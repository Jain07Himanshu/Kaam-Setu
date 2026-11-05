const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'
    : 'http://localhost:5000/api');

export function getToken(): string | null {
  return (
    localStorage.getItem('hyperlocal_auth_token') ||
    localStorage.getItem('hyperlocal_worker_token')
  );
}

export function setToken(token: string) {
  localStorage.setItem('hyperlocal_auth_token', token);
  localStorage.setItem('hyperlocal_worker_token', token);
}

export function clearToken() {
  localStorage.removeItem('hyperlocal_auth_token');
  localStorage.removeItem('hyperlocal_worker_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: any) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  demoLogin: (identifier: string = 'suresh.plumber@kaamsetu.demo') => {
    return request<{ token: string; user: any }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'WORKER', identifier }),
    });
  },

  getMe: () => request<{ user: any }>('/auth/me'),

  updateUserProfile: (data: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    bio?: string;
  }) => {
    return request<{ message: string; user: any }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Categories
  getCategories: () => request<{ categories: any[] }>('/categories'),

  // Worker Offers Inbox
  getWorkerOffers: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<{ offers: any[] }>(`/worker/offers${query}`);
  },

  getOfferById: (id: string) => request<{ offer: any }>(`/worker/offers/${id}`),

  declineOffer: (id: string) =>
    request<{ message: string; offer: any }>(`/worker/offers/${id}/decline`, {
      method: 'POST',
    }),

  // Quotes
  createQuote: (payload: {
    jobRequestId: string;
    proposedPrice: number;
    estimatedArrivalMinutes: number;
    scopeDescription: string;
    exclusions?: string;
    workerNote?: string;
  }) =>
    request<{ message: string; quote: any }>('/quotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  counterofferQuote: (quoteId: string, payload: { proposedPrice: number; message: string }) =>
    request<{ message: string; quote: any; negotiation: any }>(`/quotes/${quoteId}/counteroffer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Bookings
  getBookings: () => request<{ bookings: any[] }>('/bookings'),

  getBookingById: (id: string) => request<{ booking: any }>(`/bookings/${id}`),

  updateBookingStatus: (
    bookingId: string,
    payload: { status: string; startOtp?: string; cancellationReason?: string }
  ) =>
    request<{ message: string; booking: any }>(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Profile, Availability, Earnings
  getEarnings: () =>
    request<{ summary: any; completedBookings: any[] }>('/workers/me/earnings'),

  updateAvailability: (isAvailable: boolean) =>
    request<{ message: string; workerProfile: any }>('/workers/me/availability', {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    }),

  updateProfile: (payload: {
    bio?: string;
    serviceRadiusKm?: number;
    hourlyRate?: number;
    baseRate?: number;
    skills?: string[];
  }) =>
    request<{ message: string; workerProfile: any }>('/workers/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Notifications
  getNotifications: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),

  markNotificationAsRead: (id: string) =>
    request<{ notification: any }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsAsRead: () =>
    request<{ message: string }>('/notifications/read-all', {
      method: 'POST',
    }),

  // Support
  createSupportTicket: (payload: {
    category: string;
    subject: string;
    description: string;
    bookingId?: string;
  }) =>
    request<{ message: string; ticket: any }>('/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMySupportTickets: () => request<{ tickets: any[] }>('/support'),

  // Worker Verification & Documents
  sendWorkerMobileOtp: (phone: string) =>
    request<{ message: string; simulatedOtp?: string; maskedPhone?: string }>(
      '/worker/mobile/send-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }
    ),

  verifyWorkerMobileOtp: (otp: string) =>
    request<{ message: string; phone: string; status: string }>(
      '/worker/mobile/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify({ otp }),
      }
    ),

  submitIdentityDocument: (payload: {
    documentType: string;
    identifier: string;
    documentUrl?: string;
    notes?: string;
  }) =>
    request<{ message: string; document: any }>('/worker/verification/identity', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getIdentityDocuments: () =>
    request<{ documents: any[] }>('/worker/verification/identity'),

  submitSkillEvidence: (payload: {
    skillCategory: string;
    evidenceType?: string;
    documentTitle: string;
    issuingOrganisation?: string;
    documentUrl?: string;
  }) =>
    request<{ message: string; evidence: any }>('/worker/verification/skills', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSkillEvidences: () =>
    request<{ evidences: any[] }>('/worker/verification/skills'),

  getWorkerRightsCharter: () =>
    request<{
      policy: any;
      hasAccepted: boolean;
      acceptedRecord: any;
    }>('/worker/terms/rights-charter'),

  acceptWorkerTerms: (policyVersion: string) =>
    request<{ message: string; acceptance: any }>('/worker/terms/accept', {
      method: 'POST',
      body: JSON.stringify({ policyVersion }),
    }),

  getWorkerVerificationDashboard: () =>
    request<any>('/worker/verification/dashboard'),

  // Worker RPL & Badges & Credibility
  submitRplApplication: (payload: {
    skillCategory: string;
    yearsOfPriorExperience: number;
    selfReportedWorkSummary: string;
    references?: Array<{ name: string; phone: string; relationship: string }>;
  }) =>
    request<{ message: string; application: any }>('/worker/rpl/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getWorkerRplStatus: () =>
    request<{ applications: any[] }>('/worker/rpl/status'),

  getWorkerCredibility: (workerIdOrUserId: string) =>
    request<any>(`/workers/${workerIdOrUserId}/credibility`),

  // Visiting Charges
  getMyVisitingCharges: () =>
    request<any>('/worker/visiting-charges'),

  updateMyVisitingCharges: (payload: {
    amount: number;
    isRefundableOrAdjustable: boolean;
    terms: string;
  }) =>
    request<{ message: string; visitingCharge: any }>('/worker/visiting-charges', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Certificate Verification Adapters
  verifyCertificateQr: (payload: {
    workerSkillEvidenceId: string;
    qrData: string;
    issuingAuthority?: string;
    certificateNumber?: string;
  }) =>
    request<{ message: string; verificationRecord: any }>('/certificates/verify-qr', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  fetchDigilockerCertificate: (payload: {
    workerSkillEvidenceId: string;
    consentGiven: true;
    digilockerDocUri?: string;
  }) =>
    request<{ message: string; verificationRecord: any }>('/certificates/digilocker/fetch', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getWorkerCertificates: () =>
    request<{ certificates: any[] }>('/worker/certificates'),
};
