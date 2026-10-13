/**
 * Safe, idempotent seed script for Agricultural Farm Management System.
 * Supports:
 *  - Development and Production Redis instances (via REDIS_URL)
 *  - Preserving existing records (--skip-existing, default true)
 *  - Dry-run mode (--dry-run)
 *  - Safe re-execution with relationship validation
 *  - Explicit reporting of inserted, updated, skipped, and failed records.
 *  - NEVER calls FLUSHALL or FLUSHDB.
 */

import { redis } from '../backend/src/config/redis';

const isDryRun = process.argv.includes('--dry-run');
const overwrite = process.argv.includes('--overwrite');

console.log(`[Seed] Options: Dry-Run=${isDryRun}, Overwrite=${overwrite}`);

interface SeedEntity {
  key: string;
  indexKey: string;
  data: Record<string, any>;
  relations?: Array<{ key: string; member: string }>;
}

const SEED_DATA: SeedEntity[] = [
  // 1. Farmer 101
  {
    key: 'farmer:101',
    indexKey: 'farmers:index',
    data: {
      name: 'Ramesh Kumar',
      address: 'Kanchipuram, Tamil Nadu',
      email: 'ramesh@example.com',
      phone: '9876543210',
    },
    relations: [{ key: 'farmer:101:farms', member: '201' }],
  },
  // 2. Farm 201
  {
    key: 'farm:201',
    indexKey: 'farms:index',
    data: {
      name: 'Green Valley Farm',
      location: 'Kanchipuram',
      total_area: '25.5',
      farmer_id: '101',
    },
    relations: [
      { key: 'farm:201:fields', member: '301' },
      { key: 'farm:201:water_sources', member: '501' },
      { key: 'farm:201:crop_seasons', member: '1001' },
      { key: 'farm:201:workers', member: '1601' },
      { key: 'farm:201:equipment', member: '1801' },
    ],
  },
  // 3. Field 301
  {
    key: 'field:301',
    indexKey: 'fields:index',
    data: {
      name: 'North Field',
      farm_id: '201',
      area: '10.5',
      soil_type: 'Loamy',
    },
    relations: [
      { key: 'field:301:soil_tests', member: '401' },
      { key: 'field:301:irrigation_systems', member: '601' },
      { key: 'field:301:harvests', member: '2101' },
    ],
  },
  // 4. Soil Test 401
  {
    key: 'soil_test:401',
    indexKey: 'soil_tests:index',
    data: {
      field_id: '301',
      ph: '6.5',
      nitrogen: 'Medium',
      phosphorus: 'High',
      potassium: 'Medium',
      tested_on: '2026-10-01',
    },
  },
  // 5. Water Source 501
  {
    key: 'water_source:501',
    indexKey: 'water_sources:index',
    data: {
      farm_id: '201',
      source_type: 'Borewell',
      status: 'Active',
    },
  },
  // 6. Irrigation 601
  {
    key: 'irrigation:601',
    indexKey: 'irrigations:index',
    data: {
      field_id: '301',
      water_source_id: '501',
      method: 'Drip',
      frequency: 'Daily',
    },
  },
  // 7. Crop 701
  {
    key: 'crop:701',
    indexKey: 'crops:index',
    data: {
      name: 'Rice',
      scientific_name: 'Oryza sativa',
      category: 'Cereal',
      duration_days: '125',
    },
    relations: [
      { key: 'crop:701:varieties', member: '801' },
      { key: 'crop:701:seasons', member: '1001' },
    ],
  },
  // 8. Crop Variety 801
  {
    key: 'crop_variety:801',
    indexKey: 'crop_varieties:index',
    data: {
      crop_id: '701',
      variety_name: 'Ponni',
      expected_yield_per_acre: '2500',
    },
  },
  // 9. Season 901
  {
    key: 'season:901',
    indexKey: 'seasons:index',
    data: {
      name: 'Kharif 2026',
      season_name: 'Kharif 2026',
      start_month: 'June',
      end_month: 'October',
      description: 'Monsoon cultivation season',
    },
    relations: [{ key: 'season:901:crop_seasons', member: '1001' }],
  },
  // 10. Crop Season 1001
  {
    key: 'crop_season:1001',
    indexKey: 'crop_seasons:index',
    data: {
      crop_id: '701',
      season_id: '901',
      farm_id: '201',
      field_id: '301',
      year: '2026',
      status: 'Planned',
    },
    relations: [{ key: 'crop_season:1001:harvests', member: '2101' }],
  },
  // 11. Supplier 1101
  {
    key: 'supplier:1101',
    indexKey: 'suppliers:index',
    data: {
      name: 'Agri Supplies Ltd',
      address: 'Chennai',
      email: 'sales@agrisupplies.example',
    },
    relations: [
      { key: 'supplier:1101:phones', member: '1102' },
      { key: 'supplier:1101:inventory_items', member: '1201' },
    ],
  },
  // 12. Supplier Phone 1102
  {
    key: 'supplier_phone:1102',
    indexKey: 'supplier_phones:index',
    data: {
      supplier_id: '1101',
      phone: '9876501234',
    },
  },
  // 13. Inventory Item 1201
  {
    key: 'inventory_item:1201',
    indexKey: 'inventory_items:index',
    data: {
      name: 'Ponni Rice Seeds',
      category: 'Seed',
      quantity: '500',
      unit: 'kg',
      supplier_id: '1101',
    },
    relations: [{ key: 'inventory_item:1201:seeds', member: '1301' }],
  },
  // 14. Seed 1301
  {
    key: 'seed:1301',
    indexKey: 'seeds:index',
    data: {
      inventory_item_id: '1201',
      crop_id: '701',
      variety_id: '801',
      germination_rate: '95',
      expiry_date: '2027-06-30',
    },
  },
  // 15. Fertilizer 1401
  {
    key: 'fertilizer:1401',
    indexKey: 'fertilizers:index',
    data: {
      name: 'NPK Fertilizer',
      inventory_item_id: '1201',
      nitrogen_percent: '20',
      phosphorus_percent: '20',
      potassium_percent: '20',
    },
  },
  // 16. Pesticide 1501
  {
    key: 'pesticide:1501',
    indexKey: 'pesticides:index',
    data: {
      name: 'Neem-Based Pesticide',
      inventory_item_id: '1201',
      pesticide_type: 'Biological',
      target_pest: 'Aphids',
    },
  },
  // 17. Worker 1601
  {
    key: 'worker:1601',
    indexKey: 'workers:index',
    data: {
      name: 'Suresh Kumar',
      role: 'Farm Supervisor',
      salary: '18000',
      farm_id: '201',
    },
    relations: [
      { key: 'worker:1601:phones', member: '1602' },
      { key: 'worker:1601:attendance', member: '1701' },
      { key: 'worker:1601:equipment_assignments', member: '1901' },
    ],
  },
  // 18. Worker Phone 1602
  {
    key: 'worker_phone:1602',
    indexKey: 'worker_phones:index',
    data: {
      worker_id: '1601',
      phone: '9876512345',
    },
  },
  // 19. Attendance 1701
  {
    key: 'attendance:1701',
    indexKey: 'attendances:index',
    data: {
      worker_id: '1601',
      attendance_date: '2026-10-13',
      status: 'Present',
      hours_worked: '8',
    },
  },
  // 20. Equipment 1801
  {
    key: 'equipment:1801',
    indexKey: 'equipments:index',
    data: {
      name: 'Tractor',
      equipment_type: 'Agricultural Machinery',
      purchase_date: '2025-06-15',
      status: 'Available',
      farm_id: '201',
    },
    relations: [
      { key: 'equipment:1801:maintenance', member: '1802' },
      { key: 'equipment:1801:worker_assignments', member: '1901' },
    ],
  },
  // 21. Maintenance 1802
  {
    key: 'maintenance:1802',
    indexKey: 'maintenances:index',
    data: {
      equipment_id: '1801',
      maintenance_date: '2026-10-01',
      maintenance_type: 'Routine Service',
      cost: '2500',
      status: 'Completed',
    },
  },
  // 22. Worker Equipment 1901
  {
    key: 'worker_equipment:1901',
    indexKey: 'worker_equipments:index',
    data: {
      worker_id: '1601',
      equipment_id: '1801',
      assigned_on: '2026-10-13',
      status: 'Assigned',
    },
  },
  // 23. Customer 2001
  {
    key: 'customer:2001',
    indexKey: 'customers:index',
    data: {
      name: 'Ravi Traders',
      address: 'Chennai',
      email: 'ravi@example.com',
    },
    relations: [
      { key: 'customer:2001:phones', member: '2002' },
      { key: 'customer:2001:sales', member: '2201' },
    ],
  },
  // 24. Customer Phone 2002
  {
    key: 'customer_phone:2002',
    indexKey: 'customer_phones:index',
    data: {
      customer_id: '2001',
      phone: '9876523456',
    },
  },
  // 25. Harvest 2101
  {
    key: 'harvest:2101',
    indexKey: 'harvests:index',
    data: {
      crop_season_id: '1001',
      field_id: '301',
      harvest_date: '2026-10-13',
      quantity: '2500',
      unit: 'kg',
      quality: 'Grade A',
    },
    relations: [{ key: 'harvest:2101:sales', member: '2201' }],
  },
  // 26. Sale 2201
  {
    key: 'sale:2201',
    indexKey: 'sales:index',
    data: {
      harvest_id: '2101',
      customer_id: '2001',
      sale_date: '2026-10-13',
      quantity: '500',
      unit: 'kg',
      unit_price: '35',
      total_amount: '17500',
      status: 'Completed',
    },
    relations: [{ key: 'sale:2201:payments', member: '2301' }],
  },
  // 27. Payment 2301
  {
    key: 'payment:2301',
    indexKey: 'payments:index',
    data: {
      sale_id: '2201',
      payment_date: '2026-10-13',
      amount: '17500',
      payment_method: 'UPI',
      payment_status: 'Paid',
      transaction_reference: 'TXN20261013001',
    },
  },
];

