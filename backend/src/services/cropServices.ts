import {
  cropRepo,
  cropVarietyRepo,
  seasonRepo,
  cropSeasonRepo,
  harvestRepo,
} from '../repositories';
import { PaginationOptions } from '../repositories/baseRepository';

export const cropService = {
  async getAll(options: PaginationOptions) {
    return cropRepo.findAll({
      ...options,
      searchFields: ['name', 'scientific_name', 'category', 'variety', 'description'],
    });
  },
  async getById(id: string) {
    return cropRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    return cropRepo.create(data);
  },
  async update(id: string, data: Record<string, any>) {
    return cropRepo.update(id, data);
  },
  async delete(id: string) {
    return cropRepo.delete(id, [], [
      { setKey: `crop:${id}:varieties`, errorMessage: 'Cannot delete crop: associated crop varieties exist' },
      { setKey: `crop:${id}:seasons`, errorMessage: 'Cannot delete crop: associated crop seasons exist' },
    ]);
  },
  async getVarieties(id: string) {
    const ids = await cropRepo.getRelationMembers(`crop:${id}:varieties`);
    const items = await Promise.all(ids.map((vId) => cropVarietyRepo.findById(vId)));
    return items.filter(Boolean);
  },
};

export const cropVarietyService = {
  async getAll(options: PaginationOptions) {
    return cropVarietyRepo.findAll({
      ...options,
      searchFields: ['variety_name'],
    });
  },
  async getById(id: string) {
    return cropVarietyRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const variety = await cropVarietyRepo.create(data);
    if (data.crop_id) {
      await cropVarietyRepo.update(variety.id, {}, [], [{ key: `crop:${data.crop_id}:varieties`, member: variety.id }]);
    }
    return variety;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await cropVarietyRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.crop_id && existing.crop_id !== data.crop_id) {
      removals.push({ key: `crop:${existing.crop_id}:varieties`, member: id });
      additions.push({ key: `crop:${data.crop_id}:varieties`, member: id });
    }
    return cropVarietyRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await cropVarietyRepo.findById(id);
    if (!existing) return { success: false, error: 'Crop variety not found' };

    const removals = existing.crop_id
      ? [{ key: `crop:${existing.crop_id}:varieties`, member: id }]
      : [];

    return cropVarietyRepo.delete(id, removals);
  },
};

export const seasonService = {
  async getAll(options: PaginationOptions) {
    return seasonRepo.findAll({
      ...options,
      searchFields: ['name', 'season_name', 'description'],
    });
  },
  async getById(id: string) {
    return seasonRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    return seasonRepo.create(data);
  },
  async update(id: string, data: Record<string, any>) {
    return seasonRepo.update(id, data);
  },
  async delete(id: string) {
    return seasonRepo.delete(id, [], [
      { setKey: `season:${id}:crop_seasons`, errorMessage: 'Cannot delete season: associated crop seasons exist' },
    ]);
  },
  async getCropSeasons(id: string) {
    const ids = await seasonRepo.getRelationMembers(`season:${id}:crop_seasons`);
    const items = await Promise.all(ids.map((csId) => cropSeasonRepo.findById(csId)));
    return items.filter(Boolean);
  },
};

