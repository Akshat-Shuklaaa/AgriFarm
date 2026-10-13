import {
  customerRepo,
  saleRepo,
  paymentRepo,
} from '../repositories';
import { PaginationOptions } from '../repositories/baseRepository';

export const customerService = {
  async getAll(options: PaginationOptions) {
    return customerRepo.findAll({
      ...options,
      searchFields: ['name', 'address', 'email', 'phone', 'type'],
    });
  },
  async getById(id: string) {
    return customerRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    return customerRepo.create(data);
  },
  async update(id: string, data: Record<string, any>) {
    return customerRepo.update(id, data);
  },
  async delete(id: string) {
    return customerRepo.delete(id, [], [
      { setKey: `customer:${id}:phones`, errorMessage: 'Cannot delete customer: associated phone records exist' },
      { setKey: `customer:${id}:sales`, errorMessage: 'Cannot delete customer: associated sales records exist' },
    ]);
  },
  async getSales(id: string) {
    const ids = await customerRepo.getRelationMembers(`customer:${id}:sales`);
    const items = await Promise.all(ids.map((sId) => saleRepo.findById(sId)));
    return items.filter(Boolean);
  },
};

export const saleService = {
  async getAll(options: PaginationOptions) {
    return saleRepo.findAll({
      ...options,
      searchFields: ['status', 'sale_date'],
    });
  },
  async getById(id: string) {
    return saleRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const sale = await saleRepo.create(data);
    const additions = [];
    if (data.customer_id) additions.push({ key: `customer:${data.customer_id}:sales`, member: sale.id });
    if (data.harvest_id) additions.push({ key: `harvest:${data.harvest_id}:sales`, member: sale.id });

    if (additions.length > 0) {
      await saleRepo.update(sale.id, {}, [], additions);
    }
    return sale;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await saleRepo.findById(id);
    const removals = [];
    const additions = [];

    if (existing) {
      if (data.customer_id && existing.customer_id !== data.customer_id) {
        removals.push({ key: `customer:${existing.customer_id}:sales`, member: id });
        additions.push({ key: `customer:${data.customer_id}:sales`, member: id });
      }
      if (data.harvest_id && existing.harvest_id !== data.harvest_id) {
        removals.push({ key: `harvest:${existing.harvest_id}:sales`, member: id });
        additions.push({ key: `harvest:${data.harvest_id}:sales`, member: id });
      }
    }
    return saleRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await saleRepo.findById(id);
    if (!existing) return { success: false, error: 'Sale not found' };

    const removals = [];
    if (existing.customer_id) removals.push({ key: `customer:${existing.customer_id}:sales`, member: id });
    if (existing.harvest_id) removals.push({ key: `harvest:${existing.harvest_id}:sales`, member: id });

    return saleRepo.delete(id, removals, [
      { setKey: `sale:${id}:payments`, errorMessage: 'Cannot delete sale: associated payments exist' },
    ]);
  },
  async getPayments(id: string) {
    const ids = await saleRepo.getRelationMembers(`sale:${id}:payments`);
    const items = await Promise.all(ids.map((pId) => paymentRepo.findById(pId)));
    return items.filter(Boolean);
  },
};

export const paymentService = {
  async getAll(options: PaginationOptions) {
    return paymentRepo.findAll({
      ...options,
      searchFields: ['payment_method', 'payment_status', 'transaction_reference'],
    });
  },
  async getById(id: string) {
    return paymentRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const payment = await paymentRepo.create(data);
    if (data.sale_id) {
      await paymentRepo.update(payment.id, {}, [], [{ key: `sale:${data.sale_id}:payments`, member: payment.id }]);
    }
    return payment;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await paymentRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.sale_id && existing.sale_id !== data.sale_id) {
      removals.push({ key: `sale:${existing.sale_id}:payments`, member: id });
      additions.push({ key: `sale:${data.sale_id}:payments`, member: id });
    }
    return paymentRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await paymentRepo.findById(id);
    if (!existing) return { success: false, error: 'Payment record not found' };

    const removals = existing.sale_id
      ? [{ key: `sale:${existing.sale_id}:payments`, member: id }]
      : [];

    return paymentRepo.delete(id, removals);
  },
};
