import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import {
  Inbox,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, isAvailable, toggleAvailability } = useAuth();
  const { lastEvent } = useSocket();
  const navigate = useNavigate();

  const [pendingOffers, setPendingOffers] = useState<any[]>([]);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [offersRes, bookingsRes, earningsRes] = await Promise.all([
        api.getWorkerOffers('PENDING').catch(() => ({ offers: [] })),
        api.getBookings().catch(() => ({ bookings: [] })),
        api.getEarnings().catch(() => ({ summary: null })),
      ]);

      setPendingOffers(offersRes.offers || []);
      const active = (bookingsRes.bookings || []).filter(
        (b: any) => b.status === 'CONFIRMED' || b.status === 'ON_THE_WAY' || b.status === 'WORK_STARTED'
      );
      setActiveBookings(active);
      setEarningsSummary(earningsRes.summary);
    } catch (err) {
      console.error('Error loading worker dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id, lastEvent]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Availability Status Banner */}
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
            }
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-surface shadow-sm shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal">{user?.name}</h1>
              <span title="Verified Trade Pro">
                <ShieldCheck className="w-5 h-5 text-brand-primary" />
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Service Base: Metro City Central Hub · Trade Pro Account
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase text-gray-400">Current Status</div>
            <div className="text-sm font-extrabold text-charcoal">
              {isAvailable ? 'Online & Ready for Dispatch' : 'Offline / Unavailable'}
            </div>
          </div>
          <button
            onClick={toggleAvailability}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isAvailable
                ? 'bg-brand-surface text-brand-primaryDark border border-brand-secondary/40 hover:bg-brand-surface/80'
                : 'bg-brand-primary text-white hover:bg-brand-primaryDark'
            }`}
          >
            {isAvailable ? 'Go Offline' : 'Go Online Now'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Offers</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-charcoal">{pendingOffers.length}</div>
          <p className="text-[11px] text-gray-500">Unanswered requests</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-brand-surface text-brand-primary flex items-center justify-center font-bold text-xs">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-charcoal">{activeBookings.length}</div>
          <p className="text-[11px] text-gray-500">In-progress or scheduled</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-charcoal">
            {earningsSummary?.completedCount ?? (user?.workerProfile?.completedJobsCount || 0)}
          </div>
          <p className="text-[11px] text-gray-500">Finished service jobs</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earnings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-brand-primary">
            ${earningsSummary?.totalGrossEarnings ?? 0}
          </div>
          <p className="text-[11px] text-gray-500">Authoritative job records</p>
        </div>
      </div>

      {/* Active Service In-Progress Card */}
      {activeBookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-charcoal">Current Active Booking</h2>
          {activeBookings.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-3xl bg-brand-surface border-2 border-brand-secondary/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-6 h-6 text-brand-cream" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-brand-primaryDark border border-brand-secondary/30">
                      {b.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-brand-primary">Agreed Price: ${b.agreedPrice}</span>
                  </div>
                  <h3 className="font-bold text-base text-charcoal mt-0.5">{b.jobRequest?.title}</h3>
                  <p className="text-xs text-gray-600">
                    Customer: <strong className="text-charcoal">{b.customer?.user?.name}</strong> · Address: {b.jobRequest?.addressLabel}, {b.jobRequest?.city}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/bookings')}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>Manage Execution</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Urgent Incoming Job Opportunities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal">New Nearby Job Opportunities</h2>
            <p className="text-xs text-gray-500">
              Dispatched automatically by the Fair Matching Engine based on your trade specialization
            </p>
          </div>
          <Link
            to="/offers"
            className="text-xs font-bold text-brand-primary hover:text-brand-primaryDark flex items-center gap-1"
          >
            <span>View All Inbox ({pendingOffers.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingOffers.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-gray-100 text-center space-y-2">
            <Inbox className="w-10 h-10 text-gray-400 mx-auto" />
            <h4 className="text-sm font-bold text-charcoal">No new job offers right now</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You are currently online. When customers create service requests matching your trade, offers will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOffers.slice(0, 4).map((offer) => {
              const job = offer.jobRequest;
              return (
                <div
                  key={offer.id}
                  className="p-5 rounded-2xl bg-white border border-gray-100 shadow-card hover:border-brand-secondary/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                        {offer.matchScore}% Match
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        {job?.urgency === 'ASAP' ? 'Immediate Dispatch' : 'Scheduled'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-charcoal">{job?.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {job?.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                        <span>{job?.city}</span>
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-charcoal">
                        Budget: {job?.isOpenToQuotes ? 'Open to Quotes' : `$${job?.budgetMin} - $${job?.budgetMax}`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                    <button
                      onClick={() => navigate('/offers')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <span>Review & Submit Quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
