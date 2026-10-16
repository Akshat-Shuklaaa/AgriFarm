'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, Role, ROLE_LABELS } from '../lib/authContext';
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function UserManagementView() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('worker');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Role edit state
  const [targetRole, setTargetRole] = useState<Role>('worker');

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.users.getAll({
        page,
        limit,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setUsers(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total);
        } else {
          setTotal((res.data || []).length);
        }
      } else {
        setError(res.error || 'Failed to fetch user directory');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('worker');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await api.users.create({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      if (res.success) {
        setIsCreateOpen(false);
        await loadUsers();
      } else {
        setFormError(res.error || 'Failed to register user');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRoleModal = (u: User) => {
    setSelectedUser(u);
    setTargetRole(u.role);
    setFormError(null);
    setIsRoleOpen(true);
  };

  const handleRoleSubmit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.users.updateRole(selectedUser.id, targetRole);
      if (res.success) {
        setIsRoleOpen(false);
        await loadUsers();
      } else {
        setFormError(res.error || 'Failed to update role');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatusModal = (u: User) => {
    setSelectedUser(u);
    setFormError(null);
    setIsStatusOpen(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setFormError(null);
    const nextStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.users.updateStatus(selectedUser.id, nextStatus);
      if (res.success) {
        setIsStatusOpen(false);
        await loadUsers();
      } else {
        setFormError(res.error || 'Failed to update user status');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (u: User) => {
    setSelectedUser(u);
    setFormError(null);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.users.delete(selectedUser.id);
      if (res.success) {
        setIsDeleteOpen(false);
        await loadUsers();
      } else {
        setFormError(res.error || 'Failed to delete user');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'farm_manager':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inventory_manager':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'worker':
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e2eae1]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1c2720] tracking-tight">
              User Directory & Access Control
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#eef3ed] text-[#2d5a3f]">
              {total} {total === 1 ? 'User' : 'Users'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5e7063] mt-1">
            Manage system operators, assign access tiers, and enforce role-based permissions
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#2d5a3f] text-white rounded-xl text-xs font-semibold hover:bg-[#234731] transition shadow-sm shadow-[#2d5a3f]/20 w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Register User</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-[#e2eae1]">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#87986a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search users by name, email, or ID..."
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f] text-[#1c2720]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-3 py-1.5 bg-[#f8faf7] border border-[#e2eae1] rounded-lg text-[#1c2720] focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="farm_manager">Farm Owner / Manager</option>
            <option value="inventory_manager">Inventory Manager</option>
            <option value="worker">Worker</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-3 py-1.5 bg-[#f8faf7] border border-[#e2eae1] rounded-lg text-[#1c2720] focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* User Table Card */}
      <div className="bg-white rounded-2xl border border-[#e2eae1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#2d5a3f]/20 border-t-[#2d5a3f] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#5e7063]">Fetching user accounts from Redis...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5e7063]">
            <Users className="w-8 h-8 mx-auto mb-2 text-[#87986a]" />
            <p className="font-semibold text-sm text-[#1c2720]">No Users Found</p>
            <p className="mt-1">
              {search || roleFilter || statusFilter
                ? 'Try adjusting your search query or filters'
                : 'Click "Register User" to create the first account'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-[#f8faf7] border-b border-[#e2eae1] text-[#5e7063] font-semibold select-none">
                <tr>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f0] text-[#1c2720]">
                {users.map((u) => {
                  const initials = u.name
                    ? u.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U';
                  const isActive = u.status === 'active';

                  return (
                    <tr key={u.id} className="hover:bg-[#fafcfa] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#d8e5d6] text-[#2d5a3f] font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-[#1c2720] block truncate">{u.name}</span>
                            <span className="font-mono text-[10px] text-[#5e7063]">ID #{u.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#5e7063]">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#5e7063] text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenRoleModal(u)}
                          className="p-1.5 sm:p-2 rounded-lg text-[#5e7063] hover:text-[#2d5a3f] hover:bg-[#eef3ed] transition inline-flex items-center justify-center min-w-[32px] min-h-[32px]"
                          title="Change Role"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(u)}
                          className={`p-1.5 sm:p-2 rounded-lg transition inline-flex items-center justify-center min-w-[32px] min-h-[32px] ${
                            isActive
                              ? 'text-[#5e7063] hover:text-amber-700 hover:bg-amber-50'
                              : 'text-[#5e7063] hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(u)}
                          className="p-1.5 sm:p-2 rounded-lg text-[#5e7063] hover:text-rose-600 hover:bg-rose-50 transition inline-flex items-center justify-center min-w-[32px] min-h-[32px]"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-[#e2eae1] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2eae1]">
              <h3 className="text-sm font-bold text-[#1c2720]">Register New User Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg text-[#5e7063] hover:bg-[#f0f4f0]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1c2720]">Full Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Suresh Patel"
                  required
                  className="w-full text-xs px-3 py-2 bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1c2720]">Email Address *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="suresh@agrifarm.local"
                  required
                  className="w-full text-xs px-3 py-2 bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1c2720]">Password * (Min. 8 characters)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full text-xs px-3 py-2 bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1c2720]">Assigned Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full text-xs px-3 py-2 bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
                >
                  <option value="worker">Worker (Field Tasks & Attendance)</option>
                  <option value="inventory_manager">Inventory Manager (Supplies & Machinery)</option>
                  <option value="farm_manager">Farm Owner / Manager (Operations & Crops)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
                <p className="text-[10px] text-[#5e7063] mt-0.5">
                  Follows least-privilege defaults. Worker tier assigned by default.
                </p>
              </div>

              <div className="pt-3 border-t border-[#e2eae1] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-[#e2eae1] rounded-xl text-xs font-medium text-[#5e7063] hover:bg-[#f0f4f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2 bg-[#2d5a3f] text-white rounded-xl text-xs font-semibold hover:bg-[#234731] transition disabled:opacity-50"
                >
                  {submitting ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {isRoleOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-[#e2eae1] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2eae1]">
              <h3 className="text-sm font-bold text-[#1c2720]">Modify Role Tier</h3>
              <button onClick={() => setIsRoleOpen(false)} className="p-1.5 rounded-lg text-[#5e7063] hover:bg-[#f0f4f0]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-[#5e7063]">
                Updating access permissions for <span className="font-semibold text-[#1c2720]">{selectedUser.name}</span> (
                {selectedUser.email}).
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1c2720]">Select New Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as Role)}
                  className="w-full text-xs px-3 py-2 bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f]"
                >
                  <option value="worker">Worker</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="farm_manager">Farm Owner / Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsRoleOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-[#e2eae1] rounded-xl text-xs font-medium text-[#5e7063] hover:bg-[#f0f4f0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleRoleSubmit}
                className="w-full sm:w-auto px-4 py-2 bg-[#2d5a3f] text-white rounded-xl text-xs font-semibold hover:bg-[#234731] transition disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVATE / DEACTIVATE MODAL */}
      {isStatusOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-[#e2eae1] space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  selectedUser.status === 'active'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {selectedUser.status === 'active' ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1c2720]">
                  {selectedUser.status === 'active'
                    ? 'Deactivate User Account?'
                    : 'Reactivate User Account?'}
                </h3>
                <p className="text-xs text-[#5e7063] mt-1">
                  {selectedUser.status === 'active'
                    ? `Deactivating ${selectedUser.name} will immediately invalidate all their active Redis browser sessions and block future sign-ins.`
                    : `Reactivating ${selectedUser.name} will restore their login access.`}
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsStatusOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-[#e2eae1] rounded-xl text-xs font-medium text-[#5e7063] hover:bg-[#f0f4f0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleStatusSubmit}
                className={`w-full sm:w-auto px-4 py-2 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 ${
                  selectedUser.status === 'active'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitting
                  ? 'Updating...'
                  : selectedUser.status === 'active'
                  ? 'Confirm Deactivation'
                  : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-[#e2eae1] space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1c2720]">Permanently Delete Account?</h3>
                <p className="text-xs text-[#5e7063] mt-1">
                  Are you sure you want to delete <span className="font-semibold text-[#1c2720]">{selectedUser.name}</span>?
                  This will remove the Redis record, email index, and revoke all sessions.
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-[#e2eae1] rounded-xl text-xs font-medium text-[#5e7063] hover:bg-[#f0f4f0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteSubmit}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
