import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  TELEGRAM_BOT_CONFIG,
  handleTelegramUpdate,
  startLongPolling,
  deleteTelegramMessage,
  deleteTelegramMessages,
  purgeChatRecentSpam,
  purgeChatHistory,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from './server/telegramBot';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Parse JSON payloads
  app.use(express.json({ limit: '10mb' }));

  // Webhook endpoint for Telegram updates with anti-spam filtering
  app.post('/api/telegram-webhook', async (req, res) => {
    try {
      const update = req.body;
      if (update && (update.message || update.edited_message || update.channel_post || update.callback_query)) {
        await handleTelegramUpdate(update);
      }
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[Telegram Webhook Error]:', err);
      res.status(200).json({ ok: false });
    }
  });

  // Anti-Spam: Purge chat history / messages
  app.post('/api/telegram/purge-spam', async (req, res) => {
    try {
      const { chatId, messageId, count, messageIds } = req.body;
      if (!chatId) {
        return res.status(400).json({ ok: false, error: 'chatId is required' });
      }

      if (Array.isArray(messageIds) && messageIds.length > 0) {
        const success = await deleteTelegramMessages(chatId, messageIds);
        return res.json({ ok: success });
      }

      if (messageId) {
        if (count && count > 1) {
          await purgeChatRecentSpam(chatId, messageId, count);
        } else {
          await deleteTelegramMessage(chatId, messageId);
        }
        return res.json({ ok: true });
      }

      res.status(400).json({ ok: false, error: 'Provide messageId or messageIds' });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Error purging spam' });
    }
  });

  // Anti-Spam: Purge entire chat history (IDs 1 to 300+)
  app.post('/api/telegram/purge-all', async (req, res) => {
    try {
      const { chatId, maxRange } = req.body;
      if (!chatId) {
        return res.status(400).json({ ok: false, error: 'chatId is required' });
      }
      await purgeChatHistory(chatId, undefined, maxRange || 300);
      res.json({ ok: true, message: `Purged chat history for chat ${chatId}` });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Error purging chat history' });
    }
  });

  // Anti-Spam: Block a spammer / user ID
  app.post('/api/telegram/block-user', (req, res) => {
    const { userId, reason } = req.body;
    if (!userId) {
      return res.status(400).json({ ok: false, error: 'userId is required' });
    }
    blockUser(Number(userId), reason || 'Manual block');
    res.json({ ok: true, blocked: getBlockedUsers() });
  });

  // Anti-Spam: Unblock a user ID
  app.post('/api/telegram/unblock-user', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ ok: false, error: 'userId is required' });
    }
    unblockUser(Number(userId));
    res.json({ ok: true, blocked: getBlockedUsers() });
  });

  // Anti-Spam: List blocked users
  app.get('/api/telegram/blocked-users', (_req, res) => {
    res.json({ ok: true, blocked: getBlockedUsers() });
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      bot: TELEGRAM_BOT_CONFIG.botUsername,
      antiSpamActive: true,
      blockedCount: getBlockedUsers().length,
    });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving built assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    // Start bot polling loop to guarantee immediate response and spam blocking
    startLongPolling();
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
