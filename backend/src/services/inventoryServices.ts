import {
  supplierRepo,
  inventoryItemRepo,
  seedRepo,
  fertilizerRepo,
  pesticideRepo,
} from '../repositories';
import { PaginationOptions } from '../repositories/baseRepository';

export const supplierService = {
  async getAll(options: PaginationOptions) {
    return supplierRepo.findAll({
      ...options,
      searchFields: ['name', 'address', 'email', 'phone'],
    });
  },
  async getById(id: string) {
    return supplierRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    return supplierRepo.create(data);
  },
  async update(id: string, data: Record<string, any>) {
    return supplierRepo.update(id, data);
  },
  async delete(id: string) {
    return supplierRepo.delete(id, [], [
      { setKey: `supplier:${id}:phones`, errorMessage: 'Cannot delete supplier: associated phone numbers exist' },
      { setKey: `supplier:${id}:inventory_items`, errorMessage: 'Cannot delete supplier: associated inventory items exist' },
    ]);
  },
  async getInventoryItems(id: string) {
    const ids = await supplierRepo.getRelationMembers(`supplier:${id}:inventory_items`);
    const items = await Promise.all(ids.map((itemId) => inventoryItemRepo.findById(itemId)));
    return items.filter(Boolean);
  },
};

export const inventoryItemService = {
  async getAll(options: PaginationOptions) {
    return inventoryItemRepo.findAll({
      ...options,
      searchFields: ['name', 'category', 'unit'],
    });
  },
  async getById(id: string) {
    return inventoryItemRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const item = await inventoryItemRepo.create(data);
    if (data.supplier_id) {
      await inventoryItemRepo.update(item.id, {}, [], [{ key: `supplier:${data.supplier_id}:inventory_items`, member: item.id }]);
    }
    return item;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await inventoryItemRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.supplier_id && existing.supplier_id !== data.supplier_id) {
      removals.push({ key: `supplier:${existing.supplier_id}:inventory_items`, member: id });
      additions.push({ key: `supplier:${data.supplier_id}:inventory_items`, member: id });
    }
    return inventoryItemRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await inventoryItemRepo.findById(id);
    if (!existing) return { success: false, error: 'Inventory item not found' };

    const removals = existing.supplier_id
      ? [{ key: `supplier:${existing.supplier_id}:inventory_items`, member: id }]
      : [];

    return inventoryItemRepo.delete(id, removals, [
      { setKey: `inventory_item:${id}:seeds`, errorMessage: 'Cannot delete item: associated seeds exist' },
      { setKey: `inventory_item:${id}:fertilizers`, errorMessage: 'Cannot delete item: associated fertilizers exist' },
      { setKey: `inventory_item:${id}:pesticides`, errorMessage: 'Cannot delete item: associated pesticides exist' },
    ]);
  },
};

export const seedService = {
  async getAll(options: PaginationOptions) {
    return seedRepo.findAll({
      ...options,
      searchFields: ['seed_name', 'brand'],
    });
  },
  async getById(id: string) {
    return seedRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const seed = await seedRepo.create(data);
    if (data.inventory_item_id) {
      await seedRepo.update(seed.id, {}, [], [{ key: `inventory_item:${data.inventory_item_id}:seeds`, member: seed.id }]);
    }
    return seed;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await seedRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.inventory_item_id && existing.inventory_item_id !== data.inventory_item_id) {
      removals.push({ key: `inventory_item:${existing.inventory_item_id}:seeds`, member: id });
      additions.push({ key: `inventory_item:${data.inventory_item_id}:seeds`, member: id });
    }
    return seedRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await seedRepo.findById(id);
    if (!existing) return { success: false, error: 'Seed record not found' };

    const removals = existing.inventory_item_id
      ? [{ key: `inventory_item:${existing.inventory_item_id}:seeds`, member: id }]
      : [];

    return seedRepo.delete(id, removals);
  },
};

export const fertilizerService = {
  async getAll(options: PaginationOptions) {
    return fertilizerRepo.findAll({
      ...options,
      searchFields: ['name', 'brand', 'npk_ratio'],
    });
  },
  async getById(id: string) {
    return fertilizerRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const fert = await fertilizerRepo.create(data);
    if (data.inventory_item_id) {
      await fertilizerRepo.update(fert.id, {}, [], [{ key: `inventory_item:${data.inventory_item_id}:fertilizers`, member: fert.id }]);
    }
    return fert;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await fertilizerRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.inventory_item_id && existing.inventory_item_id !== data.inventory_item_id) {
      removals.push({ key: `inventory_item:${existing.inventory_item_id}:fertilizers`, member: id });
      additions.push({ key: `inventory_item:${data.inventory_item_id}:fertilizers`, member: id });
    }
    return fertilizerRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await fertilizerRepo.findById(id);
    if (!existing) return { success: false, error: 'Fertilizer record not found' };

    const removals = existing.inventory_item_id
      ? [{ key: `inventory_item:${existing.inventory_item_id}:fertilizers`, member: id }]
      : [];

    return fertilizerRepo.delete(id, removals);
  },
};

export const pesticideService = {
  async getAll(options: PaginationOptions) {
    return pesticideRepo.findAll({
      ...options,
      searchFields: ['name', 'pesticide_type', 'target_pest', 'brand'],
    });
  },
  async getById(id: string) {
    return pesticideRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const pest = await pesticideRepo.create(data);
    if (data.inventory_item_id) {
      await pesticideRepo.update(pest.id, {}, [], [{ key: `inventory_item:${data.inventory_item_id}:pesticides`, member: pest.id }]);
    }
    return pest;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await pesticideRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.inventory_item_id && existing.inventory_item_id !== data.inventory_item_id) {
      removals.push({ key: `inventory_item:${existing.inventory_item_id}:pesticides`, member: id });
      additions.push({ key: `inventory_item:${data.inventory_item_id}:pesticides`, member: id });
    }
    return pesticideRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await pesticideRepo.findById(id);
    if (!existing) return { success: false, error: 'Pesticide record not found' };

    const removals = existing.inventory_item_id
      ? [{ key: `inventory_item:${existing.inventory_item_id}:pesticides`, member: id }]
      : [];

    return pesticideRepo.delete(id, removals);
  },
};
