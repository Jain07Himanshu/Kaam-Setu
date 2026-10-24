import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Wrench,
  Zap,
  Sparkles,
  Settings,
  Hammer,
  Paintbrush,
  Wind,
  Utensils,
  Search,
  ArrowRight,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Wrench,
  Zap,
  Sparkles,
  Settings,
  Hammer,
  Paintbrush,
  Wind,
  Utensils,
};

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, reqRes, bookRes] = await Promise.all([
          api.getCategories(),
          api.getMyRequests().catch(() => ({ requests: [] })),
          api.getBookings().catch(() => ({ bookings: [] })),
        ]);

        setCategories(catRes.categories || []);
        setRecentRequests(reqRes.requests?.slice(0, 3) || []);

        // Find any active booking in progress
        const active = bookRes.bookings?.find(
          (b: any) => b.status === 'CONFIRMED' || b.status === 'ON_THE_WAY' || b.status === 'WORK_STARTED'
        );
        setActiveBooking(active || null);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Active Booking Banner (if exists) */}
      {activeBooking && (
        <div className="p-5 rounded-2xl bg-brand-surface border-2 border-brand-secondary/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center text-white shrink-0">
              <Clock className="w-6 h-6 text-brand-cream animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primaryDark px-2 py-0.5 rounded-full bg-white border border-brand-secondary/30">
                  {activeBooking.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-gray-500">Service in progress</span>
              </div>
              <h3 className="font-bold text-base text-charcoal mt-0.5">
                {activeBooking.jobRequest?.title || 'Active Service Booking'}
              </h3>
              <p className="text-xs text-gray-600">
                Assigned Pro: <span className="font-semibold text-charcoal">{activeBooking.worker?.user?.name}</span> · Agreed: ₹{activeBooking.agreedPrice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Verification OTP</div>
              <div className="text-lg font-black tracking-widest text-brand-primary">{activeBooking.startOtp}</div>
            </div>
            <button
              onClick={() => navigate(`/bookings/${activeBooking.id}`)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>Track Live Service</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-brand-primaryDark to-[#16430a] text-white p-8 md:p-12 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-brand-cream text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-brand-secondary" />
            <span>Trusted & Verified Local Neighborhood Trade Pros</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Reliable household services, right around the corner.
          </h1>

          <p className="text-sm md:text-base text-brand-cream/90 leading-relaxed max-w-xl">
            Create a request, receive fast transparent quotes from verified local workers, negotiate fairly, and track your job in real time.
          </p>

          {/* Search Bar */}
          <div className="pt-2">
            <div className="flex items-center bg-white rounded-2xl shadow-lg p-1.5 max-w-lg border-2 border-white/10">
              <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="What service do you need? (e.g. Plumbing, Cleaning)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm text-charcoal outline-none placeholder:text-gray-400"
              />
              <button
                onClick={() => navigate('/request')}
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold transition-colors shrink-0"
              >
                Request
              </button>
            </div>
          </div>
        </div>

        {/* Decorative background glow accents */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 rounded-full bg-brand-secondary/20 blur-3xl pointer-events-none" />
        <div className="absolute right-12 top-6 w-32 h-32 rounded-full bg-brand-cream/10 blur-2xl pointer-events-none" />
      </div>

      {/* Popular Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">Household Service Categories</h2>
            <p className="text-xs text-gray-500">Select a category to see local estimates and request service</p>
          </div>
          <Link
            to="/request"
            className="text-xs font-bold text-brand-primary hover:text-brand-primaryDark flex items-center gap-1"
          >
            <span>Custom Request</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const IconComponent = iconMap[cat.icon] || Wrench;
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/request?category=${cat.id}`)}
                className="group p-5 rounded-2xl bg-white border border-gray-100 shadow-card hover:shadow-hover hover:border-brand-secondary/40 transition-all cursor-pointer relative flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand-surface group-hover:bg-brand-primary flex items-center justify-center text-brand-primary group-hover:text-white transition-colors mb-3">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-charcoal group-hover:text-brand-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400">
                    Est. from <span className="text-brand-primaryDark font-bold">₹{cat.basePriceEstimate || 299}</span>
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-brand-primary group-hover:text-white flex items-center justify-center text-gray-400 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Requests Section (if customer has previous or current requests) */}
      {recentRequests.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal">Your Recent Requests</h2>
            <Link
              to="/my-requests"
              className="text-xs font-bold text-brand-primary hover:text-brand-primaryDark flex items-center gap-1"
            >
              <span>View All Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => navigate(`/jobs/${req.id}`)}
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-brand-secondary/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark">
                    {req.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-charcoal truncate">{req.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{req.description}</p>
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-brand-primary">
                  <span>{req.quotes?.length || 0} quotes received</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust & Platform Charter Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-brand-surface flex items-center justify-center text-brand-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-charcoal">Mutually Verified Service</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Every booking includes a 4-digit start OTP provided exclusively to you. The worker cannot mark work started until you give them the code.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-cream/40 border border-brand-creamDark shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center text-brand-primaryDark">
            <Star className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-charcoal">Real-Time Quotes & Negotiation</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Receive itemized price quotes directly from local specialists. Accept or send counteroffers without waiting for phone calls.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-beige/30 border border-brand-beigeDark shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-brand-beige flex items-center justify-center text-brand-primaryDark">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-charcoal">Fair Neighborhood Pricing</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Zero hidden broker fees. Workers keep what they quote and you get transparent upfront pricing with clear inclusions and exclusions.
          </p>
        </div>
      </div>
    </div>
  );
};
