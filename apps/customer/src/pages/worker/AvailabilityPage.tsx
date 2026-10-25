import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Power,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Save,
} from 'lucide-react';

export const AvailabilityPage: React.FC = () => {
  const { user, isAvailable, toggleAvailability, refreshProfile } = useAuth();
  const workerProfile = user?.workerProfile;

  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(workerProfile?.serviceRadiusKm || 15);
  const [hourlyRate, setHourlyRate] = useState<number>(workerProfile?.hourlyRate || 399);
  const [baseRate, setBaseRate] = useState<number>(workerProfile?.baseRate || 249);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateProfile({
        serviceRadiusKm,
        hourlyRate,
        baseRate,
      });

      setSaveSuccess(true);
      await refreshProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Availability & Dispatch Radius</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure whether you receive incoming requests and define your preferred travel boundary
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-brand-surface border border-brand-secondary/40 text-brand-primaryDark text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-brand-primary shrink-0" />
          <span>Availability and service radius updated in central matching engine!</span>
        </div>
      )}

      {/* Main Online Toggle Card */}
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isAvailable ? 'bg-brand-primary animate-pulse' : 'bg-gray-400'
              }`}
            />
            <h3 className="font-extrabold text-lg text-charcoal">
              {isAvailable ? 'Currently Online (Receiving Requests)' : 'Currently Offline (Unavailable)'}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-md">
            When online, our Fair Matching Engine dispatches immediate job offers when nearby customers request your trade.
          </p>
        </div>

        <button
          onClick={toggleAvailability}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
            isAvailable
              ? 'bg-brand-surface text-brand-primaryDark border border-brand-secondary/40 hover:bg-brand-surface/80'
              : 'bg-brand-primary text-white hover:bg-brand-primaryDark'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isAvailable ? 'Switch to Offline' : 'Switch to Online'}</span>
        </button>
      </div>

      {/* Radius & Rates Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-charcoal">Service Coverage & Rates</h2>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase">
                Service Radius: <span className="text-brand-primary text-sm font-extrabold">{serviceRadiusKm} km</span>
              </label>
              <span className="text-xs text-gray-400 font-medium">Max travel distance from base</span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
              className="w-full accent-brand-primary"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>2 km (Walking/Bicycle)</span>
              <span>25 km (Metro Core)</span>
              <span>50 km (Suburbs)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Preferred Hourly Rate (₹)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Base Visit / Callout Fee (₹)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={baseRate}
                  onChange={(e) => setBaseRate(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:border-brand-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 text-right">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
