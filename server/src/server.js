import app from './app.js';
import { config } from './config/env.js';
import { closePool } from './config/db.js';

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[api] Smart E-Commerce API listening on http://127.0.0.1:${config.port}`);
  console.log(`[api] Environment: ${config.nodeEnv}`);
  console.log(`[api] Allowed frontend origin(s): ${config.clientOrigins.join(', ')}`);
});

async function shutdown(signal) {
  console.log(`[api] ${signal} received - shutting down gracefully.`);
  server.close(async () => {
    try {
      await closePool();
      process.exit(0);
    } catch (error) {
      console.error('[api] Shutdown error:', error.message);
      process.exit(1);
    }
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
