import app from './app';
import { config } from './config';
import { closeRedis } from './config/redis';
import { initializeIndexes } from './services/initIndexes';

async function start() {
  try {
    // Initialize entity indexes from existing Redis data
    await initializeIndexes();

    const server = app.listen(config.port, () => {
      console.log(`[Server] Agricultural Farm Management API running on port ${config.port}`);
      console.log(`[Server] Environment: ${config.nodeEnv}`);
      console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        await closeRedis();
        console.log('[Server] Server closed');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();