export const cropSeasonService = {
  async getAll(options: PaginationOptions) {
    return cropSeasonRepo.findAll({
      ...options,
      searchFields: ['season_name', 'year', 'status'],
    });
  },
  async getById(id: string) {
    return cropSeasonRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const cs = await cropSeasonRepo.create(data);
    const additions = [];
    if (data.crop_id) additions.push({ key: `crop:${data.crop_id}:seasons`, member: cs.id });
    if (data.season_id) additions.push({ key: `season:${data.season_id}:crop_seasons`, member: cs.id });
    if (data.farm_id) additions.push({ key: `farm:${data.farm_id}:crop_seasons`, member: cs.id });
    if (data.field_id) additions.push({ key: `field:${data.field_id}:crop_seasons`, member: cs.id });

    if (additions.length > 0) {
      await cropSeasonRepo.update(cs.id, {}, [], additions);
    }
    return cs;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await cropSeasonRepo.findById(id);
    const removals = [];
    const additions = [];

    if (existing) {
      if (data.crop_id && existing.crop_id !== data.crop_id) {
        removals.push({ key: `crop:${existing.crop_id}:seasons`, member: id });
        additions.push({ key: `crop:${data.crop_id}:seasons`, member: id });
      }
      if (data.season_id && existing.season_id !== data.season_id) {
        removals.push({ key: `season:${existing.season_id}:crop_seasons`, member: id });
        additions.push({ key: `season:${data.season_id}:crop_seasons`, member: id });
      }
      if (data.farm_id && existing.farm_id !== data.farm_id) {
        removals.push({ key: `farm:${existing.farm_id}:crop_seasons`, member: id });
        additions.push({ key: `farm:${data.farm_id}:crop_seasons`, member: id });
      }
      if (data.field_id && existing.field_id !== data.field_id) {
        removals.push({ key: `field:${existing.field_id}:crop_seasons`, member: id });
        additions.push({ key: `field:${data.field_id}:crop_seasons`, member: id });
      }
    }
    return cropSeasonRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await cropSeasonRepo.findById(id);
    if (!existing) return { success: false, error: 'Crop season not found' };

    const removals = [];
    if (existing.crop_id) removals.push({ key: `crop:${existing.crop_id}:seasons`, member: id });
    if (existing.season_id) removals.push({ key: `season:${existing.season_id}:crop_seasons`, member: id });
    if (existing.farm_id) removals.push({ key: `farm:${existing.farm_id}:crop_seasons`, member: id });
    if (existing.field_id) removals.push({ key: `field:${existing.field_id}:crop_seasons`, member: id });

    return cropSeasonRepo.delete(id, removals, [
      { setKey: `crop_season:${id}:harvests`, errorMessage: 'Cannot delete crop season: associated harvests exist' },
    ]);
  },
  async getHarvests(id: string) {
    const ids = await cropSeasonRepo.getRelationMembers(`crop_season:${id}:harvests`);
    const items = await Promise.all(ids.map((hId) => harvestRepo.findById(hId)));
    return items.filter(Boolean);
  },
};

export const harvestService = {
  async getAll(options: PaginationOptions) {
    return harvestRepo.findAll({
      ...options,
      searchFields: ['quality', 'unit'],
    });
  },
  async getById(id: string) {
    return harvestRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const harvest = await harvestRepo.create(data);
    const additions = [];
    if (data.crop_season_id) additions.push({ key: `crop_season:${data.crop_season_id}:harvests`, member: harvest.id });
    if (data.field_id) additions.push({ key: `field:${data.field_id}:harvests`, member: harvest.id });

    if (additions.length > 0) {
      await harvestRepo.update(harvest.id, {}, [], additions);
    }
    return harvest;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await harvestRepo.findById(id);
    const removals = [];
    const additions = [];

    if (existing) {
      if (data.crop_season_id && existing.crop_season_id !== data.crop_season_id) {
        removals.push({ key: `crop_season:${existing.crop_season_id}:harvests`, member: id });
        additions.push({ key: `crop_season:${data.crop_season_id}:harvests`, member: id });
      }
      if (data.field_id && existing.field_id !== data.field_id) {
        removals.push({ key: `field:${existing.field_id}:harvests`, member: id });
        additions.push({ key: `field:${data.field_id}:harvests`, member: id });
      }
    }
    return harvestRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await harvestRepo.findById(id);
    if (!existing) return { success: false, error: 'Harvest not found' };

    const removals = [];
    if (existing.crop_season_id) removals.push({ key: `crop_season:${existing.crop_season_id}:harvests`, member: id });
    if (existing.field_id) removals.push({ key: `field:${existing.field_id}:harvests`, member: id });

    return harvestRepo.delete(id, removals, [
      { setKey: `harvest:${id}:sales`, errorMessage: 'Cannot delete harvest: associated sales exist' },
    ]);
  },
};
