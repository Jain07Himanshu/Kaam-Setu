import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { DemoSwitcher } from './DemoSwitcher';
import {
  MapPin,
  Bell,
  Wrench,
  Calendar,
  LifeBuoy,
  PlusCircle,
  Menu,
  X,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
  }, [user?.id, lastEvent]);

  const navLinks = [
    { label: 'Explore', path: '/' },
    { label: 'My Requests', path: '/my-requests' },
    { label: 'Bookings', path: '/bookings' },
    { label: 'Support', path: '/support' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Tagline */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-md shadow-brand-primary/20 group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5 text-brand-cream" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-charcoal">
                  Hyper<span className="text-brand-primary">Local</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                  Customer
                </span>
              </div>
              <div className="text-[11px] font-medium text-gray-500 hidden sm:block">
                Your Neighborhood. Connected.
              </div>
            </div>
          </Link>

          {/* Neighborhood Location Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200/80 text-xs text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span className="font-medium text-gray-800">Metro City, NY 10001</span>
            <span className="text-gray-400">·</span>
            <span className="text-brand-primary font-semibold">Downtown Hub</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
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

          {/* Action CTAs & Profile */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/request"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4 text-brand-cream" />
              <span>Request Service</span>
            </Link>

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
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1 animate-in fade-in duration-150">
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
            <div className="pt-2">
              <Link
                to="/request"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-brand-cream" />
                <span>Request a Service</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
