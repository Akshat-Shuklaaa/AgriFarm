import {
  farmerPhoneRepo,
  supplierPhoneRepo,
  workerPhoneRepo,
  customerPhoneRepo,
} from '../repositories';
import { PaginationOptions } from '../repositories/baseRepository';

export const farmerPhoneService = {
  async getAll(options: PaginationOptions) {
    return farmerPhoneRepo.findAll({ ...options, searchFields: ['phone'] });
  },
  async getById(id: string) {
    return farmerPhoneRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const rec = await farmerPhoneRepo.create(data);
    if (data.farmer_id) {
      await farmerPhoneRepo.update(rec.id, {}, [], [{ key: `farmer:${data.farmer_id}:phones`, member: rec.id }]);
    }
    return rec;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await farmerPhoneRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.farmer_id && existing.farmer_id !== data.farmer_id) {
      removals.push({ key: `farmer:${existing.farmer_id}:phones`, member: id });
      additions.push({ key: `farmer:${data.farmer_id}:phones`, member: id });
    }
    return farmerPhoneRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await farmerPhoneRepo.findById(id);
    if (!existing) return { success: false, error: 'Phone record not found' };

    const removals = existing.farmer_id
      ? [{ key: `farmer:${existing.farmer_id}:phones`, member: id }]
      : [];

    return farmerPhoneRepo.delete(id, removals);
  },
};

export const supplierPhoneService = {
  async getAll(options: PaginationOptions) {
    return supplierPhoneRepo.findAll({ ...options, searchFields: ['phone'] });
  },
  async getById(id: string) {
    return supplierPhoneRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const rec = await supplierPhoneRepo.create(data);
    if (data.supplier_id) {
      await supplierPhoneRepo.update(rec.id, {}, [], [{ key: `supplier:${data.supplier_id}:phones`, member: rec.id }]);
    }
    return rec;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await supplierPhoneRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.supplier_id && existing.supplier_id !== data.supplier_id) {
      removals.push({ key: `supplier:${existing.supplier_id}:phones`, member: id });
      additions.push({ key: `supplier:${data.supplier_id}:phones`, member: id });
    }
    return supplierPhoneRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await supplierPhoneRepo.findById(id);
    if (!existing) return { success: false, error: 'Phone record not found' };

    const removals = existing.supplier_id
      ? [{ key: `supplier:${existing.supplier_id}:phones`, member: id }]
      : [];

    return supplierPhoneRepo.delete(id, removals);
  },
};

export const workerPhoneService = {
  async getAll(options: PaginationOptions) {
    return workerPhoneRepo.findAll({ ...options, searchFields: ['phone'] });
  },
  async getById(id: string) {
    return workerPhoneRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const rec = await workerPhoneRepo.create(data);
    if (data.worker_id) {
      await workerPhoneRepo.update(rec.id, {}, [], [{ key: `worker:${data.worker_id}:phones`, member: rec.id }]);
    }
    return rec;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await workerPhoneRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.worker_id && existing.worker_id !== data.worker_id) {
      removals.push({ key: `worker:${existing.worker_id}:phones`, member: id });
      additions.push({ key: `worker:${data.worker_id}:phones`, member: id });
    }
    return workerPhoneRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await workerPhoneRepo.findById(id);
    if (!existing) return { success: false, error: 'Phone record not found' };

    const removals = existing.worker_id
      ? [{ key: `worker:${existing.worker_id}:phones`, member: id }]
      : [];

    return workerPhoneRepo.delete(id, removals);
  },
};

export const customerPhoneService = {
  async getAll(options: PaginationOptions) {
    return customerPhoneRepo.findAll({ ...options, searchFields: ['phone'] });
  },
  async getById(id: string) {
    return customerPhoneRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const rec = await customerPhoneRepo.create(data);
    if (data.customer_id) {
      await customerPhoneRepo.update(rec.id, {}, [], [{ key: `customer:${data.customer_id}:phones`, member: rec.id }]);
    }
    return rec;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await customerPhoneRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.customer_id && existing.customer_id !== data.customer_id) {
      removals.push({ key: `customer:${existing.customer_id}:phones`, member: id });
      additions.push({ key: `customer:${data.customer_id}:phones`, member: id });
    }
    return customerPhoneRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await customerPhoneRepo.findById(id);
    if (!existing) return { success: false, error: 'Phone record not found' };

    const removals = existing.customer_id
      ? [{ key: `customer:${existing.customer_id}:phones`, member: id }]
      : [];

    return customerPhoneRepo.delete(id, removals);
  },
};
