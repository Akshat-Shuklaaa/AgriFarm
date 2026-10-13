import { z } from 'zod';

// Pagination & Query Schemas
export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Auth Schemas
export const authRegisterSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['admin', 'farmer', 'manager', 'worker']).default('farmer'),
  email: z.string().email().optional(),
});

export const authLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// 1. Farmer Schema
export const createFarmerSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().default(''),
});
export const updateFarmerSchema = createFarmerSchema.partial();

// 2. Farm Schema
export const createFarmSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().default(''),
  total_area: z.string().or(z.number()).transform(String),
  farmer_id: z.string().min(1),
});
export const updateFarmSchema = createFarmSchema.partial();

// 3. Field Schema
export const createFieldSchema = z.object({
  name: z.string().min(1),
  farm_id: z.string().min(1),
  area: z.string().or(z.number()).transform(String),
  soil_type: z.string().optional().default(''),
  description: z.string().optional().default(''),
});
export const updateFieldSchema = createFieldSchema.partial();

// 4. Soil Test Schema
export const createSoilTestSchema = z.object({
  field_id: z.string().min(1),
  ph: z.string().or(z.number()).transform(String),
  nitrogen: z.string().or(z.number()).transform(String),
  phosphorus: z.string().or(z.number()).transform(String),
  potassium: z.string().or(z.number()).transform(String),
  tested_on: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  organic_carbon: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
});
export const updateSoilTestSchema = createSoilTestSchema.partial();

// 5. Water Source Schema
export const createWaterSourceSchema = z.object({
  farm_id: z.string().min(1),
  source_type: z.string().min(1),
  status: z.string().optional().default('active'),
  source_name: z.string().optional().default(''),
  location: z.string().optional().default(''),
});
export const updateWaterSourceSchema = createWaterSourceSchema.partial();

// 6. Irrigation Schema
export const createIrrigationSchema = z.object({
  field_id: z.string().min(1),
  water_source_id: z.string().min(1),
  method: z.string().optional().default('drip'),
  frequency: z.string().optional().default('daily'),
  irrigation_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  duration: z.string().optional().default(''),
  water_used: z.string().optional().default(''),
});
export const updateIrrigationSchema = createIrrigationSchema.partial();

// 7. Crop Schema
export const createCropSchema = z.object({
  name: z.string().min(1),
  scientific_name: z.string().optional().default(''),
  category: z.string().optional().default(''),
  duration_days: z.string().or(z.number()).transform(String).optional().default('120'),
  variety: z.string().optional().default(''),
  description: z.string().optional().default(''),
});
export const updateCropSchema = createCropSchema.partial();

// 8. Crop Variety Schema
export const createCropVarietySchema = z.object({
  crop_id: z.string().min(1),
  variety_name: z.string().min(1),
  expected_yield_per_acre: z.string().or(z.number()).transform(String).optional().default(''),
});
export const updateCropVarietySchema = createCropVarietySchema.partial();

// 9. Season Schema
export const createSeasonSchema = z.object({
  name: z.string().optional(),
  season_name: z.string().optional(),
  start_month: z.string().optional().default(''),
  end_month: z.string().optional().default(''),
  description: z.string().optional().default(''),
});
export const updateSeasonSchema = createSeasonSchema.partial();

// 10. Crop Season Schema
export const createCropSeasonSchema = z.object({
  crop_id: z.string().min(1),
  season_id: z.string().min(1),
  farm_id: z.string().min(1),
  field_id: z.string().min(1),
  year: z.string().or(z.number()).transform(String).optional().default(() => new Date().getFullYear().toString()),
  status: z.string().optional().default('in_progress'),
  season_name: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
});
export const updateCropSeasonSchema = createCropSeasonSchema.partial();

// 11. Harvest Schema
export const createHarvestSchema = z.object({
  crop_season_id: z.string().min(1),
  field_id: z.string().min(1),
  harvest_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  quantity: z.string().or(z.number()).transform(String),
  unit: z.string().optional().default('kg'),
  quality: z.string().optional().default('Grade A'),
});
export const updateHarvestSchema = createHarvestSchema.partial();

// 12. Seed Schema
export const createSeedSchema = z.object({
  inventory_item_id: z.string().min(1),
  crop_id: z.string().min(1),
  variety_id: z.string().optional().default(''),
  germination_rate: z.string().optional().default(''),
  expiry_date: z.string().optional().default(''),
  seed_name: z.string().optional().default(''),
  brand: z.string().optional().default(''),
});
export const updateSeedSchema = createSeedSchema.partial();

// 13. Fertilizer Schema
export const createFertilizerSchema = z.object({
  name: z.string().min(1),
  inventory_item_id: z.string().min(1),
  nitrogen_percent: z.string().optional().default('0'),
  phosphorus_percent: z.string().optional().default('0'),
  potassium_percent: z.string().optional().default('0'),
  npk_ratio: z.string().optional().default(''),
  brand: z.string().optional().default(''),
});
export const updateFertilizerSchema = createFertilizerSchema.partial();

