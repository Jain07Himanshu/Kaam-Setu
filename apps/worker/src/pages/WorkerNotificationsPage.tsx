import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Bell, CheckCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export const WorkerNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClickItem = (item: any) => {
    if (!item.readAt) {
      api.markNotificationAsRead(item.id).catch(() => {});
    }

    if (item.relatedEntityType === 'JOB_REQUEST' || item.relatedEntityType === 'QUOTE') {
      navigate('/offers');
    } else if (item.relatedEntityType === 'BOOKING') {
      navigate('/bookings');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Worker Alerts</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time job opportunities, quote acceptances, customer counteroffers, and feedback
          </p>
        </div>

        {notifications.some((n) => !n.readAt) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-brand-primary" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading alerts...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-gray-100 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-surface flex items-center justify-center mx-auto text-brand-primary">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-charcoal">No alerts right now</h3>
          <p className="text-xs text-gray-500">
            Keep your status Online to receive incoming service matches!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => {
            const isUnread = !item.readAt;
            return (
              <div
                key={item.id}
                onClick={() => handleClickItem(item)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-brand-surface/40 border-brand-secondary/30 ring-1 ring-brand-primary/20 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnread ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-charcoal">{item.title}</h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.message}</p>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
