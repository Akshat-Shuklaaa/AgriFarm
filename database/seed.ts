/**
 * Comprehensive, safe, idempotent database seed script for AgriFarm SaaS.
 * 
 * Supports:
 *  - Full 28 entities conforming strictly to REDIS_SCHEMA.md and validation schemas
 *  - 30 Farmers, 20 Crops, 50 Fields, 60 Crop Seasons, 40 Inventory items (Seeds, Fertilizers, Pesticides),
 *    15 Suppliers, 30 Workers, 15 Equipment units, 30 Customers, 50 Harvests, 50 Sales, 50 Payments, etc.
 *  - 400+ realistic, internally consistent Indian agricultural records
 *  - Safe key prefixing using designated semantic ranges (e.g. farmer:101-130, farm:201-230, etc.)
 *  - Non-destructive: preserves existing user records, verifies index integrity, NEVER calls FLUSH
 *  - Idempotent: safe to run multiple times without duplicating sample records
 *  - Flags: --dry-run, --overwrite, --prod-confirm (for remote/production safety check)
 */

import { redis } from '../backend/src/config/redis';
import { syncCounterToMax } from '../backend/src/utils/idGenerator';
import { ENTITY_DEFINITIONS } from '../backend/src/services/initIndexes';

const isDryRun = process.argv.includes('--dry-run');
const overwrite = process.argv.includes('--overwrite');
const isProd = process.env.NODE_ENV === 'production';
const hasProdConfirm = process.argv.includes('--prod-confirm');

if (isProd && !hasProdConfirm && !isDryRun) {
  console.error('[Safety Lock] Running seed against PRODUCTION requires explicit confirmation.');
  console.error('Pass --prod-confirm to proceed, or use --dry-run to simulate.');
  process.exit(1);
}

console.log(`\n============================================================`);
console.log(`      AGRIFARM IDEMPOTENT DATABASE SEEDING ENGINE           `);
console.log(`============================================================`);
console.log(`Mode: ${isDryRun ? 'DRY-RUN (No writes)' : 'LIVE EXECUTION'}`);
console.log(`Overwrite Existing: ${overwrite}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Target Redis: ${process.env.REDIS_URL ? '[Remote / REDIS_URL]' : 'localhost:6379'}\n`);

export interface SeedEntity {
  key: string;
  indexKey: string;
  data: Record<string, string>;
  relations?: Array<{ key: string; member: string }>;
}

