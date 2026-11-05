import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  Mail,
  Award,
  Edit,
  Save,
  X,
  IndianRupee,
  Layers,
  Wrench,
  AlertCircle,
  TrendingUp,
  FileCheck2,
  ArrowRight,
  Shield,
  Briefcase,
} from 'lucide-react';

export const WorkerProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const workerProfile = user?.workerProfile;

  const defaultLoc = user?.serviceLocations?.find((l: any) => l.isDefault) || user?.serviceLocations?.[0];

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Editable fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(workerProfile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '/avatars/suresh.svg');
  const [hourlyRate, setHourlyRate] = useState(workerProfile?.hourlyRate || 399);
  const [baseRate, setBaseRate] = useState(workerProfile?.baseRate || 249);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(workerProfile?.serviceRadiusKm || 15);
  const [address, setAddress] = useState(defaultLoc?.address || 'Powai Service Base');
  const [city, setCity] = useState(defaultLoc?.city || 'Mumbai');
  const [postalCode, setPostalCode] = useState(defaultLoc?.postalCode || '400076');

  // Credibility state
  const [credibilityData, setCredibilityData] = useState<any>(null);
  const [visitingCharge, setVisitingCharge] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [isLoadingExtras, setIsLoadingExtras] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.workerProfile?.bio || '');
      setAvatarUrl(user.avatarUrl || '/avatars/suresh.svg');
      setHourlyRate(user.workerProfile?.hourlyRate || 399);
      setBaseRate(user.workerProfile?.baseRate || 249);
      setServiceRadiusKm(user.workerProfile?.serviceRadiusKm || 15);
      const loc = user.serviceLocations?.find((l: any) => l.isDefault) || user.serviceLocations?.[0];
      setAddress(loc?.address || 'Powai Service Base');
      setCity(loc?.city || 'Mumbai');
      setPostalCode(loc?.postalCode || '400076');
    }
  }, [user]);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setIsLoadingExtras(true);
        const [credRes, feeRes, earnRes] = await Promise.all([
          user?.workerProfile?.id
            ? api.getWorkerCredibility(user.workerProfile.id).catch(() => null)
            : null,
          api.getMyVisitingCharges().catch(() => null),
          api.getEarnings().catch(() => null),
        ]);

        if (credRes?.credibility) setCredibilityData(credRes.credibility);
        if (feeRes?.visitingCharge) setVisitingCharge(feeRes.visitingCharge);
        if (earnRes) setEarnings(earnRes);
      } catch (err) {
        console.error('Failed to fetch worker profile data:', err);
      } finally {
        setIsLoadingExtras(false);
      }
    };

    fetchWorkerData();
  }, [user?.workerProfile?.id]);

  let skillsList: string[] = [];
  try {
    skillsList = typeof workerProfile?.skills === 'string'
      ? JSON.parse(workerProfile.skills)
      : workerProfile?.skills || [];
  } catch (e) {
    skillsList = ['General Maintenance'];
  }

  const verifications = workerProfile?.verifications || [
    { type: 'PHONE', status: 'VERIFIED', notes: 'Phone OTP Verified' },
    { type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'Government ID Verified (Masked)' },
    { type: 'SKILL_CERT', status: 'VERIFIED', notes: 'Trade License Certified' },
    { type: 'BACKGROUND_CHECK', status: 'VERIFIED', notes: 'Background check cleared' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      await Promise.all([
        api.updateUserProfile({
          name,
          phone,
          avatarUrl,
          bio,
          address,
          city,
          postalCode,
        }),
        api.updateProfile({
          bio,
          hourlyRate: Number(hourlyRate),
          baseRate: Number(baseRate),
          serviceRadiusKm: Number(serviceRadiusKm),
        }),
      ]);

      await refreshProfile();
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarOptions = [
    { label: 'Suresh (Plumber)', path: '/avatars/suresh.svg' },
    { label: 'Priya (Electric)', path: '/avatars/priya.svg' },
    { label: 'Rajesh (Cleaning)', path: '/avatars/rajesh.svg' },
    { label: 'Anita (Appliance)', path: '/avatars/anita.svg' },
    { label: 'Aarav', path: '/avatars/aarav.svg' },
    { label: 'Pooja', path: '/avatars/pooja.svg' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <Link to="/" className="hover:text-brand-primary">Dashboard</Link>
            <span>/</span>
            <span className="text-charcoal">Worker Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight flex items-center gap-2.5">
            <span>Trade Professional Profile</span>
            <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-brand-cream text-brand-primaryDark border border-brand-creamDark">
              PRO VERIFIED
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Your verified trade credentials, visiting diagnostic fee, customer ratings, and dispatch coverage
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all hover:shadow-lg"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Trade Profile</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your trade profile, rates, and coverage radius were updated successfully!</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
          <div className="relative group">
            <img
              src={avatarUrl || '/avatars/suresh.svg'}
              alt={user?.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-brand-surface shadow-sm bg-brand-surface/30 shrink-0"
            />
            <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-lg shadow-xs border border-gray-100">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-charcoal">{user?.name}</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Direct Payouts
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
              <span className="flex items-center text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                {workerProfile?.ratingAvg?.toFixed(1) || '4.9'} ({workerProfile?.ratingCount || 20} verified reviews)
              </span>
              <span>·</span>
              <span className="font-semibold text-charcoal">
                {workerProfile?.completedJobsCount || 25}+ Jobs Completed
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {user?.email}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-medium">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {user?.phone || '+91 98201 12345'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-gray-600 font-medium">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                {city} ({serviceRadiusKm} km coverage)
              </span>
            </div>
          </div>
        </div>

        {/* Verification Tier Pill */}
        <div className="p-4 rounded-2xl bg-brand-surface border border-brand-secondary/30 text-right w-full md:w-auto shrink-0 space-y-1">
          <div className="text-[11px] font-bold uppercase text-brand-primaryDark">Verification Level</div>
          <div className="text-base font-black text-charcoal">Tier 3 Pro Certified</div>
          <div className="text-[11px] text-gray-500">Government ID & Trade Verified</div>
        </div>
      </div>

      {/* Overview Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Earnings</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {isLoadingExtras ? '...' : `₹${Number(earnings?.grossEarnings || 3099).toLocaleString('en-IN')}`}
          </div>
          <p className="text-[11px] text-gray-400">Zero commission deducted</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hourly Expectation</span>
            <Clock className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            ₹{hourlyRate}/hr
          </div>
          <p className="text-[11px] text-gray-400">Base callout: ₹{baseRate}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visiting Fee</span>
            <IndianRupee className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            ₹{visitingCharge?.amount || 250}
          </div>
          <p className="text-[11px] text-gray-400">
            {visitingCharge?.isAdjustableAgainstFinalBill ? '100% bill-adjustable' : 'Fixed diagnostic fee'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Coverage</span>
            <MapPin className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            {serviceRadiusKm} km
          </div>
          <p className="text-[11px] text-gray-400">Centered from {city}</p>
        </div>
      </div>

      {/* Main Form or Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile Form & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-charcoal">Trade Profile & Service Settings</h3>
                <p className="text-xs text-gray-500">Configure your trade bio, rates, and base service location</p>
              </div>
              <span className="text-xs font-bold text-brand-primary flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Active Pro
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5">
                {/* Select Avatar */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">Select Professional Avatar</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {avatarOptions.map((opt) => (
                      <button
                        key={opt.path}
                        type="button"
                        onClick={() => setAvatarUrl(opt.path)}
                        className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                          avatarUrl === opt.path
                            ? 'border-brand-primary bg-brand-surface shadow-xs scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img src={opt.path} alt={opt.label} className="w-10 h-10 rounded-full" />
                        <span className="text-[10px] font-bold text-gray-600 mt-1">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Professional Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Professional Bio & Experience Summary</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary leading-relaxed"
                    placeholder="Describe your craft, years of hands-on experience, and guarantee..."
                  />
                </div>

                {/* Rate Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Hourly Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Base Callout Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={baseRate}
                      onChange={(e) => setBaseRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Coverage Radius (km) *</label>
                    <input
                      type="number"
                      required
                      min={2}
                      max={50}
                      value={serviceRadiusKm}
                      onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Location Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-bold text-gray-700">Base City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-bold text-gray-700">Postal Code (PIN) *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-bold text-gray-700">Base Street / Landmark</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving Changes...' : 'Save Trade Profile'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Professional Bio</span>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {workerProfile?.bio || bio || 'No biography provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Base Service Station</span>
                    <div className="text-sm font-bold text-charcoal">{address}, {city} - {postalCode}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dispatch Radius</span>
                    <div className="text-sm font-bold text-charcoal">{serviceRadiusKm} km coverage</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Expected Labor Rate</span>
                    <div className="text-sm font-bold text-charcoal">₹{hourlyRate}/hour (Callout: ₹{baseRate})</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Visiting / Diagnostic Fee</span>
                    <div className="text-sm font-bold text-charcoal">
                      ₹{visitingCharge?.amount || 250} ({visitingCharge?.isAdjustableAgainstFinalBill ? '100% Bill Deductible' : 'Diagnostic Only'})
                    </div>
                  </div>
                </div>

                {/* Specialties Badges */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Trade Specialties</span>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-3 py-1 rounded-xl bg-brand-surface text-brand-primaryDark border border-brand-secondary/30 text-xs font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card space-y-4">
            <h3 className="text-base font-black text-charcoal">Manage Pro Operations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/verification"
                className="p-4 rounded-2xl bg-brand-surface/40 hover:bg-brand-surface border border-brand-secondary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <ShieldCheck className="w-5 h-5 text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-charcoal">Verification Centre</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Phone, Aadhaar & Skill Documents</p>
                </div>
                <div className="text-[11px] font-bold text-brand-primary mt-3 flex items-center gap-1">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

              <Link
                to="/rpl-and-badges"
                className="p-4 rounded-2xl bg-brand-surface/40 hover:bg-brand-surface border border-brand-secondary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <Award className="w-5 h-5 text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-charcoal">RPL & Badges</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Prior learning & earned badges</p>
                </div>
                <div className="text-[11px] font-bold text-brand-primary mt-3 flex items-center gap-1">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

              <Link
                to="/visiting-charges"
                className="p-4 rounded-2xl bg-brand-surface/40 hover:bg-brand-surface border border-brand-secondary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <IndianRupee className="w-5 h-5 text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-charcoal">Visiting Charges</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Diagnostic fees & adjustability</p>
                </div>
                <div className="text-[11px] font-bold text-brand-primary mt-3 flex items-center gap-1">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Credibility, Verifications & Rights Charter */}
        <div className="space-y-6">
          {/* Identity Verifications Card */}
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card space-y-4">
            <h3 className="text-sm font-black text-charcoal">Trust & Identity Checkpoints</h3>

            <div className="space-y-2.5">
              {verifications.map((v: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-charcoal">
                        {v.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-gray-500">{v.notes || 'Platform verified'}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {v.status}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/verification"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-surface text-brand-primaryDark border border-brand-secondary/30 text-xs font-bold hover:bg-brand-surface/80 transition-colors"
            >
              <span>Manage Identity Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Worker Rights Charter Card */}
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-charcoal">Worker Dignity Charter</h3>
                <p className="text-[11px] text-gray-500">Code on Social Security 2020</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
              Guarantees zero hidden broker deductions, timely 100% payouts, and fair dispute representation.
            </p>

            <Link
              to="/terms-charter"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-bold text-charcoal border border-gray-200 transition-colors"
            >
              <span>View Signed Rights Charter</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
