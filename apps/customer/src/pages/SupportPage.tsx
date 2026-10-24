import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  LifeBuoy,
  Send,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [category, setCategory] = useState('GENERAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await api.getMySupportTickets();
      setTickets(res.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || description.trim().length < 10) {
      setErrorMsg('Please provide a subject and detailed description (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createSupportTicket({
        category,
        subject,
        description,
      });

      setSuccessMsg('Support ticket submitted. A customer representative will review your request.');
      setSubject('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Customer Support & Safety</h1>
        <p className="text-xs text-gray-500 mt-1">
          Need help with a service, dispute resolution, or neighborhood inquiry? We're here for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Support Ticket Form */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-bold text-charcoal">Submit a Support Inquiry</h2>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-secondary/40 text-brand-primaryDark text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-primary shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-charcoal focus:border-brand-primary outline-none"
              >
                <option value="GENERAL">General Neighborhood Question</option>
                <option value="BOOKING_ISSUE">Booking or Worker Dispute</option>
                <option value="PAYMENT_QUERY">Price / Quote Clarification</option>
                <option value="SAFETY_REPORT">Safety & Incident Report</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Subject
              </label>
              <input
                type="text"
                placeholder="Brief summary of your question"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Description & Details
              </label>
              <textarea
                rows={4}
                placeholder="Please describe your question or issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none leading-relaxed"
              />
            </div>

            <div className="text-right">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Submit Ticket'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Safety & Help Info */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-brand-surface border border-brand-secondary/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-cream" />
            </div>
            <h4 className="font-bold text-sm text-charcoal">Neighbor Trust Guarantee</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              All registered workers undergo verified phone and identity verification. All quotes are legally agreed contracts backed by our platform resolution team.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-brand-beige/40 border border-brand-beigeDark space-y-2">
            <h4 className="font-bold text-sm text-charcoal">Dispute Workflow</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              If work differs from agreed scope, do not share the final sign-off until reviewed. Our local resolution team responds within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Ticket History */}
      {tickets.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-base font-bold text-charcoal">Your Submitted Tickets</h3>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark">
                      {t.status}
                    </span>
                    <span className="text-xs text-gray-400">{t.category}</span>
                  </div>
                  <h4 className="font-bold text-sm text-charcoal mt-1">{t.subject}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                </div>
                <div className="text-[11px] text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
