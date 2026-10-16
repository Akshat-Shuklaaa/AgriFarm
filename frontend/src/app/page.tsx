'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/authContext';
import { LoginView } from '../components/LoginView';
import { AccessDeniedView } from '../components/AccessDeniedView';
import { UserManagementView } from '../components/UserManagementView';
import { AuditLogsView } from '../components/AuditLogsView';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DashboardView } from '../components/DashboardView';
import { EntityCrudView } from '../components/EntityCrudView';
import { ReportsView } from '../components/ReportsView';
import { ENTITY_CONFIGS } from '../lib/entities';
import { api } from '../lib/api';
import {
  Database,
  Server,
  Key,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Wheat,
  RotateCcw,
} from 'lucide-react';

function AppContent() {
  const { user, loading, isAuthenticated, isAllowedView } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [headerSearch, setHeaderSearch] = useState('');
  const [redisConnected, setRedisConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await api.health();
      if (res.success) {
        setRedisConnected(true);
        setHealthInfo(res.data);
      } else {
        setRedisConnected(false);
      }
    } catch {
      setRedisConnected(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // If still checking auth session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9f6] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#2d5a3f] flex items-center justify-center text-white shadow-lg shadow-[#2d5a3f]/25 mb-4 animate-bounce">
          <Wheat className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-[#1c2720]">AgriFarm SaaS Platform</p>
        <p className="text-xs text-[#5e7063] mt-1">Verifying secure session credentials...</p>
      </div>
    );
  }

  // If not logged in, render the secure login view
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Determine current entity config if browsing an entity
  const currentEntityConfig = ENTITY_CONFIGS[activeView];

  const getPageTitle = () => {
    if (activeView === 'dashboard') return 'Executive Dashboard';
    if (activeView === 'reports') return 'System Reports & Analytics';
    if (activeView === 'userManagement') return 'User & Access Directory';
    if (activeView === 'auditLogs') return 'Security & Operation Audit Logs';
    if (activeView === 'settings') return 'System Settings & Architecture';
    if (currentEntityConfig) return currentEntityConfig.pluralLabel;
    return activeView;
  };

  const getCategory = () => {
    if (activeView === 'dashboard' || activeView === 'reports') return 'Analytics';
    if (activeView === 'userManagement' || activeView === 'auditLogs' || activeView === 'settings') return 'Administration';
    if (currentEntityConfig) return currentEntityConfig.category;
    return 'Entities';
  };

  const isViewPermitted = isAllowedView(activeView);

  return (
    <div className="flex min-h-screen bg-[#f7f9f6] w-full overflow-x-hidden">
      {/* Sidebar: persistent on desktop (lg+), responsive slide-out drawer on mobile/tablet */}
      <Sidebar
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          setHeaderSearch('');
          setMobileNavOpen(false);
        }}
        redisConnected={redisConnected}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <Header
          title={getPageTitle()}
          category={getCategory()}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          searchValue={headerSearch}
          onSearchChange={currentEntityConfig ? setHeaderSearch : undefined}
          searchPlaceholder={currentEntityConfig ? `Search ${currentEntityConfig.pluralLabel.toLowerCase()}...` : undefined}
        />

        <main className="flex-1 pb-16 min-w-0 w-full">
          {!isViewPermitted ? (
            <AccessDeniedView
              onReturnDashboard={() => setActiveView('dashboard')}
              attemptedView={activeView}
            />
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView onNavigate={(view) => setActiveView(view)} />
              )}

              {activeView === 'reports' && <ReportsView />}

              {activeView === 'userManagement' && <UserManagementView />}

              {activeView === 'auditLogs' && <AuditLogsView />}

              {activeView === 'settings' && (
                <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full">
                  <div className="border-b border-[#e2eae1] pb-3 sm:pb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-[#1c2720]">System Architecture & Settings</h2>
                    <p className="text-xs text-[#5e7063] mt-1">
                      Agricultural Farm Management System Architecture & Configuration
                    </p>
                  </div>

                  {/* Architecture Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2eae1] space-y-3">
                      <div className="flex items-center gap-2.5 text-[#2d5a3f]">
                        <Database className="w-5 h-5 shrink-0" />
                        <h3 className="text-sm font-bold text-[#1c2720]">Redis In-Memory Database</h3>
                      </div>
                      <p className="text-xs text-[#5e7063] leading-relaxed">
                        Entity records are stored as Redis Hashes (e.g.{' '}
                        <code className="text-[#2d5a3f] bg-[#eef3ed] px-1 py-0.5 rounded font-mono break-all">
                          farmer:101
                        </code>
                        ) and entity relationship foreign keys are maintained through bidirectional Redis Sets (e.g.{' '}
                        <code className="text-[#2d5a3f] bg-[#eef3ed] px-1 py-0.5 rounded font-mono break-all">
                          farmer:101:farms
                        </code>
                        ).
                      </p>
                      <div className="pt-2 border-t border-[#f0f4f0] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <span className="text-[#5e7063]">Connection URL:</span>
                        <span className="font-mono text-[#2d5a3f] break-all">redis://localhost:6379</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <span className="text-[#5e7063]">Container Name:</span>
                        <span className="font-mono text-[#1c2720]">redis:latest (port 6379)</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2eae1] space-y-3">
                      <div className="flex items-center gap-2.5 text-[#2d5a3f]">
                        <Server className="w-5 h-5 shrink-0" />
                        <h3 className="text-sm font-bold text-[#1c2720]">Express REST Backend API</h3>
                      </div>
                      <p className="text-xs text-[#5e7063] leading-relaxed">
                        Modular TypeScript API with centralized Zod validation, rate limiting, and atomic pipeline
                        transactions ensuring referential integrity and zero orphan records.
                      </p>
                      <div className="pt-2 border-t border-[#f0f4f0] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <span className="text-[#5e7063]">Backend Base URL:</span>
                        <span className="font-mono text-[#2d5a3f] break-all">http://localhost:4000/api</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5e7063]">Server Status:</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Any of the 28 Entity CRUD Views */}
              {currentEntityConfig && (
                <EntityCrudView
                  key={currentEntityConfig.key}
                  config={currentEntityConfig}
                  externalSearch={headerSearch}
                  onSearchChange={setHeaderSearch}
                  onNavigateToEntity={(entityKey) => {
                    setActiveView(entityKey);
                    setHeaderSearch('');
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
