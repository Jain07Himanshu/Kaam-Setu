import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AlertOctagon, PhoneCall, ShieldCheck, CheckCircle2, AlertTriangle, Clock, MapPin, X } from 'lucide-react';

export function SafetyCentrePage() {
  const [safetyEvents, setSafetyEvents] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // SOS Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [sosAddress, setSosAddress] = useState('');

  // Cancel / Resolve Modal
  const [resolvingEventId, setResolvingEventId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadSafetyData();
  }, []);

  async function loadSafetyData() {
    try {
      setIsLoading(true);
      const [eventsRes, contactsRes] = await Promise.all([
        api.getMySafetyEvents().catch(() => ({ safetyEvents: [] })),
        api.getEmergencyContacts().catch(() => ({ contacts: [] })),
      ]);
      setSafetyEvents(eventsRes.safetyEvents || []);
      setContacts(contactsRes.contacts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load safety centre data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTriggerSos() {
    setIsTriggering(true);
    setError(null);
    try {
      const res = await api.triggerSos({
        triggerType: 'PANIC_BUTTON',
        address: sosAddress || undefined,
      });
      setSuccessMsg(`Emergency SOS activated! ${res.contactsNotifiedCount} emergency contacts dialed and response ticket created.`);
      setShowConfirmModal(false);
      setSosAddress('');
      loadSafetyData();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger emergency SOS');
    } finally {
      setIsTriggering(false);
    }
  }

  async function handleResolveSos(id: string) {
    try {
      await api.resolveSos(id, 'CANCELLED', resolutionNotes || 'Customer confirmed safe');
      setSuccessMsg('Safety alert resolved and closed.');
      setResolvingEventId(null);
      setResolutionNotes('');
      loadSafetyData();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve safety alert');
    }
  }

  const activeSos = safetyEvents.find((e) => e.status === 'ACTIVE');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Active Alert Banner if SOS is Active */}
      {activeSos && (
        <div className="bg-red-600 text-white rounded-3xl p-6 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white text-red-600 rounded-full flex items-center justify-center flex-shrink-0 font-black">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black">EMERGENCY SOS IS ACTIVE</h2>
              <p className="text-red-100 text-xs mt-0.5">
                Automated phone calls and location SMS were dispatched to your emergency contacts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setResolvingEventId(activeSos.id)}
            className="bg-white text-red-600 font-black px-6 py-2.5 rounded-xl text-xs hover:bg-red-50 transition shadow-lg"
          >
            I Am Safe / Cancel Alert
          </button>
        </div>
      )}

      {/* Main SOS Trigger Hub */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-md mb-8 text-center">
        <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-block mb-3">
          Instant Rapid Response Engine
        </span>
        <h1 className="text-3xl font-black text-gray-900">Customer Safety & SOS Centre</h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto mt-2 leading-relaxed">
          If you feel unsafe or experience any threatening behavior during an in-home service, activate the SOS trigger. Our platform will immediately simulate an urgent phone call to all registered emergency contacts and alert the operations team.
        </p>

        {/* Big Red SOS Button */}
        <div className="py-8">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-44 h-44 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center mx-auto border-4 border-red-300 ring-8 ring-red-100"
          >
            <AlertOctagon className="w-12 h-12 mb-1 animate-bounce" />
            <span>SOS</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-200 mt-0.5">Emergency</span>
          </button>
        </div>

        {/* Contacts preview */}
        <div className="border-t border-gray-100 pt-6 max-w-lg mx-auto">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Will automatically alert {contacts.length} registered contacts:
          </p>
          {contacts.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 py-2 px-3 rounded-lg">
              ⚠️ No emergency contacts registered yet. Please add contacts from the Emergency Contacts page!
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {contacts.map((c) => (
                <span key={c.id} className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <PhoneCall className="w-3 h-3 text-brand-primary" /> {c.name} ({c.relationship})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <h3 className="font-black text-xl text-gray-900 mb-2">Confirm Emergency SOS</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              This will trigger automated telephone calls to your <span className="font-bold">{contacts.length} emergency contacts</span> and file an urgent safety incident with Kaam Setu rapid response officers.
            </p>
            <div className="text-left mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Current Service Address / Notes (Optional)</label>
              <input
                type="text"
                value={sosAddress}
                onChange={(e) => setSosAddress(e.target.value)}
                placeholder="e.g. Flat 302, Tower 5, Sector 45"
                className="w-full text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerSos}
                disabled={isTriggering}
                className="flex-1 py-3 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md transition disabled:opacity-50"
              >
                {isTriggering ? 'Triggering...' : 'Yes, Activate SOS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolvingEventId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="font-black text-lg text-gray-900 mb-2">Cancel / Resolve Safety Alert</h3>
            <p className="text-xs text-gray-600 mb-4">
              Please confirm you are safe and provide a brief note (e.g. false alarm or situation resolved).
            </p>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Triggered by mistake, technician is polite and work is going fine."
              className="w-full text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResolvingEventId(null)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleResolveSos(resolvingEventId)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-md"
              >
                Confirm I Am Safe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Safety Incident Log */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-black text-gray-900 text-base mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-primary" /> Past Safety Events & Telephony Logs
        </h3>
        {safetyEvents.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No past safety alerts recorded.</p>
        ) : (
          <div className="space-y-3">
            {safetyEvents.map((e) => (
              <div key={e.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 uppercase tracking-wider">{e.eventType}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        e.status === 'ACTIVE'
                          ? 'bg-red-100 text-red-700'
                          : e.status === 'RESOLVED' || e.status === 'CANCELLED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {e.status}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{e.notes}</p>
                  {e.callLogs && e.callLogs.length > 0 && (
                    <div className="mt-2 text-[11px] text-gray-500">
                      📞 Telephony Logs: {e.callLogs.length} outbound calls logged ({e.callLogs.map((l: any) => l.contactReference).join(', ')})
                    </div>
                  )}
                </div>

                {e.status === 'ACTIVE' && (
                  <button
                    onClick={() => setResolvingEventId(e.id)}
                    className="bg-green-600 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-green-700 transition"
                  >
                    Resolve Alert
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
