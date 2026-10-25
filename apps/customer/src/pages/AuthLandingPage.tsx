import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  HardHat,
  User,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const AuthLandingPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();

  // Role Tab: 'CUSTOMER' | 'WORKER'
  const [activeRole, setActiveRole] = useState<'CUSTOMER' | 'WORKER'>('CUSTOMER');
  // Auth Mode: 'LOGIN' | 'REGISTER'
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Customer Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Customer Registration Form State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custAddress, setCustAddress] = useState('B-402, Hiranandani Gardens, Powai');
  const [custCity, setCustCity] = useState('Mumbai');
  const [custPostalCode, setCustPostalCode] = useState('400076');

  // Worker Registration Form State
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

  // Handle Customer or Worker Login
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

  // Handle Customer Registration
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custEmail.trim() || !custPassword) {
      setErrorMessage('Please fill in your name, email, and password');
      return;
    }
    if (custPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await register({
        name: custName.trim(),
        email: custEmail.trim().toLowerCase(),
        phone: custPhone.trim() || '+91 98201 12345',
        password: custPassword,
        address: custAddress,
        city: custCity,
        postalCode: custPostalCode,
        latitude: 19.1176,
        longitude: 72.9060,
      });
      // Context updates user and redirects automatically into the Customer interface
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Worker Registration
  const handleWorkerRegister = async (e: React.FormEvent) => {
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
        address: `${workerCity} Trade Hub`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Worker registration failed. Email may already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click Demo logins
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
      <div className="max-w-5xl mx-auto text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-3 p-2 px-4 rounded-full bg-brand-surface border border-brand-secondary/40 shadow-sm">
          <img src="/logo.jpg" alt="Kaam Setu" className="w-8 h-8 rounded-lg object-contain shadow-xs" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primaryDark">
            India's Connected Hyperlocal Service Network
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-charcoal tracking-tight">
          Welcome to <span className="text-brand-primary">Kaam Setu</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 font-medium max-w-2xl mx-auto">
          “Your Work, Our Priority” — Connect with verified neighborhood trade professionals for transparent quotes, fair negotiations, and mutually verified job execution.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-charcoal pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            Verified Indian Trade Pros
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200">
            <Zap className="w-4 h-4 text-brand-primary" />
            Live Quotes in Indian Rupees (₹)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200">
            <Lock className="w-4 h-4 text-brand-primary" />
            4-Digit Mutual Start Code (OTP)
          </span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-200/80 shadow-card p-6 sm:p-8 space-y-6">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
            Step 1: Choose Your Role
          </label>
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveRole('CUSTOMER');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeRole === 'CUSTOMER'
                  ? 'bg-white text-brand-primaryDark shadow-sm ring-1 ring-black/5'
                  : 'text-gray-600 hover:text-charcoal'
              }`}
            >
              <User className="w-4 h-4 text-brand-primary" />
              <span>Customer (Need Services)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('WORKER');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeRole === 'WORKER'
                  ? 'bg-white text-brand-primaryDark shadow-sm ring-1 ring-black/5'
                  : 'text-gray-600 hover:text-charcoal'
              }`}
            >
              <HardHat className="w-4 h-4 text-brand-primary" />
              <span>Worker Pro (Offer Skills)</span>
            </button>
          </div>
        </div>

        {/* Auth Mode Toggle (Login vs Register) */}
        <div className="flex items-center justify-center border-b border-gray-100 pb-4 gap-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMessage(null);
            }}
            className={`text-sm font-bold pb-2 transition-all border-b-2 ${
              authMode === 'LOGIN'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-charcoal'
            }`}
          >
            Sign In to Existing Account
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('REGISTER');
              setErrorMessage(null);
            }}
            className={`text-sm font-bold pb-2 transition-all border-b-2 ${
              authMode === 'REGISTER'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-charcoal'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* -------------------- 1. LOGIN FORM (Customer or Worker) -------------------- */}
        {authMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder={activeRole === 'CUSTOMER' ? 'e.g. aarav.customer@kaamsetu.demo' : 'e.g. suresh.plumber@kaamsetu.demo'}
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
                placeholder="Enter your password (e.g. password123)"
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
                  <span>Sign In as {activeRole === 'CUSTOMER' ? 'Customer' : 'Worker Pro'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick 1-Click Demo Accounts */}
            <div className="pt-4 border-t border-gray-100">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
                Or Instant 1-Click Demo Sign In:
              </div>
              {activeRole === 'CUSTOMER' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('aarav.customer@kaamsetu.demo')}
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-secondary/60 bg-gray-50/50 hover:bg-brand-surface text-left transition-all text-xs"
                  >
                    <div className="font-bold text-charcoal">Aarav Sharma</div>
                    <div className="text-[10px] text-gray-500">Powai, Mumbai</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('pooja.customer@kaamsetu.demo')}
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-brand-secondary/60 bg-gray-50/50 hover:bg-brand-surface text-left transition-all text-xs"
                  >
                    <div className="font-bold text-charcoal">Pooja Patel</div>
                    <div className="text-[10px] text-gray-500">Bellandur, Bengaluru</div>
                  </button>
                </div>
              ) : (
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
                </div>
              )}
            </div>
          </form>
        )}

        {/* -------------------- 2. CUSTOMER REGISTRATION FORM -------------------- */}
        {authMode === 'REGISTER' && activeRole === 'CUSTOMER' && (
          <form onSubmit={handleCustomerRegister} className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98201 12345"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. rahul@example.com"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Password * (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Create a secure password"
                value={custPassword}
                onChange={(e) => setCustPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Street Address / Apartment
              </label>
              <input
                type="text"
                value={custAddress}
                onChange={(e) => setCustAddress(e.target.value)}
                placeholder="e.g. B-402, Hiranandani Gardens, Powai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  City / Area
                </label>
                <select
                  value={custCity}
                  onChange={(e) => setCustCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none bg-white"
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Pune">Pune</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={custPostalCode}
                  onChange={(e) => setCustPostalCode(e.target.value)}
                  placeholder="400076"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Registering Customer Account...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-cream" />
                  <span>Register & Access Services</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* -------------------- 3. WORKER PRO REGISTRATION FORM -------------------- */}
        {authMode === 'REGISTER' && activeRole === 'WORKER' && (
          <form onSubmit={handleWorkerRegister} className="space-y-4 animate-in fade-in">
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
                  Primary Trade Specialization *
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
                  Preferred Hourly Rate (₹)
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
                  Base Callout Fee (₹)
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
                Base City / Neighborhood
              </label>
              <input
                type="text"
                value={workerCity}
                onChange={(e) => setWorkerCity(e.target.value)}
                placeholder="e.g. Mumbai Central / Powai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-brand-primary outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Registering Trade Pro...</span>
              ) : (
                <>
                  <HardHat className="w-4 h-4 text-brand-cream" />
                  <span>Register & Start Receiving Job Offers</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
