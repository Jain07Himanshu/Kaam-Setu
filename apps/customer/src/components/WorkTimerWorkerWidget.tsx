import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Hourglass,
  ShieldAlert,
  Calendar,
  X,
  Send,
} from 'lucide-react';

interface WorkTimerWorkerWidgetProps {
  bookingId: string;
  isWorkStarted: boolean;
  onRefreshBooking?: () => void;
}

export const WorkTimerWorkerWidget: React.FC<WorkTimerWorkerWidgetProps> = ({
  bookingId,
  isWorkStarted,
  onRefreshBooking,
}) => {
  const { lastEvent } = useSocket();
  const [timerData, setTimerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Extension Modal State
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extHours, setExtHours] = useState(0);
  const [extMinutes, setExtMinutes] = useState(30);
  const [extReason, setExtReason] = useState('Additional repair work required on site');
  const [submittingExtension, setSubmittingExtension] = useState(false);
  const [extensionFeedback, setExtensionFeedback] = useState<string | null>(null);

  // New Cycle Modal State
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);
  const [newCycleHours, setNewCycleHours] = useState(1);
  const [newCycleMinutes, setNewCycleMinutes] = useState(0);
  const [submittingNewCycle, setSubmittingNewCycle] = useState(false);

  const fetchTimer = async () => {
    try {
      const data = await api.getBookingTimerStatus(bookingId);
      setTimerData(data);
    } catch (err) {
      console.error('Failed to load work timer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWorkStarted) {
      fetchTimer();
    }
  }, [bookingId, isWorkStarted]);

  // Socket listener
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === 'booking.timer.started' ||
      lastEvent.type === 'booking.timer.expired' ||
      lastEvent.type === 'booking.timer.extension.requested' ||
      lastEvent.type === 'booking.timer.extension.approved' ||
      lastEvent.type === 'booking.timer.extension.rejected' ||
      lastEvent.type === 'booking.safety.alert.acknowledged' ||
      lastEvent.type === 'booking.safety.escalated'
    ) {
      fetchTimer();
    }
  }, [lastEvent]);

  // Local 1-second countdown clock
  useEffect(() => {
    if (!timerData?.currentTimer || timerData.currentTimer.status !== 'ACTIVE') {
      setRemainingSeconds(null);
      return;
    }

    const targetTime = new Date(timerData.currentTimer.expectedCompletionAt).getTime();

    const updateRemaining = () => {
      const now = Date.now();
      const diffSec = Math.floor((targetTime - now) / 1000);
      if (diffSec <= 0) {
        setRemainingSeconds(0);
        fetchTimer();
      } else {
        setRemainingSeconds(diffSec);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [timerData?.currentTimer]);

  if (!isWorkStarted) return null;

  if (loading) {
    return <div className="text-xs text-gray-400 py-2">Loading timer data...</div>;
  }

  const currentTimer = timerData?.currentTimer;
  const hasActiveTimer = currentTimer && currentTimer.status === 'ACTIVE';
  const isExpired = currentTimer && currentTimer.status === 'EXPIRED';
  const isSafeAcknowledged = currentTimer && currentTimer.status === 'ACKNOWLEDGED';
  const pendingExtension = timerData?.pendingExtension;
  const isEscalated = timerData?.isEscalated;

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRequestExtension = async () => {
    const totalMins = extHours * 60 + extMinutes;
    if (totalMins <= 0) {
      setExtensionFeedback('Extension time must be greater than 0 minutes');
      return;
    }
    if (!extReason.trim()) {
      setExtensionFeedback('Please enter a reason for the extension');
      return;
    }

    setSubmittingExtension(true);
    setExtensionFeedback(null);
    try {
      await api.requestTimerExtension(bookingId, {
        totalAdditionalMinutes: totalMins,
        reason: extReason.trim(),
      });
      setIsExtensionModalOpen(false);
      fetchTimer();
    } catch (err: any) {
      setExtensionFeedback(err.message || 'Failed to submit extension request');
    } finally {
      setSubmittingExtension(false);
    }
  };

  const handleSetNewCycle = async () => {
    const totalMins = newCycleHours * 60 + newCycleMinutes;
    if (totalMins <= 0) return;

    setSubmittingNewCycle(true);
    try {
      await api.resetTimerCycle(bookingId, { durationMinutes: totalMins });
      setIsNewCycleModalOpen(false);
      fetchTimer();
      if (onRefreshBooking) onRefreshBooking();
    } catch (err: any) {
      alert(err.message || 'Failed to establish new duration');
    } finally {
      setSubmittingNewCycle(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-brand-surface/60 border-2 border-brand-primary/30 space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-brand-secondary/30 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-primary" />
          <span className="font-extrabold text-xs text-brand-primaryDark uppercase tracking-wider">
            Work Duration & Safety Monitoring
          </span>
        </div>

        {hasActiveTimer && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wide">
            TIMER ACTIVE
          </span>
        )}
        {isExpired && !isSafeAcknowledged && (
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wide animate-pulse">
            DURATION EXPIRED
          </span>
        )}
        {isSafeAcknowledged && (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wide">
            CUSTOMER SAFE
          </span>
        )}
        {isEscalated && (
          <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wide animate-bounce">
            SOS ESCALATED
          </span>
        )}
      </div>

      {/* Main Timer Display */}
      {currentTimer ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          {/* Countdown Clock */}
          <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Time Remaining</span>
            <span
              className={`text-2xl font-black tracking-widest ${
                remainingSeconds !== null && remainingSeconds <= 300
                  ? 'text-red-600 animate-pulse'
                  : 'text-brand-primary'
              }`}
            >
              {remainingSeconds !== null && remainingSeconds > 0
                ? formatCountdown(remainingSeconds)
                : '00:00:00'}
            </span>
          </div>

          {/* Started & Expected */}
          <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400 text-[11px]">Started At:</span>
              <span className="font-bold text-charcoal">
                {new Date(currentTimer.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-[11px]">Expected Completion:</span>
              <span className="font-bold text-brand-primary">
                {new Date(currentTimer.expectedCompletionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-[11px]">Duration:</span>
              <span className="font-semibold text-gray-700">{currentTimer.expectedDurationMinutes} mins</span>
            </div>
          </div>

          {/* Worker Actions */}
          <div className="flex flex-col gap-2">
            {hasActiveTimer && (
              <button
                type="button"
                onClick={() => {
                  setIsExtensionModalOpen(true);
                  setExtensionFeedback(null);
                }}
                disabled={Boolean(pendingExtension)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Request Additional Time</span>
              </button>
            )}

            {isSafeAcknowledged && (
              <button
                type="button"
                onClick={() => setIsNewCycleModalOpen(true)}
                className="w-full py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Set New Expected Duration</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <span>⚠️ OTP verified. Please set expected work duration to activate customer safety timer.</span>
          <button
            type="button"
            onClick={() => setIsNewCycleModalOpen(true)}
            className="px-3 py-1.5 bg-brand-primary text-white rounded-lg font-bold text-xs"
          >
            Set Duration
          </button>
        </div>
      )}

      {/* Pending Extension Notice */}
      {pendingExtension && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <span>
            ⏳ <strong>Extension Pending:</strong> Requested +{pendingExtension.additionalMinutes} mins for "{pendingExtension.reason}". Awaiting customer approval.
          </span>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-200/80">Pending</span>
        </div>
      )}

      {/* Expiration Notice */}
      {isExpired && !isSafeAcknowledged && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
          <span>
            <strong>Service duration expired:</strong> Automated safety check-in alert was triggered for customer. You will be notified once customer confirms safety.
          </span>
        </div>
      )}

      {/* Customer Safe Notice */}
      {isSafeAcknowledged && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Customer Confirmed Safe:</strong> Safety alarm was stopped. If work is continuing, please set a new expected duration above.
          </span>
        </div>
      )}

      {/* Extension Modal */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-charcoal">REQUEST ADDITIONAL WORK TIME</h3>
              <button onClick={() => setIsExtensionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Additional time requires explicit customer approval. Please specify required extra time and reason.
            </p>

            {extensionFeedback && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {extensionFeedback}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Additional Hours</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={extHours}
                  onChange={(e) => setExtHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Additional Minutes</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={extMinutes}
                  onChange={(e) => setExtMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-gray-700 uppercase mb-1">Reason for Extension *</label>
              <textarea
                rows={2}
                value={extReason}
                onChange={(e) => setExtReason(e.target.value)}
                placeholder="e.g. Additional pipe repair required"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-primary"
              />
            </div>

            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-0.5">
              <div className="flex justify-between text-gray-500">
                <span>Total Extra Time:</span>
                <span className="font-bold text-charcoal">{extHours * 60 + extMinutes} mins</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Proposed New Completion:</span>
                <span className="font-bold text-brand-primary">
                  {new Date(Date.now() + (extHours * 60 + extMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsExtensionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestExtension}
                disabled={submittingExtension}
                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                {submittingExtension ? 'Submitting...' : 'Send Request to Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Cycle Modal */}
      {isNewCycleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-charcoal">SET EXPECTED WORK DURATION</h3>
              <button onClick={() => setIsNewCycleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Set the estimated time required to complete this service. The customer will be informed of this expected completion time.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Hours</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={newCycleHours}
                  onChange={(e) => setNewCycleHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Minutes</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={newCycleMinutes}
                  onChange={(e) => setNewCycleMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="p-3 bg-brand-surface/50 rounded-xl border border-brand-secondary/30 text-xs flex justify-between items-center">
              <span className="text-gray-500 font-medium">Expected Completion:</span>
              <span className="font-black text-brand-primary text-sm">
                {new Date(Date.now() + (newCycleHours * 60 + newCycleMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewCycleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetNewCycle}
                disabled={submittingNewCycle}
                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                {submittingNewCycle ? 'Starting...' : 'START WORK TIMER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
