import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import {
  Clock,
  ShieldCheck,
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Send,
  X,
  MapPin,
  Calendar,
} from 'lucide-react';

export const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNewlyCreated = searchParams.get('created') === 'true';

  const { joinJobRoom, leaveJobRoom, lastEvent } = useSocket();

  const [job, setJob] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Counteroffer Modal State
  const [counterModalQuote, setCounterModalQuote] = useState<any | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterMessage, setCounterMessage] = useState<string>('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  const fetchJobDetails = async () => {
    if (!id) return;
    try {
      const res = await api.getJobById(id);
      setJob(res.job);
    } catch (err: any) {
      console.error('Failed to load job details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      joinJobRoom(id);
    }
    return () => {
      if (id) leaveJobRoom(id);
    };
  }, [id]);

  // Live Socket.IO Updates
  useEffect(() => {
    if (!lastEvent || !job) return;

    if (
      lastEvent.type === 'quote.created' &&
      lastEvent.payload.jobRequestId === job.id
    ) {
      // Append newly arrived quote or update
      fetchJobDetails();
      setActionSuccess(`New quote received from ${lastEvent.payload.quote.worker?.user?.name || 'a worker'}!`);
    } else if (
      lastEvent.type === 'quote.counteroffered' &&
      lastEvent.payload.quote.jobRequestId === job.id
    ) {
      fetchJobDetails();
    } else if (
      lastEvent.type === 'quote.accepted' ||
      lastEvent.type === 'booking.confirmed'
    ) {
      fetchJobDetails();
    }
  }, [lastEvent]);

  const handleAcceptQuote = async (quoteId: string) => {
    setActionError(null);
    try {
      const res = await api.acceptQuote(quoteId);
      setActionSuccess('Quote accepted! Booking confirmed.');
      fetchJobDetails();
      // Navigate to booking tracker
      setTimeout(() => {
        navigate(`/bookings/${res.booking.id}`);
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || 'Failed to accept quote');
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    setActionError(null);
    try {
      await api.rejectQuote(quoteId);
      setActionSuccess('Quote rejected');
      fetchJobDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject quote');
    }
  };

  const submitCounteroffer = async () => {
    if (!counterModalQuote) return;
    if (counterPrice <= 0) {
      setActionError('Counter price must be greater than 0');
      return;
    }
    if (!counterMessage.trim()) {
      setActionError('Please provide a message explaining your counteroffer');
      return;
    }

    setIsSubmittingCounter(true);
    setActionError(null);

    try {
      await api.counterofferQuote(counterModalQuote.id, {
        proposedPrice: counterPrice,
        message: counterMessage,
      });

      setCounterModalQuote(null);
      setCounterMessage('');
      setActionSuccess('Counteroffer sent to worker!');
      fetchJobDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit counteroffer');
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-500">Loading service request & live quotes...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-charcoal">Service Request Not Found</h3>
        <Link to="/" className="text-xs font-bold text-brand-primary">Return Home</Link>
      </div>
    );
  }

  const quotes = job.quotes || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-brand-surface border border-brand-secondary/40 text-brand-primaryDark text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-primary shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmed Booking Banner (if already booked) */}
      {job.booking && (
        <div className="p-5 rounded-2xl bg-brand-surface border-2 border-brand-secondary/50 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-brand-cream" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-primaryDark">
                Booking Confirmed
              </div>
              <h4 className="text-sm font-bold text-charcoal">
                Assigned Pro: {job.booking.worker?.user?.name} · Agreed Price: ${job.booking.agreedPrice}
              </h4>
            </div>
          </div>
          <button
            onClick={() => navigate(`/bookings/${job.booking.id}`)}
            className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span>View Service Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                {job.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                Created {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mt-1.5">{job.title}</h1>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-400 font-medium">Category</div>
            <div className="text-sm font-bold text-brand-primary">{job.serviceCategory?.name}</div>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
          {job.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600 pt-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-primary" />
            <span>{job.addressLabel}, {job.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand-primary" />
            <span>Urgency: <strong className="text-charcoal">{job.urgency}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-brand-primary" />
            <span>
              {job.isOpenToQuotes ? 'Open to Quotes' : `$${job.budgetMin} - $${job.budgetMax}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span>{job.offers?.length || 0} local workers notified</span>
          </div>
        </div>
      </div>

      {/* Real-Time Quotes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-charcoal">
              Worker Quotes ({quotes.length})
            </h2>
            <p className="text-xs text-gray-500">
              Live quotes submitted by eligible local workers. Compare price, ETA, and scope.
            </p>
          </div>

          {quotes.length > 0 && !job.booking && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
              Socket Live Feed Active ⚡
            </span>
          )}
        </div>

        {quotes.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-gray-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-cream/60 flex items-center justify-center mx-auto text-brand-primary">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-charcoal">Waiting for Nearby Worker Quotes</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              We notified active trade pros in your area. Quotes will appear on this screen automatically without needing to refresh.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                Tip: Open the Worker App at <code className="text-brand-primary font-bold">localhost:5174</code> to submit a quote as Suresh or Priya!
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((quote: any) => {
              const workerUser = quote.worker?.user;
              const isAccepted = quote.status === 'ACCEPTED';
              const isRejected = quote.status === 'REJECTED';
              const isCounteroffered = quote.status === 'COUNTEROFFERED';

              return (
                <div
                  key={quote.id}
                  className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between ${
                    isAccepted
                      ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-surface/20 shadow-md'
                      : isRejected
                      ? 'border-gray-200 opacity-60 bg-gray-50'
                      : 'border-gray-100 shadow-card hover:shadow-hover hover:border-brand-secondary/40'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Worker Profile Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            workerUser?.avatarUrl ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
                          }
                          alt={workerUser?.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-gray-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-base text-charcoal">{workerUser?.name}</h4>
                            <span title="Verified Trade Pro">
                              <ShieldCheck className="w-4 h-4 text-brand-primary" />
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center text-amber-600 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                              {quote.worker?.ratingAvg?.toFixed(1) || '4.9'}
                            </span>
                            <span>({quote.worker?.ratingCount || 10} reviews)</span>
                            <span>·</span>
                            <span>{quote.worker?.completedJobsCount || 15} jobs</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-brand-primary">${quote.proposedPrice}</div>
                        <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>ETA: ~{quote.estimatedArrivalMinutes} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Scope & Exclusions */}
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <span className="font-bold text-gray-700 block mb-1">Included Scope:</span>
                        <p className="text-gray-600 leading-relaxed">{quote.scopeDescription}</p>
                      </div>

                      {quote.exclusions && (
                        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-amber-800">
                          <span className="font-bold block mb-0.5">Exclusions:</span>
                          <p>{quote.exclusions}</p>
                        </div>
                      )}

                      {quote.workerNote && (
                        <p className="text-gray-500 italic">"{quote.workerNote}"</p>
                      )}
                    </div>

                    {/* Negotiation History (if any counters exist) */}
                    {quote.negotiations && quote.negotiations.length > 0 && (
                      <div className="p-3 rounded-2xl bg-brand-cream/40 border border-brand-creamDark text-xs space-y-1.5">
                        <div className="font-bold text-brand-primaryDark flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Negotiation History ({quote.negotiations.length})</span>
                        </div>
                        {quote.negotiations.map((n: any) => (
                          <div key={n.id} className="text-[11px] text-gray-700 flex justify-between">
                            <span>
                              <strong>{n.senderRole}:</strong> "{n.message}"
                            </span>
                            <span className="font-bold text-brand-primary">${n.proposedPrice}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    {isAccepted ? (
                      <div className="w-full py-2 rounded-xl bg-brand-primary text-white text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-brand-cream" />
                        <span>Accepted Quote</span>
                      </div>
                    ) : isRejected ? (
                      <div className="w-full py-2 rounded-xl bg-gray-200 text-gray-600 text-xs font-semibold text-center">
                        Quote Rejected
                      </div>
                    ) : job.booking ? (
                      <div className="w-full py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-medium text-center">
                        Another quote was accepted
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCounterModalQuote(quote);
                            setCounterPrice(Math.max(10, quote.proposedPrice - 10));
                          }}
                          className="px-3.5 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                          <span>Counteroffer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectQuote(quote.id)}
                          className="px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAcceptQuote(quote.id)}
                          className="flex-1 py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4 text-brand-cream" />
                          <span>Accept & Book (${quote.proposedPrice})</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COUNTEROFFER MODAL */}
      {counterModalQuote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-charcoal">Send Counteroffer</h3>
              <button
                onClick={() => setCounterModalQuote(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Negotiating with <strong>{counterModalQuote.worker?.user?.name}</strong>. Current quote is ${counterModalQuote.proposedPrice}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Your Proposed Price ($)
                </label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-brand-primary focus:border-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Message / Scope Note
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Can we agree on $65 if I have already purchased the replacement part?"
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCounterModalQuote(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCounteroffer}
                disabled={isSubmittingCounter}
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingCounter ? 'Sending...' : 'Send Counteroffer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
