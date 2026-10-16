'use client';

import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  FlaskConical,
  Droplets,
  Sprout,
  Wheat,
  CalendarDays,
  Truck,
  Package,
  Layers,
  Wrench,
  Clock,
  ShoppingCart,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  X,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../lib/authContext';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  redisConnected?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  redisConnected = true,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Close drawer on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const { user, logout, isAllowedView } = useAuth();

  const handleNavClick = (viewId: string) => {
    onSelectView(viewId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Land & Operations',
      items: [
        { id: 'farmers', label: 'Farmers', icon: Users },
        { id: 'farms', label: 'Farms', icon: Building2 },
        { id: 'fields', label: 'Fields', icon: MapPin },
        { id: 'soilTests', label: 'Soil Tests', icon: FlaskConical },
        { id: 'waterSources', label: 'Water Sources', icon: Droplets },
        { id: 'irrigation', label: 'Irrigation', icon: Sprout },
      ],
    },
    {
      title: 'Crops & Production',
      items: [
        { id: 'crops', label: 'Crops', icon: Wheat },
        { id: 'cropVarieties', label: 'Crop Varieties', icon: Sprout },
        { id: 'seasons', label: 'Seasons', icon: CalendarDays },
        { id: 'cropSeasons', label: 'Crop Seasons', icon: CalendarDays },
        { id: 'harvests', label: 'Harvests', icon: Layers },
      ],
    },
    {
      title: 'Inventory & Supplies',
      items: [
        { id: 'suppliers', label: 'Suppliers', icon: Truck },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'seeds', label: 'Seeds', icon: Sprout },
        { id: 'fertilizers', label: 'Fertilizers', icon: FlaskConical },
        { id: 'pesticides', label: 'Pesticides', icon: ShieldCheck },
      ],
    },
    {
      title: 'Workforce & Equipment',
      items: [
        { id: 'workers', label: 'Workers', icon: Users },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'equipment', label: 'Equipment', icon: Wrench },
        { id: 'maintenance', label: 'Maintenance', icon: Wrench },
        { id: 'workerEquipment', label: 'Worker Equipment', icon: Users },
      ],
    },
    {
      title: 'Commerce & Sales',
      items: [
        { id: 'customers', label: 'Customers', icon: ShoppingCart },
        { id: 'sales', label: 'Sales', icon: Receipt },
        { id: 'payments', label: 'Payments', icon: CreditCard },
      ],
    },
    {
      title: 'System & Admin',
      items: [
        ...(user?.role === 'admin'
          ? [
              { id: 'userManagement', label: 'User Directory', icon: Users },
              { id: 'auditLogs', label: 'Security Audit Logs', icon: ShieldAlert },
            ]
          : []),
        { id: 'settings', label: 'Architecture & Keys', icon: Settings },
      ],
    },
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-[#e2eae1] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2d5a3f] flex items-center justify-center text-white shadow-sm shadow-[#2d5a3f]/20 shrink-0">
            <Wheat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-[#1c2720]">AgriFarm SaaS</h1>
            <p className="text-[11px] text-[#5e7063]">Agricultural DBMS</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#5e7063] hover:text-[#1c2720] hover:bg-[#f0f4f0] transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Redis Live Status Badge */}
      <div className="px-4 sm:px-5 py-2.5 bg-[#f2f5f1] border-b border-[#e0e7df] flex items-center justify-between text-xs">
        <span className="text-[#5e7063] font-medium flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              redisConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          Redis DB
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-[#eef3ed] text-[#2d5a3f]">
          localhost:6379
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs" aria-label="Main Navigation">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => isAllowedView(item.id));
          if (visibleItems.length === 0) return null;

          const isCollapsed = collapsedGroups[group.title];
          return (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-[#87986a] uppercase tracking-wider hover:text-[#2d5a3f] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2d5a3f]"
              >
                <span>{group.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a3f] cursor-pointer ${
                          isActive
                            ? 'bg-[#2d5a3f] text-white font-medium shadow-sm shadow-[#2d5a3f]/15'
                            : 'text-[#3c4a40] hover:bg-[#f0f4f0] hover:text-[#1c2720]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#5e7063]'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User / Session Footer */}
      {user && (
        <div className="p-3 sm:p-3.5 border-t border-[#e2eae1] bg-[#fafcfa] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#d8e5d6] text-[#2d5a3f] font-bold text-xs flex items-center justify-center shrink-0">
              {user.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1c2720] truncate">{user.name}</p>
              <p className="text-[10px] text-[#5e7063] truncate">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[#5e7063] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px lg breakpoint) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#e2eae1] flex-col h-screen sticky top-0 select-none shrink-0">
        {renderNavContent(false)}
      </aside>

      {/* Mobile & Tablet Drawer Modal (< 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer slide-in panel */}
          <aside
            className="relative z-10 w-72 max-w-[85vw] bg-white flex flex-col h-full shadow-2xl select-none animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
