import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import {
  Inbox,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  DollarSign,
  Send,
  AlertCircle,
  X,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const JobOffersPage: React.FC = () => {
  const { lastEvent } = useSocket();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'QUOTED' | 'DECLINED' | 'ALL'>('PENDING');
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quote Modal State
  const [quoteModalOffer, setQuoteModalOffer] = useState<any | null>(null);
  const [proposedPrice, setProposedPrice] = useState<number>(450);
  const [estimatedArrival, setEstimatedArrival] = useState<number>(25);
  const [scopeDescription, setScopeDescription] = useState<string>('');
  const [exclusions, setExclusions] = useState<string>('Parts and replacement hardware to be reimbursed at cost.');
  const [workerNote, setWorkerNote] = useState<string>('Fully licensed & equipped with high-grade tools.');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Counter Modal State
  const [counterModalQuote, setCounterModalQuote] = useState<any | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterMsg, setCounterMsg] = useState<string>('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOffers = async () => {
    try {
      const res = await api.getWorkerOffers(activeTab);
      setOffers(res.offers || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [activeTab, lastEvent]);

  const handleOpenQuoteModal = (offer: any) => {
    setQuoteModalOffer(offer);
    const suggested = offer.jobRequest?.budgetMin || 350;
    setProposedPrice(suggested);
    setScopeDescription(`Standard diagnostic and complete repair for: ${offer.jobRequest?.title}`);
  };

  const submitQuote = async () => {
    if (!quoteModalOffer) return;
    if (proposedPrice <= 0) {
      setFeedback({ type: 'error', message: 'Proposed price must be greater than 0' });
      return;
    }
    if (scopeDescription.trim().length < 5) {
      setFeedback({ type: 'error', message: 'Please describe the included work scope' });
      return;
    }

    setIsSubmittingQuote(true);
    setFeedback(null);

    try {
      await api.createQuote({
        jobRequestId: quoteModalOffer.jobRequestId,
        proposedPrice,
        estimatedArrivalMinutes: estimatedArrival,
        scopeDescription,
        exclusions,
        workerNote,
      });

      setQuoteModalOffer(null);
      setFeedback({ type: 'success', message: 'Quote submitted successfully! Customer has been notified.' });
      fetchOffers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit quote' });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleDecline = async (offerId: string) => {
    try {
      await api.declineOffer(offerId);
      setFeedback({ type: 'success', message: 'Job offer declined' });
      fetchOffers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to decline offer' });
    }
  };

  const submitCounter = async () => {
    if (!counterModalQuote) return;
    setIsSubmittingCounter(true);
    try {
      await api.counterofferQuote(counterModalQuote.id, {
        proposedPrice: counterPrice,
        message: counterMsg,
      });
      setCounterModalQuote(null);
      setFeedback({ type: 'success', message: 'Counteroffer sent to customer!' });
      fetchOffers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to send counteroffer' });
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Job Opportunities Inbox</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time incoming job requests matched to your trade skills and service area
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold text-gray-600">
          {(['PENDING', 'QUOTED', 'DECLINED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-white text-brand-primaryDark shadow-sm font-extrabold'
                  : 'hover:text-charcoal'
              }`}
            >
              {tab === 'PENDING' ? 'New' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-brand-surface border-brand-secondary/40 text-brand-primaryDark'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-gray-100 text-center space-y-3">
          <Inbox className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-charcoal">No job offers in this view</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {activeTab === 'PENDING'
              ? 'New requests created by neighborhood customers will appear here automatically.'
              : 'No records found for this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const job = offer.jobRequest;
            const submittedQuote = job?.quotes?.[0];
            const hasCounter = submittedQuote?.status === 'COUNTEROFFERED';

            return (
              <div
                key={offer.id}
                className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card hover:border-brand-secondary/40 transition-all space-y-4"
              >
                {/* Header & Match Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                      {offer.status}
                    </span>
                    <span className="text-xs font-bold text-brand-primary">
                      {job?.serviceCategory?.name}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      Received {new Date(offer.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-cream/70 text-brand-primaryDark border border-brand-creamDark">
                      <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{offer.matchScore}% Match Score</span>
                    </span>
                  </div>
                </div>

                {/* Job Title & Details */}
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-charcoal">{job?.title}</h3>
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    {job?.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                      <span>{job?.city} (Area Verified)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-primary" />
                      <span>Urgency: <strong className="text-charcoal">{job?.urgency}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-brand-primary" />
                      <span>
                        Budget: {job?.isOpenToQuotes ? 'Open to Quotes' : `₹${job?.budgetMin} - ₹${job?.budgetMax}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-brand-primary" />
                      <span>Protected Address</span>
                    </div>
                  </div>
                </div>

                {/* Match Reasons Transparent Breakdown */}
                {offer.matchReasons && offer.matchReasons.length > 0 && (
                  <div className="p-3 rounded-2xl bg-brand-surface/40 border border-brand-secondary/20 text-xs space-y-1">
                    <span className="font-bold text-brand-primaryDark block">Why you were matched:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {offer.matchReasons.map((reason: string, rIdx: number) => (
                        <span
                          key={rIdx}
                          className="text-[11px] font-medium bg-white px-2 py-0.5 rounded-lg border border-brand-secondary/30 text-gray-700"
                        >
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Counteroffer Alert Box */}
                {hasCounter && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-800 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-600" />
                        <span>Customer Counteroffer Received: ₹{submittedQuote.proposedPrice}</span>
                      </span>
                      <button
                        onClick={() => {
                          setCounterModalQuote(submittedQuote);
                          setCounterPrice(submittedQuote.proposedPrice);
                        }}
                        className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                      >
                        Respond to Counter
                      </button>
                    </div>
                  </div>
                )}

                {/* Submitted Quote Details (if already quoted) */}
                {submittedQuote && !hasCounter && (
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-charcoal">Your Submitted Quote: </span>
                      <span className="font-black text-brand-primary text-sm">₹{submittedQuote.proposedPrice}</span>
                      <span className="text-gray-400 ml-2">ETA: ~{submittedQuote.estimatedArrivalMinutes} min</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-gray-300">
                      Status: {submittedQuote.status}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  {offer.status === 'PENDING' || offer.status === 'VIEWED' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDecline(offer.id)}
                        className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenQuoteModal(offer)}
                        className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-brand-cream" />
                        <span>Submit Trade Quote</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMIT QUOTE MODAL */}
      {quoteModalOffer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-lg text-charcoal">Submit Quote</h3>
                <p className="text-xs text-gray-500">{quoteModalOffer.jobRequest?.title}</p>
              </div>
              <button
                onClick={() => setQuoteModalOffer(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Your Proposed Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-black text-brand-primary focus:border-brand-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Estimated Arrival (Mins)
                  </label>
                  <input
                    type="number"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:border-brand-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Scope of Work Included *
                </label>
                <textarea
                  rows={3}
                  value={scopeDescription}
                  onChange={(e) => setScopeDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-primary outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Exclusions & Extra Costs (Optional)
                </label>
                <input
                  type="text"
                  value={exclusions}
                  onChange={(e) => setExclusions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Message to Customer
                </label>
                <input
                  type="text"
                  value={workerNote}
                  onChange={(e) => setWorkerNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuoteModalOffer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitQuote}
                disabled={isSubmittingQuote}
                className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingQuote ? 'Submitting...' : 'Send Quote to Customer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTEROFFER RESPONSE MODAL */}
      {counterModalQuote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-charcoal">Respond to Counteroffer</h3>
              <button
                onClick={() => setCounterModalQuote(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Revised Price Agreement (₹)
                </label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-brand-primary focus:border-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Message to Customer
                </label>
                <textarea
                  rows={2}
                  placeholder="I can accept this price, will bring all necessary gaskets and tools."
                  value={counterMsg}
                  onChange={(e) => setCounterMsg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
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
                onClick={submitCounter}
                disabled={isSubmittingCounter}
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingCounter ? 'Submitting...' : 'Submit Counter Response'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
