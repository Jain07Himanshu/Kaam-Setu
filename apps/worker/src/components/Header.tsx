import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { DemoSwitcher } from './DemoSwitcher';
import {
  Bell,
  Power,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Inbox,
  CalendarCheck,
  ShieldCheck,
  IndianRupee,
  Award,
  FileCheck2,
  TrendingUp,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAvailable, toggleAvailability, logout } = useAuth();
  const { lastEvent } = useSocket();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const fetchUnread = async () => {
    try {
      const res = await api.getNotifications();
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [user?.id, lastEvent]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleToggle = async () => {
    setIsToggling(true);
    await toggleAvailability();
    setIsToggling(false);
  };

  const navGroups = [
    {
      groupTitle: 'TRADE DISPATCH',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Job Offers Inbox', path: '/offers', icon: Inbox },
        { label: 'Active Bookings', path: '/bookings', icon: CalendarCheck },
      ],
    },
    {
      groupTitle: 'VERIFICATION & CREDIBILITY',
      items: [
        { label: 'Verification Centre', path: '/verification', icon: ShieldCheck, badge: 'Tier 3' },
        { label: 'Visiting Charges', path: '/visiting-charges', icon: IndianRupee },
        { label: 'RPL & Badges', path: '/rpl-and-badges', icon: Award },
        { label: 'Rights Charter', path: '/terms-charter', icon: FileCheck2 },
      ],
    },
    {
      groupTitle: 'FINANCES & PROFILE',
      items: [
        { label: 'Gross Earnings', path: '/earnings', icon: TrendingUp },
        { label: 'Trade Profile', path: '/profile', icon: UserIcon },
        { label: 'Notifications', path: '/notifications', icon: Bell, count: unreadCount },
      ],
    },
  ];

  const tradeName = user?.workerProfile?.workerServices?.[0]?.serviceCategory?.name || 'Trade Specialist';

  return (
    <>
      {/* ============================================================ */}
      {/* 1. MOBILE TOP HEADER BAR (< lg)                              */}
      {/* ============================================================ */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Open Navigation Sidebar"
          >
            <Menu className="w-5 h-5 text-charcoal" />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Kaam Setu Pro" className="w-8 h-8 rounded-lg object-contain shadow-2xs border border-brand-secondary/30" />
            <div className="flex items-center gap-1">
              <span className="font-black text-lg tracking-tight text-charcoal">
                Kaam<span className="text-brand-primary">Setu</span>
              </span>
              <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-brand-cream text-brand-primaryDark border border-brand-creamDark">
                PRO
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Availability Badge on Mobile */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'}`} />
            <span>{isAvailable ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {/* Notifications Bell */}
          <Link
            to="/notifications"
            className="relative p-1.5 rounded-lg text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar Profile Link */}
          <Link to="/profile" title="My Profile">
            <img
              src={user?.avatarUrl || '/avatars/suresh.svg'}
              alt={user?.name || 'Profile'}
              className="w-7 h-7 rounded-lg object-cover bg-brand-surface border border-brand-secondary/30"
            />
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MOBILE SLIDE-OVER DRAWER BACKDROP & PANEL                 */}
      {/* ============================================================ */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-over Content */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Top */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                <img src="/logo.jpg" alt="Kaam Setu Pro" className="w-8 h-8 rounded-lg object-contain border border-brand-secondary/30" />
                <span className="font-black text-lg tracking-tight text-charcoal">
                  Kaam<span className="text-brand-primary">Setu</span> <span className="text-xs text-amber-600">PRO</span>
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Middle Menu */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
              {/* Availability Toggle Box */}
              <button
                onClick={handleToggle}
                disabled={isToggling}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all shadow-xs ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'}`} />
                  <div className="text-left">
                    <div className="text-xs font-black">{isAvailable ? 'ONLINE (Ready for Jobs)' : 'OFFLINE (Paused)'}</div>
                    <div className="text-[10px] text-gray-500">{isAvailable ? 'Visible for dispatch' : 'Tap to go online'}</div>
                  </div>
                </div>
                <Power className="w-4 h-4 opacity-70" />
              </button>

              {/* Navigation Items */}
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-2.5">
                    {group.groupTitle}
                  </div>
                  {group.items.map((link: any) => {
                    const isActive = location.pathname === link.path;
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-brand-surface text-brand-primary font-black shadow-2xs border-l-4 border-brand-primary'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-charcoal'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`} />
                          <span>{link.label}</span>
                        </div>
                        {link.badge && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                            {link.badge}
                          </span>
                        )}
                        {typeof link.count === 'number' && link.count > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-brand-primary text-white">
                            {link.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drawer Bottom */}
            <div className="p-3 border-t border-gray-100 space-y-2.5 bg-gray-50/50">
              <div className="pt-1">
                <DemoSwitcher />
              </div>

              {/* User Card */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <img
                    src={user?.avatarUrl || '/avatars/suresh.svg'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-charcoal truncate">{user?.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{tradeName}</div>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. DESKTOP FULL-HEIGHT LEFT SIDEBAR (lg:flex)                */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-gray-100/90 h-screen sticky top-0 flex-col justify-between shrink-0 z-30 shadow-xs">
        {/* Top Header & Brand */}
        <div className="p-5 border-b border-gray-100/80 space-y-3.5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.jpg"
              alt="Kaam Setu Pro"
              className="w-10 h-10 rounded-xl object-contain shadow-2xs border border-brand-secondary/30 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-charcoal">
                  Kaam<span className="text-brand-primary">Setu</span>
                </span>
                <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-brand-cream text-brand-primaryDark border border-brand-creamDark">
                  PRO
                </span>
              </div>
              <div className="text-[10px] font-medium text-gray-400 -mt-0.5">
                Trade Partner Portal
              </div>
            </div>
          </Link>

          {/* Interactive Availability Toggle Card */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all shadow-xs ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/80'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
            title="Toggle your availability for instant job matching"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'}`} />
              <div className="text-left">
                <div className="text-xs font-black">{isAvailable ? 'ONLINE (Ready)' : 'OFFLINE (Paused)'}</div>
                <div className="text-[10px] text-gray-500">{isAvailable ? 'Receiving job offers' : 'Click to go online'}</div>
              </div>
            </div>
            <Power className="w-4 h-4 opacity-70" />
          </button>
        </div>

        {/* Middle Navigation Menu Groups */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 no-scrollbar">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-3 pb-1">
                {group.groupTitle}
              </div>
              {group.items.map((link: any) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-surface text-brand-primary font-black shadow-2xs border-l-4 border-brand-primary'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-charcoal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`} />
                      <span>{link.label}</span>
                    </div>

                    {link.badge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                        {link.badge}
                      </span>
                    )}

                    {typeof link.count === 'number' && link.count > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-primary text-white animate-pulse">
                        {link.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Switcher, User & Logout Footer */}
        <div className="p-3.5 border-t border-gray-100 space-y-3 bg-gray-50/60">
          {/* Demo User Switcher Dropdown */}
          <div className="w-full">
            <DemoSwitcher />
          </div>

          {/* User Profile Card & Logout */}
          <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 min-w-0 group flex-1"
              title="View & Edit Trade Profile"
            >
              <img
                src={user?.avatarUrl || '/avatars/suresh.svg'}
                alt={user?.name}
                className="w-9 h-9 rounded-xl object-cover bg-white border border-gray-200 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-charcoal truncate group-hover:text-brand-primary transition-colors">
                  {user?.name}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {tradeName}
                </div>
              </div>
            </Link>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
              title="Log Out of Kaam Setu Pro"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
