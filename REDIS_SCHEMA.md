# Redis Database Architecture & Schema Documentation (DA3)

This document details the transition from the Oracle SQL relational schema (DA2) to the Redis In-Memory data store (DA3) for the **Agricultural Farm Management System**.

---

## 🏛️ Architecture Overview

Redis does not natively enforce SQL foreign key constraints or provide SQL-style joins. To ensure enterprise-grade reliability, the backend implements:
1. **Redis Hashes:** For primary entity records (e.g. `farmer:101`).
2. **Redis Sets:** For 1:N and M:N relationships (e.g. `farmer:101:farms`).
3. **Index Sets:** For bounded, high-speed entity scanning and pagination without `KEYS *` (e.g. `farmers:index`).
4. **Atomic Counter Keys:** For thread-safe sequential primary key generation (e.g. `counter:farmer`).
5. **Multi-Key Pipelines:** For transactional relationship maintenance and atomic deletion cascades.

---

## 📋 Entity & Key Conventions (All 28 Entities)

| # | Entity | Hash Key Pattern | Index Set Key | Key Attributes (Hash Fields) | Oracle DA2 Table Equivalent |
|:--|:---|:---|:---|:---|:---|
| 1 | **Farmer** | `farmer:<id>` | `farmers:index` | `name`, `address`, `email`, `phone` | `FARMER` |
| 2 | **Farmer Phone** | `farmer_phone:<id>` | `farmer_phones:index` | `farmer_id`, `phone` | `FARMER_PHONE` |
| 3 | **Farm** | `farm:<id>` | `farms:index` | `name`, `location`, `total_area`, `farmer_id` | `FARM` |
| 4 | **Field** | `field:<id>` | `fields:index` | `name`, `farm_id`, `area`, `soil_type`, `description` | `FIELD` |
| 5 | **Soil Test** | `soil_test:<id>` | `soil_tests:index` | `field_id`, `ph`, `nitrogen`, `phosphorus`, `potassium`, `tested_on`, `organic_carbon`, `remarks` | `SOIL_TEST` |
| 6 | **Water Source** | `water_source:<id>` | `water_sources:index` | `farm_id`, `source_type`, `source_name`, `status` | `WATER_SOURCE` |
| 7 | **Irrigation** | `irrigation:<id>` | `irrigations:index` | `field_id`, `water_source_id`, `method`, `frequency`, `duration` | `IRRIGATION` |
| 8 | **Crop** | `crop:<id>` | `crops:index` | `name`, `scientific_name`, `category`, `duration_days` | `CROP` |
| 9 | **Crop Variety** | `crop_variety:<id>` | `crop_varieties:index` | `crop_id`, `variety_name`, `expected_yield_per_acre` | `CROP_VARIETY` |
| 10 | **Season** | `season:<id>` | `seasons:index` | `season_name`, `start_month`, `end_month`, `description` | `SEASON` |
| 11 | **Crop Season** | `crop_season:<id>` | `crop_seasons:index` | `crop_id`, `season_id`, `farm_id`, `field_id`, `year`, `status` | `CROP_SEASON` |
| 12 | **Supplier** | `supplier:<id>` | `suppliers:index` | `name`, `address`, `email` | `SUPPLIER` |
| 13 | **Supplier Phone** | `supplier_phone:<id>` | `supplier_phones:index` | `supplier_id`, `phone` | `SUPPLIER_PHONE` |
| 14 | **Inventory Item** | `inventory_item:<id>` | `inventory_items:index` | `name`, `category`, `quantity`, `unit`, `supplier_id` | `INVENTORY` |
| 15 | **Seed** | `seed:<id>` | `seeds:index` | `inventory_item_id`, `crop_id`, `variety_id`, `germination_rate`, `expiry_date` | `SEED` |
| 16 | **Fertilizer** | `fertilizer:<id>` | `fertilizers:index` | `name`, `inventory_item_id`, `nitrogen_percent`, `phosphorus_percent`, `potassium_percent` | `FERTILIZER` |
| 17 | **Pesticide** | `pesticide:<id>` | `pesticides:index` | `name`, `inventory_item_id`, `pesticide_type`, `target_pest` | `PESTICIDE` |
| 18 | **Worker** | `worker:<id>` | `workers:index` | `name`, `role`, `salary`, `farm_id` | `WORKER` |
| 19 | **Worker Phone** | `worker_phone:<id>` | `worker_phones:index` | `worker_id`, `phone` | `WORKER_PHONE` |
| 20 | **Attendance** | `attendance:<id>` | `attendances:index` | `worker_id`, `attendance_date`, `status`, `hours_worked` | `ATTENDANCE` |
| 21 | **Equipment** | `equipment:<id>` | `equipments:index` | `name`, `equipment_type`, `purchase_date`, `status`, `farm_id` | `EQUIPMENT` |
| 22 | **Maintenance** | `maintenance:<id>` | `maintenances:index` | `equipment_id`, `maintenance_date`, `maintenance_type`, `cost`, `status` | `MAINTENANCE` |
| 23 | **Worker Equipment** | `worker_equipment:<id>` | `worker_equipments:index` | `worker_id`, `equipment_id`, `assigned_on`, `status` | `ASSIGNED_TO` |
| 24 | **Customer** | `customer:<id>` | `customers:index` | `name`, `address`, `email` | `CUSTOMER` |
| 25 | **Customer Phone** | `customer_phone:<id>` | `customer_phones:index` | `customer_id`, `phone` | `CUSTOMER_PHONE` |
| 26 | **Harvest** | `harvest:<id>` | `harvests:index` | `crop_season_id`, `field_id`, `harvest_date`, `quantity`, `unit`, `quality` | `HARVEST` |
| 27 | **Sale** | `sale:<id>` | `sales:index` | `harvest_id`, `customer_id`, `sale_date`, `quantity`, `unit`, `unit_price`, `total_amount`, `status` | `SALE` |
| 28 | **Payment** | `payment:<id>` | `payments:index` | `sale_id`, `payment_date`, `amount`, `payment_method`, `payment_status`, `transaction_reference` | `PAYMENT` |

