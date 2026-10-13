'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Search, Bell, Check, Clock, ShieldCheck, X } from 'lucide-react';

interface HeaderProps {
  title: string;
  category?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: 'success' | 'info' | 'warning';
}

export function Header({ title, category = 'System', onRefresh, isRefreshing }: HeaderProps) {
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

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
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
    <header className="h-16 bg-white border-b border-[#e2eae1] px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-[11px] text-[#5e7063]">
          <span>Agricultural SaaS</span>
          <span>/</span>
          <span className="capitalize">{category}</span>
          <span>/</span>
          <span className="text-[#2d5a3f] font-medium">{title}</span>
        </div>
        <h2 className="text-lg font-semibold text-[#1c2720] tracking-tight">{title}</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search Input Placeholder */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-[#87986a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records or IDs..."
            className="pl-8 pr-3 py-1.5 text-xs bg-[#f8faf7] border border-[#e2eae1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d5a3f] w-56 text-[#1c2720] placeholder-[#87986a]"
          />
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2eae1] bg-white text-xs font-medium text-[#2d5a3f] hover:bg-[#f0f4f0] transition-colors disabled:opacity-50"
            title="Refresh current data from Redis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
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
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            )}
          </button>

          {/* Dropdown Card */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#e2eae1] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 border-b border-[#e2eae1] flex items-center justify-between bg-[#fafcfa]">
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
                  <div className="p-8 text-center text-xs text-[#5e7063]">
                    No notifications at this time
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-[#fafcfa] ${
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
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-[#1c2720] truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-[#5e7063] shrink-0 ml-2">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5e7063] mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(item.id)}
                        className="text-[#87986a] hover:text-rose-600 p-0.5 transition"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-[#f8faf7] border-t border-[#e2eae1] text-center">
                <span className="text-[10px] text-[#5e7063] font-medium">
                  Redis Event Logs Synchronized
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
