'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  FileText,
  Download,
  AlertTriangle,
  Building2,
  Users,
  Wheat,
  Package,
  Wrench,
  Receipt,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState('farmers-farms');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const reportTabs = [
    { id: 'farmers-farms', label: 'Farmers & Farms', icon: Users },
    { id: 'farms-fields', label: 'Farms & Fields', icon: Building2 },
    { id: 'crops-varieties', label: 'Crops & Varieties', icon: Wheat },
    { id: 'low-stock', label: 'Low Stock Alerts', icon: Package },
    { id: 'equipment-maintenance', label: 'Equipment Upkeep', icon: Wrench },
    { id: 'sales-payments', label: 'Sales & Settlements', icon: Receipt },
  ];

  useEffect(() => {
    loadReport(selectedReport);
  }, [selectedReport]);

  const loadReport = async (reportId: string) => {
    setLoading(true);
    setReportData(null);
    try {
      if (reportId === 'farmers-farms') {
        const [farmersRes, farmsRes] = await Promise.all([
          api.farmers.getAll({ limit: 100 }),
          api.farms.getAll({ limit: 100 }),
        ]);
        const farmers = farmersRes.data || [];
        const farms = farmsRes.data || [];
        const mapped = farmers.map((farmer: any) => ({
          ...farmer,
          farms: farms.filter((farm: any) => String(farm.farmer_id) === String(farmer.id)),
        }));
        setReportData(mapped);
      } else if (reportId === 'farms-fields') {
        const [farmsRes, fieldsRes] = await Promise.all([
          api.farms.getAll({ limit: 100 }),
          api.fields.getAll({ limit: 100 }),
        ]);
        const farms = farmsRes.data || [];
        const fields = fieldsRes.data || [];
        const mapped = farms.map((farm: any) => ({
          ...farm,
          fields: fields.filter((f: any) => String(f.farm_id) === String(farm.id)),
        }));
        setReportData(mapped);
      } else if (reportId === 'crops-varieties') {
        const [cropsRes, varietiesRes] = await Promise.all([
          api.crops.getAll({ limit: 100 }),
          api.cropVarieties.getAll({ limit: 100 }),
        ]);
        const crops = cropsRes.data || [];
        const varieties = varietiesRes.data || [];
        const mapped = crops.map((c: any) => ({
          ...c,
          varieties: varieties.filter((v: any) => String(v.crop_id) === String(c.id)),
        }));
        setReportData(mapped);
      } else if (reportId === 'low-stock') {
        const itemsRes = await api.inventory.getAll({ limit: 100 });
        const items = itemsRes.data || [];
        // Filter or highlight stock items
        setReportData(items);
      } else if (reportId === 'equipment-maintenance') {
        const [eqRes, maintRes] = await Promise.all([
          api.equipment.getAll({ limit: 100 }),
          api.maintenance.getAll({ limit: 100 }),
        ]);
        const equipment = eqRes.data || [];
        const maintenance = maintRes.data || [];
        const mapped = equipment.map((eq: any) => ({
          ...eq,
          maintenance: maintenance.filter((m: any) => String(m.equipment_id) === String(eq.id)),
        }));
        setReportData(mapped);
      } else if (reportId === 'sales-payments') {
        const [salesRes, paymentsRes, custRes] = await Promise.all([
          api.sales.getAll({ limit: 100 }),
          api.payments.getAll({ limit: 100 }),
          api.customers.getAll({ limit: 100 }),
        ]);
        const sales = salesRes.data || [];
        const payments = paymentsRes.data || [];
        const customers = custRes.data || [];
        const mapped = sales.map((s: any) => {
          const cust = customers.find((c: any) => String(c.id) === String(s.customer_id));
          const relatedPayments = payments.filter((p: any) => String(p.sale_id) === String(s.id));
          const paidTotal = relatedPayments.reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0);
          return {
            ...s,
            customerName: cust ? cust.name : `Customer #${s.customer_id}`,
            payments: relatedPayments,
            paidTotal,
            balance: Math.max(0, parseFloat(s.total_amount || 0) - paidTotal),
          };
        });
        setReportData(mapped);
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e2eae1]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1c2720] tracking-tight">Agricultural Reports & Aggregations</h2>
          <p className="text-xs sm:text-sm text-[#5e7063] mt-1">
            Real-time cross-entity aggregations computed from Redis Hashes and Sets
          </p>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-[#e2eae1] pb-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#2d5a3f] text-white shadow-sm'
                  : 'bg-white text-[#5e7063] border border-[#e2eae1] hover:bg-[#f0f4f0] hover:text-[#1c2720]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Body */}
      <div className="bg-white rounded-2xl border border-[#e2eae1] shadow-sm p-4 sm:p-6 min-h-[400px]">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#2d5a3f]/20 border-t-[#2d5a3f] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#5e7063]">Aggregating report from Redis entities...</p>
          </div>
        ) : !reportData || reportData.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#5e7063]">
            <FileText className="w-8 h-8 mx-auto mb-2 text-[#87986a]" />
            <p className="font-semibold text-sm text-[#1c2720]">No Data Available for this Report</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Report 1: Farmers & Farms */}
            {selectedReport === 'farmers-farms' && (
              <div className="space-y-4">
                {reportData.map((farmer: any) => (
                  <div key={farmer.id} className="p-3.5 sm:p-4 rounded-xl border border-[#e2eae1] bg-[#f8faf7] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block font-mono text-[10px] text-[#2d5a3f] bg-[#eef3ed] px-2 py-0.5 rounded">
                          FARMER #{farmer.id}
                        </span>
                        <h4 className="text-sm font-bold text-[#1c2720] mt-1 break-words">{farmer.name}</h4>
                        <p className="text-xs text-[#5e7063] break-words">
                          {farmer.phone} • {farmer.email} • {farmer.address}
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-[#d8e5d6] text-[#21432f] shrink-0">
                        {farmer.farms?.length || 0} Owned Farms
                      </span>
                    </div>

                    <div className="pl-3 sm:pl-4 border-l-2 border-[#87986a] space-y-2">
                      <p className="text-[11px] font-semibold text-[#5e7063] uppercase">Associated Farms:</p>
                      {!farmer.farms || farmer.farms.length === 0 ? (
                        <p className="text-xs text-[#87986a] italic">No farms mapped to this farmer yet</p>
                      ) : (
                        farmer.farms.map((f: any) => (
                          <div
                            key={f.id}
                            className="p-2.5 bg-white rounded-lg border border-[#e2eae1] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-[#1c2720]">{f.name}</span>
                              <span className="text-[#5e7063] block sm:inline sm:ml-2">Location: {f.location}</span>
                            </div>
                            <span className="font-mono font-medium text-[#2d5a3f] shrink-0">{f.total_area} Acres</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Report 2: Farms & Fields */}
            {selectedReport === 'farms-fields' && (
              <div className="space-y-4">
                {reportData.map((farm: any) => (
                  <div key={farm.id} className="p-3.5 sm:p-4 rounded-xl border border-[#e2eae1] bg-[#f8faf7] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block font-mono text-[10px] text-[#2d5a3f] bg-[#eef3ed] px-2 py-0.5 rounded">
                          FARM #{farm.id}
                        </span>
                        <h4 className="text-sm font-bold text-[#1c2720] mt-1 break-words">{farm.name}</h4>
                        <p className="text-xs text-[#5e7063] break-words">
                          Location: {farm.location} • Total Area: {farm.total_area} Acres
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-[#d8e5d6] text-[#21432f] shrink-0">
                        {farm.fields?.length || 0} Sub-plots
                      </span>
                    </div>

                    <div className="pl-3 sm:pl-4 border-l-2 border-[#87986a] space-y-2">
                      <p className="text-[11px] font-semibold text-[#5e7063] uppercase">Cultivated Fields:</p>
                      {!farm.fields || farm.fields.length === 0 ? (
                        <p className="text-xs text-[#87986a] italic">No fields demarcated</p>
                      ) : (
                        farm.fields.map((f: any) => (
                          <div
                            key={f.id}
                            className="p-2.5 bg-white rounded-lg border border-[#e2eae1] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-[#1c2720]">{f.name}</span>
                              <span className="text-[#5e7063] block sm:inline sm:ml-2">Soil: {f.soil_type || 'Loamy'}</span>
                            </div>
                            <span className="font-mono font-medium text-[#2d5a3f] shrink-0">{f.area} Acres</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Report 3: Crops & Varieties */}
            {selectedReport === 'crops-varieties' && (
              <div className="space-y-4">
                {reportData.map((crop: any) => (
                  <div key={crop.id} className="p-3.5 sm:p-4 rounded-xl border border-[#e2eae1] bg-[#f8faf7] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block font-mono text-[10px] text-[#2d5a3f] bg-[#eef3ed] px-2 py-0.5 rounded">
                          CROP #{crop.id}
                        </span>
                        <h4 className="text-sm font-bold text-[#1c2720] mt-1 break-words">{crop.name}</h4>
                        <p className="text-xs text-[#5e7063] break-words">
                          Category: {crop.category} • Scientific: {crop.scientific_name} • Duration:{' '}
                          {crop.duration_days} days
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-[#d8e5d6] text-[#21432f] shrink-0">
                        {crop.varieties?.length || 0} Registered Cultivars
                      </span>
                    </div>

                    <div className="pl-3 sm:pl-4 border-l-2 border-[#87986a] space-y-2">
                      <p className="text-[11px] font-semibold text-[#5e7063] uppercase">Varieties & Expected Yields:</p>
                      {!crop.varieties || crop.varieties.length === 0 ? (
                        <p className="text-xs text-[#87986a] italic">No varieties recorded</p>
                      ) : (
                        crop.varieties.map((v: any) => (
                          <div
                            key={v.id}
                            className="p-2.5 bg-white rounded-lg border border-[#e2eae1] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs"
                          >
                            <span className="font-semibold text-[#1c2720]">{v.variety_name}</span>
                            <span className="font-mono font-medium text-[#2d5a3f] shrink-0">
                              {v.expected_yield_per_acre} kg / acre
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Report 4: Low Stock Alerts */}
            {selectedReport === 'low-stock' && (
              <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-[#f8faf7] border-b border-[#e2eae1] text-[#5e7063]">
                    <tr>
                      <th className="py-2.5 px-3">Item ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Current Qty</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f4f0]">
                    {reportData.map((item: any) => {
                      const qty = parseFloat(item.quantity || 0);
                      const isLow = qty < 100;
                      return (
                        <tr key={item.id} className="hover:bg-[#fafcfa]">
                          <td className="py-2.5 px-3 font-mono font-medium">#{item.id}</td>
                          <td className="py-2.5 px-3 font-semibold">{item.name}</td>
                          <td className="py-2.5 px-3">{item.category}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{qty}</td>
                          <td className="py-2.5 px-3">{item.unit}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isLow ? 'Low Stock Alert' : 'Adequate'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Report 5: Equipment & Maintenance */}
            {selectedReport === 'equipment-maintenance' && (
              <div className="space-y-4">
                {reportData.map((eq: any) => (
                  <div key={eq.id} className="p-3.5 sm:p-4 rounded-xl border border-[#e2eae1] bg-[#f8faf7] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block font-mono text-[10px] text-[#2d5a3f] bg-[#eef3ed] px-2 py-0.5 rounded">
                          MACHINERY #{eq.id}
                        </span>
                        <h4 className="text-sm font-bold text-[#1c2720] mt-1 break-words">{eq.name}</h4>
                        <p className="text-xs text-[#5e7063] break-words">
                          Class: {eq.equipment_type} • Status: {eq.status} • Purchased: {eq.purchase_date}
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-[#d8e5d6] text-[#21432f] shrink-0">
                        {eq.maintenance?.length || 0} Service Logs
                      </span>
                    </div>

                    <div className="pl-3 sm:pl-4 border-l-2 border-[#87986a] space-y-2">
                      <p className="text-[11px] font-semibold text-[#5e7063] uppercase">Maintenance History:</p>
                      {!eq.maintenance || eq.maintenance.length === 0 ? (
                        <p className="text-xs text-[#87986a] italic">No service records</p>
                      ) : (
                        eq.maintenance.map((m: any) => (
                          <div
                            key={m.id}
                            className="p-2.5 bg-white rounded-lg border border-[#e2eae1] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-[#1c2720]">{m.maintenance_type}</span>
                              <span className="text-[#5e7063] block sm:inline sm:ml-2">Date: {m.maintenance_date}</span>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <span className="font-bold text-[#1c2720]">₹{m.cost}</span>
                              <span className="text-[10px] text-emerald-700 ml-2">({m.status})</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Report 6: Sales & Payments */}
            {selectedReport === 'sales-payments' && (
              <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-[#f8faf7] border-b border-[#e2eae1] text-[#5e7063]">
                    <tr>
                      <th className="py-2.5 px-3">Invoice ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Billed (INR)</th>
                      <th className="py-2.5 px-3">Received (INR)</th>
                      <th className="py-2.5 px-3">Balance</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f4f0]">
                    {reportData.map((s: any) => (
                      <tr key={s.id} className="hover:bg-[#fafcfa]">
                        <td className="py-2.5 px-3 font-mono font-medium">#{s.id}</td>
                        <td className="py-2.5 px-3 font-semibold">{s.customerName}</td>
                        <td className="py-2.5 px-3 text-[#5e7063]">{s.sale_date}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">₹{s.total_amount}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">₹{s.paidTotal}</td>
                        <td className="py-2.5 px-3 font-mono text-rose-700 font-bold">₹{s.balance}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.balance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.balance === 0 ? 'Fully Paid' : 'Outstanding'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
