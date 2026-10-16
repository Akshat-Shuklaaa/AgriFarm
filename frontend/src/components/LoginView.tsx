'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import {
  Wheat,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  Package,
} from 'lucide-react';

export function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      if (!res.success) {
        setError(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Admin',
      email: 'admin@agrifarm.local',
      password: 'AdminPassword123!',
      icon: ShieldCheck,
      badge: 'Full Access',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      role: 'Farm Manager',
      email: 'manager@agrifarm.local',
      password: 'ManagerPassword123!',
      icon: Building2,
      badge: 'Operations & Crops',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      role: 'Inventory Manager',
      email: 'inventory@agrifarm.local',
      password: 'InventoryPassword123!',
      icon: Package,
      badge: 'Supplies & Machinery',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      role: 'Worker',
      email: 'worker@agrifarm.local',
      password: 'WorkerPassword123!',
      icon: Users,
      badge: 'Field Tasks & Attendance',
      color: 'bg-stone-100 text-stone-800 border-stone-200',
    },
  ];

  const handleSelectDemo = (acc: (typeof demoAccounts)[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f7f9f6] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#2d5a3f] text-white flex items-center justify-center mx-auto shadow-md shadow-[#2d5a3f]/20">
            <Wheat className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1c2720]">AgriFarm SaaS</h1>
          <p className="text-xs text-[#5e7063]">
            Agricultural Enterprise Management & Ledger Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e0e7df] shadow-xl shadow-[#2d5a3f]/5 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[#1c2720]">Sign In</h2>
            <p className="text-xs text-[#5e7063] mt-0.5">
              Enter your credentials to access your designated workspace
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1c2720]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#87986a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agrifarm.local"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#f2f5f1] border border-[#e0e7df] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a3f] text-[#1c2720] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1c2720]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#87986a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#f2f5f1] border border-[#e0e7df] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a3f] text-[#1c2720] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87986a] hover:text-[#2d5a3f] p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#2d5a3f] text-white rounded-xl text-xs font-semibold hover:bg-[#21432f] transition shadow-md shadow-[#2d5a3f]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <span>Sign In to AgriFarm</span>
              )}
            </button>
          </form>

          {/* Role Preview Accounts (Convenience Helper for Project Evaluation) */}
          <div className="pt-4 border-t border-[#e2eae1] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#5e7063] uppercase tracking-wider">
                Quick Role Selector (Testing)
              </span>
              <span className="text-[10px] text-[#87986a]">Click to load</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#2d5a3f] bg-[#eef3ed]'
                        : 'border-[#e2eae1] bg-[#fafcfa] hover:bg-[#f0f4f0]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <Icon className="w-3.5 h-3.5 text-[#2d5a3f] shrink-0" />
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-[#2d5a3f]" />}
                    </div>
                    <p className="text-xs font-bold text-[#1c2720] mt-1 truncate">{acc.role}</p>
                    <p className="text-[10px] text-[#5e7063] truncate">{acc.badge}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="text-center text-[11px] text-[#87986a] space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2d5a3f]" />
            <span>Encrypted with bcrypt (12 rounds) & Redis HttpOnly sessions</span>
          </p>
        </div>
      </div>
    </div>
  );
}
