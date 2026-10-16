import { redis } from '../config/redis';

export async function getNextId(
  entityName: string,
  customCounterKey?: string,
  indexKey?: string
): Promise<string> {
  const counterKey = customCounterKey || `counter:${entityName}`;

  if (indexKey) {
    const members = await redis.smembers(indexKey);
    const numericIds = members.map((m) => parseInt(m, 10)).filter((n) => !isNaN(n));
    if (numericIds.length > 0) {
      const maxExistingId = Math.max(...numericIds);
      const current = await redis.get(counterKey);
      const currentVal = current ? parseInt(current, 10) : 0;
      // Re-synchronize counter with actual max ID if it has drifted or was affected by deletions
      if (currentVal < maxExistingId || currentVal > maxExistingId + 5) {
        await redis.set(counterKey, maxExistingId.toString());
      }
    }
  }

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

/**
 * Synchronize counter strictly to the highest existing numeric ID in an entity's index set.
 */
export async function syncCounterToMax(entityName: string, indexKey: string): Promise<number> {
  const counterKey = `counter:${entityName}`;
  const members = await redis.smembers(indexKey);
  const numericIds = members.map((m) => parseInt(m, 10)).filter((n) => !isNaN(n));
  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  if (maxId > 0) {
    await redis.set(counterKey, maxId.toString());
  }
  return maxId;
}
