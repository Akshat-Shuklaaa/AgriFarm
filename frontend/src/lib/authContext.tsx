'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setCsrfToken } from './api';

export type Role = 'admin' | 'farm_manager' | 'inventory_manager' | 'worker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  farm_manager: 'Farm Owner / Manager',
  inventory_manager: 'Inventory Manager',
  worker: 'Worker',
};

// Frontend mirror of RBAC rules for UI display control
export const ROLE_PERMISSIONS: Record<Role, { allowedViews: string[]; canDelete: boolean; canWriteFinance: boolean }> = {
  admin: {
    allowedViews: ['*'],
    canDelete: true,
    canWriteFinance: true,
  },
  farm_manager: {
    allowedViews: [
      'dashboard',
      'reports',
      'farmers',
      'farms',
      'fields',
      'soilTests',
      'waterSources',
      'irrigation',
      'crops',
      'cropVarieties',
      'seasons',
      'cropSeasons',
      'harvests',
      'workers',
      'attendance',
      'workerEquipment',
      'equipment',
      'customers',
      'sales',
      'payments',
      'inventory',
      'seeds',
      'fertilizers',
      'pesticides',
    ],
    canDelete: true, // Except sales/payments which are admin-only in backend
    canWriteFinance: true,
  },
  inventory_manager: {
    allowedViews: [
      'dashboard',
      'reports',
      'suppliers',
      'inventory',
      'seeds',
      'fertilizers',
      'pesticides',
      'equipment',
      'maintenance',
      'workerEquipment',
      'farms',
      'fields',
      'crops',
      'cropVarieties',
      'cropSeasons',
      'harvests',
      'farmers',
    ],
    canDelete: true,
    canWriteFinance: false,
  },
  worker: {
    allowedViews: [
      'dashboard',
      'crops',
      'cropVarieties',
      'seasons',
      'cropSeasons',
      'farms',
      'fields',
      'harvests',
      'equipment',
      'attendance',
      'workerEquipment',
    ],
    canDelete: false,
    canWriteFinance: false,
  },
};

export const RESOURCE_PERMISSIONS: Record<Role, Record<string, string[]>> = {
  admin: {
    '*': ['*'],
  },
  farm_manager: {
    farmers: ['create', 'read', 'update'],
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
    attendance: ['create', 'read', 'update'],
    workerEquipment: ['create', 'read', 'update'],
    equipment: ['read'],
    maintenance: ['read'],
    customers: ['create', 'read', 'update', 'delete'],
    sales: ['create', 'read', 'update'],
    payments: ['create', 'read', 'update'],
    inventory: ['read'],
    seeds: ['read'],
    fertilizers: ['read'],
    pesticides: ['read'],
    dashboard: ['read'],
    reports: ['read'],
  },
  inventory_manager: {
    suppliers: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    seeds: ['create', 'read', 'update', 'delete'],
    fertilizers: ['create', 'read', 'update', 'delete'],
    pesticides: ['create', 'read', 'update', 'delete'],
    equipment: ['create', 'read', 'update', 'delete'],
    maintenance: ['create', 'read', 'update', 'delete'],
    workerEquipment: ['create', 'read', 'update', 'delete'],
    farms: ['read'],
    fields: ['read'],
    crops: ['read'],
    cropVarieties: ['read'],
    cropSeasons: ['read'],
    harvests: ['read'],
    farmers: ['read'],
    dashboard: ['read'],
    reports: ['read'],
  },
  worker: {
    attendance: ['create', 'read'],
    workerEquipment: ['read'],
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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  csrfToken: string | null;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
  isAllowedView: (viewId: string) => boolean;
  canPerform: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setLocalCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      setLoading(true);
      const res = await api.auth.me();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.csrfToken) {
          setLocalCsrfToken(res.data.csrfToken);
          setCsrfToken(res.data.csrfToken);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const res = await api.auth.login(credentials);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.csrfToken) {
          setLocalCsrfToken(res.data.csrfToken);
          setCsrfToken(res.data.csrfToken);
        }
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid email or password' };
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      setUser(null);
      setLocalCsrfToken(null);
      setCsrfToken(null);
    }
  };

  const refreshUser = async () => {
    await initAuth();
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  const isAllowedView = (viewId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    // Admin views
    if (viewId === 'userManagement' || viewId === 'auditLogs' || viewId === 'settings') {
      return false;
    }

    const rules = ROLE_PERMISSIONS[user.role];
    if (!rules) return false;

    return rules.allowedViews.includes(viewId);
  };

  const canPerform = (resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    const roleRules = RESOURCE_PERMISSIONS[user.role];
    if (!roleRules) return false;

    const allowed = roleRules[resource];
    if (!allowed) return false;

    return allowed.includes('*') || allowed.includes(action);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        csrfToken,
        login,
        logout,
        refreshUser,
        hasRole,
        isAllowedView,
        canPerform,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
