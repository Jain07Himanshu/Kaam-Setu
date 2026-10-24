import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { DemoSwitcher } from './DemoSwitcher';
import {
  HardHat,
  Bell,
  Power,
  Inbox,
  CalendarCheck,
  TrendingUp,
  User,
  LifeBuoy,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAvailable, toggleAvailability } = useAuth();
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
    { label: 'Dashboard', path: '/' },
    { label: 'Job Offers', path: '/offers' },
    { label: 'Bookings', path: '/bookings' },
    { label: 'Earnings', path: '/earnings' },
    { label: 'Profile', path: '/profile' },
    { label: 'Support', path: '/support' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Worker Subtitle */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/logo.jpg"
              alt="Kaam Setu Pro"
              className="w-10 h-10 rounded-xl object-contain shadow-sm border border-brand-secondary/30 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-charcoal">
                  Kaam <span className="text-brand-primary">Setu</span>
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-brand-cream text-brand-primaryDark border border-brand-creamDark">
                  PRO
                </span>
              </div>
              <div className="text-[11px] font-medium text-gray-500 hidden sm:block">
                Your Work, Our Priority
              </div>
            </div>
          </Link>

          {/* Availability Toggle Switch */}
          <div className="flex items-center">
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold shadow-sm ${
                isAvailable
                  ? 'bg-brand-surface text-brand-primaryDark border-brand-secondary/40 hover:bg-brand-surface/80'
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
              title="Toggle Your Availability to receive new requests"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isAvailable ? 'bg-brand-primary animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span>{isAvailable ? 'AVAILABLE (Online)' : 'UNAVAILABLE (Offline)'}</span>
              <Power className="w-3.5 h-3.5 ml-0.5 opacity-60" />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? 'text-brand-primary bg-brand-surface'
                      : 'text-gray-600 hover:text-charcoal hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Tools & Switcher */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl text-gray-600 hover:text-brand-primary hover:bg-gray-50 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Demo Switcher */}
            <DemoSwitcher />

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-gray-100 space-y-1 animate-in fade-in duration-150">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === link.path
                    ? 'text-brand-primary bg-brand-surface font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
