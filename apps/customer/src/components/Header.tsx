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
  LogOut,
  HardHat,
  User as UserIcon,
  Shield,
  FileText,
  PhoneCall,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
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
    { label: 'Explore', path: '/', icon: Wrench },
    { label: 'My Requests', path: '/my-requests', icon: FileText },
    { label: 'Bookings', path: '/bookings', icon: Calendar },
    { label: 'Emergency', path: '/emergency-contacts', icon: Shield },
    { label: 'Safety Hub', path: '/safety-centre', icon: LifeBuoy },
    { label: 'Care', path: '/customer-care', icon: PhoneCall },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ];

  const defaultLoc = user?.serviceLocations?.find((l: any) => l.isDefault) || user?.serviceLocations?.[0];
  const userCity = defaultLoc?.city || 'Mumbai';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* ============================================================ */}
          {/* LEFT SECTION: Brand Logo + Location + Left-Aligned Nav Links */}
          {/* ============================================================ */}
          <div className="flex items-center gap-2 lg:gap-3.5 min-w-0">
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <img
                src="/logo.jpg"
                alt="Kaam Setu"
                className="h-9 sm:h-10 w-auto object-contain rounded-xl shadow-2xs group-hover:scale-105 transition-transform"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="font-black text-lg tracking-tight text-charcoal">
                    Kaam<span className="text-brand-primary">Setu</span>
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                    Customer
                  </span>
                </div>
                <div className="text-[10px] font-medium text-gray-400 -mt-0.5 leading-none">
                  Your Work, Our Priority
                </div>
              </div>
            </Link>

            {/* Compact Location Pill */}
            <div className="hidden 2xl:flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200/80 text-[11px] text-gray-600 shrink-0">
              <MapPin className="w-3 h-3 text-brand-primary shrink-0" />
              <span className="font-semibold text-gray-800">{userCity}</span>
              <span className="text-gray-300">·</span>
              <span className="text-brand-primary font-bold">Hub</span>
            </div>

            {/* Left-Aligned Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
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
          {/* RIGHT SECTION: Profile Pill + CTAs + Demo Switcher + Logout   */}
          {/* ============================================================ */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Request Service CTA */}
            <Link
              to="/request"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-brand-cream" />
              <span className="hidden xs:inline">Request Service</span>
              <span className="xs:hidden">Request</span>
            </Link>

            {/* Profile User Pill (Direct Quick Link to Profile) */}
            <Link
              to="/profile"
              className={`flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all shrink-0 ${
                location.pathname === '/profile'
                  ? 'bg-brand-surface border-brand-primary/40 text-brand-primaryDark font-bold ring-1 ring-brand-primary/20'
                  : 'bg-gray-50/80 hover:bg-gray-100/80 border-gray-200/80 text-gray-700 font-semibold'
              }`}
              title="View & Edit My Profile"
            >
              <img
                src={user?.avatarUrl || '/avatars/aarav.svg'}
                alt={user?.name || 'Profile'}
                className="w-6 h-6 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
              />
              <span className="text-xs hidden sm:inline max-w-[90px] truncate">
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

            {/* Quick Switch to Worker Pro View */}
            <button
              onClick={() => switchDemoUser('suresh.plumber@kaamsetu.demo')}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-cream/80 hover:bg-brand-cream border border-brand-creamDark text-brand-primaryDark text-xs font-bold transition-all shadow-2xs shrink-0 whitespace-nowrap"
              title="Experience Kaam Setu as a Trade Professional"
            >
              <HardHat className="w-3.5 h-3.5 text-brand-primary" />
              <span>Worker Pro View</span>
            </button>

            {/* Demo Switcher */}
            <div className="shrink-0">
              <DemoSwitcher />
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 shrink-0"
              title="Log Out of Kaam Setu"
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
                src={user?.avatarUrl || '/avatars/aarav.svg'}
                alt={user?.name}
                className="w-10 h-10 rounded-xl object-cover bg-white border border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-charcoal truncate">{user?.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{user?.email}</div>
                <span className="text-[10px] font-bold text-brand-primary">View Full Profile ➔</span>
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

            <div className="pt-2 space-y-2 border-t border-gray-100">
              <Link
                to="/request"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-brand-cream" />
                <span>Request a Service</span>
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  switchDemoUser('suresh.plumber@kaamsetu.demo');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-cream border border-brand-creamDark text-brand-primaryDark text-xs font-bold"
              >
                <HardHat className="w-3.5 h-3.5 text-brand-primary" />
                <span>Switch to Worker Pro View (Suresh Kumar)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
