'use client';

import React from 'react';
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
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  redisConnected?: boolean;
}

export function Sidebar({ activeView, onSelectView, redisConnected = true }: SidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
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
      title: 'System',
      items: [{ id: 'settings', label: 'Settings', icon: Settings }],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#e2eae1] flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#e2eae1] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2d5a3f] flex items-center justify-center text-white shadow-sm shadow-[#2d5a3f]/20">
            <Wheat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-[#1c2720]">AgriFarm SaaS</h1>
            <p className="text-[11px] text-[#5e7063]">Redis DA3 System</p>
          </div>
        </div>
      </div>

      {/* Redis Live Status Badge */}
      <div className="px-5 py-2.5 bg-[#f8faf7] border-b border-[#e2eae1] flex items-center justify-between text-xs">
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
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups[group.title];
          return (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-[#87986a] uppercase tracking-wider hover:text-[#2d5a3f] transition-colors"
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
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectView(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
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
      <div className="p-3.5 border-t border-[#e2eae1] bg-[#fafcfa] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#d8e5d6] text-[#2d5a3f] font-semibold text-xs flex items-center justify-center">
          RK
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#1c2720] truncate">Ramesh Kumar</p>
          <p className="text-[10px] text-[#5e7063] truncate">Lead Farm Operator</p>
        </div>
      </div>
    </aside>
  );
}
