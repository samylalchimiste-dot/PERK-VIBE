/**
 * Telegram Bot Configuration & Web App Integration
 * Bot: STATIC GEM (@TricomeLab_Bot)
 * Dedicated for STATIC GEM
 */

export const TELEGRAM_BOT_CONFIG = {
  get token(): string {
    return (typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN) || '';
  },
  botUsername: 'TricomeLab_Bot',
  botName: 'STATIC GEM',
  botUrl: 'https://t.me/TricomeLab_Bot',
  get apiUrl(): string {
    const t = this.token;
    return t ? `https://api.telegram.org/bot${t}` : '';
  },
  // Official Mini App URL
  miniAppUrl: 'https://perk-vibe.vercel.app/',
};

/**
 * The official welcome message text and inline button specifications
 * for the /start command and boutique interactions.
 */
export const TELEGRAM_START_RESPONSE = {
  text: `🔥 <b>STATIC GEM EST DE RETOUR !</b> 💎\n\nToute l'équipe est ravie de vous retrouver avec un service encore plus fluide, rapide et ultra-sécurisé.\n\n✨ Découvrez dès maintenant notre catalogue exclusif, nos arrivages et toutes nos nouveautés.\n\n👇 <i>Cliquez sur le bouton ci-dessous pour ouvrir la boutique :</i>`,
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

// ==========================================
// ANTI-SPAM & RUSSIAN MESSAGE FILTERING
// ==========================================

/**
 * Detects Russian / Cyrillic characters across standard and extended Cyrillic Unicode blocks.
 * Covers Russian alphabet: А-Я, а-я, Ё, ё, etc.
 */
export function isRussianOrCyrillic(text?: string | null): boolean {
  if (!text) return false;
  // Cyrillic unicode block: U+0400–U+04FF, Cyrillic Supplement: U+0500–U+052F,
  // Cyrillic Extended-A: U+2DE0–U+2DFF, Cyrillic Extended-B: U+A640–U+A69F
  return /[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/.test(text);
}

/**
 * Known Russian spam indicators, illegal ad keywords, casino/crypto bots keywords.
 */
const RUSSIAN_SPAM_PATTERNS = [
  /крипт/i,
  /казино/i,
  /заработ/i,
  /инвестиц/i,
  /рубл/i,
  /ставк/i,
  /подработ/i,
  /схема/i,
  /слив/i,
  /шлюх/i,
  /порно/i,
  /виагр/i,
  /гидр/i,
  /клад/i,
  /t\.me\/\+[a-zA-Z0-9_-]+/i, // Private telegram invite links often used in spam
];

/**
 * Checks whether an incoming message is Russian spam or unauthorized promotional spam.
 */
export function isRussianSpam(message: any): boolean {
  if (!message) return false;

  const text = (message.text || '').trim();
  const caption = (message.caption || '').trim();

  // 1. Direct Cyrillic character check in text or caption
  if (isRussianOrCyrillic(text) || isRussianOrCyrillic(caption)) {
    return true;
  }

  // 2. Keyword checks
  for (const pattern of RUSSIAN_SPAM_PATTERNS) {
    if (pattern.test(text) || pattern.test(caption)) {
      return true;
    }
  }

  // 3. Forward origin check
  if (isRussianOrCyrillic(message.forward_sender_name)) return true;
  if (isRussianOrCyrillic(message.forward_from_chat?.title)) return true;
  if (isRussianOrCyrillic(message.forward_from_chat?.username)) return true;
  if (isRussianOrCyrillic(message.forward_from?.first_name || message.forward_from?.last_name)) return true;

  // 4. Sender profile check (if sender language is Russian or name contains Cyrillic)
  const lang = message.from?.language_code;
  const fullName = `${message.from?.first_name || ''} ${message.from?.last_name || ''}`;
  const isCyrillicName = isRussianOrCyrillic(fullName) || isRussianOrCyrillic(message.from?.username);

  if ((lang === 'ru' || isCyrillicName) && !text.startsWith('/start')) {
    return true;
  }

  return false;
}

// In-memory blocked users set
const blockedUsersSet = new Set<number>();

export function isUserBlocked(userId?: number): boolean {
  if (!userId) return false;
  return blockedUsersSet.has(userId);
}

export function blockUser(userId?: number, reason: string = 'Spam'): void {
  if (!userId) return;
  blockedUsersSet.add(userId);
  console.log(`[Anti-Spam] User ${userId} blocked permanently. Reason: ${reason}`);
}

export function unblockUser(userId?: number): void {
  if (!userId) return;
  blockedUsersSet.delete(userId);
  console.log(`[Anti-Spam] User ${userId} unblocked.`);
}

export function getBlockedUsers(): number[] {
  return Array.from(blockedUsersSet);
}

// ==========================================
// TELEGRAM BOT API DISPATCHERS
// ==========================================

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
 * Deletes a single message from a chat via Telegram Bot API deleteMessage.
 */
export async function deleteTelegramMessage(
  chatId: string | number,
  messageId: number
): Promise<boolean> {
  if (!chatId || !messageId) return false;
  try {
    const url = `${TELEGRAM_BOT_CONFIG.apiUrl}/deleteMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`[Anti-Spam] Successfully deleted message ${messageId} in chat ${chatId}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[Anti-Spam] Error deleting message ${messageId} in chat ${chatId}:`, err);
    return false;
  }
}

/**
 * Batch deletes up to 100 messages from a chat via Telegram Bot API deleteMessages.
 */
export async function deleteTelegramMessages(
  chatId: string | number,
  messageIds: number[]
): Promise<boolean> {
  if (!chatId || !messageIds || messageIds.length === 0) return true;
  try {
    const validIds = messageIds.filter((id) => id > 0).slice(0, 100);
    const url = `${TELEGRAM_BOT_CONFIG.apiUrl}/deleteMessages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_ids: validIds,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`[Anti-Spam] Successfully batch deleted ${validIds.length} messages in chat ${chatId}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[Anti-Spam] Error batch deleting messages in chat ${chatId}:`, err);
    return false;
  }
}

/**
 * Unpins all pinned messages in a chat (to remove any pinned Russian spam).
 */
export async function unpinAllChatMessages(chatId: string | number): Promise<boolean> {
  if (!chatId) return false;
  try {
    const url = `${TELEGRAM_BOT_CONFIG.apiUrl}/unpinAllChatMessages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    return false;
  }
}

/**
 * Eradicates and completely purges all messages across the chat history (IDs 1 up to current + 10)
 * to ensure that any Russian spam or unwanted bot message is deleted from Telegram servers.
 */
export async function purgeChatHistory(
  chatId: string | number,
  currentMessageId?: number,
  maxRange: number = 300
): Promise<void> {
  if (!chatId) return;

  const topId = Math.max(currentMessageId ? currentMessageId + 10 : 150, 150, Math.min(maxRange, 500));
  console.log(`[Anti-Spam] Eradicating chat history for chat ${chatId} (IDs 1 to ${topId})...`);

  // 1. Unpin any pinned messages
  await unpinAllChatMessages(chatId).catch(() => {});

  // 2. Batch delete messages in chunks of 100
  const allIds: number[] = [];
  for (let i = 1; i <= topId; i++) {
    // Avoid deleting the user's current command if it's start
    allIds.push(i);
  }

  for (let i = 0; i < allIds.length; i += 100) {
    const chunk = allIds.slice(i, i + 100);
    await deleteTelegramMessages(chatId, chunk);
  }

  // 3. Fallback: targeted delete on first 10 messages and surrounding current message
  const priorityIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (currentMessageId) {
    for (let i = -5; i <= 5; i++) {
      const id = currentMessageId + i;
      if (id > 0 && !priorityIds.includes(id)) {
        priorityIds.push(id);
      }
    }
  }

  for (const pid of priorityIds) {
    await deleteTelegramMessage(chatId, pid).catch(() => {});
  }
}

export const purgeChatRecentSpam = purgeChatHistory;

/**
 * Bans and removes a sender from a group or supergroup channel, revoking their past messages.
 */
export async function banChatSender(
  chatId: string | number,
  userId: number
): Promise<boolean> {
  if (!chatId || !userId) return false;
  try {
    const url = `${TELEGRAM_BOT_CONFIG.apiUrl}/banChatMember`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
        revoke_messages: true,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`[Anti-Spam] Sender ${userId} banned from chat ${chatId}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[Anti-Spam] Error banning sender ${userId} from chat ${chatId}:`, err);
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
 * - Detects and destroys Russian spam instantly.
 * - Blocks Russian spammers and unauthorized bots.
 * - Automatically purges any past spam from the chat.
 * - Ensures /start sends only the official boutique Mini App link.
 */
export async function handleTelegramUpdate(update: any): Promise<void> {
  if (!update) return;

  const message = update.message || update.edited_message || update.channel_post;
  if (!message) return;

  const text = (message.text || '').trim();
  const chatId = message.chat?.id;
  const messageId = message.message_id;
  const fromId = message.from?.id;
  const chatType = message.chat?.type || 'private';

  if (!chatId) return;

  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      // Dynamic require or fs write in node
      import('fs').then((fs) => {
        fs.appendFileSync('/tmp/telegram_chats.log', `${new Date().toISOString()} [chat:${chatId}] [from:${fromId}] [msg:${messageId}] ${text}\n`);
      }).catch(() => {});
    } catch {}
  }

  // 1. If sender is already blocked, delete immediately and ignore
  if (fromId && isUserBlocked(fromId)) {
    console.log(`[Anti-Spam] Blocked user ${fromId} tried sending message ${messageId}. Deleting...`);
    if (messageId) {
      await deleteTelegramMessage(chatId, messageId);
    }
    return;
  }

  // 2. Russian spam detection and blocking
  if (isRussianSpam(message)) {
    console.warn(
      `[Anti-Spam] RUSSIAN SPAM DETECTED in chat ${chatId} from user ${fromId} (${message.from?.username || message.from?.first_name}): "${text || message.caption}"`
    );

    // Block sender permanently
    if (fromId) {
      blockUser(fromId, 'Sent Russian text / spam');
    }

    // Immediately delete the spam message
    if (messageId) {
      await deleteTelegramMessage(chatId, messageId);
      // Purge full chat history to eliminate residual spam
      await purgeChatHistory(chatId, messageId, 300);
    }

    // If in group or channel, ban sender and revoke messages
    if ((chatType === 'group' || chatType === 'supergroup') && fromId) {
      await banChatSender(chatId, fromId);
    }

    return;
  }

  // 3. For any message in private chat: eradicate all previous spam and send official boutique link
  if (chatType === 'private') {
    console.log(`[Telegram Bot] Processing message from chat ID ${chatId}: "${text}" (messageId: ${messageId})`);

    // Clean up chat: delete the user's non-start message if random, or purge all previous messages
    if (messageId) {
      await purgeChatHistory(chatId, messageId, 300);
    }

    // Send official STATIC GEM welcome message with official boutique button
    await sendStartWelcomeMessage(chatId);
    return;
  }

  // 4. In groups or channels: if someone uses /start, respond cleanly
  if (text.startsWith('/start')) {
    await sendStartWelcomeMessage(chatId);
  }
}

/**
 * Background polling loop for node / server execution.
 * Continuously polls Telegram for updates with real-time spam elimination.
 */
let isPollingActive = false;
let lastUpdateId = 0;

export async function startLongPolling(): Promise<void> {
  if (!TELEGRAM_BOT_CONFIG.token) {
    console.log('[Telegram Bot] No TELEGRAM_BOT_TOKEN set in environment. Polling disabled.');
    return;
  }
  if (isPollingActive) return;
  isPollingActive = true;

  console.log('[Telegram Bot] Starting long polling service for @TricomeLab_Bot (STATIC GEM)...');

  const poll = async () => {
    while (isPollingActive) {
      try {
        const url = `${TELEGRAM_BOT_CONFIG.apiUrl}/getUpdates?offset=${lastUpdateId + 1}&timeout=25&allowed_updates=["message","edited_message","channel_post","callback_query"]`;
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
