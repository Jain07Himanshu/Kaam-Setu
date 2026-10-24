import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LifeBuoy, Send, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

export const WorkerSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [category, setCategory] = useState('BOOKING_ISSUE');
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

      setSuccessMsg('Worker inquiry submitted. Our local support desk will review and reply.');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Worker Trade Support & Safety</h1>
        <p className="text-xs text-gray-500 mt-1">
          Assistance with customer communication, job-site safety reports, and platform guidance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-bold text-charcoal">Submit Support Request</h2>

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
                Inquiry Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-charcoal focus:border-brand-primary outline-none"
              >
                <option value="BOOKING_ISSUE">Customer Unresponsive / Job Site Issue</option>
                <option value="PAYMENT_QUERY">Price / Scope Disagreement</option>
                <option value="SAFETY_REPORT">Safety Concern / Hazard</option>
                <option value="GENERAL">General Platform Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Subject
              </label>
              <input
                type="text"
                placeholder="Brief subject of the inquiry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Detailed Description
              </label>
              <textarea
                rows={4}
                placeholder="Please describe the situation..."
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
                <span>{isSubmitting ? 'Submitting...' : 'Send to Support'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-brand-surface border border-brand-secondary/30 space-y-3">
            <ShieldCheck className="w-8 h-8 text-brand-primary" />
            <h4 className="font-bold text-sm text-charcoal">Worker Safety & Protection</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              If an on-site condition is unsafe or does not match the customer's stated scope, you are fully entitled to pause work without penalty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
