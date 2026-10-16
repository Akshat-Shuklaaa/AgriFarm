import app from './app';
import { config } from './config';
import { closeRedis } from './config/redis';
import { initializeIndexes } from './services/initIndexes';

import { authService } from './services/authService';

async function start() {
  try {
    // Initialize entity indexes from existing Redis data
    await initializeIndexes();

    // Auto-bootstrap admin from environment if no admin exists
    const adminCount = await authService.countAdmins();
    if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await authService.createUser({
        name: process.env.ADMIN_NAME || 'System Administrator',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        actor: { id: 'system', name: 'Server Auto-Bootstrap', role: 'admin' },
      });
      console.log(`[Bootstrap] Initialized administrator from environment (${process.env.ADMIN_EMAIL})`);
    } else if (adminCount === 0) {
      console.log('[Notice] No administrator accounts registered. Run `npm run bootstrap:admin` to create one.');
    }

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
