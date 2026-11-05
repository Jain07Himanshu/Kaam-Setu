import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, CheckCircle2, AlertCircle, Eye, ShieldCheck, HelpCircle } from 'lucide-react';

export function VisitingChargesSettingsPage() {
  const [amount, setAmount] = useState(150);
  const [isAdjustable, setIsAdjustable] = useState(true);
  const [terms, setTerms] = useState(
    'Standard diagnostic visit fee upon doorstep arrival. 100% credited against total labor invoice if job proceeds.'
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setIsLoading(true);
      const res = await api.getMyVisitingCharges();
      if (res) {
        setAmount(res.amount ?? 150);
        setIsAdjustable(res.isRefundableOrAdjustable ?? true);
        if (res.terms) setTerms(res.terms);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load visiting charge settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      await api.updateMyVisitingCharges({
        amount: Number(amount),
        isRefundableOrAdjustable: isAdjustable,
        terms,
      });
      setSuccessMsg('Visiting charge policy saved successfully! Customers will see these terms upfront before booking.');
    } catch (err: any) {
      setError(err.message || 'Failed to update visiting charges');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-brand-primary/20 text-brand-primary text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
            Transparent Pricing Engine
          </span>
          <h1 className="text-3xl font-black mt-1">Visiting & Inspection Charges</h1>
          <p className="text-gray-300 text-sm mt-2 max-w-xl leading-relaxed">
            Protect your travel time and vehicle expenses. Define your visiting/callout charge. Customers must explicitly acknowledge and accept these terms before confirming your visit.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center w-full md:w-auto">
          <p className="text-xs uppercase tracking-wider text-gray-300 font-bold">Your Visiting Charge</p>
          <p className="text-3xl font-black text-brand-primary mt-0.5">₹{amount}</p>
          <p className="text-[11px] text-gray-400 mt-1">{isAdjustable ? 'Adjustable against bill' : 'Non-adjustable'}</p>
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
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings Form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-primary" /> Configure Policy
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Changes take effect immediately on all upcoming customer quote previews.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Visiting Inspection Fee (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full text-sm pl-8 pr-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-bold text-gray-900"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Recommended: ₹100 - ₹300 for neighborhood diagnostic visits</p>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdjustable}
                  onChange={(e) => setIsAdjustable(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary mt-1"
                />
                <div>
                  <span className="block text-xs font-bold text-gray-800">
                    Adjust against final invoice (Recommended)
                  </span>
                  <span className="block text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    If customer approves and hires the repair work on-site, this fee is deducted 100% from the total service price. (Increases customer booking conversion by 85%).
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Terms & Conditions / Scope
              </label>
              <textarea
                rows={3}
                required
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Specify your visiting rules, what is covered in diagnostic inspection..."
                className="w-full text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-brand-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-600 transition disabled:opacity-50 mt-2"
            >
              {isSaving ? 'Saving Policy...' : 'Save Visiting Policy'}
            </button>
          </form>
        </div>

        {/* Live Customer Preview */}
        <div>
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-700" /> Customer Warning Preview
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed mb-4">
              Before a customer accepts your quote or confirms your arrival, this modal appears requiring their digital signature:
            </p>

            <div className="bg-white rounded-xl p-4 border border-amber-300 shadow-sm text-xs">
              <div className="flex items-center gap-2 mb-2 text-brand-primary font-bold">
                <ShieldCheck className="w-4 h-4" /> Pre-Booking Visiting Fee Notice
              </div>
              <p className="text-gray-700 leading-relaxed mb-3">
                Technician charges an upfront diagnostic fee of <span className="font-bold text-gray-900">₹{amount}</span>.
              </p>
              <div className="bg-gray-50 p-2.5 rounded-lg text-[11px] text-gray-600 mb-3 border border-gray-100">
                "{terms}"
              </div>
              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                ✓ Customer must click "I understand and agree" before booking is scheduled.
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 leading-relaxed">
            <span className="font-bold block text-gray-800 mb-1">Protection Under Platform Guidelines:</span>
            Customers are legally bound to pay the agreed inspection fee upon doorstep arrival if they decide not to proceed with the work after diagnostics.
          </div>
        </div>
      </div>
    </div>
  );
}
