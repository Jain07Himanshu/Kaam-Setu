import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Wrench,
  Clock,
  ArrowRight,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

export const MyRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.getMyRequests();
      setRequests(res.requests || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">My Service Requests</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track incoming worker quotes, negotiations, and booking progress
          </p>
        </div>
        <Link
          to="/request"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all"
        >
          <PlusCircle className="w-4 h-4 text-brand-cream" />
          <span>New Request</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading your requests...</div>
      ) : requests.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-gray-100 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-cream/60 flex items-center justify-center mx-auto text-brand-primary">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-charcoal">You haven't requested a service yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Choose a service category to request verified local trade workers in your neighborhood.
          </p>
          <div className="pt-2">
            <Link
              to="/request"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-sm"
            >
              <span>Create Your First Request</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const quoteCount = req.quotes?.length || 0;
            const isBooked = req.status === 'BOOKED' || req.booking;

            return (
              <div
                key={req.id}
                onClick={() => navigate(`/jobs/${req.id}`)}
                className="p-5 rounded-2xl bg-white border border-gray-100 shadow-card hover:shadow-hover hover:border-brand-secondary/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                      {req.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-brand-primary">
                      {req.serviceCategory?.name}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-charcoal">{req.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{req.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-charcoal flex items-center justify-end gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{quoteCount} {quoteCount === 1 ? 'Quote' : 'Quotes'} Received</span>
                    </div>
                    {isBooked ? (
                      <div className="text-[11px] font-semibold text-brand-primaryDark flex items-center gap-1 justify-end">
                        <CheckCircle className="w-3 h-3 text-brand-primary" />
                        <span>Booked (₹{req.booking?.agreedPrice})</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-400">
                        {req.urgency === 'ASAP' ? 'Immediate dispatch' : 'Scheduled'}
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
