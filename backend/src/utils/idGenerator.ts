import { redis } from '../config/redis';

export async function getNextId(entityName: string): Promise<string> {
  const counterKey = `counter:${entityName}`;
  const nextVal = await redis.incr(counterKey);
  return nextVal.toString();
}

/**
 * Ensures the counter starts above existing max IDs to prevent key collisions.
 */
export async function initCounterIfLower(entityName: string, minVal: number): Promise<void> {
  const counterKey = `counter:${entityName}`;
  const current = await redis.get(counterKey);
  if (!current || parseInt(current, 10) < minVal) {
    await redis.set(counterKey, minVal.toString());
  }
}
