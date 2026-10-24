import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  Wrench,
  Zap,
  Sparkles,
  Settings,
  Hammer,
  Paintbrush,
  Wind,
  Utensils,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Calendar,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Wrench,
  Zap,
  Sparkles,
  Settings,
  Hammer,
  Paintbrush,
  Wind,
  Utensils,
};

export const CreateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category');

  const [categories, setCategories] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    serviceCategoryId: preselectedCategory || '',
    title: '',
    description: '',
    addressLabel: 'B-402, Hiranandani Gardens, Powai',
    city: 'Mumbai',
    postalCode: '400076',
    latitude: 19.1176,
    longitude: 72.9060,
    urgency: 'ASAP' as 'ASAP' | 'SCHEDULED',
    scheduledAt: '',
    isOpenToQuotes: true,
    budgetMin: 350,
    budgetMax: 850,
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.getCategories();
        setCategories(res.categories || []);
        if (preselectedCategory && !formData.serviceCategoryId) {
          setFormData((prev) => ({ ...prev, serviceCategoryId: preselectedCategory }));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, [preselectedCategory]);

  const selectedCategory = categories.find((c) => c.id === formData.serviceCategoryId);

  const handleNext = () => {
    setError(null);
    if (currentStep === 1 && !formData.serviceCategoryId) {
      setError('Please select a service category to continue');
      return;
    }
    if (currentStep === 2) {
      if (!formData.title.trim()) {
        setError('Please provide a brief title for your request');
        return;
      }
      if (formData.description.trim().length < 10) {
        setError('Please describe what needs to be done in more detail (at least 10 characters)');
        return;
      }
    }
    if (currentStep === 4 && formData.urgency === 'SCHEDULED' && !formData.scheduledAt) {
      setError('Please pick a date and time for scheduled service');
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        serviceCategoryId: formData.serviceCategoryId,
        title: formData.title,
        description: formData.description,
        addressLabel: formData.addressLabel,
        city: formData.city,
        postalCode: formData.postalCode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        budgetMin: formData.isOpenToQuotes ? null : Number(formData.budgetMin),
        budgetMax: formData.isOpenToQuotes ? null : Number(formData.budgetMax),
        isOpenToQuotes: formData.isOpenToQuotes,
        urgency: formData.urgency,
        scheduledAt: formData.urgency === 'SCHEDULED' ? formData.scheduledAt : null,
      };

      const res = await api.createJob(payload);
      // Navigate directly to the job request & quotes matching view!
      navigate(`/jobs/${res.jobRequest.id}?created=true`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit service request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, label: 'Category' },
    { number: 2, label: 'Details' },
    { number: 3, label: 'Location' },
    { number: 4, label: 'Timing' },
    { number: 5, label: 'Budget' },
    { number: 6, label: 'Review' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Step Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-primary -z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div key={s.number} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    isCompleted
                      ? 'bg-brand-primary text-white'
                      : isCurrent
                      ? 'bg-brand-primary text-white ring-4 ring-brand-surface'
                      : 'bg-white text-gray-400 border border-gray-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5 text-brand-cream" /> : s.number}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-semibold hidden sm:block ${
                    isCurrent ? 'text-brand-primary font-bold' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-10 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CHOOSE CATEGORY */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-charcoal">Select Service Category</h2>
              <p className="text-xs text-gray-500 mt-1">
                Choose the trade specialization required for your home service request
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const Icon = iconMap[cat.icon] || Wrench;
                const isSelected = formData.serviceCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceCategoryId: cat.id })}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-brand-primary bg-brand-surface ring-2 ring-brand-primary shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        isSelected ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-charcoal">{cat.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Est. ₹{cat.basePriceEstimate || 349}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: DESCRIBE THE ISSUE */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-charcoal">Describe What You Need</h2>
              <p className="text-xs text-gray-500 mt-1">
                Category: <span className="font-bold text-brand-primary">{selectedCategory?.name}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Request Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leaking kitchen sink trap pipe"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-surface outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Please describe the issue, symptoms, any noises, what you have observed, and how accessible the area is..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-surface outline-none text-sm leading-relaxed"
                />
                <div className="text-[11px] text-gray-400 text-right mt-1">
                  {formData.description.length} characters (minimum 10)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & ADDRESS */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-charcoal">Service Location</h2>
              <p className="text-xs text-gray-500 mt-1">
                Workers nearby will see approximate distance. Your exact address is kept private until you accept a quote.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={formData.addressLabel}
                    onChange={(e) => setFormData({ ...formData, addressLabel: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    City / Neighborhood
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm"
                  />
                </div>
              </div>

              {/* Map Coordinates Simulation card */}
              <div className="p-4 rounded-2xl bg-brand-surface border border-brand-secondary/30 text-xs text-gray-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-primary" />
                  <span>Geo-Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</span>
                </div>
                <span className="text-[11px] font-semibold text-brand-primaryDark bg-white px-2 py-0.5 rounded-full border border-brand-secondary/30">
                  Radius Verified
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: TIMING & URGENCY */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-charcoal">When do you need service?</h2>
              <p className="text-xs text-gray-500 mt-1">
                Workers receive notification based on your requested urgency
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'ASAP' })}
                className={`p-5 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                  formData.urgency === 'ASAP'
                    ? 'border-brand-primary bg-brand-surface ring-2 ring-brand-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    formData.urgency === 'ASAP' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal">As Soon As Possible</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Broadcast immediately to online active workers for prompt dispatch today.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'SCHEDULED' })}
                className={`p-5 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                  formData.urgency === 'SCHEDULED'
                    ? 'border-brand-primary bg-brand-surface ring-2 ring-brand-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    formData.urgency === 'SCHEDULED' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal">Schedule for Later</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Pick a convenient upcoming day and time slot.
                  </p>
                </div>
              </button>
            </div>

            {formData.urgency === 'SCHEDULED' && (
              <div className="pt-3 animate-in fade-in">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Preferred Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 5: BUDGET & PRICING PREFERENCE */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-charcoal">Expected Budget</h2>
              <p className="text-xs text-gray-500 mt-1">
                You can specify an approximate budget or leave it open to receive competitive bids
              </p>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setFormData({ ...formData, isOpenToQuotes: true })}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  formData.isOpenToQuotes
                    ? 'border-brand-primary bg-brand-surface ring-2 ring-brand-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm text-charcoal">Open to Competitive Quotes</h4>
                  <p className="text-xs text-gray-500">Workers evaluate your issue and quote their best trade price</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    formData.isOpenToQuotes ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'
                  }`}
                >
                  {formData.isOpenToQuotes && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              <div
                onClick={() => setFormData({ ...formData, isOpenToQuotes: false })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  !formData.isOpenToQuotes
                    ? 'border-brand-primary bg-brand-surface ring-2 ring-brand-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-charcoal">Set an Expected Budget Range</h4>
                    <p className="text-xs text-gray-500">Provide an estimated range you are willing to spend</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      !formData.isOpenToQuotes ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'
                    }`}
                  >
                    {!formData.isOpenToQuotes && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                {!formData.isOpenToQuotes && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 uppercase">Min (₹)</label>
                      <input
                        type="number"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 uppercase">Max (₹)</label>
                      <input
                        type="number"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & SUBMIT */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-charcoal">Review & Submit Request</h2>
              <p className="text-xs text-gray-500 mt-1">
                Check your request details. Matched nearby pros will be notified in real-time.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3.5 text-xs">
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500">Service Category:</span>
                <span className="font-bold text-charcoal">{selectedCategory?.name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500">Request Title:</span>
                <span className="font-bold text-charcoal">{formData.title}</span>
              </div>
              <div className="pb-2 border-b border-gray-200">
                <span className="text-gray-500 block mb-1">Issue Description:</span>
                <p className="text-gray-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-gray-200">
                  {formData.description}
                </p>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500">Location:</span>
                <span className="font-bold text-charcoal">{formData.addressLabel}, {formData.city}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500">Urgency:</span>
                <span className="font-bold text-brand-primary">
                  {formData.urgency === 'ASAP' ? 'Immediate Dispatch (ASAP)' : `Scheduled: ${formData.scheduledAt}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Budget:</span>
                <span className="font-bold text-charcoal">
                  {formData.isOpenToQuotes ? 'Open to worker quotes' : `₹${formData.budgetMin} - ₹${formData.budgetMax}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-4 flex items-center justify-between border-t border-gray-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold transition-all shadow-md shadow-brand-primary/20 hover:shadow-lg"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-sm font-bold transition-all shadow-lg shadow-brand-primary/20 hover:scale-[1.02] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Matching Workers...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-brand-cream" />
                  <span>Submit & Find Nearby Workers</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
