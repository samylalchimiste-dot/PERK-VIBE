/**
 * Telegram Bot Configuration & Integration
 * Connected to official bot: PERK VIBES FARMZ BOT ⚡ (@F2nOfficiel_Bot)
 */

export const TELEGRAM_BOT_CONFIG = {
  token: '8554779751:AAEgcpOnFeaP3MJhIgyORUCtExk6Pt0d8Fc',
  botUsername: 'F2nOfficiel_Bot',
  botName: 'PERK VIBES FARMZ BOT ⚡',
  botUrl: 'https://t.me/F2nOfficiel_Bot',
  apiUrl: 'https://api.telegram.org/bot8554779751:AAEgcpOnFeaP3MJhIgyORUCtExk6Pt0d8Fc',
};

/**
 * Sends a direct message via the Telegram Bot API.
 * Safely handles network errors and CORS if called from browser.
 */
export async function sendTelegramBotMessage(
  chatId: string | number,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  try {
    const url = `${TELEGRAM_BOT_CONFIG.apiUrl}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.warn('Telegram Bot notification could not be dispatched directly:', err);
    return false;
  }
}
