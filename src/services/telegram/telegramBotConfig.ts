/**
 * Telegram Bot Configuration & Web App Integration
 * Bot: Noah Montane (@NoahMontane_Bot)
 */

export const TELEGRAM_BOT_CONFIG = {
  token: '8922397289:AAFD98D2yMvOsSC7N_OsedfYAZL_nMAOuLc',
  botUsername: 'NoahMontane_Bot',
  botName: 'Noah Montane',
  botUrl: 'https://t.me/NoahMontane_Bot',
  apiUrl: 'https://api.telegram.org/bot8922397289:AAFD98D2yMvOsSC7N_OsedfYAZL_nMAOuLc',
  // Official Mini App URL
  miniAppUrl: 'https://perk-vibe.vercel.app/',
};

/**
 * The exact welcome message text and inline button specifications
 * as requested by the user for /start command.
 */
export const TELEGRAM_START_RESPONSE = {
  text: `👋 Bienvenue chez TRICHOMES LAB\n\nDécouvrez notre catalogue et nos nouveautés directement depuis notre boutique.\n\n👇 Cliquez ci-dessous pour ouvrir la boutique.`,
  buttonText: '🛍️ Ouvrir la boutique',
};

export interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  web_app?: { url: string };
  callback_data?: string;
}

export interface TelegramSendMessageOptions {
  chatId: string | number;
  text: string;
  replyMarkup?: {
    inline_keyboard?: TelegramInlineKeyboardButton[][];
  };
  parseMode?: 'HTML' | 'Markdown';
}

/**
 * Sends a message via the Telegram Bot API with optional inline keyboard (Mini App button).
 */
export async function sendTelegramBotMessage(
  chatId: string | number,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML',
  replyMarkup?: { inline_keyboard?: TelegramInlineKeyboardButton[][] }
): Promise<boolean> {
  try {
    const url = `${TELEGRAM_BOT_CONFIG.apiUrl}/sendMessage`;
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    };

    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.warn('Telegram Bot notification could not be dispatched directly:', err);
    return false;
  }
}

/**
 * Sends the official /start welcome message with the Mini App inline button.
 */
export async function sendStartWelcomeMessage(chatId: string | number): Promise<boolean> {
  const miniAppUrl = TELEGRAM_BOT_CONFIG.miniAppUrl;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: TELEGRAM_START_RESPONSE.buttonText,
          web_app: {
            url: miniAppUrl,
          },
        },
      ],
    ],
  };

  return sendTelegramBotMessage(
    chatId,
    TELEGRAM_START_RESPONSE.text,
    'HTML',
    replyMarkup
  );
}

/**
 * Dispatches an update received from Telegram Webhook or Long Polling.
 * Handles the /start command reliably every time the user invokes it.
 */
export async function handleTelegramUpdate(update: any): Promise<void> {
  if (!update) return;

  const message = update.message;
  if (!message || !message.text) return;

  const text = message.text.trim();
  const chatId = message.chat?.id;

  if (!chatId) return;

  // Detect /start or /start <payload>
  if (text === '/start' || text.startsWith('/start ') || text.startsWith('/start@')) {
    console.log(`[Telegram Bot] Handling /start command for chat ID: ${chatId}`);
    await sendStartWelcomeMessage(chatId);
  }
}

/**
 * Background polling loop for node / server execution.
 * Ensures /start is answered in real-time.
 */
let isPollingActive = false;
let lastUpdateId = 0;

export async function startLongPolling(): Promise<void> {
  if (isPollingActive) return;
  isPollingActive = true;

  console.log('[Telegram Bot] Starting long polling service for @NoahMontane_Bot (TRICHOMES LAB)...');

  const poll = async () => {
    while (isPollingActive) {
      try {
        const url = `${TELEGRAM_BOT_CONFIG.apiUrl}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            try {
              await handleTelegramUpdate(update);
            } catch (updateErr) {
              console.error('[Telegram Bot] Error handling update:', updateErr);
            }
          }
        }
      } catch (err) {
        // Wait 3 seconds on error before retrying to prevent aggressive loops
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  };

  poll().catch((err) => {
    console.error('[Telegram Bot] Fatal polling error:', err);
    isPollingActive = false;
  });
}
