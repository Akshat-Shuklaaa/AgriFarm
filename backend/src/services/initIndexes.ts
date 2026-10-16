import { redis } from '../config/redis';
import { initCounterIfLower, syncCounterToMax } from '../utils/idGenerator';

interface EntityIndexDef {
  name: string;
  keyPrefix: string;
  indexKey: string;
}

export const ENTITY_DEFINITIONS: EntityIndexDef[] = [
  { name: 'farmer', keyPrefix: 'farmer:', indexKey: 'farmers:index' },
  { name: 'farmer_phone', keyPrefix: 'farmer_phone:', indexKey: 'farmer_phones:index' },
  { name: 'farm', keyPrefix: 'farm:', indexKey: 'farms:index' },
  { name: 'field', keyPrefix: 'field:', indexKey: 'fields:index' },
  { name: 'soil_test', keyPrefix: 'soil_test:', indexKey: 'soil_tests:index' },
  { name: 'water_source', keyPrefix: 'water_source:', indexKey: 'water_sources:index' },
  { name: 'irrigation', keyPrefix: 'irrigation:', indexKey: 'irrigations:index' },
  { name: 'crop', keyPrefix: 'crop:', indexKey: 'crops:index' },
  { name: 'crop_variety', keyPrefix: 'crop_variety:', indexKey: 'crop_varieties:index' },
  { name: 'season', keyPrefix: 'season:', indexKey: 'seasons:index' },
  { name: 'crop_season', keyPrefix: 'crop_season:', indexKey: 'crop_seasons:index' },
  { name: 'harvest', keyPrefix: 'harvest:', indexKey: 'harvests:index' },
  { name: 'seed', keyPrefix: 'seed:', indexKey: 'seeds:index' },
  { name: 'fertilizer', keyPrefix: 'fertilizer:', indexKey: 'fertilizers:index' },
  { name: 'pesticide', keyPrefix: 'pesticide:', indexKey: 'pesticides:index' },
  { name: 'inventory_item', keyPrefix: 'inventory_item:', indexKey: 'inventory_items:index' },
  { name: 'supplier', keyPrefix: 'supplier:', indexKey: 'suppliers:index' },
  { name: 'supplier_phone', keyPrefix: 'supplier_phone:', indexKey: 'supplier_phones:index' },
  { name: 'worker', keyPrefix: 'worker:', indexKey: 'workers:index' },
  { name: 'worker_phone', keyPrefix: 'worker_phone:', indexKey: 'worker_phones:index' },
  { name: 'attendance', keyPrefix: 'attendance:', indexKey: 'attendances:index' },
  { name: 'equipment', keyPrefix: 'equipment:', indexKey: 'equipments:index' },
  { name: 'maintenance', keyPrefix: 'maintenance:', indexKey: 'maintenances:index' },
  { name: 'worker_equipment', keyPrefix: 'worker_equipment:', indexKey: 'worker_equipments:index' },
  { name: 'customer', keyPrefix: 'customer:', indexKey: 'customers:index' },
  { name: 'customer_phone', keyPrefix: 'customer_phone:', indexKey: 'customer_phones:index' },
  { name: 'sale', keyPrefix: 'sale:', indexKey: 'sales:index' },
  { name: 'payment', keyPrefix: 'payment:', indexKey: 'payments:index' },
];

/**
 * Scan all keys in Redis matching prefix:id pattern (excluding relationship sets that have 2 colons)
 */
async function scanEntityKeys(prefix: string): Promise<string[]> {
  let cursor = '0';
  const ids: string[] = [];
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
    cursor = nextCursor;
    for (const key of keys) {
      // Must match prefix + digits/uuid, no second colon (to avoid matching relationship sets like farmer:101:farms)
      const afterPrefix = key.slice(prefix.length);
      if (afterPrefix && !afterPrefix.includes(':')) {
        ids.push(afterPrefix);
      }
    }
  } while (cursor !== '0');
  return ids;
}

export async function initializeIndexes(): Promise<void> {
  console.log('[Startup] Checking and initializing entity indexes...');

  for (const def of ENTITY_DEFINITIONS) {
    const exists = await redis.exists(def.indexKey);
    const scannedIds = await scanEntityKeys(def.keyPrefix);

    // Special handling for season:901 where season:901 hash does not exist,
    // but season:901:crop_seasons exists
    if (def.name === 'season') {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'season:*:crop_seasons', 'COUNT', 100);
        cursor = nextCursor;
        for (const k of keys) {
          const match = k.match(/^season:([^:]+):crop_seasons$/);
          if (match && !scannedIds.includes(match[1])) {
            scannedIds.push(match[1]);
          }
        }
      } while (cursor !== '0');
    }

    if (scannedIds.length > 0) {
      const pipeline = redis.pipeline();
      for (const id of scannedIds) {
        pipeline.sadd(def.indexKey, id);
      }
      await pipeline.exec();

      // Find highest numerical ID to initialize counter
      const numericIds = scannedIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
      if (numericIds.length > 0) {
        const maxId = Math.max(...numericIds);
        await initCounterIfLower(def.name, maxId);
        await syncCounterToMax(def.name, def.indexKey);
      }
      console.log(`[Startup] Indexed ${scannedIds.length} records for ${def.name} (${def.indexKey})`);
    } else {
      console.log(`[Startup] No existing records found for ${def.name}`);
    }
  }

  console.log('[Startup] Entity indexes initialized successfully');
}
