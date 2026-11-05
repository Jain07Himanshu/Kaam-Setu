import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Award, Sparkles, CheckCircle2, Clock, Plus, Star, ShieldCheck, Heart } from 'lucide-react';

export function RplAndBadgesPage() {
  const [credibilityData, setCredibilityData] = useState<any>(null);
  const [rplStatus, setRplStatus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // RPL Form
  const [isApplying, setIsApplying] = useState(false);
  const [rplCategory, setRplCategory] = useState('plumbing');
  const [yearsExp, setYearsExp] = useState(5);
  const [summary, setSummary] = useState('');
  const [refName, setRefName] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [isSubmittingRpl, setIsSubmittingRpl] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [meRes, rplRes] = await Promise.all([
        api.getMe(),
        api.getWorkerRplStatus().catch(() => ({ applications: [] })),
      ]);

      setRplStatus(rplRes.applications || []);

      if (meRes.user?.workerProfile?.id) {
        const credRes = await api.getWorkerCredibility(meRes.user.workerProfile.id);
        setCredibilityData(credRes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load RPL and badges data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApplyRpl(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmittingRpl(true);

    try {
      await api.submitRplApplication({
        skillCategory: rplCategory,
        yearsOfPriorExperience: Number(yearsExp),
        selfReportedWorkSummary: summary,
        references: refName && refPhone ? [{ name: refName, phone: refPhone, relationship: 'Contractor/Client' }] : undefined,
      });

      setSuccessMsg('RPL Application submitted! Our trade assessment committee will review your portfolio.');
      setIsApplying(false);
      setSummary('');
      setRefName('');
      setRefPhone('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit RPL application');
    } finally {
      setIsSubmittingRpl(false);
    }
  }

  const badges = credibilityData?.badges || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
            Recognition of Prior Learning (RPL) & Experience
          </span>
          <h1 className="text-3xl font-black mt-1">Mastery Badges & RPL Credentials</h1>
          <p className="text-purple-200 text-sm mt-2 max-w-xl leading-relaxed">
            Have years of hands-on field experience without formal college certificates? Kaam Setu grants official RPL recognition based on practical portfolio review and automatically awards milestones for verified jobs completed on our platform.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center w-full md:w-auto">
          <p className="text-xs uppercase tracking-wider text-purple-200 font-bold">Earned Badges</p>
          <p className="text-3xl font-black text-amber-300 mt-0.5">{badges.length}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Badges Gallery */}
      <div className="mb-10">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-primary" /> Your Earned Credibility Badges
        </h2>
        {badges.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-sm text-gray-400">
            No badges awarded yet. Complete your first booking or submit an RPL application to unlock badges!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {badges.map((b: any) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {b.badgeCategory}
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 text-sm mb-1">{b.badgeName}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.badgeDescription}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
                  {b.eligibilityReference}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RPL (Recognition of Prior Learning) Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-700" /> Recognition of Prior Learning (RPL) Applications
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Get certified for your practical trade knowledge and real-world workmanship experience.
            </p>
          </div>
          {!isApplying && (
            <button
              onClick={() => setIsApplying(true)}
              className="inline-flex items-center gap-1.5 bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-purple-800 transition"
            >
              <Plus className="w-4 h-4" /> Apply for RPL Recognition
            </button>
          )}
        </div>

        {/* Existing applications list */}
        {rplStatus.length > 0 && (
          <div className="space-y-3 mb-6">
            {rplStatus.map((app: any) => (
              <div key={app.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 capitalize">{app.skillCategory}</span>
                    <span className="text-gray-500">• {app.yearsOfPriorExperience} Years Experience</span>
                  </div>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Submitted: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    app.assessmentStatus === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : app.assessmentStatus === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {app.assessmentStatus}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Application Form */}
        {isApplying && (
          <form onSubmit={handleApplyRpl} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Trade Category *</label>
                <select
                  value={rplCategory}
                  onChange={(e) => setRplCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-purple-700 bg-white"
                >
                  <option value="plumbing">Plumbing & Sanitary Works</option>
                  <option value="electrical">Electrical & Wiring</option>
                  <option value="carpentry">Carpentry & Furniture</option>
                  <option value="painting">House Painting & Polishing</option>
                  <option value="appliances">Appliance Repair</option>
                  <option value="cleaning">Professional Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Years of Practical Experience *</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={yearsExp}
                  onChange={(e) => setYearsExp(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Work Portfolio Summary *</label>
              <textarea
                rows={3}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe your practical field experience (types of jobs handled, common residential issues solved, tools used, previous local contractor associations)..."
                className="w-full text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-purple-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Senior Contractor / Client Reference Name</label>
                <input
                  type="text"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar (Senior Contractor)"
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reference Mobile Number</label>
                <input
                  type="tel"
                  value={refPhone}
                  onChange={(e) => setRefPhone(e.target.value)}
                  placeholder="e.g. 9811223344"
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsApplying(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRpl}
                className="px-6 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md hover:bg-purple-800 disabled:opacity-50"
              >
                {isSubmittingRpl ? 'Submitting...' : 'Submit Portfolio for RPL Assessment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
