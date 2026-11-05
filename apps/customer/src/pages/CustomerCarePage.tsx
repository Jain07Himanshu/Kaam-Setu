import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Phone, Mail, Clock, HelpCircle, AlertCircle, CheckCircle, ShieldCheck, FileText, ChevronRight } from 'lucide-react';

export function CustomerCarePage() {
  const [careInfo, setCareInfo] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('BOOKING_ISSUE');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [careRes, ticketsRes] = await Promise.all([
        api.getCustomerCare(),
        api.getMySupportTickets().catch(() => ({ tickets: [] })),
      ]);
      setCareInfo(careRes);
      setTickets(ticketsRes.tickets || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer care information');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      await api.createSupportTicket({
        category,
        subject,
        description,
      });
      setSuccessMsg('Your grievance/ticket has been submitted. Our grievance officer will review it within 2 hours.');
      setSubject('');
      setDescription('');
      const updatedTickets = await api.getMySupportTickets();
      setTickets(updatedTickets.tickets || []);
    } catch (err: any) {
      setError(err.message || 'Failed to submit support ticket');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Care Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-brand-primary/20 text-brand-primary text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
            24/7 Customer Care & Rapid Help
          </span>
          <h1 className="text-3xl font-black mt-1">We are here to protect & assist you</h1>
          <p className="text-gray-300 text-sm mt-2 max-w-xl leading-relaxed">
            Need urgent assistance, want to report a worker grievance, or resolve a pricing disagreement? Speak directly with our dedicated operations team or lodge a formal resolution ticket.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center w-full md:w-auto">
          <p className="text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Direct Telephone Helpline</p>
          <a
            href={`tel:${careInfo?.customerCarePhone || '+918000012345'}`}
            className="text-2xl font-black text-brand-primary hover:text-orange-400 transition flex items-center justify-center gap-2"
          >
            <Phone className="w-6 h-6 animate-pulse" />
            {careInfo?.customerCarePhone || '+91 80000 12345'}
          </a>
          <p className="text-[11px] text-gray-400 mt-1">Tap to call our National Help Desk</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Emergency Helplines Directory */}
      <div className="mb-8">
        <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-primary" /> National Emergency Numbers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(careInfo?.helplineDirectory || [
            { name: 'National Emergency', number: '112', purpose: 'Police, Fire, Ambulance' },
            { name: 'Police Control', number: '100', purpose: 'Immediate Police Assistance' },
            { name: 'Women Helpline', number: '1091', purpose: 'Safety & Protection' },
            { name: 'Ambulance', number: '108', purpose: 'Medical Emergency' },
          ]).map((h: any) => (
            <a
              key={h.number}
              href={`tel:${h.number}`}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-brand-primary transition block text-center group"
            >
              <span className="text-xl font-black text-gray-900 group-hover:text-brand-primary transition block">
                {h.number}
              </span>
              <span className="text-xs font-bold text-gray-700 block mt-0.5">{h.name}</span>
              <span className="text-[10px] text-gray-400 block mt-1">{h.purpose}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Support Ticket Submission Form */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-primary" /> Submit a Service Complaint or Query
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            All tickets are timestamped and assigned to a certified resolution specialist under Consumer Protection Act norms.
          </p>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-white"
              >
                <option value="BOOKING_ISSUE">Booking & Scheduling Problem</option>
                <option value="WORKER_BEHAVIOUR">Worker Professionalism / Behaviour Report</option>
                <option value="PRICING_DISPUTE">Pricing Dispute / Unauthorized Callout Charges</option>
                <option value="SAFETY_CONCERN">Urgent Safety / Property Concern</option>
                <option value="CANCELLATION">Cancellation & Refund Assistance</option>
                <option value="PAYMENT_ISSUE">Payment & Invoice Issue</option>
                <option value="TECHNICAL_PROBLEM">App or Technical Glitch</option>
                <option value="GENERAL">General Inquiries & Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Subject / Summary *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your inquiry or issue"
                className="w-full text-sm px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Description *</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what happened, including any relevant dates, worker details, or specific actions requested..."
                className="w-full text-sm px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-orange-600 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Logging Ticket...' : 'Submit Resolution Ticket'}
            </button>
          </form>
        </div>

        {/* Side Panel: Your Recent Tickets */}
        <div>
          <h2 className="text-base font-black text-gray-900 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand-primary" /> Your Active Tickets
          </h2>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="bg-white rounded-xl p-5 border border-gray-100 text-center text-xs text-gray-400">
                You have no active support tickets.
              </div>
            ) : (
              tickets.slice(0, 5).map((t) => (
                <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-gray-900 truncate max-w-[140px]">{t.subject}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-700'
                          : t.status === 'OPEN'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-gray-500 line-clamp-2 mb-2">{t.description}</p>
                  <p className="text-[10px] text-gray-400">
                    Category: {t.category} • {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed">
            <span className="font-bold block text-gray-800 mb-1">Our Safety & Service Guarantee:</span>
            {careInfo?.safetyPledge ||
              'Kaam Setu guarantees worker dignity, customer security, zero unauthorized price extortion, and prompt grievance resolution.'}
          </div>
        </div>
      </div>
    </div>
  );
}
