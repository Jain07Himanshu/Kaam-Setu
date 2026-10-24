import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HardHat,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  User,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const WorkerAuthLandingPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [workerTrade, setWorkerTrade] = useState('plumbing');
  const [workerExperience, setWorkerExperience] = useState(5);
  const [workerHourlyRate, setWorkerHourlyRate] = useState(399);
  const [workerBaseRate, setWorkerBaseRate] = useState(249);
  const [workerCity, setWorkerCity] = useState('Mumbai');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign in submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim() || !workerEmail.trim() || !workerPassword) {
      setErrorMessage('Please fill in your name, email, and password');
      return;
    }
    if (workerPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await register({
        name: workerName.trim(),
        email: workerEmail.trim().toLowerCase(),
        phone: workerPhone.trim() || '+91 98201 54321',
        password: workerPassword,
        role: 'WORKER',
        serviceCategoryId: workerTrade,
        experienceYears: Number(workerExperience),
        hourlyRate: Number(workerHourlyRate),
        baseRate: Number(workerBaseRate),
        city: workerCity,
        address: `${workerCity} Service Hub`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click Demo login
  const handleQuickDemo = async (email: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await demoLogin(email);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-8">
      {/* Brand Hero Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-3 p-2 px-4 rounded-full bg-brand-surface border border-brand-secondary/40 shadow-sm">
          <img src="/logo.jpg" alt="Kaam Setu Pro" className="w-8 h-8 rounded-lg object-contain shadow-xs" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primaryDark">
            Kaam Setu Pro — Trade Partner Portal
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-charcoal tracking-tight">
          Empowering Local <span className="text-brand-primary">Trade Professionals</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 font-medium max-w-xl mx-auto">
          “Your Work, Our Priority” — Receive matched job opportunities, quote fair prices in Indian Rupees (₹), manage your schedule, and keep 100% of your earnings.
        </p>

        {/* Value Prop Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-charcoal pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200">
            <CheckCircle className="w-4 h-4 text-brand-primary" />
            100% Full Quote Retained (Zero Broker Cuts)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200">
            <Zap className="w-4 h-4 text-brand-primary" />
            Live Neighborhood Dispatch
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200">
            <Lock className="w-4 h-4 text-brand-primary" />
            4-Digit Start Code Verification
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="max-w-lg mx-auto bg-white rounded-3xl border border-gray-200/80 shadow-card p-6 sm:p-8 space-y-6">
        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              authMode === 'LOGIN'
                ? 'bg-white text-brand-primaryDark shadow-sm'
                : 'text-gray-500 hover:text-charcoal'
            }`}
          >
            Worker Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('REGISTER');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              authMode === 'REGISTER'
                ? 'bg-white text-brand-primaryDark shadow-sm'
                : 'text-gray-500 hover:text-charcoal'
            }`}
          >
            Register as Pro
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* -------------------- 1. WORKER LOGIN FORM -------------------- */}
        {authMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Pro Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. suresh.plumber@kaamsetu.demo"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-surface outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter password (e.g. password123)"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-surface outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <HardHat className="w-4 h-4 text-brand-cream" />
                  <span>Access Worker Pro Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick 1-Click Demo Logins */}
            <div className="pt-4 border-t border-gray-100">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
                Instant 1-Click Demo Trade Pro Logins:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('suresh.plumber@kaamsetu.demo')}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-secondary/60 bg-gray-50/50 hover:bg-brand-surface text-left transition-all text-xs"
                >
                  <div className="font-bold text-charcoal">Suresh Kumar</div>
                  <div className="text-[10px] text-gray-500">Master Plumber (10 yrs)</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('priya.electric@kaamsetu.demo')}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-secondary/60 bg-gray-50/50 hover:bg-brand-surface text-left transition-all text-xs"
                >
                  <div className="font-bold text-charcoal">Priya Sharma</div>
                  <div className="text-[10px] text-gray-500">Electrician (7 yrs)</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('rajesh.cleaning@kaamsetu.demo')}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-secondary/60 bg-gray-50/50 hover:bg-brand-surface text-left transition-all text-xs"
                >
                  <div className="font-bold text-charcoal">Rajesh Verma</div>
                  <div className="text-[10px] text-gray-500">Cleaning Specialist</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('anita.appliances@kaamsetu.demo')}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-secondary/60 bg-gray-50/50 hover:bg-brand-surface text-left transition-all text-xs"
                >
                  <div className="font-bold text-charcoal">Anita Roy</div>
                  <div className="text-[10px] text-gray-500">Appliance & AC Tech</div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* -------------------- 2. WORKER REGISTRATION FORM -------------------- */}
        {authMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98201 54321"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.patil@example.com"
                  value={workerEmail}
                  onChange={(e) => setWorkerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Password * (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Create password"
                  value={workerPassword}
                  onChange={(e) => setWorkerPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Primary Trade *
                </label>
                <select
                  value={workerTrade}
                  onChange={(e) => setWorkerTrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none bg-white"
                >
                  <option value="plumbing">Plumbing Specialist</option>
                  <option value="electrical">Certified Electrician</option>
                  <option value="cleaning">Deep Cleaning Pro</option>
                  <option value="appliance">Appliance Repair</option>
                  <option value="carpentry">Carpentry & Woodwork</option>
                  <option value="painting">Painting & Waterproofing</option>
                  <option value="ac-repair">AC Repair & Service</option>
                  <option value="cooking">Cooking & Household</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={workerExperience}
                  onChange={(e) => setWorkerExperience(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Hourly Rate (₹)
                </label>
                <input
                  type="number"
                  step={50}
                  value={workerHourlyRate}
                  onChange={(e) => setWorkerHourlyRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Callout Fee (₹)
                </label>
                <input
                  type="number"
                  step={50}
                  value={workerBaseRate}
                  onChange={(e) => setWorkerBaseRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Base City / Area
              </label>
              <input
                type="text"
                value={workerCity}
                onChange={(e) => setWorkerCity(e.target.value)}
                placeholder="e.g. Mumbai Central"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Creating Worker Profile...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-cream" />
                  <span>Register & Open Pro Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Customer Portal Link */}
        <div className="pt-2 text-center">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors"
          >
            <span>Need a home service instead? Go to Customer Portal (Port 5173)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
