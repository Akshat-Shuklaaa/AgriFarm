/**
 * Centralized Role-Based Access Control (RBAC) Definition
 * Agricultural Farm Management System
 */

export type Role = 'admin' | 'farm_manager' | 'inventory_manager' | 'worker';

export const ROLES: Record<string, Role> = {
  ADMIN: 'admin',
  FARM_MANAGER: 'farm_manager',
  INVENTORY_MANAGER: 'inventory_manager',
  WORKER: 'worker',
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  farm_manager: 'Farm Owner / Manager',
  inventory_manager: 'Inventory Manager',
  worker: 'Worker',
};

export type Action = 'create' | 'read' | 'update' | 'delete';

export type Resource =
  // Land & Operations
  | 'farmers'
  | 'farmerPhones'
  | 'farms'
  | 'fields'
  | 'soilTests'
  | 'waterSources'
  | 'irrigation'
  // Crops & Production
  | 'crops'
  | 'cropVarieties'
  | 'seasons'
  | 'cropSeasons'
  | 'harvests'
  // Inventory & Supplies
  | 'suppliers'
  | 'supplierPhones'
  | 'inventory'
  | 'seeds'
  | 'fertilizers'
  | 'pesticides'
  // Workforce & Machinery
  | 'workers'
  | 'workerPhones'
  | 'attendance'
  | 'equipment'
  | 'maintenance'
  | 'workerEquipment'
  // Commerce & Finance
  | 'customers'
  | 'customerPhones'
  | 'sales'
  | 'payments'
  // System & Administration
  | 'users'
  | 'auditLogs'
  | 'dashboard'
  | 'reports'
  | 'settings';

type PermissionMatrix = {
  [key in Role]: {
    [key in Resource]?: Action[] | ['*'];
  };
};

export const PERMISSIONS: PermissionMatrix = {
  // 1. Admin: Full, unrestricted access to all resources
  admin: {
    farmers: ['*'],
    farmerPhones: ['*'],
    farms: ['*'],
    fields: ['*'],
    soilTests: ['*'],
    waterSources: ['*'],
    irrigation: ['*'],
    crops: ['*'],
    cropVarieties: ['*'],
    seasons: ['*'],
    cropSeasons: ['*'],
    harvests: ['*'],
    suppliers: ['*'],
    supplierPhones: ['*'],
    inventory: ['*'],
    seeds: ['*'],
    fertilizers: ['*'],
    pesticides: ['*'],
    workers: ['*'],
    workerPhones: ['*'],
    attendance: ['*'],
    equipment: ['*'],
    maintenance: ['*'],
    workerEquipment: ['*'],
    customers: ['*'],
    customerPhones: ['*'],
    sales: ['*'],
    payments: ['*'],
    users: ['*'],
    auditLogs: ['read'],
    dashboard: ['read'],
    reports: ['read'],
    settings: ['*'],
  },

  // 2. Farm Owner / Manager: Manages land, crops, workforce, harvests, sales & payments
  farm_manager: {
    farmers: ['create', 'read', 'update'],
    farmerPhones: ['create', 'read', 'update', 'delete'],
    farms: ['create', 'read', 'update', 'delete'],
    fields: ['create', 'read', 'update', 'delete'],
    soilTests: ['create', 'read', 'update', 'delete'],
    waterSources: ['create', 'read', 'update', 'delete'],
    irrigation: ['create', 'read', 'update', 'delete'],
    crops: ['create', 'read', 'update'],
    cropVarieties: ['create', 'read', 'update'],
    seasons: ['create', 'read', 'update'],
    cropSeasons: ['create', 'read', 'update', 'delete'],
    harvests: ['create', 'read', 'update', 'delete'],
    workers: ['create', 'read', 'update'],
    workerPhones: ['create', 'read', 'update', 'delete'],
    attendance: ['create', 'read', 'update'],
    equipment: ['read'],
    maintenance: ['read'],
    workerEquipment: ['create', 'read', 'update'],
    customers: ['create', 'read', 'update', 'delete'],
    customerPhones: ['create', 'read', 'update', 'delete'],
    sales: ['create', 'read', 'update'], // Deletions restricted to Admin
    payments: ['create', 'read', 'update'], // Deletions restricted to Admin
    // Read inventory items to check supplies
    inventory: ['read'],
    seeds: ['read'],
    fertilizers: ['read'],
    pesticides: ['read'],
    dashboard: ['read'],
    reports: ['read'],
  },

  // 3. Inventory Manager: Manages suppliers, inventory, seeds, fertilizers, pesticides, equipment
  inventory_manager: {
    suppliers: ['create', 'read', 'update', 'delete'],
    supplierPhones: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    seeds: ['create', 'read', 'update', 'delete'],
    fertilizers: ['create', 'read', 'update', 'delete'],
    pesticides: ['create', 'read', 'update', 'delete'],
    equipment: ['create', 'read', 'update', 'delete'],
    maintenance: ['create', 'read', 'update', 'delete'],
    workerEquipment: ['create', 'read', 'update', 'delete'],
    // Read access to farms, crops, harvests and farmers for inventory logistics
    farmers: ['read'],
    farms: ['read'],
    fields: ['read'],
    crops: ['read'],
    cropVarieties: ['read'],
    cropSeasons: ['read'],
    harvests: ['read'],
    dashboard: ['read'],
    reports: ['read'],
  },

  // 4. Worker: Performs assigned field tasks and logs attendance
  worker: {
    attendance: ['create', 'read'], // Log check-in and view attendance
    workerEquipment: ['read'], // View assigned tools
    crops: ['read'],
    cropVarieties: ['read'],
    seasons: ['read'],
    cropSeasons: ['read'],
    farms: ['read'],
    fields: ['read'],
    harvests: ['read'],
    equipment: ['read'],
    dashboard: ['read'],
  },
};

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  const allowedActions = rolePermissions[resource];
  if (!allowedActions) return false;

  const actions = allowedActions as string[];
  if (actions.includes('*') || actions.includes(action)) {
    return true;
  }

  return false;
}
