import {
  farmerRepo,
  farmRepo,
  fieldRepo,
  soilTestRepo,
  waterSourceRepo,
  irrigationRepo,
} from '../repositories';
import { PaginationOptions } from '../repositories/baseRepository';

export const farmerService = {
  async getAll(options: PaginationOptions) {
    return farmerRepo.findAll({
      ...options,
      searchFields: ['name', 'address', 'email', 'phone'],
    });
  },
  async getById(id: string) {
    return farmerRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    return farmerRepo.create(data);
  },
  async update(id: string, data: Record<string, any>) {
    return farmerRepo.update(id, data);
  },
  async delete(id: string) {
    return farmerRepo.delete(id, [], [
      { setKey: `farmer:${id}:farms`, errorMessage: 'Cannot delete farmer: associated farms exist' },
      { setKey: `farmer:${id}:phones`, errorMessage: 'Cannot delete farmer: associated phone numbers exist' },
    ]);
  },
  async getFarms(id: string) {
    const farmIds = await farmerRepo.getRelationMembers(`farmer:${id}:farms`);
    const farms = await Promise.all(farmIds.map((fId) => farmRepo.findById(fId)));
    return farms.filter(Boolean);
  },
};

export const farmService = {
  async getAll(options: PaginationOptions) {
    return farmRepo.findAll({
      ...options,
      searchFields: ['name', 'location'],
    });
  },
  async getById(id: string) {
    return farmRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const relationships = [
      { key: `farmer:${data.farmer_id}:farms`, member: '' }, // member will be filled by create if needed or pass custom
    ];
    // To ensure exact id is used in relation:
    const farm = await farmRepo.create(data);
    if (data.farmer_id) {
      await farmRepo.update(farm.id, {}, [], [{ key: `farmer:${data.farmer_id}:farms`, member: farm.id }]);
    }
    return farm;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await farmRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.farmer_id && existing.farmer_id !== data.farmer_id) {
      removals.push({ key: `farmer:${existing.farmer_id}:farms`, member: id });
      additions.push({ key: `farmer:${data.farmer_id}:farms`, member: id });
    }
    return farmRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await farmRepo.findById(id);
    if (!existing) return { success: false, error: 'Farm not found' };

    const removals = existing.farmer_id
      ? [{ key: `farmer:${existing.farmer_id}:farms`, member: id }]
      : [];

    return farmRepo.delete(id, removals, [
      { setKey: `farm:${id}:fields`, errorMessage: 'Cannot delete farm: associated fields exist' },
      { setKey: `farm:${id}:water_sources`, errorMessage: 'Cannot delete farm: associated water sources exist' },
      { setKey: `farm:${id}:workers`, errorMessage: 'Cannot delete farm: associated workers exist' },
      { setKey: `farm:${id}:equipment`, errorMessage: 'Cannot delete farm: associated equipment exists' },
      { setKey: `farm:${id}:crop_seasons`, errorMessage: 'Cannot delete farm: associated crop seasons exist' },
    ]);
  },
  async getFields(id: string) {
    const ids = await farmRepo.getRelationMembers(`farm:${id}:fields`);
    const items = await Promise.all(ids.map((fieldId) => fieldRepo.findById(fieldId)));
    return items.filter(Boolean);
  },
};

