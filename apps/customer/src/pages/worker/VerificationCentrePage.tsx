import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldCheck, Phone, FileText, Award, CheckCircle, AlertTriangle, Send, QrCode, Upload } from 'lucide-react';

export function VerificationCentrePage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Phone OTP
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // ID Upload
  const [docType, setDocType] = useState('AADHAAR');
  const [identifierInput, setIdentifierInput] = useState('');
  const [isUploadingId, setIsUploadingId] = useState(false);

  // Skill Proof
  const [skillCategory, setSkillCategory] = useState('plumbing');
  const [certTitle, setCertTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [isUploadingSkill, setIsUploadingSkill] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setIsLoading(true);
      const data = await api.getWorkerVerificationDashboard();
      setDashboard(data);
      if (data.profile?.user?.phone) {
        setPhoneInput(data.profile.user.phone);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load verification status');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMobileOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSendingOtp(true);
    try {
      const res = await api.sendWorkerMobileOtp(phoneInput);
      setShowOtpInput(true);
      setSuccessMsg(res.message);
      if (res.simulatedOtp) {
        setOtpInput(res.simulatedOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send mobile OTP');
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyMobileOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.verifyWorkerMobileOtp(otpInput);
      setSuccessMsg('Mobile number verified successfully!');
      setShowOtpInput(false);
      setOtpInput('');
      loadDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to verify mobile OTP');
    }
  }

  async function handleUploadIdentity(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsUploadingId(true);
    try {
      await api.submitIdentityDocument({
        documentType: docType,
        identifier: identifierInput,
      });
      setSuccessMsg('Government identity document submitted for review. Masked preview generated.');
      setIdentifierInput('');
      loadDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to submit identity document');
    } finally {
      setIsUploadingId(false);
    }
  }

  async function handleUploadSkill(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsUploadingSkill(true);
    try {
      const res = await api.submitSkillEvidence({
        skillCategory,
        documentTitle: certTitle,
        issuingOrganisation: issuer,
      });
      setSuccessMsg('Skill evidence submitted.');

      // Auto-trigger instant QR verification adapter demo
      if (res.evidence?.id) {
        await api.verifyCertificateQr({
          workerSkillEvidenceId: res.evidence.id,
          qrData: JSON.stringify({
            certNo: `SKILL-IN-${Date.now().toString().slice(-6)}`,
            issuer: issuer || 'National Skill Development Corporation',
            valid: true,
          }),
        }).catch(() => {});
      }

      setCertTitle('');
      setIssuer('');
      loadDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to submit skill proof');
    } finally {
      setIsUploadingSkill(false);
    }
  }

  const isPhoneVerified = dashboard?.trustScore?.phoneVerified;
  const isIdVerified = dashboard?.trustScore?.identityVerified;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
            Professional Verification Hub
          </span>
          <h1 className="text-3xl font-black mt-1">Worker Credibility & Trust Center</h1>
          <p className="text-gray-300 text-sm mt-2 max-w-xl leading-relaxed">
            Verified professionals get up to 3x more service bookings, instant badge badges, and higher quote acceptance rates from customers across your neighborhood.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center">
          <p className="text-xs uppercase tracking-wider text-gray-300 font-bold">Trust Standing</p>
          <p className="text-3xl font-black text-green-400 mt-0.5">
            {isPhoneVerified && isIdVerified ? 'Verified Pro' : 'In Progress'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Step 1: Mobile Phone Verification */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isPhoneVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-brand-primary'}`}>
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">1. Mobile Phone Verification</h2>
                <p className="text-xs text-gray-500">Ensure SMS OTP connectivity for job dispatches</p>
              </div>
            </div>
            {isPhoneVerified ? (
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Phone Verified
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
                Verification Required
              </span>
            )}
          </div>

          {!isPhoneVerified ? (
            <div className="space-y-3 max-w-md pt-2">
              {!showOtpInput ? (
                <form onSubmit={handleSendMobileOtp} className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="flex-1 text-sm px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="px-5 py-2.5 bg-brand-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {isSendingOtp ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyMobileOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Enter 6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-xl font-mono font-bold py-2 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOtpInput(false)}
                      className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={otpInput.length < 6}
                      className="flex-1 py-2 text-xs font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50"
                    >
                      Confirm Phone OTP
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 flex items-center justify-between">
              <span>Verified Number: <span className="font-mono font-bold text-gray-800">{dashboard?.profile?.user?.phone}</span></span>
              <span className="text-gray-400">Locked to Account</span>
            </div>
          )}
        </div>

        {/* Step 2: Government Identity Document */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isIdVerified ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">2. Government Identity Verification</h2>
                <p className="text-xs text-gray-500">Aadhaar, Passport, Voter ID, or Driving License with masked storage</p>
              </div>
            </div>
            {isIdVerified ? (
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> ID Verified
              </span>
            ) : dashboard?.documents?.some((d: any) => d.verificationStatus === 'SUBMITTED') ? (
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                Review Pending
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
                Not Submitted
              </span>
            )}
          </div>

          {/* List of submitted IDs */}
          {dashboard?.documents && dashboard.documents.length > 0 && (
            <div className="mb-4 space-y-2">
              {dashboard.documents.map((d: any) => (
                <div key={d.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-800">{d.documentType}</span>
                    <span className="ml-2 font-mono text-gray-500">{d.maskedIdentifier}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${d.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                    {d.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isIdVerified && (
            <form onSubmit={handleUploadIdentity} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-white"
                >
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PASSPORT">Indian Passport</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Document Number / ID</label>
                <input
                  type="text"
                  required
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="w-full text-xs px-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isUploadingId}
                  className="w-full py-2.5 bg-brand-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {isUploadingId ? 'Submitting...' : 'Upload & Mask ID'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Step 3: Skill Evidence & Certification */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">3. Skill Proof & Trade Certificates</h2>
                <p className="text-xs text-gray-500">ITI, NSDC, Skill India, apprenticeship letters, or vocational credentials</p>
              </div>
            </div>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" /> QR / DigiLocker
            </span>
          </div>

          {dashboard?.skills && dashboard.skills.length > 0 && (
            <div className="mb-4 space-y-2">
              {dashboard.skills.map((s: any) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{s.documentTitle}</span>
                    <span className="ml-2 text-gray-500">({s.skillCategory})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${s.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                    {s.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleUploadSkill} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Trade Category</label>
              <select
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-white"
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="cleaning">Cleaning</option>
                <option value="appliances">Appliances</option>
                <option value="carpentry">Carpentry</option>
                <option value="painting">Painting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Certificate / Document Title</label>
              <input
                type="text"
                required
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="e.g. ITI National Trade Certificate"
                className="w-full text-xs px-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isUploadingSkill}
                className="w-full py-2.5 bg-brand-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-600 transition disabled:opacity-50"
              >
                {isUploadingSkill ? 'Recording...' : 'Submit & Verify Proof'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
