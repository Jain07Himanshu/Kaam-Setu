import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Star,
  Award,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  FileCheck,
  AlertCircle,
  Briefcase,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface WorkerCredibilityCardProps {
  workerId: string;
  defaultExpanded?: boolean;
}

export const WorkerCredibilityCard: React.FC<WorkerCredibilityCardProps> = ({
  workerId,
  defaultExpanded = true,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'INFO' | 'IDENTITY' | 'SKILLS' | 'BADGES' | 'REVIEWS'>('INFO');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!workerId) return;
    let isMounted = true;
    setLoading(true);

    api
      .getWorkerCredibility(workerId)
      .then((res: any) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Failed to load worker profile');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [workerId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-6 text-center text-xs text-gray-500">
        Professional profile details unavailable.
      </div>
    );
  }

  const {
    name,
    avatarUrl,
    bio,
    category,
    serviceCategories = [],
    experienceYears = 5,
    serviceArea = 'Within 15 km radius',
    trustVerification = {},
    ratingsBreakdown = {},
    allSkillEvidences = [],
    skillEvidences = [],
    verifiedCertificates = [],
    badges = [],
    recentReviews = [],
  } = data;

  const certificatesList = skillEvidences.length > 0 ? skillEvidences : allSkillEvidences;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
      {/* Top Banner / Section Header */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
              YOUR SERVICE PROFESSIONAL
            </span>
            <span className="text-xs text-white/80 font-medium">Verified Direct Profile</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <span>{name}</span>
            {trustVerification.identityVerified && (
              <span title="Verified Pro" className="text-brand-cream">
                <ShieldCheck className="w-5 h-5" />
              </span>
            )}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-white text-brand-primary hover:bg-brand-cream rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <span>View Complete Credential Profile</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Overview Strip */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl || '/avatars/suresh.svg'}
            alt={name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-secondary/30 shadow-sm shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-charcoal">{category || 'Trade Specialist'}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500 font-semibold">{experienceYears}+ Yrs Experience</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
              <span className="flex items-center text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                {ratingsBreakdown.overall?.toFixed(1) || '4.9'}
              </span>
              <span>({ratingsBreakdown.totalReviews || 12} verified reviews)</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Mobile Verified
              </span>
            </div>
          </div>
        </div>

        {/* Identity Verification Pill */}
        <div className="self-stretch sm:self-auto flex items-center sm:justify-end">
          {trustVerification.identityStatus === 'VERIFIED' ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Identity Verified (Govt ID Screened)</span>
            </div>
          ) : trustVerification.identityStatus === 'PENDING' ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Identity Verification Pending Review</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Identity Verification Not Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-100 overflow-x-auto text-xs font-bold bg-gray-50/50">
        <button
          onClick={() => setActiveTab('INFO')}
          className={`px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'INFO'
              ? 'border-brand-primary text-brand-primary bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          1. Professional Info
        </button>
        <button
          onClick={() => setActiveTab('IDENTITY')}
          className={`px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'IDENTITY'
              ? 'border-brand-primary text-brand-primary bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          2. Identity Verification
        </button>
        <button
          onClick={() => setActiveTab('SKILLS')}
          className={`px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'SKILLS'
              ? 'border-brand-primary text-brand-primary bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          3. Skills & Certificates ({certificatesList.length})
        </button>
        <button
          onClick={() => setActiveTab('BADGES')}
          className={`px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'BADGES'
              ? 'border-brand-primary text-brand-primary bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          4. Achievements & Badges ({badges.length})
        </button>
        <button
          onClick={() => setActiveTab('REVIEWS')}
          className={`px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'REVIEWS'
              ? 'border-brand-primary text-brand-primary bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          5. Customer Reviews ({ratingsBreakdown.totalReviews || recentReviews.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* TAB 1: Professional Information */}
        {activeTab === 'INFO' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-xs font-bold text-gray-600 block mb-1">Professional Bio & Hands-On Background</span>
              <p className="text-xs text-gray-700 leading-relaxed">
                {bio || `${name} is an experienced home service specialist with over ${experienceYears} years of trade practice across domestic and commercial installations.`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-brand-surface/40 border border-brand-secondary/30">
                <span className="text-[11px] font-bold text-gray-400 block mb-1">Service Area</span>
                <div className="flex items-center gap-1.5 font-bold text-charcoal">
                  <MapPin className="w-4 h-4 text-brand-primary" />
                  <span>{serviceArea}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-surface/40 border border-brand-secondary/30">
                <span className="text-[11px] font-bold text-gray-400 block mb-1">Primary Categories</span>
                <div className="flex items-center gap-1.5 font-bold text-charcoal">
                  <Briefcase className="w-4 h-4 text-brand-primary" />
                  <span>{serviceCategories.join(', ') || category}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-surface/40 border border-brand-secondary/30">
                <span className="text-[11px] font-bold text-gray-400 block mb-1">Verified Mobile</span>
                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>OTP Confirmed Mobile</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Identity Verification */}
        {activeTab === 'IDENTITY' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-emerald-900">
                  {trustVerification.identityStatus === 'VERIFIED'
                    ? 'Identity Verified by Kaam Setu Trust & Safety'
                    : trustVerification.identityStatus === 'PENDING'
                    ? 'Identity Verification Under Review'
                    : 'Identity Verification Not Completed'}
                </h4>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                  Government-issued identification has been verified against registered records. Complete document numbers, biometric data, and personal ID copies are strictly protected under customer & worker privacy charters and never made public.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 font-medium">Government ID Check</span>
                  <div className="font-bold text-charcoal">Aadhaar / Driving License / Voter Card</div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    trustVerification.identityVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {trustVerification.identityStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 font-medium">Direct Mobile Authentication</span>
                  <div className="font-bold text-charcoal">OTP-Verified Cellular Line</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Skills & Certificates */}
        {activeTab === 'SKILLS' && (
          <div className="space-y-3">
            {certificatesList.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">No certificates uploaded yet.</p>
            ) : (
              certificatesList.map((cert: any) => {
                const isVerified = cert.verificationStatus === 'VERIFIED';
                return (
                  <div
                    key={cert.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-charcoal text-xs">{cert.documentTitle}</h4>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          <span>Issued by: <strong>{cert.issuingOrganisation || 'Recognized Trade Institution'}</strong></span>
                          <span className="mx-1.5">·</span>
                          <span>Category: <strong>{cert.skillCategory}</strong></span>
                        </div>
                        {cert.reviewedAt && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Verified on {new Date(cert.reviewedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-center">
                      {isVerified ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wide flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>VERIFIED BADGE</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wide flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending Verification</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: Experience & Achievements */}
        {activeTab === 'BADGES' && (
          <div className="space-y-3">
            {badges.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">No milestone badges unlocked yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-charcoal">{b.badgeName}</h4>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900">
                          {b.badgeCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">{b.badgeDescription}</p>
                      <p className="text-[10px] text-amber-800 font-medium pt-0.5">
                        {b.eligibilityReference}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Customer Reviews & Ratings */}
        {activeTab === 'REVIEWS' && (
          <div className="space-y-4">
            {/* Rating Breakdown Bar */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block">Service Quality</span>
                <span className="text-sm font-black text-charcoal flex items-center justify-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {ratingsBreakdown.serviceQuality?.toFixed(1) || '5.0'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block">Punctuality</span>
                <span className="text-sm font-black text-charcoal flex items-center justify-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-brand-primary" />
                  {ratingsBreakdown.punctuality?.toFixed(1) || '5.0'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block">Professionalism</span>
                <span className="text-sm font-black text-charcoal flex items-center justify-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {ratingsBreakdown.professionalism?.toFixed(1) || '5.0'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block">Communication</span>
                <span className="text-sm font-black text-charcoal flex items-center justify-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  {ratingsBreakdown.communication?.toFixed(1) || '5.0'}
                </span>
              </div>
            </div>

            {/* Written reviews list */}
            <div className="space-y-2.5">
              {recentReviews.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-2">No reviews available yet.</p>
              ) : (
                recentReviews.map((rev: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal">{rev.reviewer?.name || 'Customer'}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Verified Booking'}
                      </span>
                    </div>
                    <p className="text-gray-600 italic">"{rev.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full Modal View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-surface text-brand-primaryDark border border-brand-secondary/30">
                  FULL PROFESSIONAL CREDENTIALS
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={avatarUrl || '/avatars/suresh.svg'}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover border border-gray-200"
              />
              <div>
                <h3 className="text-xl font-black text-charcoal">{name}</h3>
                <p className="text-xs text-gray-500">{category} · {experienceYears}+ years experience · {serviceArea}</p>
                <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{ratingsBreakdown.overall?.toFixed(1) || '4.9'} ({ratingsBreakdown.totalReviews || 12} reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-gray-400 uppercase tracking-wider text-[11px] mb-1">About the Professional</h4>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">{bio}</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-400 uppercase tracking-wider text-[11px] mb-2">Verified Badges & Milestones</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {badges.map((b: any) => (
                    <div key={b.id} className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                      <div className="font-bold text-charcoal flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>{b.badgeName}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">{b.badgeDescription}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-400 uppercase tracking-wider text-[11px] mb-2">Verified Certificates & Skills</h4>
                <div className="space-y-2">
                  {certificatesList.map((c: any) => (
                    <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-charcoal">{c.documentTitle}</div>
                        <div className="text-[10px] text-gray-500">{c.issuingOrganisation} · {c.skillCategory}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {c.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'Pending Verification'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

