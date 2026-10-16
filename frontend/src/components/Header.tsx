'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Search, Bell, Check, Clock, ShieldCheck, X, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../lib/authContext';

interface HeaderProps {
  title: string;
  category?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenMobileNav?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: 'success' | 'info' | 'warning';
}

export function Header({
  title,
  category = 'System',
  onRefresh,
  isRefreshing,
  onOpenMobileNav,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Harvest Lot #2101 Logged',
      description: '2,500 kg Ponni Rice recorded with Grade A quality rating.',
      time: '10m ago',
      unread: true,
      type: 'success',
    },
    {
      id: '2',
      title: 'Payment Settlement Received',
      description: '₹17,500 credited via UPI for Sale Invoice #2201.',
      time: '1h ago',
      unread: true,
      type: 'success',
    },
    {
      id: '3',
      title: 'Soil Test Analyzed',
      description: 'North Field pH 6.5, Nitrogen & Potassium optimal.',
      time: '2h ago',
      unread: false,
      type: 'info',
    },
    {
      id: '4',
      title: 'Redis In-Memory Persistence Active',
      description: 'AOF and RDB background snapshots synchronized.',
      time: '3h ago',
      unread: false,
      type: 'info',
    },
  ]);

  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="h-16 bg-white border-b border-[#e2eae1] px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left Area: Mobile Menu Button + Title & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 -ml-1 rounded-lg text-[#5e7063] hover:text-[#1c2720] hover:bg-[#f0f4f0] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a3f] shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-[#5e7063] truncate">
            <span>AgriFarm</span>
            <span>/</span>
            <span className="capitalize truncate">{category}</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-[#2d5a3f] font-medium hidden sm:inline truncate">{title}</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-[#1c2720] tracking-tight truncate">
            {title}
          </h2>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Header Search Input */}
        {onSearchChange ? (
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-[#87986a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder || 'Search records or IDs...'}
              className="pl-8 pr-7 py-1.5 text-xs bg-[#f2f5f1] border border-[#e0e7df] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f] w-40 lg:w-56 text-[#1c2720] placeholder-[#87986a] transition-all"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#87986a] hover:text-[#1c2720] p-0.5 rounded transition-colors"
                title="Clear"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative hidden md:block opacity-60">
            <Search className="w-3.5 h-3.5 text-[#87986a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              disabled
              placeholder="Select an entity to search..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#f2f5f1] border border-[#e0e7df] rounded-lg cursor-not-allowed w-40 lg:w-56 text-[#5e7063] placeholder-[#87986a]"
            />
          </div>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#e2eae1] bg-white text-xs font-medium text-[#2d5a3f] hover:bg-[#f0f4f0] transition-colors disabled:opacity-50"
            title="Refresh current data from Redis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        )}

        {/* Notifications Popover Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`p-2 rounded-lg transition-colors relative ${
              notificationsOpen
                ? 'bg-[#eef3ed] text-[#2d5a3f]'
                : 'text-[#5e7063] hover:text-[#1c2720] hover:bg-[#f0f4f0]'
            }`}
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            )}
          </button>

          {/* Dropdown Card */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-xl border border-[#e2eae1] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 sm:p-4 border-b border-[#e2eae1] flex items-center justify-between bg-[#fafcfa]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#1c2720]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d8e5d6] text-[#21432f]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-[#2d5a3f] hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#f0f4f0]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#5e7063]">
                    No notifications at this time
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3 transition-colors hover:bg-[#fafcfa] ${
                        item.unread ? 'bg-[#f4f7f3]/50' : 'bg-white'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                          item.type === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-semibold text-[#1c2720] truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-[#5e7063] shrink-0">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5e7063] mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(item.id)}
                        className="text-[#87986a] hover:text-rose-600 p-1 transition shrink-0"
                        title="Dismiss"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-[#f7f9f6] border-t border-[#e0e7df] text-center">
                <span className="text-[10px] text-[#5e7063] font-medium">
                  Redis Event Logs Synchronized
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#e0e7df] hover:bg-[#f0f4f0] transition-colors cursor-pointer"
              aria-label="User profile options"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2d5a3f] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-semibold text-[#1c2720] block leading-tight truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-[#5e7063] block leading-none">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#e0e7df] p-3 space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 bg-[#f7f9f6] rounded-xl border border-[#e0e7df] space-y-1">
                  <p className="text-xs font-bold text-[#1c2720] truncate">{user.name}</p>
                  <p className="text-[11px] font-mono text-[#5e7063] truncate">{user.email}</p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d8e5d6] text-[#21432f]">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium capitalize">
                      ● {user.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