// 14. Pesticide Schema
export const createPesticideSchema = z.object({
  name: z.string().min(1),
  inventory_item_id: z.string().min(1),
  pesticide_type: z.string().optional().default(''),
  target_pest: z.string().optional().default(''),
  brand: z.string().optional().default(''),
});
export const updatePesticideSchema = createPesticideSchema.partial();

// 15. Inventory Item Schema
export const createInventoryItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.string().or(z.number()).transform(String),
  unit: z.string().min(1),
  supplier_id: z.string().min(1),
});
export const updateInventoryItemSchema = createInventoryItemSchema.partial();

// 16. Supplier Schema
export const createSupplierSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().default(''),
});
export const updateSupplierSchema = createSupplierSchema.partial();

// 17. Worker Schema
export const createWorkerSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().default('Laborer'),
  salary: z.string().or(z.number()).transform(String).optional().default('0'),
  farm_id: z.string().min(1),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  gender: z.string().optional().default(''),
  skill_type: z.string().optional().default(''),
  daily_wage: z.string().optional().default(''),
});
export const updateWorkerSchema = createWorkerSchema.partial();

// 18. Attendance Schema
export const createAttendanceSchema = z.object({
  worker_id: z.string().min(1),
  attendance_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  status: z.string().optional().default('present'),
  hours_worked: z.string().or(z.number()).transform(String).optional().default('8'),
});
export const updateAttendanceSchema = createAttendanceSchema.partial();

// 19. Equipment Schema
export const createEquipmentSchema = z.object({
  name: z.string().min(1),
  equipment_type: z.string().optional().default('Tractor'),
  purchase_date: z.string().optional().default(''),
  status: z.string().optional().default('operational'),
  farm_id: z.string().min(1),
  cost: z.string().optional().default('0'),
});
export const updateEquipmentSchema = createEquipmentSchema.partial();

// 20. Maintenance Schema
export const createMaintenanceSchema = z.object({
  equipment_id: z.string().min(1),
  maintenance_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  maintenance_type: z.string().optional().default('routine'),
  cost: z.string().or(z.number()).transform(String).optional().default('0'),
  status: z.string().optional().default('completed'),
  description: z.string().optional().default(''),
});
export const updateMaintenanceSchema = createMaintenanceSchema.partial();

// 21. Worker Equipment Bridge Schema
export const createWorkerEquipmentSchema = z.object({
  worker_id: z.string().min(1),
  equipment_id: z.string().min(1),
  assigned_on: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  status: z.string().optional().default('active'),
});
export const updateWorkerEquipmentSchema = createWorkerEquipmentSchema.partial();

// 22. Customer Schema
export const createCustomerSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().default(''),
  type: z.string().optional().default('retail'),
});
export const updateCustomerSchema = createCustomerSchema.partial();

// 23. Sale Schema
export const createSaleSchema = z.object({
  harvest_id: z.string().min(1),
  customer_id: z.string().min(1),
  sale_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  quantity: z.string().or(z.number()).transform(String),
  unit: z.string().optional().default('kg'),
  unit_price: z.string().or(z.number()).transform(String),
  total_amount: z.string().or(z.number()).transform(String),
  status: z.string().optional().default('completed'),
});
export const updateSaleSchema = createSaleSchema.partial();

// 24. Payment Schema
export const createPaymentSchema = z.object({
  sale_id: z.string().min(1),
  payment_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  amount: z.string().or(z.number()).transform(String),
  payment_method: z.string().optional().default('cash'),
  payment_status: z.string().optional().default('completed'),
  transaction_reference: z.string().optional().default(''),
});
export const updatePaymentSchema = createPaymentSchema.partial();

// 25. Farmer Phone Schema
export const createFarmerPhoneSchema = z.object({
  farmer_id: z.string().min(1),
  phone: z.string().min(1),
});
export const updateFarmerPhoneSchema = createFarmerPhoneSchema.partial();

// 26. Supplier Phone Schema
export const createSupplierPhoneSchema = z.object({
  supplier_id: z.string().min(1),
  phone: z.string().min(1),
});
export const updateSupplierPhoneSchema = createSupplierPhoneSchema.partial();

// 27. Worker Phone Schema
export const createWorkerPhoneSchema = z.object({
  worker_id: z.string().min(1),
  phone: z.string().min(1),
});
export const updateWorkerPhoneSchema = createWorkerPhoneSchema.partial();

// 28. Customer Phone Schema
export const createCustomerPhoneSchema = z.object({
  customer_id: z.string().min(1),
  phone: z.string().min(1),
});
export const updateCustomerPhoneSchema = createCustomerPhoneSchema.partial();
