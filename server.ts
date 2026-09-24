import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  TELEGRAM_BOT_CONFIG,
  handleTelegramUpdate,
  startLongPolling
} from './src/services/telegram/telegramBotConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Parse JSON payloads
  app.use(express.json({ limit: '10mb' }));

  // Webhook endpoint for Telegram updates
  app.post('/api/telegram-webhook', async (req, res) => {
    try {
      const update = req.body;
      if (update && (update.message || update.callback_query)) {
        await handleTelegramUpdate(update);
      }
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[Telegram Webhook Error]:', err);
      res.status(200).json({ ok: false });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', bot: TELEGRAM_BOT_CONFIG.botUsername });
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
    // Start bot polling loop to guarantee immediate response to /start anywhere
    startLongPolling();
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
