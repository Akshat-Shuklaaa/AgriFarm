/**
 * Demo Users Seeding Script
 * Seeds initial demo accounts corresponding to the 4 RBAC role tiers:
 * 1. Admin (admin@agrifarm.local)
 * 2. Farm Owner / Manager (manager@agrifarm.local)
 * 3. Inventory Manager (inventory@agrifarm.local)
 * 4. Field Worker (worker@agrifarm.local)
 *
 * Safe: Preserves existing records; idempotent and non-destructive.
 */

import dotenv from 'dotenv';
dotenv.config();

import { authService } from '../services/authService';
import { Role } from '../config/permissions';
import { redis } from '../config/redis';

interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Administrator',
    email: 'admin@agrifarm.local',
    password: 'AdminPassword123!',
    role: 'admin',
  },
  {
    name: 'Rajesh Sharma',
    email: 'manager@agrifarm.local',
    password: 'ManagerPassword123!',
    role: 'farm_manager',
  },
  {
    name: 'Priya Verma',
    email: 'inventory@agrifarm.local',
    password: 'InventoryPassword123!',
    role: 'inventory_manager',
  },
  {
    name: 'Suresh Kumar',
    email: 'worker@agrifarm.local',
    password: 'WorkerPassword123!',
    role: 'worker',
  },
];

async function seedDemoUsers() {
  console.log('\n============================================================');
  console.log('            SEEDING DEMO USERS (4 RBAC TIERS)               ');
  console.log('============================================================\n');

  for (const account of DEMO_ACCOUNTS) {
    try {
      const existing = await authService.getUserByEmail(account.email);
      if (existing) {
        console.log(`[Skip] User "${account.email}" already exists with role "${existing.role}".`);
        continue;
      }

      const created = await authService.createUser({
        name: account.name,
        email: account.email,
        password: account.password,
        role: account.role,
        actor: {
          id: 'system',
          name: 'Demo Seeder',
          role: 'admin',
        },
      });

      console.log(`[Created] ${created.role.padEnd(18)} : ${created.email} (ID: ${created.id})`);
    } catch (err: any) {
      console.error(`[Error] Failed to seed "${account.email}":`, err.message);
    }
  }

  console.log('\n============================================================');
  console.log('Demo users setup complete. All passwords hashed with bcrypt.');
  console.log('============================================================\n');

  await redis.quit();
  process.exit(0);
}

seedDemoUsers().catch((err) => {
  console.error('Fatal error seeding demo users:', err);
  process.exit(1);
});
