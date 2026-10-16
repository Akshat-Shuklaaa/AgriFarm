'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auditLogs.getAll({ page, limit });
      if (res.success) {
        setLogs(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total);
        } else {
          setTotal((res.data || []).length);
        }
      } else {
        setError(res.error || 'Failed to fetch audit log trail');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getActionBadge = (action: string) => {
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('LOGIN') || action.includes('ACTIVATE') || action.includes('CREATE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('ROLE')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e2eae1]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1c2720] tracking-tight">
              Security Audit Trail & Telemetry
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#eef3ed] text-[#2d5a3f]">
              {total} Logged Events
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5e7063] mt-1">
            Immutable, append-only security logs recording administrative actions, role modifications, and critical data operations
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-3.5 py-2 border border-[#e2eae1] bg-white rounded-xl text-xs font-semibold text-[#2d5a3f] hover:bg-[#f0f4f0] transition shadow-sm w-full sm:w-auto shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Log Table Card */}
      <div className="bg-white rounded-2xl border border-[#e2eae1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#2d5a3f]/20 border-t-[#2d5a3f] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#5e7063]">Fetching audit trail from Redis sorted set...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5e7063]">
            <FileText className="w-8 h-8 mx-auto mb-2 text-[#87986a]" />
            <p className="font-semibold text-sm text-[#1c2720]">No Audit Records Found</p>
            <p className="mt-1">Events will appear here as users perform system actions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="bg-[#f2f5f1] border-b border-[#e0e7df] text-[#5e7063] font-semibold select-none">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f0] text-[#1c2720]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fafcfa] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[#5e7063] font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="min-w-0">
                        <span className="font-semibold text-[#1c2720] block">{log.username}</span>
                        <span className="text-[10px] text-[#5e7063] font-mono capitalize">
                          {log.userRole} (ID #{log.userId})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-[#2d5a3f] bg-[#eef3ed] px-2 py-0.5 rounded">
                        {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#5e7063] text-[11px]">
                      {log.ip || 'internal'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono text-[10px] text-[#5e7063]">
                      {Object.keys(log.details || {}).length > 0
                        ? JSON.stringify(log.details)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 sm:p-4 border-t border-[#e2eae1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5e7063]">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-[#e2eae1] hover:bg-[#f0f4f0] disabled:opacity-40 transition flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-[#e2eae1] hover:bg-[#f0f4f0] disabled:opacity-40 transition flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
