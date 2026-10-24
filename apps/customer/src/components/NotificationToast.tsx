import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Clock, ArrowRight, X } from 'lucide-react';

interface ToastData {
  id: string;
  title: string;
  message: string;
  link?: string;
  type: 'quote' | 'status' | 'booking';
}

export const NotificationToast: React.FC = () => {
  const { lastEvent } = useSocket();
  const [toast, setToast] = useState<ToastData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'quote.created') {
      const q = lastEvent.payload.quote;
      setToast({
        id: Date.now().toString(),
        title: `New Quote Received: $${q.proposedPrice}`,
        message: `${q.worker?.user?.name || 'A verified worker'} sent an offer for your request.`,
        link: `/jobs/${lastEvent.payload.jobRequestId}`,
        type: 'quote',
      });
    } else if (lastEvent.type === 'quote.counteroffered') {
      const q = lastEvent.payload.quote;
      setToast({
        id: Date.now().toString(),
        title: `Counteroffer Received: $${q.proposedPrice}`,
        message: `Worker sent a counteroffer response.`,
        link: `/jobs/${q.jobRequestId}`,
        type: 'quote',
      });
    } else if (lastEvent.type === 'booking.status.updated') {
      const { status, booking } = lastEvent.payload;
      let statusLabel = status;
      if (status === 'ON_THE_WAY') statusLabel = 'Worker is On The Way! 🚗';
      if (status === 'WORK_STARTED') statusLabel = 'Work In Progress 🔨';
      if (status === 'COMPLETED') statusLabel = 'Job Completed! ⭐';

      setToast({
        id: Date.now().toString(),
        title: statusLabel,
        message: `${booking.worker?.user?.name || 'Worker'} updated booking status.`,
        link: `/bookings/${booking.id}`,
        type: 'status',
      });
    } else if (lastEvent.type === 'booking.confirmed') {
      const booking = lastEvent.payload.booking;
      setToast({
        id: Date.now().toString(),
        title: 'Booking Confirmed! 🎉',
        message: `Agreed price: $${booking.agreedPrice}. Start Code: ${booking.startOtp}`,
        link: `/bookings/${booking.id}`,
        type: 'booking',
      });
    }
  }, [lastEvent]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-brand-secondary/40 p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center shrink-0 border border-brand-secondary/20">
          {toast.type === 'quote' ? (
            <Clock className="w-5 h-5 text-brand-primary" />
          ) : toast.type === 'booking' ? (
            <CheckCircle className="w-5 h-5 text-brand-primary" />
          ) : (
            <Bell className="w-5 h-5 text-brand-primary" />
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
              <span>View Details</span>
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
