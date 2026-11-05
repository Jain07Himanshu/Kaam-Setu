import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
  LifeBuoy,
  Shield,
  Layers,
  IndianRupee,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Editable Form State
  const defaultLoc = user?.serviceLocations?.find((l: any) => l.isDefault) || user?.serviceLocations?.[0];
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '/avatars/aarav.svg');
  const [address, setAddress] = useState(user?.customerProfile?.preferredAddress || defaultLoc?.address || 'B-402 Hiranandani Gardens, Powai');
  const [city, setCity] = useState(defaultLoc?.city || 'Mumbai');
  const [postalCode, setPostalCode] = useState(defaultLoc?.postalCode || '400076');

  // Stats State
  const [requestsCount, setRequestsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [completedBookingsCount, setCompletedBookingsCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [emergencyContactsCount, setEmergencyContactsCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '/avatars/aarav.svg');
      const loc = user.serviceLocations?.find((l: any) => l.isDefault) || user.serviceLocations?.[0];
      setAddress(user.customerProfile?.preferredAddress || loc?.address || 'B-402 Hiranandani Gardens, Powai');
      setCity(loc?.city || 'Mumbai');
      setPostalCode(loc?.postalCode || '400076');
    }
  }, [user]);

  // Fetch real statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const [reqRes, bookRes, contactRes] = await Promise.all([
          api.getMyRequests().catch(() => ({ requests: [] })),
          api.getBookings().catch(() => ({ bookings: [] })),
          api.getEmergencyContacts().catch(() => ({ contacts: [] })),
        ]);

        const requests = reqRes.requests || [];
        const bookings = bookRes.bookings || [];
        const contacts = contactRes.contacts || [];

        setRequestsCount(requests.length);
        setBookingsCount(bookings.length);
        setEmergencyContactsCount(contacts.length);

        const completed = bookings.filter((b: any) => b.status === 'COMPLETED');
        setCompletedBookingsCount(completed.length);

        const spent = completed.reduce((sum: number, b: any) => sum + (Number(b.agreedPrice) || 0), 0);
        setTotalSpent(spent);
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      await api.updateUserProfile({
        name,
        phone,
        avatarUrl,
        address,
        city,
        postalCode,
      });

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
    { label: 'Aarav', path: '/avatars/aarav.svg' },
    { label: 'Pooja', path: '/avatars/pooja.svg' },
    { label: 'Priya', path: '/avatars/priya.svg' },
    { label: 'Anita', path: '/avatars/anita.svg' },
    { label: 'Suresh', path: '/avatars/suresh.svg' },
    { label: 'Rajesh', path: '/avatars/rajesh.svg' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <Link to="/" className="hover:text-brand-primary">Home</Link>
            <span>/</span>
            <span className="text-charcoal">Account & Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight flex items-center gap-2.5">
            <span>Customer Profile & Details</span>
            <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-brand-surface text-brand-primary border border-brand-secondary/30">
              Verified Account
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your personal identity, contact details, neighborhood addresses, and account security
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all hover:shadow-lg"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile Details</span>
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
          <span>Your profile information and addresses were updated successfully in the central database!</span>
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-surface/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
          <div className="relative group">
            <img
              src={avatarUrl || '/avatars/aarav.svg'}
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
                Active Member
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {user?.email}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-medium">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {user?.phone || '+91 98201 12345'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 flex-wrap">
              <span className="flex items-center gap-1 text-gray-600 font-medium">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                {city}, {postalCode}
              </span>
              <span>·</span>
              <span className="text-gray-400">User ID: <code className="text-[11px] font-mono bg-gray-100 px-1.5 py-0.5 rounded">{user?.id?.slice(0, 8)}...</code></span>
            </div>
          </div>
        </div>

        {/* Quick Safety Health Badge */}
        <div className="p-4 rounded-2xl bg-brand-surface/70 border border-brand-secondary/30 w-full md:w-auto shrink-0 space-y-1.5">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-bold text-gray-700 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-primary" />
              Safety & SOS Armed
            </span>
            <span className="text-brand-primary font-black">
              {emergencyContactsCount}/3 Contacts
            </span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-primary h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (emergencyContactsCount / 3) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500">
            {emergencyContactsCount > 0
              ? 'Emergency broadcast ready for rapid response'
              : 'Add emergency contacts for voice alert protection'}
          </p>
        </div>
      </div>

      {/* Overview Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Requests</span>
            <FileText className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            {isLoadingStats ? '...' : requestsCount}
          </div>
          <p className="text-[11px] text-gray-400">Total requests created</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bookings</span>
            <Layers className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            {isLoadingStats ? '...' : bookingsCount}
          </div>
          <p className="text-[11px] text-gray-400">{completedBookingsCount} completed successfully</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Invested</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {isLoadingStats ? '...' : `₹${totalSpent.toLocaleString('en-IN')}`}
          </div>
          <p className="text-[11px] text-gray-400">In verified home trades</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Emergency Contacts</span>
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            {isLoadingStats ? '...' : `${emergencyContactsCount} / 3`}
          </div>
          <p className="text-[11px] text-gray-400">Registered trusted contacts</p>
        </div>
      </div>

      {/* Profile Form (Edit Mode or View Mode) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Information & Address (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-charcoal">Personal & Contact Information</h3>
                <p className="text-xs text-gray-500">Details used for service dispatch, receipts, and technician communication</p>
              </div>
              <span className="text-xs font-bold text-brand-primary flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Verified Customer
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5">
                {/* Choose Avatar */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">Select Profile Avatar</label>
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
                      placeholder="e.g. Aarav Sharma"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Phone Number (10 digits) *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      placeholder="e.g. 98201 12345"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Email Address (Read Only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400">Account primary email cannot be modified directly.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Doorstep Street Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder="e.g. B-402 Hiranandani Gardens, Central Avenue"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      placeholder="e.g. Mumbai"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Postal Code (PIN) *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      placeholder="e.g. 400076"
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
                    <span>{isSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full Legal Name</span>
                    <div className="text-sm font-bold text-charcoal">{user?.name}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Registered Mobile</span>
                    <div className="text-sm font-bold text-charcoal flex items-center gap-1.5">
                      <span>{user?.phone || '+91 98201 12345'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Account Email</span>
                    <div className="text-sm font-bold text-charcoal">{user?.email}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Default Neighborhood</span>
                    <div className="text-sm font-bold text-charcoal">{city}, {postalCode}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Primary Service Address</span>
                  <div className="text-sm font-bold text-charcoal flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <span>{address || 'B-402 Hiranandani Gardens, Powai, Mumbai 400076'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Access to Key Sections */}
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card space-y-4">
            <h3 className="text-base font-black text-charcoal">Manage Customer Portals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/my-requests"
                className="p-4 rounded-2xl bg-brand-surface/40 hover:bg-brand-surface border border-brand-secondary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <FileText className="w-5 h-5 text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-charcoal">My Requests</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">View your open and matched requests</p>
                </div>
                <div className="text-[11px] font-bold text-brand-primary mt-3 flex items-center gap-1">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

              <Link
                to="/bookings"
                className="p-4 rounded-2xl bg-brand-surface/40 hover:bg-brand-surface border border-brand-secondary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <Layers className="w-5 h-5 text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-charcoal">Confirmed Bookings</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Track arrivals, OTPs, and invoices</p>
                </div>
                <div className="text-[11px] font-bold text-brand-primary mt-3 flex items-center gap-1">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

              <Link
                to="/customer-care"
                className="p-4 rounded-2xl bg-brand-surface/40 hover:bg-brand-surface border border-brand-secondary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <LifeBuoy className="w-5 h-5 text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-charcoal">Customer Care</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Helpline support & ticket desk</p>
                </div>
                <div className="text-[11px] font-bold text-brand-primary mt-3 flex items-center gap-1">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Emergency & Security Card (1 Col) */}
        <div className="space-y-6">
          {/* Emergency Safety Card */}
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-charcoal">Safety & Emergency Hub</h3>
                <p className="text-[11px] text-gray-500">SOS broadcasts & trusted contacts</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-charcoal">
                <span>Emergency Contacts</span>
                <span className="text-rose-600">{emergencyContactsCount} / 3 Registered</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                When you tap SOS, our telephony engine places automated bilingual emergency phone calls and SMS alerts to these contacts.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                to="/emergency-contacts"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-bold text-charcoal border border-gray-200 transition-colors"
              >
                <span>Manage 3 Trusted Contacts</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </Link>

              <Link
                to="/safety-centre"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-bold text-charcoal border border-gray-200 transition-colors"
              >
                <span>Open Safety Centre Cockpit</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Account Security & Platform Commitments */}
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-card space-y-4">
            <h3 className="text-sm font-black text-charcoal">Trust & Security Shield</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-charcoal">Mutually Verified Start OTP</div>
                  <div className="text-[11px] text-gray-500">Technicians cannot start billing without your 4-digit code.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-charcoal">Transparent Quoted Pricing</div>
                  <div className="text-[11px] text-gray-500">Zero hidden brokerage fees. 100% transparent in INR (₹).</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <Clock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-charcoal">Scheduled Safety Check-ins</div>
                  <div className="text-[11px] text-gray-500">Proactive milestones during every home service execution.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
