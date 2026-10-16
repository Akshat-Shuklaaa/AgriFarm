/**
 * Agricultural Farm Management System - API Client
 * Connects frontend directly to the Express + Redis REST backend.
 */

const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

class ApiError extends Error {
  constructor(public message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

let currentCsrfToken: string | null = null;
export const setCsrfToken = (token: string | null) => {
  currentCsrfToken = token;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (currentCsrfToken) {
    headers['X-CSRF-Token'] = currentCsrfToken;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(data.error || `HTTP error ${res.status}`, res.status, data.details);
    }

    return data as ApiResponse<T>;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network request failed', 0);
  }
}

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const qStr = query.toString();
  return qStr ? `?${qStr}` : '';
}

// Generic CRUD endpoints generator
export function createEntityApi<T = any>(resourcePath: string) {
  return {
    getAll: (params?: QueryParams) => request<T[]>(`/${resourcePath}${buildQuery(params)}`),
    getById: (id: string | number) => request<T>(`/${resourcePath}/${id}`),
    create: (data: Partial<T>) =>
      request<T>(`/${resourcePath}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string | number, data: Partial<T>) =>
      request<T>(`/${resourcePath}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string | number) =>
      request<{ message: string }>(`/${resourcePath}/${id}`, {
        method: 'DELETE',
      }),
  };
}

export const api = {
  // System
  health: () => request<{ status: string; uptime: string; redis: { connected: boolean; ping: string } }>('/health'),
  dashboardStats: () =>
    request<{
      entityCounts: Record<string, number>;
      summary: {
        totalRevenue: number;
        totalHarvestQuantity: number;
        activeFarms: number;
        totalWorkers: number;
        totalEquipment: number;
      };
    }>('/dashboard/stats'),

  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ user: any; token: string; csrfToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request<{ user: any; csrfToken?: string }>('/auth/me'),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
    getCsrfToken: () => request<{ csrfToken: string }>('/auth/csrf-token'),
  },

  // User Management (Admin only)
  users: {
    getAll: (params?: QueryParams) => request<any[]>(`/users${buildQuery(params)}`),
    getById: (id: string) => request<any>(`/users/${id}`),
    create: (data: { name: string; email: string; password: string; role?: string }) =>
      request<any>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateRole: (id: string, role: string) =>
      request<any>(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    updateStatus: (id: string, status: 'active' | 'inactive') =>
      request<any>(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) => request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
  },

  // Audit Logs (Admin only)
  auditLogs: {
    getAll: (params?: QueryParams) => request<any[]>(`/audit-logs${buildQuery(params)}`),
  },

  // 28 Entities
  farmers: {
    ...createEntityApi('farmers'),
    getFarms: (id: string) => request<any[]>(`/farmers/${id}/farms`),
  },
  farmerPhones: {
    getAll: (params?: QueryParams) => request<any[]>(`/phones/farmer${buildQuery(params)}`),
    create: (data: any) => request<any>('/phones/farmer', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/phones/farmer/${id}`, { method: 'DELETE' }),
  },
  farms: {
    ...createEntityApi('farms'),
    getFields: (id: string) => request<any[]>(`/farms/${id}/fields`),
  },
  fields: createEntityApi('fields'),
  soilTests: createEntityApi('soil-tests'),
  waterSources: createEntityApi('water-sources'),
  irrigation: createEntityApi('irrigation'),
  crops: createEntityApi('crops'),
  cropVarieties: createEntityApi('crop-varieties'),
  seasons: createEntityApi('seasons'),
  cropSeasons: createEntityApi('crop-seasons'),
  suppliers: {
    ...createEntityApi('suppliers'),
    getItems: (id: string) => request<any[]>(`/suppliers/${id}/items`),
  },
  supplierPhones: {
    getAll: (params?: QueryParams) => request<any[]>(`/phones/supplier${buildQuery(params)}`),
    create: (data: any) => request<any>('/phones/supplier', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/phones/supplier/${id}`, { method: 'DELETE' }),
  },
  inventory: createEntityApi('inventory'),
  seeds: createEntityApi('seeds'),
  fertilizers: createEntityApi('fertilizers'),
  pesticides: createEntityApi('pesticides'),
  workers: {
    ...createEntityApi('workers'),
    getAttendance: (id: string) => request<any[]>(`/workers/${id}/attendance`),
  },
  workerPhones: {
    getAll: (params?: QueryParams) => request<any[]>(`/phones/worker${buildQuery(params)}`),
    create: (data: any) => request<any>('/phones/worker', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/phones/worker/${id}`, { method: 'DELETE' }),
  },
  attendance: createEntityApi('attendance'),
  equipment: {
    ...createEntityApi('equipment'),
    getMaintenance: (id: string) => request<any[]>(`/equipment/${id}/maintenance`),
  },
  maintenance: createEntityApi('maintenance'),
  workerEquipment: createEntityApi('worker-equipment'),
  customers: {
    ...createEntityApi('customers'),
    getSales: (id: string) => request<any[]>(`/customers/${id}/sales`),
  },
  customerPhones: {
    getAll: (params?: QueryParams) => request<any[]>(`/phones/customer${buildQuery(params)}`),
    create: (data: any) => request<any>('/phones/customer', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/phones/customer/${id}`, { method: 'DELETE' }),
  },
  harvests: createEntityApi('harvests'),
  sales: {
    ...createEntityApi('sales'),
    getPayments: (id: string) => request<any[]>(`/sales/${id}/payments`),
  },
  payments: createEntityApi('payments'),
};