export function generateSeedData(): SeedEntity[] {
  const records: SeedEntity[] = [];

  // ==========================================
  // 1. SEASONS (4 Seasons: Kharif, Rabi, Zaid, Annual)
  // IDs: 901 - 904
  // ==========================================
  const seasonsData = [
    { id: '901', name: 'Kharif 2026', start_month: 'June', end_month: 'October', description: 'Southwest monsoon cropping season for rice, cotton, and pulses' },
    { id: '902', name: 'Rabi 2026', start_month: 'November', end_month: 'April', description: 'Winter cropping season for wheat, mustard, and gram' },
    { id: '903', name: 'Zaid 2026', start_month: 'March', end_month: 'June', description: 'Summer short-duration season for vegetables, watermelon, and cucumber' },
    { id: '904', name: 'Annual 2026', start_month: 'January', end_month: 'December', description: 'Year-round commercial crop cycle for sugarcane, banana, and turmeric' },
  ];

  for (const s of seasonsData) {
    records.push({
      key: `season:${s.id}`,
      indexKey: 'seasons:index',
      data: {
        season_id: s.id,
        name: s.name,
        season_name: s.name,
        start_month: s.start_month,
        end_month: s.end_month,
        description: s.description,
      },
    });
  }

  // ==========================================
  // 2. CROPS (20 Crops) & CROP VARIETIES (20 Varieties)
  // Crop IDs: 701 - 720
  // Variety IDs: 801 - 820
  // ==========================================
  const cropsList = [
    { id: '701', name: 'Rice', sci: 'Oryza sativa', cat: 'Cereal', days: '125', varietyId: '801', vName: 'Ponni Deluxe', yield: '2800' },
    { id: '702', name: 'Wheat', sci: 'Triticum aestivum', cat: 'Cereal', days: '135', varietyId: '802', vName: 'Sharbati Gold', yield: '3200' },
    { id: '703', name: 'Maize', sci: 'Zea mays', cat: 'Cereal', days: '105', varietyId: '803', vName: 'Deccan Hybrid 103', yield: '4500' },
    { id: '704', name: 'Cotton', sci: 'Gossypium hirsutum', cat: 'Cash Crop', days: '160', varietyId: '804', vName: 'Bollgard II Bt', yield: '1800' },
    { id: '705', name: 'Sugarcane', sci: 'Saccharum officinarum', cat: 'Cash Crop', days: '360', varietyId: '805', vName: 'Co 0238 Super', yield: '35000' },
    { id: '706', name: 'Tomato', sci: 'Solanum lycopersicum', cat: 'Vegetable', days: '90', varietyId: '806', vName: 'Arka Rakshak', yield: '12000' },
    { id: '707', name: 'Onion', sci: 'Allium cepa', cat: 'Vegetable', days: '110', varietyId: '807', vName: 'Bhima Super', yield: '9500' },
    { id: '708', name: 'Potato', sci: 'Solanum tuberosum', cat: 'Vegetable', days: '95', varietyId: '808', vName: 'Kufri Jyoti', yield: '11000' },
    { id: '709', name: 'Groundnut', sci: 'Arachis hypogaea', cat: 'Oilseed', days: '115', varietyId: '809', vName: 'Kadiri 6', yield: '1900' },
    { id: '710', name: 'Soybean', sci: 'Glycine max', cat: 'Oilseed', days: '100', varietyId: '810', vName: 'JS 335', yield: '2100' },
    { id: '711', name: 'Banana', sci: 'Musa acuminata', cat: 'Fruit', days: '330', varietyId: '811', vName: 'Grand Naine (G9)', yield: '25000' },
    { id: '712', name: 'Mango', sci: 'Mangifera indica', cat: 'Fruit', days: '150', varietyId: '812', vName: 'Banganapalli Choice', yield: '8000' },
    { id: '713', name: 'Turmeric', sci: 'Curcuma longa', cat: 'Cash Crop', days: '260', varietyId: '813', vName: 'Prathibha Gold', yield: '6500' },
    { id: '714', name: 'Chilli', sci: 'Capsicum annuum', cat: 'Vegetable', days: '140', varietyId: '814', vName: 'Guntur Sannam', yield: '3200' },
    { id: '715', name: 'Finger Millet (Ragi)', sci: 'Eleusine coracana', cat: 'Cereal', days: '110', varietyId: '815', vName: 'GPU 28', yield: '2200' },
    { id: '716', name: 'Pearl Millet (Bajra)', sci: 'Pennisetum glaucum', cat: 'Cereal', days: '85', varietyId: '816', vName: 'Pusa 1201', yield: '2400' },
    { id: '717', name: 'Chickpea (Chana)', sci: 'Cicer arietinum', cat: 'Pulse', days: '105', varietyId: '817', vName: 'JG 11 Desi', yield: '1600' },
    { id: '718', name: 'Black Gram (Urad)', sci: 'Vigna mungo', cat: 'Pulse', days: '80', varietyId: '818', vName: 'VBN 8', yield: '1100' },
    { id: '719', name: 'Green Gram (Moong)', sci: 'Vigna radiata', cat: 'Pulse', days: '70', varietyId: '819', vName: 'IPM 2-3', yield: '1050' },
    { id: '720', name: 'Mustard', sci: 'Brassica juncea', cat: 'Oilseed', days: '110', varietyId: '820', vName: 'Pusa Bold', yield: '1750' },
  ];

  for (const c of cropsList) {
    records.push({
      key: `crop:${c.id}`,
      indexKey: 'crops:index',
      data: {
        crop_id: c.id,
        name: c.name,
        scientific_name: c.sci,
        category: c.cat,
        duration_days: c.days,
        variety: c.vName,
        description: `Premium ${c.name} cultivated across Indian agricultural zones`,
      },
      relations: [{ key: `crop:${c.id}:varieties`, member: c.varietyId }],
    });

    records.push({
      key: `crop_variety:${c.varietyId}`,
      indexKey: 'crop_varieties:index',
      data: {
        variety_id: c.varietyId,
        crop_id: c.id,
        variety_name: c.vName,
        expected_yield_per_acre: c.yield,
      },
    });
  }

  // ==========================================
  // 3. SUPPLIERS (15 Suppliers) & SUPPLIER PHONES
  // Supplier IDs: 1101 - 1115
  // Supplier Phone IDs: 1121 - 1135
  // ==========================================
  const suppliersData = [
    { id: '1101', phoneId: '1121', name: 'Tamil Nadu Agro Supplies Ltd', address: 'Guindy, Chennai, Tamil Nadu', email: 'sales@tnagro.example.com', phone: '9876501101' },
    { id: '1102', phoneId: '1122', name: 'Kaveri Seed Company', address: 'Secunderabad, Telangana', email: 'support@kaveriseeds.example.com', phone: '9876501102' },
    { id: '1103', phoneId: '1123', name: 'Coromandel International Fertilizers', address: 'Visakhapatnam, Andhra Pradesh', email: 'contact@coromandel.example.com', phone: '9876501103' },
    { id: '1104', phoneId: '1124', name: 'Maharastra Krishi Kendra', address: 'Shivajinagar, Pune, Maharashtra', email: 'info@krishikendra.example.com', phone: '9876501104' },
    { id: '1105', phoneId: '1125', name: 'Punjab Agro Seed Corporation', address: 'Sector 17, Chandigarh, Punjab', email: 'seeds@punjabagro.example.com', phone: '9876501105' },
    { id: '1106', phoneId: '1126', name: 'Karnataka Bio-Agro Solutions', address: 'Hebbal, Bengaluru, Karnataka', email: 'bio@karagro.example.com', phone: '9876501106' },
    { id: '1107', phoneId: '1127', name: 'Gujarat Pesticides & Nutrients', address: 'GIDC, Vadodara, Gujarat', email: 'orders@gujpesticides.example.com', phone: '9876501107' },
    { id: '1108', phoneId: '1128', name: 'Rasi Seeds Bio-Tech', address: 'Attur, Salem, Tamil Nadu', email: 'sales@rasiseeds.example.com', phone: '9876501108' },
    { id: '1109', phoneId: '1129', name: 'IFFCO Farmers Cooperative', address: 'Chanakyapuri, New Delhi', email: 'customercare@iffco.example.com', phone: '9876501109' },
    { id: '1110', phoneId: '1130', name: 'Godrej Agrovet Inputs', address: 'Vikhroli, Mumbai, Maharashtra', email: 'agrovet@godrej.example.com', phone: '9876501110' },
    { id: '1111', phoneId: '1131', name: 'UPL Crop Protection India', address: 'Bandra, Mumbai, Maharashtra', email: 'support@uplindia.example.com', phone: '9876501111' },
    { id: '1112', phoneId: '1132', name: 'Bayer CropScience South Asia', address: 'Powai, Mumbai, Maharashtra', email: 'agri@bayersouthasia.example.com', phone: '9876501112' },
    { id: '1113', phoneId: '1133', name: 'National Seeds Corporation (NSC)', address: 'Pusa Complex, New Delhi', email: 'contact@nscindia.example.com', phone: '9876501113' },
    { id: '1114', phoneId: '1134', name: 'Jain Irrigation Farm Supplies', address: 'Jalgaon, Maharashtra', email: 'drip@jains.example.com', phone: '9876501114' },
    { id: '1115', phoneId: '1135', name: 'Malwa Organic Bio-Fertilizers', address: 'Indore, Madhya Pradesh', email: 'malwa@biofertilizers.example.com', phone: '9876501115' },
  ];

  for (const sup of suppliersData) {
    records.push({
      key: `supplier:${sup.id}`,
      indexKey: 'suppliers:index',
      data: {
        supplier_id: sup.id,
        name: sup.name,
        address: sup.address,
        email: sup.email,
        phone: sup.phone,
      },
      relations: [{ key: `supplier:${sup.id}:phones`, member: sup.phoneId }],
    });

    records.push({
      key: `supplier_phone:${sup.phoneId}`,
      indexKey: 'supplier_phones:index',
      data: {
        phone_id: sup.phoneId,
        supplier_id: sup.id,
        phone: sup.phone,
      },
    });
  }

  // ==========================================
  // 4. INVENTORY ITEMS (40 Items) with linked SEEDS (15), FERTILIZERS (15), PESTICIDES (10)
  // Inventory IDs: 1201 - 1240
  // Seed IDs: 1301 - 1315
  // Fertilizer IDs: 1401 - 1415
  // Pesticide IDs: 1501 - 1510
  // ==========================================
  const inventoryData = [
    // 15 Seeds
    { id: '1201', name: 'Certified Ponni Paddy Seeds', cat: 'Seed', qty: '850', unit: 'kg', supId: '1101', seedId: '1301', cropId: '701', varId: '801', germ: '96', exp: '2027-04-30' },
    { id: '1202', name: 'Sharbati Wheat Certified Seeds', cat: 'Seed', qty: '1200', unit: 'kg', supId: '1105', seedId: '1302', cropId: '702', varId: '802', germ: '94', exp: '2027-05-31' },
    { id: '1203', name: 'Deccan 103 Hybrid Maize Seeds', cat: 'Seed', qty: '600', unit: 'kg', supId: '1102', seedId: '1303', cropId: '703', varId: '803', germ: '92', exp: '2027-03-31' },
    { id: '1204', name: 'Bollgard II Hybrid Cotton Seeds', cat: 'Seed', qty: '350', unit: 'packets', supId: '1108', seedId: '1304', cropId: '704', varId: '804', germ: '90', exp: '2027-06-30' },
    { id: '1205', name: 'Tissue Culture Sugarcane Setts', cat: 'Seed', qty: '5000', unit: 'setts', supId: '1106', seedId: '1305', cropId: '705', varId: '805', germ: '98', exp: '2026-12-31' },
    { id: '1206', name: 'Arka Rakshak F1 Tomato Seeds', cat: 'Seed', qty: '120', unit: 'packets', supId: '1106', seedId: '1306', cropId: '706', varId: '806', germ: '95', exp: '2027-08-31' },
    { id: '1207', name: 'Bhima Super Red Onion Seeds', cat: 'Seed', qty: '400', unit: 'kg', supId: '1104', seedId: '1307', cropId: '707', varId: '807', germ: '91', exp: '2027-02-28' },
    { id: '1208', name: 'Kufri Jyoti Certified Seed Tubers', cat: 'Seed', qty: '2500', unit: 'kg', supId: '1113', seedId: '1308', cropId: '708', varId: '808', germ: '95', exp: '2026-11-30' },
    { id: '1209', name: 'Kadiri 6 Groundnut Kernels', cat: 'Seed', qty: '750', unit: 'kg', supId: '1103', seedId: '1309', cropId: '709', varId: '809', germ: '93', exp: '2027-04-15' },
    { id: '1210', name: 'JS 335 Certified Soybean Seeds', cat: 'Seed', qty: '900', unit: 'kg', supId: '1115', seedId: '1310', cropId: '710', varId: '810', germ: '92', exp: '2027-05-15' },
    { id: '1211', name: 'G9 Tissue Culture Banana Suckers', cat: 'Seed', qty: '2000', unit: 'plants', supId: '1106', seedId: '1311', cropId: '711', varId: '811', germ: '99', exp: '2026-12-15' },
    { id: '1212', name: 'Prathibha Turmeric Mother Rhizomes', cat: 'Seed', qty: '1500', unit: 'kg', supId: '1101', seedId: '1312', cropId: '713', varId: '813', germ: '95', exp: '2027-03-31' },
    { id: '1213', name: 'Guntur Sannam Hot Chilli Seeds', cat: 'Seed', qty: '200', unit: 'packets', supId: '1103', seedId: '1313', cropId: '714', varId: '814', germ: '94', exp: '2027-07-31' },
    { id: '1214', name: 'GPU 28 Ragi Certified Seeds', cat: 'Seed', qty: '500', unit: 'kg', supId: '1106', seedId: '1314', cropId: '715', varId: '815', germ: '96', exp: '2027-09-30' },
    { id: '1215', name: 'JG 11 Desi Chickpea Seeds', cat: 'Seed', qty: '650', unit: 'kg', supId: '1115', seedId: '1315', cropId: '717', varId: '817', germ: '93', exp: '2027-04-30' },

    // 15 Fertilizers
    { id: '1216', name: 'IFFCO Urea Granular (46% N)', cat: 'Fertilizer', qty: '2400', unit: 'kg', supId: '1109', fertId: '1401', n: '46', p: '0', k: '0', npk: '46-0-0', brand: 'IFFCO' },
    { id: '1217', name: 'DAP Di-Ammonium Phosphate (18-46-0)', cat: 'Fertilizer', qty: '1800', unit: 'kg', supId: '1109', fertId: '1402', n: '18', p: '46', k: '0', npk: '18-46-0', brand: 'IFFCO' },
    { id: '1218', name: 'MOP Muriate of Potash (60% K2O)', cat: 'Fertilizer', qty: '1500', unit: 'kg', supId: '1103', fertId: '1403', n: '0', p: '0', k: '60', npk: '0-0-60', brand: 'Coromandel' },
    { id: '1219', name: 'Gromor NPK Complex 20-20-0-13S', cat: 'Fertilizer', qty: '1200', unit: 'kg', supId: '1103', fertId: '1404', n: '20', p: '20', k: '0', npk: '20-20-0', brand: 'Coromandel' },
    { id: '1220', name: 'Mahadhan NPK 19-19-19 100% Water Soluble', cat: 'Fertilizer', qty: '750', unit: 'kg', supId: '1104', fertId: '1405', n: '19', p: '19', k: '19', npk: '19-19-19', brand: 'Mahadhan' },
    { id: '1221', name: 'Single Super Phosphate (SSP 16% P2O5)', cat: 'Fertilizer', qty: '1600', unit: 'kg', supId: '1107', fertId: '1406', n: '0', p: '16', k: '0', npk: '0-16-0', brand: 'Gujarat Fert' },
    { id: '1222', name: 'Zinc Sulphate Monohydrate (33% Zn)', cat: 'Fertilizer', qty: '400', unit: 'kg', supId: '1107', fertId: '1407', n: '0', p: '0', k: '0', npk: 'Micro-Zinc', brand: 'Gujarat Agro' },
    { id: '1223', name: 'Ferrous Sulphate 19% Micro Nutrient', cat: 'Fertilizer', qty: '350', unit: 'kg', supId: '1115', fertId: '1408', n: '0', p: '0', k: '0', npk: 'Micro-Iron', brand: 'Malwa Bio' },
    { id: '1224', name: 'Neem Coated Urea (NCU)', cat: 'Fertilizer', qty: '2000', unit: 'kg', supId: '1109', fertId: '1409', n: '46', p: '0', k: '0', npk: '46-0-0-NCU', brand: 'IFFCO' },
    { id: '1225', name: 'Coromandel NPK 10-26-26 Complex', cat: 'Fertilizer', qty: '1100', unit: 'kg', supId: '1103', fertId: '1410', n: '10', p: '26', k: '26', npk: '10-26-26', brand: 'Coromandel' },
    { id: '1226', name: 'Calcium Nitrate Water Soluble', cat: 'Fertilizer', qty: '500', unit: 'kg', supId: '1104', fertId: '1411', n: '15', p: '0', k: '0', npk: '15.5-0-0+18.8Ca', brand: 'Mahadhan' },
    { id: '1227', name: 'Potassium Nitrate NPK 13-0-45', cat: 'Fertilizer', qty: '450', unit: 'kg', supId: '1115', fertId: '1412', n: '13', p: '0', k: '45', npk: '13-0-45', brand: 'Malwa Bio' },
    { id: '1228', name: 'Boron 20% Disodium Octaborate', cat: 'Fertilizer', qty: '200', unit: 'kg', supId: '1107', fertId: '1413', n: '0', p: '0', k: '0', npk: 'Boron-20', brand: 'Gujarat Agro' },
    { id: '1229', name: 'Organic Vermicompost Enriched', cat: 'Fertilizer', qty: '4500', unit: 'kg', supId: '1115', fertId: '1414', n: '2', p: '1', k: '1', npk: 'Bio-Organic', brand: 'Malwa Bio' },
    { id: '1230', name: 'Bio-NPK Liquid Consortium Conserve', cat: 'Fertilizer', qty: '300', unit: 'liters', supId: '1106', fertId: '1415', n: 'Bio', p: 'Bio', k: 'Bio', npk: 'Microbial', brand: 'Kar Bio' },

    // 10 Pesticides
    { id: '1231', name: 'NeemAzal T/S Neem Oil 10000 PPM', cat: 'Pesticide', qty: '180', unit: 'liters', supId: '1101', pestId: '1501', pType: 'Biological', target: 'Whiteflies, Aphids, Thrips', brand: 'EID Parry' },
    { id: '1232', name: 'Confidor Imidacloprid 17.8% SL', cat: 'Pesticide', qty: '120', unit: 'liters', supId: '1112', pestId: '1502', pType: 'Chemical', target: 'Brown Plant Hopper, Termites', brand: 'Bayer' },
    { id: '1233', name: 'Saaf Mancozeb 63% + Carbendazim 12% WP', cat: 'Pesticide', qty: '250', unit: 'kg', supId: '1111', pestId: '1503', pType: 'Fungicide', target: 'Blast, Leaf Spot, Fruit Rot', brand: 'UPL' },
    { id: '1234', name: 'Coragen Chlorantraniliprole 18.5% SC', cat: 'Pesticide', qty: '80', unit: 'liters', supId: '1110', pestId: '1504', pType: 'Chemical', target: 'Stem Borer, Fruit Borer, Spodoptera', brand: 'FMC/Godrej' },
    { id: '1235', name: 'Roundup Glyphosate 41% SL Herbicide', cat: 'Pesticide', qty: '220', unit: 'liters', supId: '1112', pestId: '1505', pType: 'Herbicide', target: 'Broad Spectrum Annual & Perennial Weeds', brand: 'Bayer' },
    { id: '1236', name: 'Trichoderma Viride Bio-Fungicide', cat: 'Pesticide', qty: '400', unit: 'kg', supId: '1106', pestId: '1506', pType: 'Biological', target: 'Root Rot, Collar Rot, Wilt', brand: 'Kar Bio' },
    { id: '1237', name: 'Pseudomonas fluorescens 1% WP Bio-agent', cat: 'Pesticide', qty: '350', unit: 'kg', supId: '1106', pestId: '1507', pType: 'Biological', target: 'Bacterial Blight, Sheath Rot', brand: 'Kar Bio' },
    { id: '1238', name: 'Rogor Dimethoate 30% EC Systemic', cat: 'Pesticide', qty: '150', unit: 'liters', supId: '1111', pestId: '1508', pType: 'Chemical', target: 'Mites, Stem Flies, Jassids', brand: 'UPL' },
    { id: '1239', name: 'Amistar Top Difenoconazole + Azoxystrobin', cat: 'Pesticide', qty: '90', unit: 'liters', supId: '1110', pestId: '1509', pType: 'Fungicide', target: 'Powdery Mildew, Anthracnose', brand: 'Syngenta/Godrej' },
    { id: '1240', name: 'Pendimethalin 30% EC Pre-emergence Herbicide', cat: 'Pesticide', qty: '160', unit: 'liters', supId: '1111', pestId: '1510', pType: 'Herbicide', target: 'Early Grasses & Broadleaf Weeds', brand: 'UPL' },
  ];

  for (const item of inventoryData) {
    const relations: Array<{ key: string; member: string }> = [
      { key: `supplier:${item.supId}:inventory_items`, member: item.id },
    ];

    if (item.seedId) relations.push({ key: `inventory_item:${item.id}:seeds`, member: item.seedId });
    if (item.fertId) relations.push({ key: `inventory_item:${item.id}:fertilizers`, member: item.fertId });
    if (item.pestId) relations.push({ key: `inventory_item:${item.id}:pesticides`, member: item.pestId });

    records.push({
      key: `inventory_item:${item.id}`,
      indexKey: 'inventory_items:index',
      data: {
        item_id: item.id,
        name: item.name,
        category: item.cat,
        quantity: item.qty,
        unit: item.unit,
        supplier_id: item.supId,
      },
      relations,
    });

    if (item.seedId) {
      records.push({
        key: `seed:${item.seedId}`,
        indexKey: 'seeds:index',
        data: {
          seed_id: item.seedId,
          inventory_item_id: item.id,
          crop_id: item.cropId!,
          variety_id: item.varId || '',
          germination_rate: item.germ!,
          expiry_date: item.exp!,
          seed_name: item.name,
          brand: 'Certified National Seed',
        },
      });
    }

    if (item.fertId) {
      records.push({
        key: `fertilizer:${item.fertId}`,
        indexKey: 'fertilizers:index',
        data: {
          fertilizer_id: item.fertId,
          name: item.name,
          inventory_item_id: item.id,
          nitrogen_percent: item.n!,
          phosphorus_percent: item.p!,
          potassium_percent: item.k!,
          npk_ratio: item.npk!,
          brand: item.brand!,
        },
      });
    }

    if (item.pestId) {
      records.push({
        key: `pesticide:${item.pestId}`,
        indexKey: 'pesticides:index',
        data: {
          pesticide_id: item.pestId,
          name: item.name,
          inventory_item_id: item.id,
          pesticide_type: item.pType!,
          target_pest: item.target!,
          brand: item.brand!,
        },
      });
    }
  }

  // ==========================================
  // 5. FARMERS (30 Farmers) & FARMER PHONES (30)
  // Farmer IDs: 101 - 130
  // Farmer Phone IDs: 151 - 180
  // ==========================================
  const farmersList = [
    { id: '101', name: 'Ramesh Kumar', addr: 'Kanchipuram, Tamil Nadu', email: 'ramesh@example.com', phone: '9876543210' },
    { id: '102', name: 'Gurpreet Singh', addr: 'Ludhiana, Punjab', email: 'gurpreet.singh@agrifarm.example.com', phone: '9876543211' },
    { id: '103', name: 'Venkat Reddy', addr: 'Guntur, Andhra Pradesh', email: 'venkat.reddy@agrifarm.example.com', phone: '9876543212' },
    { id: '104', name: 'Shivaji Patil', addr: 'Kolhapur, Maharashtra', email: 'shivaji.patil@agrifarm.example.com', phone: '9876543213' },
    { id: '105', name: 'Rahul R', addr: 'Meelakottiyur, Tamil Nadu', email: 'rahul@gmail.com', phone: '5282923133' },
    { id: '106', name: 'Mohan', addr: 'Chennai, Tamil Nadu', email: 'mohan@gmail.com', phone: '9876543214' },
    { id: '107', name: 'Ram Singh', addr: 'JP Nagar, Bengaluru, Karnataka', email: 'ram@example.com', phone: '7569843575' },
    { id: '108', name: 'Anand Deshmukh', addr: 'Akola, Maharashtra', email: 'anand.deshmukh@agrifarm.example.com', phone: '9876543215' },
    { id: '109', name: 'Muthusamy Gounder', addr: 'Pollachi, Tamil Nadu', email: 'muthusamy@agrifarm.example.com', phone: '9876543216' },
    { id: '110', name: 'Hardeep Gill', addr: 'Bathinda, Punjab', email: 'hardeep.gill@agrifarm.example.com', phone: '9876543217' },
    { id: '111', name: 'Jagdish Choudhary', addr: 'Kota, Rajasthan', email: 'jagdish.choudhary@agrifarm.example.com', phone: '9876543218' },
    { id: '112', name: 'Ramaswamy Naidu', addr: 'Nellore, Andhra Pradesh', email: 'ramaswamy.naidu@agrifarm.example.com', phone: '9876543219' },
    { id: '113', name: 'Bhupendra Patel', addr: 'Anand, Gujarat', email: 'bhupendra.patel@agrifarm.example.com', phone: '9876543220' },
    { id: '114', name: 'Birendra Yadav', addr: 'Gorakhpur, Uttar Pradesh', email: 'birendra.yadav@agrifarm.example.com', phone: '9876543221' },
    { id: '115', name: 'Gopal Hegde', addr: 'Sirsi, Karnataka', email: 'gopal.hegde@agrifarm.example.com', phone: '9876543222' },
    { id: '116', name: 'Manish Tiwari', addr: 'Jabalpur, Madhya Pradesh', email: 'manish.tiwari@agrifarm.example.com', phone: '9876543223' },
    { id: '117', name: 'Siddaramaiah Gowda', addr: 'Mandya, Karnataka', email: 'siddaramaiah@agrifarm.example.com', phone: '9876543224' },
    { id: '118', name: 'Praveen Sharma', addr: 'Karnal, Haryana', email: 'praveen.sharma@agrifarm.example.com', phone: '9876543225' },
    { id: '119', name: 'Kishore Jena', addr: 'Balasore, Odisha', email: 'kishore.jena@agrifarm.example.com', phone: '9876543226' },
    { id: '120', name: 'Subir Mondal', addr: 'Burdwan, West Bengal', email: 'subir.mondal@agrifarm.example.com', phone: '9876543227' },
    { id: '121', name: 'Satish Shinde', addr: 'Nashik, Maharashtra', email: 'satish.shinde@agrifarm.example.com', phone: '9876543228' },
    { id: '122', name: 'Dharmendra Rawat', addr: 'Dehradun, Uttarakhand', email: 'dharmendra.rawat@agrifarm.example.com', phone: '9876543229' },
    { id: '123', name: 'Chandrahas Nair', addr: 'Palakkad, Kerala', email: 'chandrahas.nair@agrifarm.example.com', phone: '9876543230' },
    { id: '124', name: 'Naveen Reddy', addr: 'Khammam, Telangana', email: 'naveen.reddy@agrifarm.example.com', phone: '9876543231' },
    { id: '125', name: 'Virendra Rathore', addr: 'Udaipur, Rajasthan', email: 'virendra.rathore@agrifarm.example.com', phone: '9876543232' },
    { id: '126', name: 'Pankaj Borah', addr: 'Nagaon, Assam', email: 'pankaj.borah@agrifarm.example.com', phone: '9876543233' },
    { id: '127', name: 'Satyavan Verma', addr: 'Raipur, Chhattisgarh', email: 'satyavan.verma@agrifarm.example.com', phone: '9876543234' },
    { id: '128', name: 'Devendra Meena', addr: 'Sawai Madhopur, Rajasthan', email: 'devendra.meena@agrifarm.example.com', phone: '9876543235' },
    { id: '129', name: 'Ayyappan Pillai', addr: 'Alappuzha, Kerala', email: 'ayyappan.pillai@agrifarm.example.com', phone: '9876543236' },
    { id: '130', name: 'Ashok Ganguly', addr: 'Hooghly, West Bengal', email: 'ashok.ganguly@agrifarm.example.com', phone: '9876543237' },
  ];

  for (let i = 0; i < farmersList.length; i++) {
    const f = farmersList[i];
    const phoneId = String(151 + i);
    records.push({
      key: `farmer:${f.id}`,
      indexKey: 'farmers:index',
      data: {
        farmer_id: f.id,
        name: f.name,
        address: f.addr,
        email: f.email,
        phone: f.phone,
      },
      relations: [{ key: `farmer:${f.id}:phones`, member: phoneId }],
    });

    records.push({
      key: `farmer_phone:${phoneId}`,
      indexKey: 'farmer_phones:index',
      data: {
        phone_id: phoneId,
        farmer_id: f.id,
        phone: f.phone,
      },
    });
  }

  // ==========================================
  // 6. FARMS (30 Farms: one per farmer)
  // Farm IDs: 201 - 230
  // Linked Farmer IDs: 101 - 130
  // ==========================================
  const farmNames = [
    'Green Valley Farm', 'Golden Fields Agro Estate', 'Kaveri Basin Plantation', 'Sahyadri Organic Orchard',
    'Chola Dynasty Farmlands', 'Deccan Horizon Farm', 'Cauvery Green Acres', 'Panchaganga Agro Meadows',
    'Annamalai Coconut Grove', 'Satluj Breeze Farmland', 'Hadoti Basin Agro Farm', 'Penna Delta Paddy Fields',
    'Amul Dairy & Fodder Farm', 'Ganga Plains Agro Hub', 'Malnad Spice Plantation', 'Narmada Valley Agro',
    'Mandya Sugarcane Greens', 'Yamuna Khadir Farm', 'Mahanadi Coastal Agro', 'Rarh Bengal Agro Estate',
    'Godavari Grape Vineyards', 'Doon Valley Organic Farm', 'Kuttanad Backwater Paddy', 'Krishna River Basin Farm',
    'Mewar Organic Acreage', 'Brahmaputra Agro Valley', 'Mahanadi Basin Agro Fields', 'Ranthambore Border Farm',
    'Vembanad Lake Agro Estate', 'Damodar Agro Acres',
  ];

  const locations = [
    'Kanchipuram, TN', 'Ludhiana, PB', 'Guntur, AP', 'Kolhapur, MH',
    'Chengalpattu, TN', 'Thiruvallur, TN', 'Bengaluru Rural, KA', 'Akola, MH',
    'Pollachi, TN', 'Bathinda, PB', 'Kota, RJ', 'Nellore, AP',
    'Anand, GJ', 'Gorakhpur, UP', 'Sirsi, KA', 'Jabalpur, MP',
    'Mandya, KA', 'Karnal, HR', 'Balasore, OD', 'Burdwan, WB',
    'Nashik, MH', 'Dehradun, UK', 'Palakkad, KL', 'Khammam, TS',
    'Udaipur, RJ', 'Nagaon, AS', 'Raipur, CG', 'Sawai Madhopur, RJ',
    'Alappuzha, KL', 'Hooghly, WB',
  ];

  for (let i = 0; i < 30; i++) {
    const farmId = String(201 + i);
    const farmerId = String(101 + i);
    const totalArea = String(20 + (i % 7) * 5 + (i * 2) % 15); // 20 to 65 acres

    records.push({
      key: `farm:${farmId}`,
      indexKey: 'farms:index',
      data: {
        farm_id: farmId,
        name: farmNames[i],
        location: locations[i],
        total_area: totalArea,
        farmer_id: farmerId,
      },
      relations: [
        { key: `farmer:${farmerId}:farms`, member: farmId },
      ],
    });
  }

  // ==========================================
  // 7. FIELDS (50 Fields)
  // Field IDs: 301 - 350
  // Distributed across Farms 201 - 230
  // ==========================================
  const soilTypes = ['Loamy', 'Black Soil', 'Alluvial', 'Red Soil', 'Clay', 'Sandy'];
  const fieldNamesPrefix = ['North Plot', 'South Basin', 'East Meadow', 'West Ridge', 'Central Acre', 'Canal View Plot', 'Borewell Plot'];

  for (let i = 0; i < 50; i++) {
    const fieldId = String(301 + i);
    // Map first 30 to farms 201-230, remaining 20 to farms 201-220
    const farmId = String(201 + (i < 30 ? i : i - 30));
    const area = String(4.5 + (i % 8) * 1.5);
    const soilType = soilTypes[i % soilTypes.length];
    const name = `${fieldNamesPrefix[i % fieldNamesPrefix.length]} ${Math.floor(i / 7) + 1}`;

    records.push({
      key: `field:${fieldId}`,
      indexKey: 'fields:index',
      data: {
        field_id: fieldId,
        name: name,
        farm_id: farmId,
        area: area,
        soil_type: soilType,
        description: `Highly fertile ${soilType.toLowerCase()} plot suited for seasonal crop cycles`,
      },
      relations: [
        { key: `farm:${farmId}:fields`, member: fieldId },
      ],
    });
  }

  // ==========================================
  // 8. WATER SOURCES (30 Sources) & IRRIGATION SYSTEMS (30 Systems)
  // Water Source IDs: 501 - 530 (One per Farm 201 - 230)
  // Irrigation IDs: 601 - 630 (Mapped to Fields 301 - 330)
  // ==========================================
  const sourceTypes = ['Borewell', 'Open Well', 'Canal', 'Pond', 'Rainwater'];
  const irrMethods = ['Drip', 'Sprinkler', 'Flood', 'Sub-surface'];
  const irrFreqs = ['Daily', 'Alternate Days', 'Weekly', 'Twice Weekly'];

  for (let i = 0; i < 30; i++) {
    const wsId = String(501 + i);
    const farmId = String(201 + i);
    const sType = sourceTypes[i % sourceTypes.length];

    records.push({
      key: `water_source:${wsId}`,
      indexKey: 'water_sources:index',
      data: {
        source_id: wsId,
        farm_id: farmId,
        source_type: sType,
        source_name: `Primary ${sType} #${i + 1}`,
        status: i % 10 === 0 ? 'Seasonal' : 'Active',
        location: `Quadrant ${((i % 4) + 1)}`,
      },
      relations: [
        { key: `farm:${farmId}:water_sources`, member: wsId },
      ],
    });

    const irrId = String(601 + i);
    const fieldId = String(301 + i);
    const method = irrMethods[i % irrMethods.length];
    const freq = irrFreqs[i % irrFreqs.length];

    records.push({
      key: `irrigation:${irrId}`,
      indexKey: 'irrigations:index',
      data: {
        irrigation_id: irrId,
        field_id: fieldId,
        water_source_id: wsId,
        method: method,
        frequency: freq,
        irrigation_date: '2026-10-01',
        duration: '2 hours',
        water_used: '4500 liters',
      },
      relations: [
        { key: `field:${fieldId}:irrigation_systems`, member: irrId },
      ],
    });
  }

  // ==========================================
  // 9. SOIL TESTS (50 Tests, one per Field 301 - 350)
  // Soil Test IDs: 401 - 450
  // ==========================================
  const nLevels = ['High (320 kg/ha)', 'Medium (240 kg/ha)', 'Medium (280 kg/ha)', 'Low (180 kg/ha)'];
  const pLevels = ['High (45 kg/ha)', 'Medium (30 kg/ha)', 'High (50 kg/ha)', 'Low (18 kg/ha)'];
  const kLevels = ['Medium (210 kg/ha)', 'High (310 kg/ha)', 'High (290 kg/ha)', 'Medium (190 kg/ha)'];

  for (let i = 0; i < 50; i++) {
    const testId = String(401 + i);
    const fieldId = String(301 + i);
    const ph = (6.0 + (i % 15) * 0.1).toFixed(1);
    const day = (1 + (i % 28)).toString().padStart(2, '0');
    const month = (1 + (i % 9)).toString().padStart(2, '0');

    records.push({
      key: `soil_test:${testId}`,
      indexKey: 'soil_tests:index',
      data: {
        test_id: testId,
        field_id: fieldId,
        ph: ph,
        nitrogen: nLevels[i % nLevels.length],
        phosphorus: pLevels[i % pLevels.length],
        potassium: kLevels[i % kLevels.length],
        tested_on: `2026-${month}-${day}`,
        organic_carbon: `${(0.55 + (i % 8) * 0.05).toFixed(2)}%`,
        remarks: `Optimal mineral composition for regional cereal and cash crop cycles`,
      },
      relations: [
        { key: `field:${fieldId}:soil_tests`, member: testId },
      ],
    });
  }

  // ==========================================
  // 10. CROP SEASONS (60 Schedules)
  // Crop Season IDs: 1001 - 1060
  // Linking Fields 301 - 350, Crops 701 - 720, Seasons 901 - 904
  // ==========================================
  const csStatuses = ['Completed', 'Harvested', 'In Progress', 'Planned'];

  for (let i = 0; i < 60; i++) {
    const csId = String(1001 + i);
    const fieldId = String(301 + (i % 50));
    // Determine farmId from field mapping: first 30 fields belong to 201-230, next 20 to 201-220
    const fieldIdx = i % 50;
    const farmId = String(201 + (fieldIdx < 30 ? fieldIdx : fieldIdx - 30));
    const cropId = String(701 + (i % 20));
    const seasonId = String(901 + (i % 4));
    const status = csStatuses[i % csStatuses.length];

    records.push({
      key: `crop_season:${csId}`,
      indexKey: 'crop_seasons:index',
      data: {
        crop_season_id: csId,
        crop_id: cropId,
        season_id: seasonId,
        farm_id: farmId,
        field_id: fieldId,
        year: '2026',
        status: status,
        season_name: `Season Schedule ${csId}`,
        start_date: '2026-06-15',
        end_date: '2026-10-30',
      },
      relations: [
        { key: `crop:${cropId}:seasons`, member: csId },
        { key: `season:${seasonId}:crop_seasons`, member: csId },
        { key: `farm:${farmId}:crop_seasons`, member: csId },
      ],
    });
  }

  // ==========================================
  // 11. HARVESTS (50 Harvest Batches)
  // Harvest IDs: 2101 - 2150
  // Linked to Crop Seasons 1001 - 1050
  // ==========================================
  const qualities = ['Grade A', 'Grade A', 'Grade B', 'Grade A'];
  const units = ['kg', 'kg', 'quintal', 'kg'];

  for (let i = 0; i < 50; i++) {
    const hId = String(2101 + i);
    const csId = String(1001 + i);
    const fieldId = String(301 + (i % 50));
    const day = (1 + (i % 27)).toString().padStart(2, '0');
    const month = (6 + (i % 4)).toString().padStart(2, '0');
    const qty = String(1500 + (i % 12) * 250);
    const qual = qualities[i % qualities.length];
    const u = units[i % units.length];

    records.push({
      key: `harvest:${hId}`,
      indexKey: 'harvests:index',
      data: {
        harvest_id: hId,
        crop_season_id: csId,
        field_id: fieldId,
        harvest_date: `2026-${month}-${day}`,
        quantity: qty,
        unit: u,
        quality: qual,
      },
      relations: [
        { key: `crop_season:${csId}:harvests`, member: hId },
        { key: `field:${fieldId}:harvests`, member: hId },
      ],
    });
  }

  // ==========================================
  // 12. CUSTOMERS (30 Buyers) & CUSTOMER PHONES (30)
  // Customer IDs: 2001 - 2030
  // Customer Phone IDs: 2051 - 2080
  // ==========================================
  const customersList = [
    { id: '2001', name: 'Ravi Traders & Grain Wholesalers', addr: 'Koyambedu, Chennai, Tamil Nadu', email: 'ravi@example.com', phone: '9876523456' },
    { id: '2002', name: 'ITC Agri Commodity Sourcing', addr: 'Secunderabad, Telangana', email: 'procure@itcagri.example.com', phone: '9876523457' },
    { id: '2003', name: 'APMC Grain Terminal Pune', addr: 'Gultekdi, Pune, Maharashtra', email: 'pune.apmc@example.com', phone: '9876523458' },
    { id: '2004', name: 'Punjab Grain Exporters Corp', addr: 'Ludhiana, Punjab', email: 'sales@punjabgrain.example.com', phone: '9876523459' },
    { id: '2005', name: 'Reliance Fresh Agro Hub', addr: 'Vashi, Navi Mumbai, Maharashtra', email: 'sourcing@reliancefresh.example.com', phone: '9876523460' },
    { id: '2006', name: 'Heritage Foods Milk & Grain Ltd', addr: 'Hyderabad, Telangana', email: 'commodities@heritage.example.com', phone: '9876523461' },
    { id: '2007', name: 'Adani Wilmar Edible Oils Hub', addr: 'Mundra, Gujarat', email: 'oilseed@adaniwilmar.example.com', phone: '9876523462' },
    { id: '2008', name: 'Mother Dairy Fruit & Vegetable', addr: 'Mangolpuri, Delhi', email: 'mdfv@motherdairy.example.com', phone: '9876523463' },
    { id: '2009', name: 'Cargill India Food Distribution', addr: 'Gurugram, Haryana', email: 'india_sales@cargill.example.com', phone: '9876523464' },
    { id: '2010', name: 'Blinkit Hyperlocal Hub South', addr: 'Whitefield, Bengaluru, Karnataka', email: 'vendor@blinkit.example.com', phone: '9876523465' },
    { id: '2011', name: 'Godrej Nature Basket Retail', addr: 'Koramangala, Bengaluru, Karnataka', email: 'supplies@naturesbasket.example.com', phone: '9876523466' },
    { id: '2012', name: 'BigBasket Wholesale Mandi', addr: 'Okhla Phase II, New Delhi', email: 'farmfresh@bigbasket.example.com', phone: '9876523467' },
    { id: '2013', name: 'Spencer Retail Wholesale Outlet', addr: 'Park Street, Kolkata, West Bengal', email: 'agriprocure@spencers.example.com', phone: '9876523468' },
    { id: '2014', name: 'Kisan Mandi Traders Association', addr: 'Chandigarh, Punjab', email: 'kisanmandi@traders.example.com', phone: '9876523469' },
    { id: '2015', name: 'Maharashtra Cotton Marketing Fed', addr: 'Nagpur, Maharashtra', email: 'cotton@mahagov.example.com', phone: '9876523470' },
    { id: '2016', name: 'DCM Shriram Sugar Mill Sourcing', addr: 'Muzaffarnagar, Uttar Pradesh', email: 'sugarcane@shriram.example.com', phone: '9876523471' },
    { id: '2017', name: 'Nafed Commodity Procurement', addr: 'Ashram Road, Ahmedabad, Gujarat', email: 'procurement@nafed.example.com', phone: '9876523472' },
    { id: '2018', name: 'Organic India Herbals Sourcing', addr: 'Lucknow, Uttar Pradesh', email: 'herbs@organicindia.example.com', phone: '9876523473' },
    { id: '2019', name: 'Haldiram Snacks Food Processing', addr: 'Noida, Uttar Pradesh', email: 'rawmaterials@haldirams.example.com', phone: '9876523474' },
    { id: '2020', name: 'Patanjali Agro Inputs & Purchase', addr: 'Haridwar, Uttarakhand', email: 'grainpurchase@patanjali.example.com', phone: '9876523475' },
    { id: '2021', name: 'Metro Cash & Carry Wholesale', addr: 'Yeshwanthpur, Bengaluru, Karnataka', email: 'buyer@metro.example.com', phone: '9876523476' },
    { id: '2022', name: 'Tata Consumer Products Beverages', addr: 'Kochi, Kerala', email: 'spices@tataconsumer.example.com', phone: '9876523477' },
    { id: '2023', name: 'Eastern Condiments Spice Mills', addr: 'Adimali, Idukki, Kerala', email: 'spices@eastern.example.com', phone: '9876523478' },
    { id: '2024', name: 'Bikanervala Agro Food Raw Stocks', addr: 'Bhiwadi, Rajasthan', email: 'supply@bikanervala.example.com', phone: '9876523479' },
    { id: '2025', name: 'Zomato Hyperpure Agro Mandi', addr: 'Gurugram, Haryana', email: 'hyperpure@zomato.example.com', phone: '9876523480' },
    { id: '2026', name: 'Zepto QuickFresh Distribution', addr: 'Marol, Andheri, Mumbai', email: 'procurement@zepto.example.com', phone: '9876523481' },
    { id: '2027', name: 'Tamil Nadu Civil Supplies Corp', addr: 'Kilpauk, Chennai, Tamil Nadu', email: 'tncsc@gov.example.com', phone: '9876523482' },
    { id: '2028', name: 'Balaji Wafers Potato Sourcing', addr: 'Rajkot, Gujarat', email: 'potatoes@balajiwafers.example.com', phone: '9876523483' },
    { id: '2029', name: 'Hatsun Agro Product Dairy & Feed', addr: 'Salem, Tamil Nadu', email: 'feed@hap.example.com', phone: '9876523484' },
    { id: '2030', name: 'Godrej Tyson Fresh Chicken & Feed', addr: 'Pune, Maharashtra', email: 'grainfeed@godrej.example.com', phone: '9876523485' },
  ];

  for (let i = 0; i < customersList.length; i++) {
    const cust = customersList[i];
    const phoneId = String(2051 + i);

    records.push({
      key: `customer:${cust.id}`,
      indexKey: 'customers:index',
      data: {
        customer_id: cust.id,
        name: cust.name,
        address: cust.addr,
        email: cust.email,
        phone: cust.phone,
        type: i % 2 === 0 ? 'wholesale' : 'commercial',
      },
      relations: [{ key: `customer:${cust.id}:phones`, member: phoneId }],
    });

    records.push({
      key: `customer_phone:${phoneId}`,
      indexKey: 'customer_phones:index',
      data: {
        phone_id: phoneId,
        customer_id: cust.id,
        phone: cust.phone,
      },
    });
  }

  // ==========================================
  // 13. SALES (50 Invoices) & PAYMENTS (50 Receipts)
  // Sale IDs: 2201 - 2250
  // Payment IDs: 2301 - 2350
  // Linked to Harvests 2101 - 2150 and Customers 2001 - 2030
  // ==========================================
  const paymentModes = ['UPI', 'Bank Transfer', 'NEFT', 'Cash', 'Cheque'];

  for (let i = 0; i < 50; i++) {
    const saleId = String(2201 + i);
    const payId = String(2301 + i);
    const hId = String(2101 + i);
    const custId = String(2001 + (i % 30));

    const day = (1 + (i % 27)).toString().padStart(2, '0');
    const month = (7 + (i % 3)).toString().padStart(2, '0');
    const saleDate = `2026-${month}-${day}`;

    // Quantities and rates calculated consistently: Total = Qty * Price
    const qtyNum = 500 + (i % 10) * 100; // 500 to 1400 kg
    const priceNum = 28 + (i % 8) * 4;   // 28 to 56 INR/kg
    const totalNum = qtyNum * priceNum;  // 14,000 to 78,400 INR

    const pMethod = paymentModes[i % paymentModes.length];
    const txnRef = `TXN2026${month}${day}${String(100 + i)}`;

    records.push({
      key: `sale:${saleId}`,
      indexKey: 'sales:index',
      data: {
        sale_id: saleId,
        harvest_id: hId,
        customer_id: custId,
        sale_date: saleDate,
        quantity: String(qtyNum),
        unit: 'kg',
        unit_price: String(priceNum),
        total_amount: String(totalNum),
        status: 'Completed',
      },
      relations: [
        { key: `harvest:${hId}:sales`, member: saleId },
        { key: `customer:${custId}:sales`, member: saleId },
        { key: `sale:${saleId}:payments`, member: payId },
      ],
    });

    records.push({
      key: `payment:${payId}`,
      indexKey: 'payments:index',
      data: {
        payment_id: payId,
        sale_id: saleId,
        payment_date: saleDate,
        amount: String(totalNum),
        payment_method: pMethod,
        payment_status: 'Paid',
        transaction_reference: txnRef,
      },
    });
  }

  // ==========================================
  // 14. WORKERS (30 Workers) & WORKER PHONES (30) & ATTENDANCES (60 Shifts)
  // Worker IDs: 1601 - 1630 (Mapped to Farms 201 - 230)
  // Worker Phone IDs: 1651 - 1680
  // Attendance IDs: 1701 - 1760 (2 attendance logs per worker)
  // ==========================================
  const workerNames = [
    'Suresh Kumar', 'Manoj Paswan', 'Raju Gowda', 'Vijay Shinde', 'Balwinder Singh',
    'Chinna Swamy', 'Dinesh Yadav', 'Karthik Raja', 'Laxman Patil', 'Sanjay Meena',
    'Pradeep Sharma', 'Babu Lal', 'Rameshwar Roy', 'Kishore Das', 'Arunachalam S',
    'Shivashankar', 'Mahesh Verma', 'Harish Chandra', 'Anil Kumar', 'Mukesh Naik',
    'Prakash Rao', 'Santosh Murmu', 'Govindasamy', 'Bhola Prasad', 'Kuldeep Dhillon',
    'Sundar Pichaiyan', 'Gajendra Singh', 'Thangavelu M', 'Rajendra Bheel', 'Somnath Chatterjee',
  ];

  const workerRoles = [
    'Farm Supervisor', 'Tractor Operator', 'Irrigation Technician', 'Field Laborer', 'Harvester Operator',
    'Spraying Specialist', 'Fertilizer Handler', 'Warehouse Incharge', 'Quality Inspector', 'Senior Laborer',
  ];

  for (let i = 0; i < 30; i++) {
    const wId = String(1601 + i);
    const farmId = String(201 + i);
    const phoneId = String(1651 + i);
    const role = workerRoles[i % workerRoles.length];
    const wage = String(15000 + (i % 6) * 1500);

    records.push({
      key: `worker:${wId}`,
      indexKey: 'workers:index',
      data: {
        worker_id: wId,
        name: workerNames[i],
        role: role,
        salary: wage,
        farm_id: farmId,
        phone: `987651${String(1000 + i).slice(1)}`,
        daily_wage: String(Math.floor(parseInt(wage) / 26)),
      },
      relations: [
        { key: `farm:${farmId}:workers`, member: wId },
        { key: `worker:${wId}:phones`, member: phoneId },
      ],
    });

    records.push({
      key: `worker_phone:${phoneId}`,
      indexKey: 'worker_phones:index',
      data: {
        phone_id: phoneId,
        worker_id: wId,
        phone: `987651${String(1000 + i).slice(1)}`,
      },
    });

    // 2 Attendance logs per worker: 1701-1760
    const att1Id = String(1701 + i * 2);
    const att2Id = String(1702 + i * 2);

    records.push({
      key: `attendance:${att1Id}`,
      indexKey: 'attendances:index',
      data: {
        attendance_id: att1Id,
        worker_id: wId,
        attendance_date: '2026-10-12',
        status: 'Present',
        hours_worked: '8',
      },
      relations: [{ key: `worker:${wId}:attendance`, member: att1Id }],
    });

    records.push({
      key: `attendance:${att2Id}`,
      indexKey: 'attendances:index',
      data: {
        attendance_id: att2Id,
        worker_id: wId,
        attendance_date: '2026-10-13',
        status: i % 8 === 0 ? 'Half Day' : 'Present',
        hours_worked: i % 8 === 0 ? '4' : '8',
      },
      relations: [{ key: `worker:${wId}:attendance`, member: att2Id }],
    });
  }

  // ==========================================
  // 15. EQUIPMENT (15 Units), MAINTENANCE (15 Logs) & WORKER ASSIGNMENTS (15 Bridges)
  // Equipment IDs: 1801 - 1815
  // Maintenance IDs: 1851 - 1865
  // Worker Equipment Assignment IDs: 1901 - 1915
  // ==========================================
  const equipList = [
    { id: '1801', name: 'Mahindra 575 DI 45HP Tractor', type: 'Tractor', farmId: '201', wId: '1601', cost: '780000', maintCost: '3500', mType: '500hr Engine Oil & Filter Service' },
    { id: '1802', name: 'John Deere 5050D 50HP Utility Tractor', type: 'Tractor', farmId: '202', wId: '1602', cost: '850000', maintCost: '4200', mType: 'Hydraulic System Inspection' },
    { id: '1803', name: 'Swaraj 744 FE 48HP Field Tractor', type: 'Tractor', farmId: '203', wId: '1603', cost: '740000', maintCost: '2800', mType: 'Clutch Adjustment & Grease' },
    { id: '1804', name: 'Kubota DC-68G Self-Propelled Harvester', type: 'Harvester', farmId: '204', wId: '1604', cost: '1450000', maintCost: '8500', mType: 'Cutter Bar Blade Sharpening' },
    { id: '1805', name: 'Claas Crop Tiger 30 Combine Harvester', type: 'Harvester', farmId: '205', wId: '1605', cost: '1600000', maintCost: '9500', mType: 'Threshing Drum Bearing Replacement' },
    { id: '1806', name: 'Lemken 3-Bottom Hydraulic Reversible Plough', type: 'Implement', farmId: '206', wId: '1606', cost: '220000', maintCost: '1800', mType: 'Shear Bolt & Point Check' },
    { id: '1807', name: 'Fieldking 9-Tyne Spring Loaded Cultivator', type: 'Implement', farmId: '207', wId: '1607', cost: '65000', maintCost: '950', mType: 'Tyne Bush Replacement' },
    { id: '1808', name: 'Shaktiman 7-Foot Multi-Speed Rotary Tiller', type: 'Rotavator', farmId: '208', wId: '1608', cost: '135000', maintCost: '2200', mType: 'Side Gear Oil Replacement' },
    { id: '1809', name: 'National 11-Row Seed-cum-Fertilizer Drill', type: 'Planter', farmId: '209', wId: '1609', cost: '95000', maintCost: '1200', mType: 'Metering Roller Calibration' },
    { id: '1810', name: 'Kirloskar 10HP Submersible Borewell Pump', type: 'Irrigation Pump', farmId: '210', wId: '1610', cost: '68000', maintCost: '2100', mType: 'Control Panel Relay Testing' },
    { id: '1811', name: 'Crompton 7.5HP Centrifugal Canal Monobloc', type: 'Irrigation Pump', farmId: '211', wId: '1611', cost: '48000', maintCost: '1400', mType: 'Gland Packing Replacement' },
    { id: '1812', name: 'ASPEE Marut HTP 500L Tractor Sprayer', type: 'Sprayer', farmId: '212', wId: '1612', cost: '110000', maintCost: '2600', mType: 'Pressure Gauge & Nozzle Overhaul' },
    { id: '1813', name: 'Mitra Bullet 400L Air-Assisted Orchard Sprayer', type: 'Sprayer', farmId: '213', wId: '1613', cost: '175000', maintCost: '3200', mType: 'Blower Fan Bearing Grease' },
    { id: '1814', name: 'Mahindra Heavy Duty 5-Tonne Farm Trailer', type: 'Transport', farmId: '214', wId: '1614', cost: '185000', maintCost: '1500', mType: 'Wheel Hub Greasing & Brake Check' },
    { id: '1815', name: 'Stihl MS 382 Professional Farm Chainsaw', type: 'Power Tool', farmId: '215', wId: '1615', cost: '45000', maintCost: '850', mType: 'Carburetor Tune-up & Chain Grind' },
  ];

  for (let i = 0; i < equipList.length; i++) {
    const eq = equipList[i];
    const maintId = String(1851 + i);
    const assignId = String(1901 + i);

    records.push({
      key: `equipment:${eq.id}`,
      indexKey: 'equipments:index',
      data: {
        equipment_id: eq.id,
        name: eq.name,
        equipment_type: eq.type,
        purchase_date: '2025-06-15',
        status: 'Available',
        farm_id: eq.farmId,
        cost: eq.cost,
      },
      relations: [
        { key: `farm:${eq.farmId}:equipment`, member: eq.id },
        { key: `equipment:${eq.id}:maintenance`, member: maintId },
        { key: `equipment:${eq.id}:worker_assignments`, member: assignId },
      ],
    });

    records.push({
      key: `maintenance:${maintId}`,
      indexKey: 'maintenances:index',
      data: {
        maintenance_id: maintId,
        equipment_id: eq.id,
        maintenance_date: '2026-09-20',
        maintenance_type: eq.mType,
        cost: eq.maintCost,
        status: 'Completed',
        description: `Routine scheduled overhaul completed by authorized technician`,
      },
    });

    records.push({
      key: `worker_equipment:${assignId}`,
      indexKey: 'worker_equipments:index',
      data: {
        assignment_id: assignId,
        worker_id: eq.wId,
        equipment_id: eq.id,
        assigned_on: '2026-10-01',
        status: 'Assigned',
      },
      relations: [
        { key: `worker:${eq.wId}:equipment_assignments`, member: assignId },
      ],
    });
  }

  return records;
}

