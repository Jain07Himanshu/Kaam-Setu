import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Plus, Phone, Trash2, CheckCircle, AlertTriangle, Send, User, Heart, Lock } from 'lucide-react';

export function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add form state
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Family',
    phone: '',
    email: '',
    priorityOrder: 1,
  });

  // OTP Verification state
  const [verifyingContactId, setVerifyingContactId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getEmergencyContacts();
      setContacts(data.contacts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load emergency contacts');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      await api.addEmergencyContact(formData);
      setSuccessMsg('Emergency contact added successfully.');
      setIsAdding(false);
      setFormData({
        name: '',
        relationship: 'Family',
        phone: '',
        email: '',
        priorityOrder: contacts.length + 1,
      });
      loadContacts();
    } catch (err: any) {
      setError(err.message || 'Failed to add emergency contact');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this emergency contact?')) return;
    try {
      await api.deleteEmergencyContact(id);
      setSuccessMsg('Emergency contact deleted.');
      loadContacts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete emergency contact');
    }
  }

  async function handleSendOtp(id: string) {
    setError(null);
    setOtpNotice(null);
    try {
      const res = await api.sendContactOtp(id);
      setVerifyingContactId(id);
      setOtpNotice(res.message);
      if (res.simulatedOtp) {
        setOtpInput(res.simulatedOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    }
  }

  async function handleConfirmOtp(id: string) {
    setIsVerifying(true);
    setError(null);
    try {
      await api.verifyContactOtp(id, otpInput);
      setSuccessMsg('Emergency contact phone number verified successfully!');
      setVerifyingContactId(null);
      setOtpInput('');
      setOtpNotice(null);
      loadContacts();
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-primary to-orange-600 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-7 h-7 text-white" />
            <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Safety First
            </span>
          </div>
          <h1 className="text-2xl font-black">Trusted Emergency Contacts</h1>
          <p className="text-orange-100 text-sm mt-1 max-w-xl">
            Register up to 3 trusted family members or friends. In any in-home emergency or unacknowledged check-in, our automated rapid dialer will instantly call and message them.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center">
          <p className="text-xs uppercase tracking-wider text-orange-200">Registered</p>
          <p className="text-3xl font-black">{contacts.length} / 3</p>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Privacy Notice Box */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
        <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Strict Customer Privacy Protection:</span> Only you can view or modify these emergency contacts. Service professionals and workers on Kaam Setu never have access to this information under any circumstances.
        </div>
      </div>

      {/* Contacts List */}
      <div className="space-y-4 mb-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading your emergency contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
            <div className="w-14 h-14 bg-orange-100 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">No Emergency Contacts Registered</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Add someone you trust so they can be immediately alerted in case you trigger an SOS or fail a scheduled safety check-in.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 bg-brand-primary text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:bg-orange-600 transition"
            >
              <Plus className="w-4 h-4" /> Add First Contact
            </button>
          </div>
        ) : (
          contacts.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-50 border border-orange-100 text-brand-primary rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg">
                  #{c.priorityOrder}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-900 text-base">{c.name}</h3>
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-500" /> {c.relationship}
                    </span>
                    {c.isVerified ? (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Unverified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {c.maskedPhone || c.phone}
                    </span>
                    {c.email && (
                      <span className="text-gray-500">{c.email}</span>
                    )}
                    <span className="text-gray-400">
                      Priority Order: {c.priorityOrder === 1 ? 'Primary (1st dialed)' : c.priorityOrder === 2 ? 'Secondary' : 'Tertiary'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {!c.isVerified && (
                  <button
                    onClick={() => handleSendOtp(c.id)}
                    className="inline-flex items-center gap-1 bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-600 transition"
                  >
                    <Send className="w-3 h-3" /> Verify via OTP
                  </button>
                )}
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Remove contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* OTP Modal */}
      {verifyingContactId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Verify Contact Mobile</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              {otpNotice || 'A 6-digit confirmation code has been sent via SMS to the contact.'}
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="e.g. 543210"
                className="w-full text-center tracking-widest text-2xl font-mono font-bold py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVerifyingContactId(null)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmOtp(verifyingContactId)}
                disabled={otpInput.length < 6 || isVerifying}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-primary rounded-xl hover:bg-orange-600 disabled:opacity-50 transition"
              >
                {isVerifying ? 'Verifying...' : 'Confirm Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal / Section */}
      {contacts.length < 3 && !isAdding && (
        <div className="text-center">
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 font-bold px-6 py-3 rounded-2xl hover:border-brand-primary hover:text-brand-primary transition"
          >
            <Plus className="w-4 h-4" /> Register Another Emergency Contact ({contacts.length}/3)
          </button>
        </div>
      )}

      {isAdding && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Add New Emergency Contact</h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddContact} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Sharma"
                className="w-full text-sm px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Relationship *</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse / Partner</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Son / Daughter</option>
                <option value="Neighbor">Trusted Neighbor</option>
                <option value="Friend">Close Friend</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Indian Mobile Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full text-sm px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <p className="text-[11px] text-gray-400 mt-1">Accepts 10-digit Indian mobile or +91 format</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ramesh@example.com"
                className="w-full text-sm px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="md:col-span-2 pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-brand-primary rounded-xl shadow-md hover:bg-orange-600 transition"
              >
                Save Emergency Contact
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