---

## 🔗 Bidirectional Relationship Sets

To support foreign key navigation and joined views without slow scans, the application maintains Redis Sets:

- **Farmer → Farms:** `farmer:<id>:farms` (Members: Farm IDs)
- **Farmer → Phones:** `farmer:<id>:phones` (Members: Phone IDs)
- **Farm → Fields:** `farm:<id>:fields` (Members: Field IDs)
- **Farm → Water Sources:** `farm:<id>:water_sources` (Members: Water Source IDs)
- **Farm → Workers:** `farm:<id>:workers` (Members: Worker IDs)
- **Farm → Equipment:** `farm:<id>:equipment` (Members: Equipment IDs)
- **Farm → Crop Seasons:** `farm:<id>:crop_seasons` (Members: Crop Season IDs)
- **Field → Soil Tests:** `field:<id>:soil_tests` (Members: Soil Test IDs)
- **Field → Irrigation:** `field:<id>:irrigation_systems` (Members: Irrigation IDs)
- **Field → Harvests:** `field:<id>:harvests` (Members: Harvest IDs)
- **Crop → Varieties:** `crop:<id>:varieties` (Members: Variety IDs)
- **Crop → Seasons:** `crop:<id>:seasons` (Members: Crop Season IDs)
- **Season → Crop Seasons:** `season:<id>:crop_seasons` (Members: Crop Season IDs)
- **Supplier → Inventory:** `supplier:<id>:inventory_items` (Members: Inventory Item IDs)
- **Supplier → Phones:** `supplier:<id>:phones` (Members: Phone IDs)
- **Inventory → Seeds:** `inventory_item:<id>:seeds` (Members: Seed IDs)
- **Inventory → Fertilizers:** `inventory_item:<id>:fertilizers` (Members: Fertilizer IDs)
- **Inventory → Pesticides:** `inventory_item:<id>:pesticides` (Members: Pesticide IDs)
- **Worker → Attendance:** `worker:<id>:attendance` (Members: Attendance IDs)
- **Worker → Phones:** `worker:<id>:phones` (Members: Phone IDs)
- **Worker → Equipment:** `worker:<id>:equipment_assignments` (Members: Assignment IDs)
- **Equipment → Maintenance:** `equipment:<id>:maintenance` (Members: Maintenance IDs)
- **Equipment → Operators:** `equipment:<id>:worker_assignments` (Members: Assignment IDs)
- **Customer → Sales:** `customer:<id>:sales` (Members: Sale IDs)
- **Customer → Phones:** `customer:<id>:phones` (Members: Phone IDs)
- **Harvest → Sales:** `harvest:<id>:sales` (Members: Sale IDs)
- **Sale → Payments:** `sale:<id>:payments` (Members: Payment IDs)

---

## 🛡️ Referential Integrity & Deletion Cascade Policy

1. **Restricted Deletion (Foreign Key Constraint Simulation):**
   - Attempting to delete a `Farmer` who has members in `farmer:<id>:farms` is **blocked** and returns `400 Bad Request` (`Cannot delete farmer: associated farms exist`).
   - Attempting to delete a `Farm` with active fields, equipment, or workers is blocked.
   - Attempting to delete a `Crop` with active varieties or seasons is blocked.
   - Attempting to delete an `Equipment` unit with maintenance logs is blocked.
   - Attempting to delete a `Sale` with recorded payments is blocked.

2. **Atomic Orphan Cleanup:**
   - When an allowed deletion occurs, Redis Pipelines execute:
     1. `DEL <entity>:<id>`
     2. `SREM <entities>:index <id>`
     3. `SREM <parent>:<parent_id>:<children> <id>`

---

## ⚡ Index & Performance Design

- **Index Sets:** Every entity is recorded in `<plural>:index`. Scanning all entity keys uses `SMEMBERS <plural>:index` with pipelined `HGETALL` rather than unsafe `KEYS *`.
- **Startup Index Initialization:** If any legacy Redis records exist that were not previously indexed, `initIndexes.ts` scans using cursor-based `SCAN` once at server boot and populates the index sets automatically.
- **Counter Keys:** Unique numerical IDs are safely generated using atomic `INCR counter:<entity>`, initialized to the maximum existing numerical ID to prevent ID collisions.
