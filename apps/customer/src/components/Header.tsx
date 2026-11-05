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
  Compass,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
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

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navGroups = [
    {
      groupTitle: 'SERVICE DISCOVERY',
      items: [
        { label: 'Explore Services', path: '/', icon: Compass },
        { label: 'My Requests', path: '/my-requests', icon: FileText },
        { label: 'Bookings & Orders', path: '/bookings', icon: Calendar },
      ],
    },
    {
      groupTitle: 'SAFETY & SUPPORT',
      items: [
        { label: 'Emergency Contacts', path: '/emergency-contacts', icon: ShieldAlert, badge: 'Max 3' },
        { label: 'Safety Hub (SOS)', path: '/safety-centre', icon: LifeBuoy, badge: '24/7' },
        { label: 'Customer Care', path: '/customer-care', icon: PhoneCall },
      ],
    },
    {
      groupTitle: 'ACCOUNT & ALERTS',
      items: [
        { label: 'Profile & Details', path: '/profile', icon: UserIcon },
        {
          label: 'Notifications',
          path: '/notifications',
          icon: Bell,
          count: unreadCount,
        },
      ],
    },
  ];

  const defaultLoc = user?.serviceLocations?.find((l: any) => l.isDefault) || user?.serviceLocations?.[0];
  const userCity = defaultLoc?.city || 'Mumbai';
  const userAddress = defaultLoc?.address || 'Powai, Mumbai 400076';

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
            <img src="/logo.jpg" alt="Kaam Setu" className="h-8 w-auto object-contain rounded-lg shadow-2xs" />
            <div className="flex items-center gap-1">
              <span className="font-black text-lg tracking-tight text-charcoal">
                Kaam<span className="text-brand-primary">Setu</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                Customer
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Request Button on Mobile */}
          <Link
            to="/request"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-primary text-white text-[11px] font-bold shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Request</span>
          </Link>

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
              src={user?.avatarUrl || '/avatars/aarav.svg'}
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
                <img src="/logo.jpg" alt="Kaam Setu" className="h-8 w-auto object-contain rounded-lg" />
                <span className="font-black text-lg tracking-tight text-charcoal">
                  Kaam<span className="text-brand-primary">Setu</span>
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
              {/* Request CTA */}
              <Link
                to="/request"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-black shadow-md shadow-brand-primary/20 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-brand-cream" />
                <span>Request a Service</span>
              </Link>

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
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
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
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  switchDemoUser('suresh.plumber@kaamsetu.demo');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-cream border border-brand-creamDark text-brand-primaryDark text-xs font-bold"
              >
                <HardHat className="w-4 h-4 text-brand-primary" />
                <span>Switch to Worker Pro View</span>
              </button>

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
                    src={user?.avatarUrl || '/avatars/aarav.svg'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-charcoal truncate">{user?.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
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
              alt="Kaam Setu"
              className="h-10 w-auto object-contain rounded-xl shadow-2xs group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-charcoal">
                  Kaam<span className="text-brand-primary">Setu</span>
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                  Customer
                </span>
              </div>
              <div className="text-[10px] font-medium text-gray-400 -mt-0.5">
                Your Work, Our Priority
              </div>
            </div>
          </Link>

          {/* Neighborhood Location Indicator */}
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-gray-800 text-[11px] truncate">{userCity} Dispatch Hub</div>
              <div className="text-[10px] text-gray-400 truncate">{userAddress}</div>
            </div>
          </div>

          {/* Primary Action CTA */}
          <Link
            to="/request"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-black shadow-md shadow-brand-primary/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4 text-brand-cream" />
            <span>Request a Service</span>
          </Link>
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
          {/* Switch to Worker Pro View */}
          <button
            onClick={() => switchDemoUser('suresh.plumber@kaamsetu.demo')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-cream/80 hover:bg-brand-cream border border-brand-creamDark text-brand-primaryDark text-xs font-bold transition-all shadow-2xs"
            title="Experience Kaam Setu as a Trade Professional"
          >
            <HardHat className="w-3.5 h-3.5 text-brand-primary" />
            <span>Worker Pro View</span>
          </button>

          {/* Demo User Switcher Dropdown */}
          <div className="w-full">
            <DemoSwitcher />
          </div>

          {/* User Profile Card & Logout */}
          <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 min-w-0 group flex-1"
              title="View & Edit My Profile"
            >
              <img
                src={user?.avatarUrl || '/avatars/aarav.svg'}
                alt={user?.name}
                className="w-9 h-9 rounded-xl object-cover bg-white border border-gray-200 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-charcoal truncate group-hover:text-brand-primary transition-colors">
                  {user?.name}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </Link>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
              title="Log Out of Kaam Setu"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
