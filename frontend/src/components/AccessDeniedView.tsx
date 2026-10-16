'use client';

import React from 'react';
import { useAuth, ROLE_LABELS } from '../lib/authContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AccessDeniedViewProps {
  onReturnDashboard: () => void;
  attemptedView?: string;
}

export function AccessDeniedView({ onReturnDashboard, attemptedView }: AccessDeniedViewProps) {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto my-12 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1c2720] tracking-tight">
          Access Restricted by Role Policy
        </h2>
        <p className="text-xs sm:text-sm text-[#5e7063] max-w-md mx-auto">
          Your assigned role tier does not possess the necessary security clearance to view or operate{' '}
          <span className="font-semibold text-[#1c2720] font-mono">
            {attemptedView ? `/${attemptedView}` : 'this module'}
          </span>
          .
        </p>
      </div>

      {user && (
        <div className="p-4 rounded-2xl bg-white border border-[#e2eae1] max-w-sm mx-auto shadow-xs text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#5e7063]">Current Operator:</span>
            <span className="font-semibold text-[#1c2720]">{user.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5e7063]">Assigned Role:</span>
            <span className="font-semibold px-2 py-0.5 rounded-full bg-[#eef3ed] text-[#2d5a3f]">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5e7063]">Account Status:</span>
            <span className="font-semibold text-emerald-700 capitalize">{user.status}</span>
          </div>
        </div>
      )}

      <div>
        <button
          onClick={onReturnDashboard}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2d5a3f] text-white rounded-xl text-xs font-semibold hover:bg-[#21432f] transition shadow-md shadow-[#2d5a3f]/20 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Permitted Dashboard</span>
        </button>
      </div>
    </div>
  );
}
