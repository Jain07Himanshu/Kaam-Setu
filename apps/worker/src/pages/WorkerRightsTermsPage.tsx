import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldCheck, CheckCircle2, BookOpen, AlertCircle, Scale, DollarSign, Calendar, HeartHandshake } from 'lucide-react';

export function WorkerRightsTermsPage() {
  const [charter, setCharter] = useState<any>(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [acceptedRecord, setAcceptedRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    loadCharter();
  }, []);

  async function loadCharter() {
    try {
      setIsLoading(true);
      const res = await api.getWorkerRightsCharter();
      setCharter(res.policy);
      setHasAccepted(res.hasAccepted);
      setAcceptedRecord(res.acceptedRecord);
    } catch (err: any) {
      setError(err.message || 'Failed to load rights charter');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept() {
    setIsAccepting(true);
    setError(null);
    try {
      const res = await api.acceptWorkerTerms(charter?.version || 'v1.0');
      setSuccessMsg('You have successfully accepted the Worker Dignity & Rights Charter.');
      setHasAccepted(true);
      setAcceptedRecord(res.acceptance);
    } catch (err: any) {
      setError(err.message || 'Failed to accept charter');
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
            Statutory Protections & Social Security
          </span>
          <h1 className="text-3xl font-black mt-1">Worker Dignity & Rights Charter</h1>
          <p className="text-orange-100 text-sm mt-2 max-w-xl leading-relaxed">
            Aligned with the <span className="font-bold underline">Code on Social Security 2020</span> and Indian labor standards, Kaam Setu is architected to guarantee independent trade workers full dignity, fair pay, and zero commission exploitation.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center w-full md:w-auto">
          <p className="text-xs uppercase tracking-wider text-orange-200 font-bold">Charter Status</p>
          <p className="text-xl font-black text-white mt-0.5 flex items-center justify-center gap-1.5">
            {hasAccepted ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-300" /> Signed & Active
              </>
            ) : (
              'Action Required'
            )}
          </p>
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

      {/* Core Charter Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-100 text-brand-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Transparent Calling & Visiting Charges</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Every worker has the sovereign right to charge a diagnostic visiting fee. Customers are warned upfront and must acknowledge this before booking.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Zero Arbitrary Deductions</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              100% of customer payments for labor belong authoritatively to you. Kaam Setu never charges hidden deductions or penalties for reasonable job declines.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Autonomous Working Hours</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Toggle your availability online or offline anytime. You are never penalized for declining offers outside your chosen service radius or trade expertise.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Fair Dispute Mediation</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Customer claims are never settled one-sidedly. A human operations arbitrator reviews customer complaints and photo evidence before making decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Charter Text & Legal Citation */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <h2 className="text-base font-black text-gray-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-primary" /> Full Charter Document ({charter?.version || 'v1.0'})
        </h2>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700 leading-relaxed font-sans space-y-3">
          <p>
            {charter?.content ||
              'Kaam Setu operates strictly as an autonomous trade connection platform under Indian electronic commerce standards. All service technicians and independent tradespersons maintain complete professional autonomy.'}
          </p>
          <div className="pt-2 border-t border-gray-200 text-gray-500 text-[11px]">
            <span className="font-bold text-gray-700">Statutory Framework:</span> Ministry of Labour & Employment, Government of India — Code on Social Security 2020 (Sections 113 & 114 regarding Gig & Platform Workers).
          </div>
        </div>

        {/* Acceptance Action */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          {hasAccepted ? (
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>
                Signed on: <span className="font-bold text-gray-900">{acceptedRecord?.acceptedAt ? new Date(acceptedRecord.acceptedAt).toLocaleDateString() : 'Active on record'}</span>
              </span>
            </div>
          ) : (
            <div className="text-xs text-amber-700 font-medium">
              Please review and sign to finalize your worker verified status.
            </div>
          )}

          {!hasAccepted && (
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full md:w-auto px-8 py-3 bg-brand-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-600 transition disabled:opacity-50"
            >
              {isAccepting ? 'Recording Acceptance...' : 'Accept & Sign Worker Charter'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
