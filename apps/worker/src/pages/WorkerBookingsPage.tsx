import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import {
  CalendarCheck,
  Clock,
  MapPin,
  CheckCircle,
  Phone,
  KeyRound,
  AlertCircle,
  Star,
  ArrowRight,
  X,
  Car,
  Wrench,
} from 'lucide-react';

export const WorkerBookingsPage: React.FC = () => {
  const { lastEvent } = useSocket();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // OTP Modal State
  const [otpModalBooking, setOtpModalBooking] = useState<any | null>(null);
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
  }, [lastEvent]);

  const handleStatusUpdate = async (bookingId: string, status: string, startOtp?: string) => {
    setActionFeedback(null);
    try {
      const res = await api.updateBookingStatus(bookingId, { status, startOtp });
      setActionFeedback({
        type: 'success',
        message: `Booking status updated to ${status.replace(/_/g, ' ')}!`,
      });
      fetchBookings();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to update status' });
      throw err;
    }
  };

  const handleVerifyStartOtp = async () => {
    if (!otpModalBooking) return;
    if (!inputOtp.trim()) {
      setOtpError('Please enter the 4-digit code provided by the customer');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      await handleStatusUpdate(otpModalBooking.id, 'WORK_STARTED', inputOtp.trim());
      setOtpModalBooking(null);
      setInputOtp('');
    } catch (err: any) {
      setOtpError(err.message || 'Invalid start code. Please check with customer.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Job Management & Execution</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage dispatched jobs, update travel status, verify customer start OTP, and record completion
        </p>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-brand-surface border-brand-secondary/40 text-brand-primaryDark'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-gray-100 text-center space-y-3">
          <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-charcoal">No confirmed bookings yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When customers accept your submitted quotes, their confirmed booking will appear here for execution.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const customerUser = booking.customer?.user;
            const isConfirmed = booking.status === 'CONFIRMED';
            const isOnTheWay = booking.status === 'ON_THE_WAY';
            const isWorkStarted = booking.status === 'WORK_STARTED';
            const isCompleted = booking.status === 'COMPLETED';

            return (
              <div
                key={booking.id}
                className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card hover:border-brand-secondary/40 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-brand-surface text-brand-primaryDark border border-brand-secondary/30'
                      }`}
                    >
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-brand-primary">
                      {booking.jobRequest?.serviceCategory?.name}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      Booked {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-semibold">Agreed Price</div>
                    <div className="text-xl font-black text-brand-primary">₹{booking.agreedPrice}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-extrabold text-charcoal">{booking.jobRequest?.title}</h3>

                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed">
                    <span className="font-bold text-gray-600 block mb-0.5">Agreed Scope:</span>
                    {booking.agreedScope}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                      <span>
                        {booking.jobRequest?.addressLabel}, {booking.jobRequest?.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-brand-primary" />
                      <span>Customer: {customerUser?.name} ({customerUser?.phone || '+91 98201 12345'})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-primary" />
                      <span>Urgency: {booking.jobRequest?.urgency}</span>
                    </div>
                  </div>

                  {isCompleted && booking.review && (
                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>Customer Review ({booking.review.rating}★):</span>
                      </div>
                      <p className="text-gray-700 italic">"{booking.review.comment}"</p>
                    </div>
                  )}
                </div>

                {/* Status Progression Controls */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    {isConfirmed && 'Step 1: Notify customer you are heading over'}
                    {isOnTheWay && 'Step 2: Enter customer\'s 4-digit code upon arrival'}
                    {isWorkStarted && 'Step 3: Service is active. Confirm when completed'}
                    {isCompleted && 'Service completed & recorded in earnings'}
                  </div>

                  <div className="flex items-center gap-2">
                    {isConfirmed && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'ON_THE_WAY')}
                        className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
                      >
                        <Car className="w-3.5 h-3.5 text-brand-cream" />
                        <span>Mark On The Way</span>
                      </button>
                    )}

                    {isOnTheWay && (
                      <button
                        onClick={() => {
                          setOtpModalBooking(booking);
                          setInputOtp('');
                          setOtpError(null);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Enter Start Code</span>
                      </button>
                    )}

                    {isWorkStarted && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Job Completed</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* START OTP VERIFICATION MODAL */}
      {otpModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-surface text-brand-primary flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-charcoal">Customer Start Code</h3>
              </div>
              <button
                onClick={() => setOtpModalBooking(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Ask the customer for their 4-digit verification code shown on their Kaam Setu screen to safely begin work.
            </p>

            {otpError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {otpError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                4-Digit Start Code
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="e.g. 4921"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                className="w-full text-center text-2xl font-black tracking-widest px-4 py-3 rounded-xl border-2 border-brand-primary/40 focus:border-brand-primary outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOtpModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyStartOtp}
                disabled={isVerifyingOtp}
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isVerifyingOtp ? 'Verifying...' : 'Verify & Start Work'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
