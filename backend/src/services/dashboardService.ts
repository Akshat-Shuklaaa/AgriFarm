import { redis } from '../config/redis';
import { saleRepo, harvestRepo } from '../repositories';

export class DashboardService {
  async getStats() {
    const counts = {
      farmers: await redis.scard('farmers:index'),
      farms: await redis.scard('farms:index'),
      fields: await redis.scard('fields:index'),
      crops: await redis.scard('crops:index'),
      crop_seasons: await redis.scard('crop_seasons:index'),
      harvests: await redis.scard('harvests:index'),
      inventory_items: await redis.scard('inventory_items:index'),
      suppliers: await redis.scard('suppliers:index'),
      workers: await redis.scard('workers:index'),
      equipment: await redis.scard('equipments:index'),
      customers: await redis.scard('customers:index'),
      sales: await redis.scard('sales:index'),
      payments: await redis.scard('payments:index'),
    };

    // Calculate total revenue and harvest volume
    const salesResult = await saleRepo.findAll({ limit: 1000 });
    let totalRevenue = 0;
    for (const sale of salesResult.data) {
      const amt = parseFloat(sale.total_amount || '0');
      if (!isNaN(amt)) {
        totalRevenue += amt;
      }
    }

    const harvestResult = await harvestRepo.findAll({ limit: 1000 });
    let totalHarvestQty = 0;
    for (const h of harvestResult.data) {
      const q = parseFloat(h.quantity || '0');
      if (!isNaN(q)) {
        totalHarvestQty += q;
      }
    }

    return {
      entityCounts: counts,
      summary: {
        totalRevenue,
        totalHarvestQuantity: totalHarvestQty,
        activeFarms: counts.farms,
        totalWorkers: counts.workers,
        totalEquipment: counts.equipment,
      },
    };
  }
}

export const dashboardService = new DashboardService();
