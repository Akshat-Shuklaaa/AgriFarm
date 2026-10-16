/**
 * Administrator Bootstrap Script
 * One-time setup utility for initializing the primary administrator account.
 * Usage:
 *   ADMIN_EMAIL="admin@agrifarm.local" ADMIN_PASSWORD="SecurePassword123" npm run bootstrap:admin
 * Or with CLI arguments:
 *   npx tsx src/scripts/bootstrapAdmin.ts --email=admin@agrifarm.local --password=SecurePassword123 --name="System Administrator"
 */

import dotenv from 'dotenv';
dotenv.config();

import { authService } from '../services/authService';
import { redis } from '../config/redis';

async function bootstrap() {
  console.log('[Bootstrap] Checking existing administrator accounts in Redis...');

  const existingAdminCount = await authService.countAdmins();
  if (existingAdminCount > 0) {
    console.log(
      `[Bootstrap] System already contains ${existingAdminCount} administrator(s). One-time bootstrap aborted to prevent account overwrite.`
    );
    await redis.quit();
    process.exit(0);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    const arg = args.find((a) => a.startsWith(prefix));
    if (arg) return arg.slice(prefix.length);
    const index = args.indexOf(`--${name}`);
    if (index !== -1 && args[index + 1]) return args[index + 1];
    return undefined;
  };

  const email = (getArg('email') || process.env.ADMIN_EMAIL || '').trim();
  const password = getArg('password') || process.env.ADMIN_PASSWORD || '';
  const name = (getArg('name') || process.env.ADMIN_NAME || 'System Administrator').trim();

  if (!email || !password) {
    console.error('[Bootstrap] Error: Both ADMIN_EMAIL and ADMIN_PASSWORD must be provided.');
    console.error('Example:');
    console.error('  ADMIN_EMAIL="admin@agrifarm.local" ADMIN_PASSWORD="YourSecurePassword123!" npm run bootstrap:admin');
    await redis.quit();
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('[Bootstrap] Error: Administrator password must be at least 8 characters long.');
    await redis.quit();
    process.exit(1);
  }

  try {
    const admin = await authService.createUser({
      name,
      email,
      password,
      role: 'admin',
      actor: {
        id: 'system',
        name: 'Initial Bootstrap',
        role: 'admin',
      },
    });

    console.log('====================================================');
    console.log('       ADMINISTRATOR INITIALIZED SUCCESSFULLY       ');
    console.log('====================================================');
    console.log(`ID:     ${admin.id}`);
    console.log(`Name:   ${admin.name}`);
    console.log(`Email:  ${admin.email}`);
    console.log(`Role:   ${admin.role}`);
    console.log(`Status: ${admin.status}`);
    console.log('====================================================');
    console.log('Security Notice: Passwords are encrypted with bcrypt.');
  } catch (err: any) {
    console.error('[Bootstrap] Failed to create administrator:', err.message);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal error:', err);
  process.exit(1);
});