export const fieldService = {
  async getAll(options: PaginationOptions) {
    return fieldRepo.findAll({
      ...options,
      searchFields: ['name', 'soil_type', 'description'],
    });
  },
  async getById(id: string) {
    return fieldRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const field = await fieldRepo.create(data);
    if (data.farm_id) {
      await fieldRepo.update(field.id, {}, [], [{ key: `farm:${data.farm_id}:fields`, member: field.id }]);
    }
    return field;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await fieldRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.farm_id && existing.farm_id !== data.farm_id) {
      removals.push({ key: `farm:${existing.farm_id}:fields`, member: id });
      additions.push({ key: `farm:${data.farm_id}:fields`, member: id });
    }
    return fieldRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await fieldRepo.findById(id);
    if (!existing) return { success: false, error: 'Field not found' };

    const removals = existing.farm_id
      ? [{ key: `farm:${existing.farm_id}:fields`, member: id }]
      : [];

    return fieldRepo.delete(id, removals, [
      { setKey: `field:${id}:soil_tests`, errorMessage: 'Cannot delete field: associated soil tests exist' },
      { setKey: `field:${id}:irrigation_systems`, errorMessage: 'Cannot delete field: associated irrigation systems exist' },
      { setKey: `field:${id}:crop_seasons`, errorMessage: 'Cannot delete field: associated crop seasons exist' },
      { setKey: `field:${id}:harvests`, errorMessage: 'Cannot delete field: associated harvests exist' },
    ]);
  },
};

export const soilTestService = {
  async getAll(options: PaginationOptions) {
    return soilTestRepo.findAll(options);
  },
  async getById(id: string) {
    return soilTestRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const soilTest = await soilTestRepo.create(data);
    if (data.field_id) {
      await soilTestRepo.update(soilTest.id, {}, [], [{ key: `field:${data.field_id}:soil_tests`, member: soilTest.id }]);
    }
    return soilTest;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await soilTestRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.field_id && existing.field_id !== data.field_id) {
      removals.push({ key: `field:${existing.field_id}:soil_tests`, member: id });
      additions.push({ key: `field:${data.field_id}:soil_tests`, member: id });
    }
    return soilTestRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await soilTestRepo.findById(id);
    if (!existing) return { success: false, error: 'Soil test not found' };

    const removals = existing.field_id
      ? [{ key: `field:${existing.field_id}:soil_tests`, member: id }]
      : [];

    return soilTestRepo.delete(id, removals);
  },
};

export const waterSourceService = {
  async getAll(options: PaginationOptions) {
    return waterSourceRepo.findAll({
      ...options,
      searchFields: ['source_type', 'source_name', 'location'],
    });
  },
  async getById(id: string) {
    return waterSourceRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const ws = await waterSourceRepo.create(data);
    if (data.farm_id) {
      await waterSourceRepo.update(ws.id, {}, [], [{ key: `farm:${data.farm_id}:water_sources`, member: ws.id }]);
    }
    return ws;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await waterSourceRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.farm_id && existing.farm_id !== data.farm_id) {
      removals.push({ key: `farm:${existing.farm_id}:water_sources`, member: id });
      additions.push({ key: `farm:${data.farm_id}:water_sources`, member: id });
    }
    return waterSourceRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await waterSourceRepo.findById(id);
    if (!existing) return { success: false, error: 'Water source not found' };

    const removals = existing.farm_id
      ? [{ key: `farm:${existing.farm_id}:water_sources`, member: id }]
      : [];

    return waterSourceRepo.delete(id, removals);
  },
};

export const irrigationService = {
  async getAll(options: PaginationOptions) {
    return irrigationRepo.findAll({
      ...options,
      searchFields: ['method', 'frequency'],
    });
  },
  async getById(id: string) {
    return irrigationRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const irr = await irrigationRepo.create(data);
    if (data.field_id) {
      await irrigationRepo.update(irr.id, {}, [], [{ key: `field:${data.field_id}:irrigation_systems`, member: irr.id }]);
    }
    return irr;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await irrigationRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.field_id && existing.field_id !== data.field_id) {
      removals.push({ key: `field:${existing.field_id}:irrigation_systems`, member: id });
      additions.push({ key: `field:${data.field_id}:irrigation_systems`, member: id });
    }
    return irrigationRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await irrigationRepo.findById(id);
    if (!existing) return { success: false, error: 'Irrigation record not found' };

    const removals = existing.field_id
      ? [{ key: `field:${existing.field_id}:irrigation_systems`, member: id }]
      : [];

    return irrigationRepo.delete(id, removals);
  },
};
