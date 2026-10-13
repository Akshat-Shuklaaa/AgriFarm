import {
  workerRepo,
  attendanceRepo,
  equipmentRepo,
  maintenanceRepo,
  workerEquipmentRepo,
} from '../repositories';
import { PaginationOptions } from '../repositories/baseRepository';

export const workerService = {
  async getAll(options: PaginationOptions) {
    return workerRepo.findAll({
      ...options,
      searchFields: ['name', 'role', 'phone', 'address', 'skill_type'],
    });
  },
  async getById(id: string) {
    return workerRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const worker = await workerRepo.create(data);
    if (data.farm_id) {
      await workerRepo.update(worker.id, {}, [], [{ key: `farm:${data.farm_id}:workers`, member: worker.id }]);
    }
    return worker;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await workerRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.farm_id && existing.farm_id !== data.farm_id) {
      removals.push({ key: `farm:${existing.farm_id}:workers`, member: id });
      additions.push({ key: `farm:${data.farm_id}:workers`, member: id });
    }
    return workerRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await workerRepo.findById(id);
    if (!existing) return { success: false, error: 'Worker not found' };

    const removals = existing.farm_id
      ? [{ key: `farm:${existing.farm_id}:workers`, member: id }]
      : [];

    return workerRepo.delete(id, removals, [
      { setKey: `worker:${id}:phones`, errorMessage: 'Cannot delete worker: associated phone records exist' },
      { setKey: `worker:${id}:attendance`, errorMessage: 'Cannot delete worker: associated attendance records exist' },
      { setKey: `worker:${id}:equipment_assignments`, errorMessage: 'Cannot delete worker: active equipment assignments exist' },
    ]);
  },
  async getAttendance(id: string) {
    const ids = await workerRepo.getRelationMembers(`worker:${id}:attendance`);
    const items = await Promise.all(ids.map((attId) => attendanceRepo.findById(attId)));
    return items.filter(Boolean);
  },
};

export const attendanceService = {
  async getAll(options: PaginationOptions) {
    return attendanceRepo.findAll({
      ...options,
      searchFields: ['status', 'attendance_date'],
    });
  },
  async getById(id: string) {
    return attendanceRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const att = await attendanceRepo.create(data);
    if (data.worker_id) {
      await attendanceRepo.update(att.id, {}, [], [{ key: `worker:${data.worker_id}:attendance`, member: att.id }]);
    }
    return att;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await attendanceRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.worker_id && existing.worker_id !== data.worker_id) {
      removals.push({ key: `worker:${existing.worker_id}:attendance`, member: id });
      additions.push({ key: `worker:${data.worker_id}:attendance`, member: id });
    }
    return attendanceRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await attendanceRepo.findById(id);
    if (!existing) return { success: false, error: 'Attendance record not found' };

    const removals = existing.worker_id
      ? [{ key: `worker:${existing.worker_id}:attendance`, member: id }]
      : [];

    return attendanceRepo.delete(id, removals);
  },
};

export const equipmentService = {
  async getAll(options: PaginationOptions) {
    return equipmentRepo.findAll({
      ...options,
      searchFields: ['name', 'equipment_type', 'status'],
    });
  },
  async getById(id: string) {
    return equipmentRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const eq = await equipmentRepo.create(data);
    if (data.farm_id) {
      await equipmentRepo.update(eq.id, {}, [], [{ key: `farm:${data.farm_id}:equipment`, member: eq.id }]);
    }
    return eq;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await equipmentRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.farm_id && existing.farm_id !== data.farm_id) {
      removals.push({ key: `farm:${existing.farm_id}:equipment`, member: id });
      additions.push({ key: `farm:${data.farm_id}:equipment`, member: id });
    }
    return equipmentRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await equipmentRepo.findById(id);
    if (!existing) return { success: false, error: 'Equipment not found' };

    const removals = existing.farm_id
      ? [{ key: `farm:${existing.farm_id}:equipment`, member: id }]
      : [];

    return equipmentRepo.delete(id, removals, [
      { setKey: `equipment:${id}:maintenance`, errorMessage: 'Cannot delete equipment: maintenance records exist' },
      { setKey: `equipment:${id}:worker_assignments`, errorMessage: 'Cannot delete equipment: active worker assignments exist' },
    ]);
  },
  async getMaintenance(id: string) {
    const ids = await equipmentRepo.getRelationMembers(`equipment:${id}:maintenance`);
    const items = await Promise.all(ids.map((mId) => maintenanceRepo.findById(mId)));
    return items.filter(Boolean);
  },
};

export const maintenanceService = {
  async getAll(options: PaginationOptions) {
    return maintenanceRepo.findAll({
      ...options,
      searchFields: ['maintenance_type', 'status', 'description'],
    });
  },
  async getById(id: string) {
    return maintenanceRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const m = await maintenanceRepo.create(data);
    if (data.equipment_id) {
      await maintenanceRepo.update(m.id, {}, [], [{ key: `equipment:${data.equipment_id}:maintenance`, member: m.id }]);
    }
    return m;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await maintenanceRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing && data.equipment_id && existing.equipment_id !== data.equipment_id) {
      removals.push({ key: `equipment:${existing.equipment_id}:maintenance`, member: id });
      additions.push({ key: `equipment:${data.equipment_id}:maintenance`, member: id });
    }
    return maintenanceRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await maintenanceRepo.findById(id);
    if (!existing) return { success: false, error: 'Maintenance record not found' };

    const removals = existing.equipment_id
      ? [{ key: `equipment:${existing.equipment_id}:maintenance`, member: id }]
      : [];

    return maintenanceRepo.delete(id, removals);
  },
};

export const workerEquipmentService = {
  async getAll(options: PaginationOptions) {
    return workerEquipmentRepo.findAll({
      ...options,
      searchFields: ['status'],
    });
  },
  async getById(id: string) {
    return workerEquipmentRepo.findById(id);
  },
  async create(data: Record<string, any>) {
    const we = await workerEquipmentRepo.create(data);
    const additions = [];
    if (data.worker_id) additions.push({ key: `worker:${data.worker_id}:equipment_assignments`, member: we.id });
    if (data.equipment_id) additions.push({ key: `equipment:${data.equipment_id}:worker_assignments`, member: we.id });

    if (additions.length > 0) {
      await workerEquipmentRepo.update(we.id, {}, [], additions);
    }
    return we;
  },
  async update(id: string, data: Record<string, any>) {
    const existing = await workerEquipmentRepo.findById(id);
    const removals = [];
    const additions = [];
    if (existing) {
      if (data.worker_id && existing.worker_id !== data.worker_id) {
        removals.push({ key: `worker:${existing.worker_id}:equipment_assignments`, member: id });
        additions.push({ key: `worker:${data.worker_id}:equipment_assignments`, member: id });
      }
      if (data.equipment_id && existing.equipment_id !== data.equipment_id) {
        removals.push({ key: `equipment:${existing.equipment_id}:worker_assignments`, member: id });
        additions.push({ key: `equipment:${data.equipment_id}:worker_assignments`, member: id });
      }
    }
    return workerEquipmentRepo.update(id, data, removals, additions);
  },
  async delete(id: string) {
    const existing = await workerEquipmentRepo.findById(id);
    if (!existing) return { success: false, error: 'Worker-equipment assignment not found' };

    const removals = [];
    if (existing.worker_id) removals.push({ key: `worker:${existing.worker_id}:equipment_assignments`, member: id });
    if (existing.equipment_id) removals.push({ key: `equipment:${existing.equipment_id}:worker_assignments`, member: id });

    return workerEquipmentRepo.delete(id, removals);
  },
};
