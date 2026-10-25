import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const EarningsPage: React.FC = () => {
  const [data, setData] = useState<{ summary: any; completedBookings: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = async () => {
    try {
      const res = await api.getEarnings();
      setData(res);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const summary = data?.summary || { totalGrossEarnings: 0, completedCount: 0, averageJobValue: 0 };
  const completedBookings = data?.completedBookings || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Earnings & Completed Jobs</h1>
        <p className="text-xs text-gray-500 mt-1">
          Authoritative earnings derived directly from completed service records in the central database
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-brand-surface border border-brand-secondary/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-primaryDark text-xs font-bold uppercase tracking-wider">
            <span>Total Gross Earnings</span>
            <DollarSign className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="text-3xl font-black text-brand-primaryDark">₹{summary.totalGrossEarnings}</div>
          <p className="text-[11px] text-gray-500">100% of agreed quotes retained</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
            <span>Completed Jobs</span>
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-charcoal">{summary.completedCount}</div>
          <p className="text-[11px] text-gray-500">Verified customer completions</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
            <span>Average Job Payout</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-charcoal">₹{summary.averageJobValue}</div>
          <p className="text-[11px] text-gray-500">Average ticket across completed trades</p>
        </div>
      </div>

      {/* Itemized Completed Jobs History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-charcoal">Completed Work History</h2>

        {isLoading ? (
          <div className="py-10 text-center text-xs text-gray-500">Loading records...</div>
        ) : completedBookings.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-gray-100 text-center space-y-2">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-charcoal">No completed jobs yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              When you complete bookings and verify the start OTP with customers, your recorded payouts will be tallied here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
            <div className="divide-y divide-gray-100">
              {completedBookings.map((b) => (
                <div key={b.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Completed
                      </span>
                      <span className="text-xs font-semibold text-charcoal">
                        {b.jobRequest?.serviceCategory?.name}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">
                        {b.completedAt ? new Date(b.completedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-charcoal">{b.jobRequest?.title}</h4>
                    <p className="text-xs text-gray-500">
                      Customer: {b.customer?.user?.name || 'Neighborhood Resident'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-brand-primary">+₹{b.agreedPrice}</div>
                    <div className="text-[10px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
