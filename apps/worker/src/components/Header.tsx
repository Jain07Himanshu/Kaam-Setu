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

  const handleToggle = async () => {
    setIsToggling(true);
    await toggleAvailability();
    setIsToggling(false);
  };

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Offers', path: '/offers', icon: Inbox },
    { label: 'Bookings', path: '/bookings', icon: CalendarCheck },
    { label: 'Verification', path: '/verification', icon: ShieldCheck },
    { label: 'Visiting Fee', path: '/visiting-charges', icon: IndianRupee },
    { label: 'RPL & Badges', path: '/rpl-and-badges', icon: Award },
    { label: 'Rights', path: '/terms-charter', icon: FileCheck2 },
    { label: 'Earnings', path: '/earnings', icon: TrendingUp },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* ============================================================ */}
          {/* LEFT SECTION: Brand Logo + Availability + Left-Aligned Links */}
          {/* ============================================================ */}
          <div className="flex items-center gap-2 lg:gap-3.5 min-w-0">
            {/* Logo & Pro Tagline */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <img
                src="/logo.jpg"
                alt="Kaam Setu Pro"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain shadow-2xs border border-brand-secondary/30 group-hover:scale-105 transition-transform"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="font-black text-lg tracking-tight text-charcoal">
                    Kaam<span className="text-brand-primary">Setu</span>
                  </span>
                  <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-brand-cream text-brand-primaryDark border border-brand-creamDark">
                    PRO
                  </span>
                </div>
                <div className="text-[10px] font-medium text-gray-400 -mt-0.5 leading-none">
                  Trade Partner Portal
                </div>
              </div>
            </Link>

            {/* Availability Toggle Switch */}
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-bold shadow-2xs shrink-0 ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
              title="Toggle your availability for instant job matching"
            >
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span className="hidden md:inline">{isAvailable ? 'ONLINE (Ready)' : 'OFFLINE'}</span>
              <span className="md:hidden">{isAvailable ? 'ON' : 'OFF'}</span>
              <Power className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Left-Aligned Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'text-brand-primary bg-brand-surface font-extrabold shadow-2xs'
                        : 'text-gray-600 hover:text-charcoal hover:bg-gray-100/70'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 opacity-80" />}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ============================================================ */}
          {/* RIGHT SECTION: Profile Pill + Switcher + Tools + Logout      */}
          {/* ============================================================ */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Profile User Pill (Direct Quick Link to Profile) */}
            <Link
              to="/profile"
              className={`flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all shrink-0 ${
                location.pathname === '/profile'
                  ? 'bg-brand-surface border-brand-primary/40 text-brand-primaryDark font-bold ring-1 ring-brand-primary/20'
                  : 'bg-gray-50/80 hover:bg-gray-100/80 border-gray-200/80 text-gray-700 font-semibold'
              }`}
              title="View & Edit Worker Trade Profile"
            >
              <img
                src={user?.avatarUrl || '/avatars/suresh.svg'}
                alt={user?.name || 'Profile'}
                className="w-6 h-6 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
              />
              <span className="text-xs hidden sm:inline max-w-[85px] truncate">
                {user?.name?.split(' ')[0] || 'Profile'}
              </span>
            </Link>

            {/* Notifications Bell */}
            <Link
              to="/notifications"
              className="relative p-1.5 sm:p-2 rounded-xl text-gray-600 hover:text-brand-primary hover:bg-gray-50 transition-colors shrink-0"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Demo Switcher */}
            <div className="shrink-0">
              <DemoSwitcher />
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 shrink-0"
              title="Log Out of Kaam Setu Pro"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold hidden 2xl:inline">Logout</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Mobile Navigation Drawer                                     */}
        {/* ============================================================ */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-gray-100 space-y-1 animate-in fade-in duration-150">
            {/* User Profile Mini Banner in Drawer */}
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-brand-surface/60 border border-brand-secondary/30 mb-2"
            >
              <img
                src={user?.avatarUrl || '/avatars/suresh.svg'}
                alt={user?.name}
                className="w-10 h-10 rounded-xl object-cover bg-white border border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-charcoal truncate">{user?.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{user?.email}</div>
                <span className="text-[10px] font-bold text-brand-primary">View Full Trade Profile ➔</span>
              </div>
            </Link>

            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                    location.pathname === link.path
                      ? 'text-brand-primary bg-brand-surface font-extrabold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-brand-primary" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
