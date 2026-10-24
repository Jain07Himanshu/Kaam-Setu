import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle, Bell, ArrowRight, X, DollarSign } from 'lucide-react';

interface WorkerToastData {
  id: string;
  title: string;
  message: string;
  link?: string;
  type: 'offer' | 'counter' | 'booking';
}

export const NotificationToast: React.FC = () => {
  const { lastEvent } = useSocket();
  const [toast, setToast] = useState<WorkerToastData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'job.offer.created') {
      const offer = lastEvent.payload.offer;
      setToast({
        id: Date.now().toString(),
        title: 'New Service Opportunity nearby! ⚡',
        message: `"${offer.jobRequest?.title || 'Service Request'}" - Match Score: ${lastEvent.payload.matchScore}%`,
        link: '/offers',
        type: 'offer',
      });
    } else if (lastEvent.type === 'quote.counteroffered') {
      const q = lastEvent.payload.quote;
      setToast({
        id: Date.now().toString(),
        title: 'Customer Counteroffer Received! 💬',
        message: `Counter proposed at ₹${q.proposedPrice}. Review & reply in Job Offers.`,
        link: '/offers',
        type: 'counter',
      });
    } else if (lastEvent.type === 'quote.accepted' || lastEvent.type === 'booking.confirmed') {
      setToast({
        id: Date.now().toString(),
        title: 'Quote Accepted! Booking Confirmed 🎉',
        message: `Customer accepted your quote. Ready for dispatch.`,
        link: '/bookings',
        type: 'booking',
      });
    }
  }, [lastEvent]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-brand-primary/40 p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center shrink-0 border border-brand-secondary/30">
          {toast.type === 'offer' ? (
            <Zap className="w-5 h-5 text-brand-primary" />
          ) : toast.type === 'booking' ? (
            <CheckCircle className="w-5 h-5 text-brand-primary" />
          ) : (
            <DollarSign className="w-5 h-5 text-brand-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-charcoal truncate">{toast.title}</h4>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toast.message}</p>

          {toast.link && (
            <button
              onClick={() => {
                navigate(toast.link!);
                setToast(null);
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primaryDark transition-colors"
            >
              <span>View In App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setToast(null)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
