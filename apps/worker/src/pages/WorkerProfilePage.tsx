import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
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
} from 'lucide-react';

export const WorkerProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const workerProfile = user?.workerProfile;

  const [bio, setBio] = useState(workerProfile?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  let skillsList: string[] = [];
  try {
    skillsList = typeof workerProfile?.skills === 'string'
      ? JSON.parse(workerProfile.skills)
      : workerProfile?.skills || [];
  } catch (e) {
    skillsList = ['General Maintenance'];
  }

  const verifications = workerProfile?.verifications || [
    { type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
    { type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'Government ID Verified' },
    { type: 'SKILL_CERT', status: 'VERIFIED', notes: 'Trade License Certified' },
    { type: 'BACKGROUND_CHECK', status: 'VERIFIED', notes: 'Background check cleared' },
  ];

  const handleSaveBio = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({ bio });
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update bio:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Worker Trade Profile</h1>
        <p className="text-xs text-gray-500 mt-1">
          Your public credentials, neighborhood verification badges, and customer ratings
        </p>
      </div>

      {/* Main Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'}
            alt={user?.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-surface shadow-sm shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-charcoal">{user?.name}</h2>
              <ShieldCheck className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                {workerProfile?.ratingAvg?.toFixed(1) || '4.9'} ({workerProfile?.ratingCount || 20} reviews)
              </span>
              <span>·</span>
              <span className="font-semibold text-charcoal">
                {workerProfile?.completedJobsCount || 30} Jobs Completed
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {user?.phone || '+1 (555) 432-1098'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-surface border border-brand-secondary/30 text-right w-full sm:w-auto">
          <div className="text-[11px] font-bold uppercase text-brand-primaryDark">Verification Level</div>
          <div className="text-base font-extrabold text-charcoal mt-0.5">Tier 3 Pro Certified</div>
          <div className="text-[11px] text-gray-500">100% Platform Verified</div>
        </div>
      </div>

      {/* Verification Checkpoints Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
          Trust & Identity Verifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {verifications.map((v: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-brand-surface/40 border border-brand-secondary/30 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-brand-cream" />
                </div>
                <div>
                  <div className="text-xs font-bold text-charcoal">
                    {v.type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-gray-500">{v.notes || 'Verified by platform'}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white text-brand-primary border border-brand-secondary/30">
                {v.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Biography & Skills Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">Professional Bio</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-brand-primary hover:text-brand-primaryDark flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : 'Edit Bio'}</span>
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs focus:border-brand-primary outline-none leading-relaxed"
              />
              <button
                onClick={handleSaveBio}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Bio'}</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {workerProfile?.bio || bio || 'No biography provided.'}
            </p>
          )}
        </div>

        {/* Skills List */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">Trade Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {skillsList.map((skill, sIdx) => (
              <span
                key={sIdx}
                className="px-3 py-1.5 rounded-xl bg-brand-surface text-brand-primaryDark border border-brand-secondary/30 text-xs font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