export async function runSeeder() {
  const seedRecords = generateSeedData();
  console.log(`[Seed Engine] Compiled ${seedRecords.length} structured records across all 28 entities.`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const entity of seedRecords) {
    try {
      const exists = (await redis.exists(entity.key)) === 1;

      if (exists && !overwrite) {
        skipped++;
        // Idempotent reconciliation: ensure indexed set membership and bidirectional relationship sets
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
      console.error(`[Seed Engine] Error on ${entity.key}:`, err);
      failed++;
    }
  }

  console.log('\n============================================================');
  console.log('              SEEDING EXECUTION SUMMARY                     ');
  console.log('============================================================');
  console.log(`Inserted (New):  ${inserted}`);
  console.log(`Updated:         ${updated}`);
  console.log(`Skipped (Reused):${skipped}`);
  console.log(`Failed:          ${failed}`);
  console.log('============================================================');

  // Synchronize atomic auto-increment counters to prevent ID collisions with future user additions
  if (!isDryRun) {
    console.log('\n[Counter Sync] Harmonizing Redis atomic sequence counters...');
    for (const def of ENTITY_DEFINITIONS) {
      const maxVal = await syncCounterToMax(def.name, def.indexKey);
      if (maxVal > 0) {
        console.log(`  - counter:${def.name} synchronized to ${maxVal}`);
      }
    }
    console.log('[Counter Sync] All entity counters synchronized to maximum values.\n');
  }

  await redis.quit();
  return { inserted, updated, skipped, failed };
}

// Direct execution CLI entrypoint
if (require.main === module) {
  runSeeder()
    .then((res) => {
      if (res.failed > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Fatal]', err);
      process.exit(1);
    });
}
