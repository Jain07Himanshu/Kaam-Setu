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
} from 'lucide-react';

export const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { joinBookingRoom, leaveBookingRoom, lastEvent } = useSocket();

  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBooking = async () => {
    if (!id) return;
    try {
      const res = await api.getBookingById(id);
      setBooking(res.booking);
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
    }
  }, [lastEvent]);

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

  // Timeline steps
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
          <div className="text-2xl font-black text-brand-primary">${booking.agreedPrice}</div>
        </div>
      </div>

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
              src={workerUser?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'}
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
              <span className="font-semibold text-charcoal">{workerUser?.phone || '+1 (555) 432-1098'}</span>
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

      {/* Customer Review & Rating Form (when completed) */}
      {isCompleted && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 sm:p-8 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-charcoal">Service Feedback & Rating</h3>
              <p className="text-xs text-gray-500">
                {hasReviewed ? 'Thank you! Your verified review has been recorded.' : 'Rate your experience with this verified local professional.'}
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
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Rating (1 to 5 Stars)
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
                  Your Review & Comments
                </label>
                <textarea
                  rows={3}
                  placeholder="How was the craftsmanship, punctuality, and cleanliness of the job?"
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
                  <span>{isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
