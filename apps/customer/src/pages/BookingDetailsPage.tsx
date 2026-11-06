import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import {
  CheckCircle,
  Clock,
  Car,
  Wrench,
  Star,
  ShieldCheck,
  Phone,
  MapPin,
  AlertCircle,
  KeyRound,
  Send,
  X,
  ArrowRight,
  AlertOctagon,
  DollarSign,
  Heart,
  MessageSquare,
  ThumbsUp,
  Hourglass,
  Bell,
  Volume2,
} from 'lucide-react';
import { WorkerCredibilityCard } from '../components/WorkerCredibilityCard';
import { playSafetyAlarmSound, stopSafetyAlarmSound } from '../utils/alarmSound';

export const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { joinBookingRoom, leaveBookingRoom, lastEvent } = useSocket();

  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Safety & Work Timer state
  const [safetyStatus, setSafetyStatus] = useState<any | null>(null);
  const [timerData, setTimerData] = useState<any | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isAcknowledgingSafe, setIsAcknowledgingSafe] = useState(false);
  const [respondingToExtension, setRespondingToExtension] = useState(false);
  const [isTriggeringSos, setIsTriggeringSos] = useState(false);
  const [sosSuccessMsg, setSosSuccessMsg] = useState<string | null>(null);

  // Visiting Charge state
  const [visitingCharge, setVisitingCharge] = useState<any | null>(null);
  const [hasAcknowledgedCharge, setHasAcknowledgedCharge] = useState(false);
  const [isAcknowledgingCharge, setIsAcknowledgingCharge] = useState(false);

  // Multicategory Review state
  const [rating, setRating] = useState(5);
  const [serviceQuality, setServiceQuality] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBooking = async () => {
    if (!id) return;
    try {
      const res = await api.getBookingById(id);
      setBooking(res.booking);
      if (res.booking?.chargeAcknowledgement) {
        setHasAcknowledgedCharge(true);
      }

      // Fetch safety status
      const safetyRes = await api.getBookingSafetyStatus(id).catch(() => null);
      if (safetyRes) setSafetyStatus(safetyRes);

      // Fetch work timer status
      const timerRes = await api.getBookingTimerStatus(id).catch(() => null);
      if (timerRes) {
        setTimerData(timerRes);
        if (timerRes.hasActiveAlarm) {
          setIsAlarmActive(true);
          playSafetyAlarmSound();
        } else {
          setIsAlarmActive(false);
          stopSafetyAlarmSound();
        }
      }

      // Fetch visiting charge terms
      if (res.booking?.workerId) {
        const chargeRes = await api.getWorkerVisitingCharges(res.booking.workerId).catch(() => null);
        if (chargeRes) setVisitingCharge(chargeRes);
      }
    } catch (err: any) {
      console.error('Failed to load booking:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBooking();
      joinBookingRoom(id);
    }
    return () => {
      if (id) leaveBookingRoom(id);
      stopSafetyAlarmSound();
    };
  }, [id]);

  // Live Socket.IO Status Updates
  useEffect(() => {
    if (!lastEvent || !booking) return;

    if (
      lastEvent.type === 'booking.status.updated' &&
      lastEvent.payload.bookingId === booking.id
    ) {
      setBooking(lastEvent.payload.booking);
      fetchBooking();
    } else if (
      lastEvent.type === 'booking.timer.started' ||
      lastEvent.type === 'booking.timer.expired' ||
      lastEvent.type === 'booking.safety.alert.created' ||
      lastEvent.type === 'booking.timer.extension.requested' ||
      lastEvent.type === 'booking.timer.extension.approved' ||
      lastEvent.type === 'booking.timer.extension.rejected' ||
      lastEvent.type === 'booking.safety.alert.acknowledged' ||
      lastEvent.type === 'booking.safety.escalated'
    ) {
      fetchBooking();
    }
  }, [lastEvent]);

  // 1-second countdown interval
  useEffect(() => {
    if (!timerData?.currentTimer || timerData.currentTimer.status !== 'ACTIVE') {
      setRemainingSeconds(null);
      return;
    }

    const target = new Date(timerData.currentTimer.expectedCompletionAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.floor((target - now) / 1000);
      if (diffSec <= 0) {
        setRemainingSeconds(0);
        fetchBooking();
      } else {
        setRemainingSeconds(diffSec);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timerData?.currentTimer]);

  const handleAcknowledgeVisitingCharge = async () => {
    if (!booking) return;
    setIsAcknowledgingCharge(true);
    try {
      await api.acknowledgeVisitingCharge(booking.id);
      setHasAcknowledgedCharge(true);
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge visiting charge');
    } finally {
      setIsAcknowledgingCharge(false);
    }
  };

  const handleTriggerBookingSos = async () => {
    if (!booking) return;
    if (!confirm('Are you sure you want to trigger an Emergency SOS? This will immediately place automated calls to your emergency contacts.')) return;

    setIsTriggeringSos(true);
    setSosSuccessMsg(null);
    try {
      const res = await api.triggerSos({
        bookingId: booking.id,
        triggerType: 'SOS',
        address: `${booking.jobRequest?.addressLabel}, ${booking.jobRequest?.city}`,
      });
      setSosSuccessMsg(`Emergency SOS Activated! ${res.contactsNotifiedCount} emergency contacts dialed.`);
      const updatedSafety = await api.getBookingSafetyStatus(booking.id);
      setSafetyStatus(updatedSafety);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger SOS');
    } finally {
      setIsTriggeringSos(false);
    }
  };

  const handleAcknowledgeCheckin = async (checkInId: string) => {
    try {
      await api.acknowledgeCheckin(checkInId);
      const updatedSafety = await api.getBookingSafetyStatus(booking.id);
      setSafetyStatus(updatedSafety);
      alert('Thank you! Confirmed you are safe and sound.');
    } catch (err: any) {
      alert(err.message || 'Failed to confirm check-in');
    }
  };

  const handleAcknowledgeSafe = async () => {
    if (!booking) return;
    setIsAcknowledgingSafe(true);
    stopSafetyAlarmSound();
    setIsAlarmActive(false);

    try {
      await api.acknowledgeSafe(booking.id);
      fetchBooking();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge safety check-in');
    } finally {
      setIsAcknowledgingSafe(false);
    }
  };

  const handleRespondToExtension = async (extensionId: string, action: 'APPROVE' | 'REJECT') => {
    if (!booking) return;
    setRespondingToExtension(true);

    try {
      await api.respondToTimerExtension(booking.id, extensionId, action);
      fetchBooking();
    } catch (err: any) {
      alert(err.message || 'Failed to respond to extension request');
    } finally {
      setRespondingToExtension(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!booking) return;
    if (reviewComment.trim().length < 5) {
      setErrorMessage('Please write at least a 5 character review comment');
      return;
    }

    setIsSubmittingReview(true);
    setErrorMessage(null);

    try {
      await api.createReview({
        bookingId: booking.id,
        rating,
        comment: reviewComment,
        serviceQuality,
        punctuality,
        professionalism,
        communication,
      });

      setReviewSuccess(true);
      fetchBooking();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-gray-500">
        Loading booking details...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-charcoal">Booking Not Found</h3>
        <Link to="/bookings" className="text-xs font-bold text-brand-primary">View All Bookings</Link>
      </div>
    );
  }

  const workerUser = booking.worker?.user;
  const isCompleted = booking.status === 'COMPLETED';
  const hasReviewed = !!booking.review;

  const timelineSteps = [
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Booking accepted & scheduled' },
    { key: 'ON_THE_WAY', label: 'On The Way', desc: 'Worker en route to address' },
    { key: 'WORK_STARTED', label: 'In Progress', desc: 'Start OTP verified by worker' },
    { key: 'COMPLETED', label: 'Completed', desc: 'Work done & verified' },
  ];

  const statusOrder = ['CONFIRMED', 'ON_THE_WAY', 'WORK_STARTED', 'COMPLETED'];
  const currentStepIdx = statusOrder.indexOf(booking.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
              {booking.status.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-400">
              Booking ID: <code className="text-gray-600">{booking.id.slice(0, 8)}</code>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mt-1.5">
            {booking.jobRequest?.title}
          </h1>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400 font-semibold">Agreed Price</div>
          <div className="text-2xl font-black text-brand-primary">₹{booking.agreedPrice}</div>
        </div>
      </div>

      {/* Pre-Booking Visiting Charge Notice & Acknowledgement */}
      {visitingCharge && !hasAcknowledgedCharge && !isCompleted && booking.status !== 'CANCELLED' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900">
                Visiting & Inspection Charge Notice: ₹{visitingCharge.amount}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                "{visitingCharge.terms || 'Standard diagnostic inspection fee. Deducted from final service bill upon hire.'}"
              </p>
              <p className="text-[11px] text-amber-700/80 mt-1">
                Please acknowledge this visiting policy before technician arrival.
              </p>
            </div>
          </div>
          <button
            onClick={handleAcknowledgeVisitingCharge}
            disabled={isAcknowledgingCharge}
            className="w-full md:w-auto px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-amber-700 transition disabled:opacity-50 shrink-0"
          >
            {isAcknowledgingCharge ? 'Confirming...' : 'I Acknowledge & Agree'}
          </button>
        </div>
      )}

      {/* Progress Timeline */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Service Timeline</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
          {timelineSteps.map((s, idx) => {
            const isDone = currentStepIdx >= idx;
            const isCurrent = booking.status === s.key;

            return (
              <div
                key={s.key}
                className={`p-4 rounded-2xl border transition-all text-left space-y-2 ${
                  isCurrent
                    ? 'border-brand-primary bg-brand-surface ring-2 ring-brand-primary shadow-sm'
                    : isDone
                    ? 'border-brand-secondary/40 bg-brand-surface/40'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-5 h-5 text-brand-cream" /> : idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal">{s.label}</h4>
                  <p className="text-[11px] text-gray-500 leading-snug">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE WORK TIMER & SAFETY MONITORING (When In Progress) */}
      {booking.status === 'WORK_STARTED' && (
        <div className="bg-white rounded-3xl border-2 border-brand-primary/40 shadow-md p-6 sm:p-8 space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <Hourglass className="w-6 h-6 text-brand-cream animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  SERVICE IN PROGRESS · TIMER ACTIVE
                </span>
                <h3 className="text-xl font-extrabold text-charcoal mt-1">Live Service Work Timer</h3>
              </div>
            </div>

            {timerData?.currentTimer && (
              <div className="text-right sm:text-right">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Time Remaining</span>
                <span
                  className={`text-3xl font-black tracking-widest ${
                    remainingSeconds !== null && remainingSeconds <= 300
                      ? 'text-red-600 animate-pulse'
                      : 'text-brand-primary'
                  }`}
                >
                  {remainingSeconds !== null && remainingSeconds > 0
                    ? `${Math.floor(remainingSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0')}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
                    : '00:00:00'}
                </span>
              </div>
            )}
          </div>

          {timerData?.currentTimer && (
            <div className="p-4 rounded-2xl bg-brand-surface border border-brand-secondary/40 text-xs text-brand-primaryDark flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary shrink-0" />
              <span>
                Your service professional <strong>{booking.worker?.user?.name}</strong> has started working. The expected completion time is{' '}
                <strong>
                  {new Date(timerData.currentTimer.expectedCompletionAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </strong>.
              </span>
            </div>
          )}

          {/* Pending Worker Extension Request Approval Card */}
          {timerData?.pendingExtension && (
            <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-300 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Worker Requested Additional Time</span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed">
                Your service professional has requested an additional{' '}
                <strong>{timerData.pendingExtension.additionalMinutes} minutes</strong> to complete the work.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-xl border border-blue-200">
                <div>
                  <span className="text-gray-400 text-[10px] block">Reason for Extension:</span>
                  <span className="font-bold text-charcoal">{timerData.pendingExtension.reason}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">New Proposed Completion:</span>
                  <span className="font-bold text-brand-primary">
                    {new Date(timerData.pendingExtension.proposedCompletionAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleRespondToExtension(timerData.pendingExtension.id, 'REJECT')}
                  disabled={respondingToExtension}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition"
                >
                  REJECT EXTENSION
                </button>
                <button
                  type="button"
                  onClick={() => handleRespondToExtension(timerData.pendingExtension.id, 'APPROVE')}
                  disabled={respondingToExtension}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white font-bold text-xs shadow-sm transition"
                >
                  APPROVE EXTENSION
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AUTOMATIC SOS ESCALATION STATUS (When unacknowledged timer expires) */}
      {timerData?.isEscalated && (
        <div className="p-6 rounded-3xl bg-red-600 text-white shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center font-bold">
              <AlertOctagon className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-800 text-white px-2.5 py-0.5 rounded-full">
                EMERGENCY ESCALATION ACTIVE
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                Automated Safety Protocol Escalated
              </h3>
            </div>
          </div>
          <p className="text-xs text-red-100 leading-relaxed">
            The service work duration expired without confirmation. Outbound calls and urgent SMS alerts have been placed to your registered emergency contacts, and the Kaam Setu Rapid Safety Response team has been alerted.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-red-500/60 text-xs">
            <span className="text-red-200">If this was a false alarm, you can resolve the alert:</span>
            <button
              onClick={() => handleTriggerBookingSos()}
              className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 font-black rounded-xl text-xs transition shadow-sm"
            >
              Resolve / I Am Safe Now
            </button>
          </div>
        </div>
      )}

      {/* UNLOCKED SECTION: YOUR SERVICE PROFESSIONAL (Accessible throughout active booking & after completion) */}
      <div className="space-y-3">
        <WorkerCredibilityCard workerId={booking.workerId} />
      </div>

      {/* Active Service Safety Card (SOS Button & Check-In Milestones) */}
      {!isCompleted && booking.status !== 'CANCELLED' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-gray-900">Safety & Rapid Protection Active</h4>
                {safetyStatus?.hasActiveSos && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                    SOS ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 max-w-lg leading-relaxed">
                If at any moment you feel unsafe or experience misconduct during this in-home service, trigger the SOS button below.
              </p>

              {/* Pending Safety Check-In Prompt if any */}
              {safetyStatus?.checkIns?.some((c: any) => c.status === 'SCHEDULED' || c.status === 'REMINDER_SENT') && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <span className="text-blue-800">
                    🔔 Safety Check-in Milestone: Is everything going well with technician?
                  </span>
                  <button
                    onClick={() => handleAcknowledgeCheckin(safetyStatus.checkIns[0].id)}
                    className="bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shrink-0"
                  >
                    I am Safe
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <button
              onClick={handleTriggerBookingSos}
              disabled={isTriggeringSos}
              className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{isTriggeringSos ? 'Dispatched...' : 'Trigger Emergency SOS'}</span>
            </button>
            <Link
              to="/emergency-contacts"
              className="text-[11px] text-gray-400 hover:text-brand-primary underline"
            >
              Manage {safetyStatus?.emergencyContactsCount || 3} Emergency Contacts
            </Link>
          </div>
        </div>
      )}

      {/* Verification OTP Callout Card */}
      {!isCompleted && booking.status !== 'CANCELLED' && (
        <div className="p-6 rounded-3xl bg-brand-cream/60 border-2 border-brand-creamDark shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <KeyRound className="w-6 h-6 text-brand-cream" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-primaryDark">
                Mutually Verified Start Code
              </div>
              <h4 className="font-extrabold text-base text-charcoal">
                Customer Verification OTP: <span className="text-2xl font-black text-brand-primary tracking-widest">{booking.startOtp}</span>
              </h4>
              <p className="text-xs text-gray-600 mt-1 max-w-lg leading-relaxed">
                Provide this 4-digit code to {workerUser?.name} when they arrive at your door. The worker cannot start billing or trigger execution until they enter this exact code.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Worker Details & Scope */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-card p-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Professional</h3>

          <div className="flex items-center gap-3">
            <img
              src={workerUser?.avatarUrl || '/avatars/suresh.svg'}
              alt={workerUser?.name}
              className="w-14 h-14 rounded-2xl object-cover border border-gray-200"
            />
            <div>
              <h4 className="font-bold text-base text-charcoal">{workerUser?.name}</h4>
              <div className="flex items-center text-xs text-gray-500 gap-1.5 mt-0.5">
                <span className="flex items-center text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                  {booking.worker?.ratingAvg?.toFixed(1) || '4.9'}
                </span>
                <span>({booking.worker?.ratingCount || 10} reviews)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-primary" />
              <span className="font-semibold text-charcoal">{workerUser?.phone || '+91 98201 12345'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span>Identity & Trade License Verified</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-card p-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Agreed Scope of Work</h3>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs leading-relaxed text-gray-700">
            {booking.agreedScope}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 pt-2 border-t border-gray-100">
            <div>
              <span className="text-gray-400 block mb-0.5 font-medium">Service Address:</span>
              <span className="font-semibold text-charcoal">
                {booking.jobRequest?.addressLabel}, {booking.jobRequest?.city}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5 font-medium">Category:</span>
              <span className="font-semibold text-brand-primary">
                {booking.jobRequest?.serviceCategory?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multicategory Review & Rating Form (when completed) */}
      {isCompleted && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 sm:p-8 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-charcoal">Comprehensive Quality Review & Rating</h3>
              <p className="text-xs text-gray-500">
                {hasReviewed ? 'Thank you! Your verified multicategory review is on record.' : 'Rate your technician across 4 key dimensions to award credibility badges.'}
              </p>
            </div>
            {hasReviewed && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                Reviewed ⭐
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorMessage}
            </div>
          )}

          {hasReviewed || reviewSuccess ? (
            <div className="p-5 rounded-2xl bg-brand-surface border border-brand-secondary/30 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (booking.review?.rating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-700 italic">
                "{booking.review?.comment || reviewComment}"
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Multicategory Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Service Quality</span>
                    <span className="text-brand-primary">{serviceQuality} / 5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={serviceQuality}
                    onChange={(e) => setServiceQuality(Number(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Punctuality</span>
                    <span className="text-brand-primary">{punctuality} / 5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={punctuality}
                    onChange={(e) => setPunctuality(Number(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Professionalism & Conduct</span>
                    <span className="text-brand-primary">{professionalism} / 5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={professionalism}
                    onChange={(e) => setProfessionalism(Number(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Communication</span>
                    <span className="text-brand-primary">{communication} / 5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={communication}
                    onChange={(e) => setCommunication(Number(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Overall Rating (Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-charcoal">{rating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Your Verified Review & Comments
                </label>
                <textarea
                  rows={3}
                  placeholder="How was the craftsmanship, punctuality, and overall experience with this professional?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none leading-relaxed"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={isSubmittingReview}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReview ? 'Submitting...' : 'Submit Verified Multicategory Review'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