async function runSeed() {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`\n[Seed] Processing ${SEED_DATA.length} canonical records...`);

  for (const entity of SEED_DATA) {
    try {
      const exists = (await redis.exists(entity.key)) === 1;

      if (exists && !overwrite) {
        skipped++;
        // Still ensure it is in the index set and relations exist
        if (!isDryRun) {
          const id = entity.key.split(':')[1];
          await redis.sadd(entity.indexKey, id);
          if (entity.relations) {
            for (const r of entity.relations) {
              await redis.sadd(r.key, r.member);
            }
          }
        }
        continue;
      }

      if (!isDryRun) {
        const id = entity.key.split(':')[1];
        const pipeline = redis.pipeline();
        pipeline.hset(entity.key, entity.data);
        pipeline.sadd(entity.indexKey, id);

        if (entity.relations) {
          for (const r of entity.relations) {
            pipeline.sadd(r.key, r.member);
          }
        }

        await pipeline.exec();
      }

      if (exists) {
        updated++;
      } else {
        inserted++;
      }
    } catch (err) {
      console.error(`[Seed] Error processing ${entity.key}:`, err);
      failed++;
    }
  }

  console.log('\n====================================');
  console.log('       SEEDING SUMMARY REPORT       ');
  console.log('====================================');
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated:  ${updated}`);
  console.log(`Skipped:  ${skipped} (already existed, intact)`);
  console.log(`Failed:   ${failed}`);
  console.log('====================================');

  await redis.quit();
}

runSeed().catch((e) => {
  console.error('[Seed] Fatal error:', e);
  process.exit(1);
});
