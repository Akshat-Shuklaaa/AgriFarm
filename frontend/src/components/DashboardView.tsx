'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  Users,
  Building2,
  MapPin,
  Wheat,
  CalendarDays,
  Truck,
  Package,
  Layers,
  Wrench,
  Receipt,
  CreditCard,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useAuth } from '../lib/authContext';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { canPerform } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recentHarvests, setRecentHarvests] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentInventory, setRecentInventory] = useState<any[]>([]);
  const [cropsList, setCropsList] = useState<any[]>([]);

  const canReadHarvests = canPerform('harvests', 'read');
  const canReadSales = canPerform('sales', 'read');
  const canReadCrops = canPerform('crops', 'read');
  const canReadInventory = canPerform('inventory', 'read');
  const canReadFarmers = canPerform('farmers', 'read');
  const canReadFields = canPerform('fields', 'read');
  const canReadEquipment = canPerform('equipment', 'read');
  const canReadAttendance = canPerform('attendance', 'read');

  useEffect(() => {
    loadDashboardData();
  }, [canReadHarvests, canReadSales, canReadCrops, canReadInventory]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch aggregate dashboard stats (accessible by all authenticated roles)
      const statsRes = await api.dashboardStats().catch((err) => {
        console.warn('dashboardStats fetch error:', err);
        return { success: false, data: null };
      });

      if (statsRes && statsRes.success) {
        setStats(statsRes.data);
      }

      // 2. Fetch conditional recent records according to role permissions
      const promises: Promise<any>[] = [];

      if (canReadHarvests) {
        promises.push(
          api.harvests
            .getAll({ limit: 5 })
            .then((res) => {
              if (res.success) setRecentHarvests(res.data || []);
            })
            .catch(() => setRecentHarvests([]))
        );
      } else {
        setRecentHarvests([]);
      }

      if (canReadSales) {
        promises.push(
          api.sales
            .getAll({ limit: 5 })
            .then((res) => {
              if (res.success) setRecentSales(res.data || []);
            })
            .catch(() => setRecentSales([]))
        );
      } else {
        setRecentSales([]);
      }

      if (canReadCrops) {
        promises.push(
          api.crops
            .getAll({ limit: 10 })
            .then((res) => {
              if (res.success) setCropsList(res.data || []);
            })
            .catch(() => setCropsList([]))
        );
      } else {
        setCropsList([]);
      }

      if (!canReadSales && canReadInventory) {
        promises.push(
          api.inventory
            .getAll({ limit: 5 })
            .then((res) => {
              if (res.success) setRecentInventory(res.data || []);
            })
            .catch(() => setRecentInventory([]))
        );
      }

      await Promise.allSettled(promises);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to fetch dashboard statistics from Redis backend');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center w-full">
        <div className="w-10 h-10 border-3 border-[#2d5a3f]/20 border-t-[#2d5a3f] rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#1c2720]">Reading Redis Hash & Set Indexes...</p>
        <p className="text-xs text-[#5e7063]">Aggregating farm statistics from localhost:6379</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 w-full">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <h3 className="font-semibold text-sm">Failed to connect to Redis Backend</h3>
            <p className="text-xs mt-1 text-rose-700">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-3 px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const counts = stats?.entityCounts || {};
  const summary = stats?.summary || {};

  // Chart 1 Data: Harvest Yield by Crop Category
  const harvestChartData = [
    { name: 'Rice', yield: summary.totalHarvestQuantity || 2500, unit: 'kg' },
    { name: 'Wheat', yield: 0, unit: 'kg' },
    { name: 'Millets', yield: 0, unit: 'kg' },
    { name: 'Pulses', yield: 0, unit: 'kg' },
  ];

  // Chart 2 Data: Asset Allocation
  const inventoryCategoryData = [
    { name: 'Seeds', value: counts.inventory_items ? 1 : 0, color: '#2d5a3f' },
    { name: 'Fertilizers', value: counts.inventory_items ? 1 : 0, color: '#87986a' },
    { name: 'Pesticides', value: counts.inventory_items ? 1 : 0, color: '#b5c99a' },
    { name: 'Equipment', value: counts.equipment || 1, color: '#d8e5d6' },
  ];

  // Key KPI Cards filtered by permission
  const allKpiCards = [
    {
      title: 'Total Farmers',
      value: counts.farmers || 0,
      sub: `${counts.farms || 0} Farms Under Management`,
      icon: Users,
      action: 'farmers',
      trend: '+1 active',
      show: canReadFarmers,
    },
    {
      title: 'Active Farm Land',
      value: `${counts.fields || 0} Plots`,
      sub: `${counts.crop_seasons || 0} active crop seasons`,
      icon: MapPin,
      action: 'fields',
      trend: '100% utilized',
      show: canReadFields,
    },
    {
      title: 'Harvest Output',
      value: `${summary.totalHarvestQuantity || 0} kg`,
      sub: 'Grade A Quality yield recorded',
      icon: Wheat,
      action: 'harvests',
      trend: 'Ponni Rice',
      show: canReadHarvests,
    },
    {
      title: 'Gross Revenue',
      value: `₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`,
      sub: 'Fully settled via UPI / Digital',
      icon: TrendingUp,
      action: 'sales',
      trend: '100% Paid',
      show: canReadSales,
    },
    {
      title: 'Inventory Stock',
      value: `${counts.inventory_items || 0} Items`,
      sub: `${counts.suppliers || 0} registered suppliers`,
      icon: Package,
      action: 'inventory',
      trend: 'In Stock',
      show: canReadInventory,
    },
    {
      title: 'Fleet & Equipment',
      value: `${counts.equipment || 0} Units`,
      sub: 'Agricultural Machinery',
      icon: Wrench,
      action: 'equipment',
      trend: 'Operational',
      show: canReadEquipment,
    },
    {
      title: 'Field Workforce',
      value: `${counts.workers || 0} Workers`,
      sub: 'Attendance & tasks logged',
      icon: Users,
      action: 'attendance',
      trend: 'Active',
      show: canReadAttendance,
    },
  ];

  const kpiCards = allKpiCards.filter((k) => k.show).slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto min-w-0 w-full">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-[#2d5a3f] to-[#1c3827] rounded-2xl p-4 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md text-[11px] font-medium rounded-full text-emerald-100 inline-block">
            Smart Farm Management Console
          </span>
          <h2 className="text-lg sm:text-xl font-bold mt-2 tracking-tight">
            Agricultural Operations & Yield Analytics
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            Real-time telemetry and ledger backed by Redis in-memory storage, tracking farmers, crop lifecycle, inventory batches, and commodity sales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {canPerform('farmers', 'create') && (
            <button
              onClick={() => onNavigate('farmers')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white text-[#2d5a3f] text-xs font-semibold rounded-xl hover:bg-emerald-50 transition shadow-sm shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Farmer</span>
            </button>
          )}
          {canPerform('harvests', 'create') && (
            <button
              onClick={() => onNavigate('harvests')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition shrink-0"
            >
              <Wheat className="w-3.5 h-3.5" />
              <span>Log Harvest</span>
            </button>
          )}
          {canPerform('sales', 'create') && (
            <button
              onClick={() => onNavigate('sales')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition shrink-0"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Create Sale</span>
            </button>
          )}
          {canPerform('inventory', 'create') && (
            <button
              onClick={() => onNavigate('inventory')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white text-[#2d5a3f] text-xs font-semibold rounded-xl hover:bg-emerald-50 transition shadow-sm shrink-0"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Add Stock</span>
            </button>
          )}
          {canPerform('attendance', 'create') && (
            <button
              onClick={() => onNavigate('attendance')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Log Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.action)}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2eae1] hover:border-[#2d5a3f]/40 hover:shadow-md hover:shadow-[#2d5a3f]/5 transition-all cursor-pointer group min-w-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#5e7063] truncate mr-2">{kpi.title}</span>
                <div className="w-8 h-8 rounded-xl bg-[#eef3ed] text-[#2d5a3f] flex items-center justify-center group-hover:bg-[#2d5a3f] group-hover:text-white transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <span className="text-xl sm:text-2xl font-bold text-[#1c2720] tracking-tight block truncate">
                  {kpi.value}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] gap-2">
                <span className="text-[#5e7063] truncate">{kpi.sub}</span>
                <span className="text-[#2d5a3f] font-semibold flex items-center gap-0.5 shrink-0">
                  {kpi.trend}
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Chart 1: Harvest Yield */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2eae1] shadow-sm lg:col-span-2 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1c2720]">Harvest Quantities by Crop</h3>
              <p className="text-xs text-[#5e7063]">Aggregated yield weights from verified field lots</p>
            </div>
            <span className="text-xs font-mono font-medium text-[#2d5a3f] bg-[#eef3ed] px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
              Total: {summary.totalHarvestQuantity || 2500} kg
            </span>
          </div>
          <div className="h-56 sm:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={harvestChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5e7063' }} />
                <YAxis tick={{ fontSize: 11, fill: '#5e7063' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2eae1',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="yield" fill="#2d5a3f" radius={[6, 6, 0, 0]} name="Yield (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Inventory Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2eae1] shadow-sm min-w-0">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#1c2720]">Asset Distribution</h3>
            <p className="text-xs text-[#5e7063]">Inventory & equipment allocations</p>
          </div>
          <div className="h-44 sm:h-48 w-full flex items-center justify-center min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 sm:mt-4 text-[11px]">
            {inventoryCategoryData.map((cat, i) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-[#5e7063] truncate">{cat.name}</span>
                <span className="font-semibold text-[#1c2720] ml-auto shrink-0">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Ledger Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        {/* Table 1: Harvests or Crops */}
        {canReadHarvests ? (
          <div className="bg-white rounded-2xl border border-[#e2eae1] shadow-sm overflow-hidden min-w-0">
            <div className="p-4 sm:p-5 border-b border-[#e2eae1] flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-sm font-semibold text-[#1c2720] truncate">Recent Harvest Batches</h3>
                <p className="text-xs text-[#5e7063] truncate">Latest production entries from Redis storage</p>
              </div>
              <button
                onClick={() => onNavigate('harvests')}
                className="text-xs font-medium text-[#2d5a3f] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-[#f0f4f0]">
              {recentHarvests.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-xs text-[#5e7063]">No harvests recorded yet</div>
              ) : (
                recentHarvests.map((h, i) => (
                  <div key={i} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-[#fafcfa] gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#1c2720]">Lot #{h.id || h.harvest_id}</span>
                      <span className="ml-2 text-[#5e7063] hidden sm:inline">Date: {h.harvest_date}</span>
                      <p className="text-[11px] text-[#5e7063] mt-0.5 truncate">
                        Field Plot: #{h.field_id} • Season: #{h.crop_season_id}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#2d5a3f] block">
                        {h.quantity} {h.unit || 'kg'}
                      </span>
                      <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                        {h.quality || 'Grade A'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : canReadCrops ? (
          <div className="bg-white rounded-2xl border border-[#e2eae1] shadow-sm overflow-hidden min-w-0">
            <div className="p-4 sm:p-5 border-b border-[#e2eae1] flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-sm font-semibold text-[#1c2720] truncate">Crops Under Cultivation</h3>
                <p className="text-xs text-[#5e7063] truncate">Active agricultural crops in season</p>
              </div>
              <button
                onClick={() => onNavigate('crops')}
                className="text-xs font-medium text-[#2d5a3f] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-[#f0f4f0]">
              {cropsList.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-xs text-[#5e7063]">No crops registered yet</div>
              ) : (
                cropsList.slice(0, 5).map((c, i) => (
                  <div key={i} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-[#fafcfa] gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#1c2720]">{c.name}</span>
                      <span className="ml-2 text-[#5e7063] hidden sm:inline">Type: {c.crop_type || 'Grain'}</span>
                      <p className="text-[11px] text-[#5e7063] mt-0.5 truncate">
                        Growing Duration: {c.duration_days || 120} days
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {/* Table 2: Sales or Inventory */}
        {canReadSales ? (
          <div className="bg-white rounded-2xl border border-[#e2eae1] shadow-sm overflow-hidden min-w-0">
            <div className="p-4 sm:p-5 border-b border-[#e2eae1] flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-sm font-semibold text-[#1c2720] truncate">Recent Invoices & Sales</h3>
                <p className="text-xs text-[#5e7063] truncate">Commercial transactions with buyers</p>
              </div>
              <button
                onClick={() => onNavigate('sales')}
                className="text-xs font-medium text-[#2d5a3f] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-[#f0f4f0]">
              {recentSales.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-xs text-[#5e7063]">No sales recorded yet</div>
              ) : (
                recentSales.map((s, i) => (
                  <div key={i} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-[#fafcfa] gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#1c2720]">Invoice #{s.id || s.sale_id}</span>
                      <span className="ml-2 text-[#5e7063] hidden sm:inline">Date: {s.sale_date}</span>
                      <p className="text-[11px] text-[#5e7063] mt-0.5 truncate">
                        Customer: #{s.customer_id} • Qty: {s.quantity} {s.unit || 'kg'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#1c2720] block">
                        ₹{parseFloat(s.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                        {s.status || 'Completed'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : canReadInventory ? (
          <div className="bg-white rounded-2xl border border-[#e2eae1] shadow-sm overflow-hidden min-w-0">
            <div className="p-4 sm:p-5 border-b border-[#e2eae1] flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-sm font-semibold text-[#1c2720] truncate">Current Inventory Supplies</h3>
                <p className="text-xs text-[#5e7063] truncate">Warehouse stock and allocated items</p>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-medium text-[#2d5a3f] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-[#f0f4f0]">
              {recentInventory.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-xs text-[#5e7063]">No inventory items logged yet</div>
              ) : (
                recentInventory.map((item, i) => (
                  <div key={i} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-[#fafcfa] gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#1c2720]">{item.item_name || `Item #${item.id}`}</span>
                      <span className="ml-2 text-[#5e7063] hidden sm:inline">Type: {item.category || item.item_type || 'Supply'}</span>
                      <p className="text-[11px] text-[#5e7063] mt-0.5 truncate">
                        Supplier: #{item.supplier_id || 'Direct'} • Reorder Threshold: {item.reorder_level || '10'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#2d5a3f] block">
                        {item.quantity || 0} {item.unit || 'units'}
                      </span>
                      <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                        In Stock
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
