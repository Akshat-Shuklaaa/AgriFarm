'use client';

import React, { useState, useEffect } from 'react';
import { EntityConfig, FieldDefinition } from '../lib/entities';
import { api } from '../lib/api';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  AlertCircle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink,
} from 'lucide-react';

interface EntityCrudViewProps {
  config: EntityConfig;
  onNavigateToEntity?: (entityKey: string, id?: string) => void;
}

export function EntityCrudView({ config, onNavigateToEntity }: EntityCrudViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeItem, setActiveItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Relational options map: { [fieldName]: Array<{ value: string, label: string }> }
  const [relationOptions, setRelationOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({});

  // Dynamic API getter for this entity key
  const entityApi = (api as any)[config.key];

  useEffect(() => {
    loadData();
    loadRelations();
  }, [config.key, page, search]);

  const loadData = async () => {
    if (!entityApi) return;
    setLoading(true);
    setError(null);
    try {
      const res = await entityApi.getAll({
        page,
        limit,
        search: search.trim() || undefined,
      });

      if (res.success) {
        setItems(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total);
        } else {
          setTotal((res.data || []).length);
        }
      }
    } catch (err: any) {
      console.error(`Failed to load ${config.pluralLabel}:`, err);
      setError(err.message || `Failed to fetch ${config.pluralLabel}`);
    } finally {
      setLoading(false);
    }
  };

  // Pre-load foreign key dropdown options
  const loadRelations = async () => {
    const relationFields = config.fields.filter((f) => f.relation);
    for (const field of relationFields) {
      if (field.relation) {
        const targetApi = (api as any)[field.relation.entity];
        if (targetApi) {
          try {
            const res = await targetApi.getAll({ limit: 100 });
            if (res.success && Array.isArray(res.data)) {
              const options = res.data.map((item: any) => ({
                value: String(item[field.relation!.valueKey] || item.id),
                label: `${item[field.relation!.labelKey] || item.name || item.id} (ID: ${item.id})`,
              }));
              setRelationOptions((prev) => ({ ...prev, [field.name]: options }));
            }
          } catch (e) {
            console.warn(`Could not preload relations for ${field.name}`, e);
          }
        }
      }
    }
  };

  const handleOpenCreate = () => {
    const initial: Record<string, any> = {};
    config.fields.forEach((f) => {
      initial[f.name] = '';
    });
    setFormData(initial);
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setActiveItem(item);
    setFormData({ ...item });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleOpenDetail = (item: any) => {
    setActiveItem(item);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (item: any) => {
    setActiveItem(item);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleSave = async (isEdit: boolean) => {
    // Validate required fields
    const errors: Record<string, string> = {};
    config.fields.forEach((f) => {
      if (f.required && (!formData[f.name] || String(formData[f.name]).trim() === '')) {
        errors[f.name] = `${f.label} is required`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await entityApi.update(activeItem.id, formData);
        setIsEditOpen(false);
      } else {
        await entityApi.create(formData);
        setIsCreateOpen(false);
      }
      await loadData();
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      const res = await entityApi.delete(activeItem.id);
      if (res.success) {
        setIsDeleteOpen(false);
        await loadData();
      } else {
        setDeleteError(res.error || 'Failed to delete record');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Server error preventing deletion (check dependencies)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full">
      {/* Entity Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e2eae1]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1c2720] tracking-tight">{config.pluralLabel}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#eef3ed] text-[#2d5a3f]">
              {total} {total === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5e7063] mt-1 break-words">{config.description}</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#2d5a3f] text-white rounded-xl text-xs font-semibold hover:bg-[#234731] transition shadow-sm shadow-[#2d5a3f]/20 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Add {config.label}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-xl border border-[#e2eae1]">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#87986a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={`Search ${config.pluralLabel.toLowerCase()}...`}
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f] text-[#1c2720]"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-[#5e7063]">
          <span>
            Showing {items.length} of {total}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#e2eae1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#2d5a3f]/20 border-t-[#2d5a3f] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#5e7063]">Fetching records from Redis...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5e7063]">
            <Info className="w-8 h-8 mx-auto mb-2 text-[#87986a]" />
            <p className="font-semibold text-sm text-[#1c2720]">No {config.pluralLabel} Found</p>
            <p className="mt-1">
              {search ? 'Try clearing your search query' : `Click "Add ${config.label}" to register your first record`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-[#f8faf7] border-b border-[#e2eae1] text-[#5e7063] font-semibold select-none">
                <tr>
                  {config.columns.map((col) => (
                    <th key={col.key} className="py-3 px-3 sm:px-4">
                      {col.label}
                    </th>
                  ))}
                  <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f0] text-[#1c2720]">
                {items.map((item, rowIdx) => (
                  <tr key={item.id || rowIdx} className="hover:bg-[#fafcfa] transition-colors">
                    {config.columns.map((col) => (
                      <td key={col.key} className="py-3 px-3 sm:px-4">
                        {col.key === 'id' ? (
                          <span className="font-mono font-medium text-[#2d5a3f] bg-[#eef3ed] px-2 py-0.5 rounded text-[11px]">
                            #{item[col.key]}
                          </span>
                        ) : col.render ? (
                          col.render(item[col.key])
                        ) : (
                          <span className="truncate max-w-xs block">{item[col.key] ?? '—'}</span>
                        )}
                      </td>
                    ))}
                    <td className="py-3 px-3 sm:px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="p-1.5 sm:p-2 rounded-lg text-[#5e7063] hover:text-[#2d5a3f] hover:bg-[#eef3ed] transition inline-flex items-center justify-center min-w-[30px] min-h-[30px]"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 sm:p-2 rounded-lg text-[#5e7063] hover:text-[#2d5a3f] hover:bg-[#eef3ed] transition inline-flex items-center justify-center min-w-[30px] min-h-[30px]"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(item)}
                        className="p-1.5 sm:p-2 rounded-lg text-[#5e7063] hover:text-rose-600 hover:bg-rose-50 transition inline-flex items-center justify-center min-w-[30px] min-h-[30px]"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

      {/* CREATE / EDIT MODAL */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-[#e2eae1] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2eae1]">
              <h3 className="text-sm font-bold text-[#1c2720] truncate pr-2">
                {isEditOpen ? `Edit ${config.label} #${activeItem?.id}` : `Register New ${config.label}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="p-1.5 rounded-lg text-[#5e7063] hover:bg-[#f0f4f0] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              {config.fields.map((field) => {
                const errorMsg = formErrors[field.name];
                return (
                  <div key={field.name} className="space-y-1">
                    <label className="block text-xs font-medium text-[#1c2720]">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="w-full text-xs px-3 py-2 bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
                      >
                        <option value="">-- Select {field.label} --</option>
                        {field.relation && relationOptions[field.name]
                          ? relationOptions[field.name].map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))
                          : field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={formData[field.name] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full text-xs px-3 py-2 bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full text-xs px-3 py-2 bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
                      />
                    )}

                    {errorMsg && <p className="text-[11px] text-rose-500">{errorMsg}</p>}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#e2eae1] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-[#e2eae1] rounded-xl text-xs font-medium text-[#5e7063] hover:bg-[#f0f4f0] transition text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(isEditOpen)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-[#2d5a3f] text-white rounded-xl text-xs font-semibold hover:bg-[#234731] transition disabled:opacity-50 text-center"
              >
                {isSubmitting ? 'Saving to Redis...' : isEditOpen ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && activeItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-[#e2eae1] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2eae1]">
              <div className="min-w-0 pr-2">
                <span className="inline-block text-[10px] font-mono font-medium text-[#2d5a3f] bg-[#eef3ed] px-2 py-0.5 rounded truncate max-w-full">
                  REDIS HASH: {config.key.slice(0, -1)}:{activeItem.id}
                </span>
                <h3 className="text-base font-bold text-[#1c2720] mt-1 truncate">
                  {config.label} #{activeItem.id}
                </h3>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-1.5 rounded-lg text-[#5e7063] hover:bg-[#f0f4f0] shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-[#f0f4f0] text-xs">
              {Object.entries(activeItem).map(([k, v]) => (
                <div key={k} className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                  <span className="font-medium text-[#5e7063] capitalize shrink-0">{k.replace(/_/g, ' ')}</span>
                  <span className="text-[#1c2720] font-mono text-left sm:text-right break-words">{String(v ?? '—')}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#e2eae1] flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-[#2d5a3f] text-white rounded-xl text-xs font-semibold hover:bg-[#234731] transition text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && activeItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-[#e2eae1] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1c2720]">Delete {config.label} Record?</h3>
                <p className="text-xs text-[#5e7063] mt-1 break-words">
                  Are you sure you want to delete <span className="font-semibold text-[#1c2720]">#{activeItem.id}</span>?
                  This will remove the Redis hash key and clean up index sets.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="break-words">
                  <p className="font-semibold">Referential Integrity Protection:</p>
                  <p className="mt-0.5">{deleteError}</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-[#e2eae1] rounded-xl text-xs font-medium text-[#5e7063] hover:bg-[#f0f4f0] transition text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50 text-center"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
