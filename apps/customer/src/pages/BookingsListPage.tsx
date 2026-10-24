import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  Star,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const BookingsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await api.getBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">My Service Bookings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review active service progress, technician details, and completed job history
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-gray-100 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-cream/60 flex items-center justify-center mx-auto text-brand-primary">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-charcoal">No confirmed bookings yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Once you accept a quote from a local worker, your confirmed booking and arrival tracker will appear here.
          </p>
          <div className="pt-2">
            <Link
              to="/my-requests"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-sm"
            >
              <span>View Open Requests & Quotes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const isCompleted = b.status === 'COMPLETED';
            const isActive = b.status === 'ON_THE_WAY' || b.status === 'WORK_STARTED' || b.status === 'CONFIRMED';

            return (
              <div
                key={b.id}
                onClick={() => navigate(`/bookings/${b.id}`)}
                className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-brand-primary/40 ring-1 ring-brand-primary/20 shadow-md'
                    : 'border-gray-100 shadow-sm hover:border-gray-200'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-brand-surface text-brand-primaryDark border border-brand-secondary/30'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {b.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-charcoal">
                      {b.jobRequest?.serviceCategory?.name}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-charcoal">{b.jobRequest?.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    Assigned: <strong className="text-charcoal">{b.worker?.user?.name}</strong> · {b.agreedScope}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black text-brand-primary">${b.agreedPrice}</div>
                    {isActive && (
                      <div className="text-[11px] font-semibold text-brand-primaryDark">
                        Start Code: <strong className="tracking-wider">{b.startOtp}</strong>
                      </div>
                    )}
                    {isCompleted && b.review && (
                      <div className="text-[11px] text-amber-600 font-bold flex items-center justify-end gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{b.review.rating}★ Rated</span>
                      </div>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
