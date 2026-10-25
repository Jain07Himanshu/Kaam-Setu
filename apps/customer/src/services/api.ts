const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'
    : 'http://localhost:5000/api');

export function getToken(): string | null {
  return (
    localStorage.getItem('hyperlocal_auth_token') ||
    localStorage.getItem('hyperlocal_customer_token') ||
    localStorage.getItem('hyperlocal_worker_token')
  );
}

export function setToken(token: string) {
  localStorage.setItem('hyperlocal_auth_token', token);
  localStorage.setItem('hyperlocal_customer_token', token);
  localStorage.setItem('hyperlocal_worker_token', token);
}

export function clearToken() {
  localStorage.removeItem('hyperlocal_auth_token');
  localStorage.removeItem('hyperlocal_customer_token');
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

  demoLogin: (identifier: string = 'aarav.customer@kaamsetu.demo') => {
    const role = identifier.includes('customer') ? 'CUSTOMER' : 'WORKER';
    return request<{ token: string; user: any }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role, identifier }),
    });
  },

  getMe: () => request<{ user: any }>('/auth/me'),

  // Categories
  getCategories: () => request<{ categories: any[] }>('/categories'),
  getCategoryBySlug: (slug: string) => request<{ category: any }>(`/categories/${slug}`),

  // Workers Directory
  getWorkers: (params?: { category?: string; availableOnly?: boolean; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.availableOnly) query.append('availableOnly', 'true');
    if (params?.search) query.append('search', params.search);
    return request<{ workers: any[] }>(`/workers?${query.toString()}`);
  },

  getWorkerById: (id: string) => request<{ worker: any }>(`/workers/${id}`),

  // Customer Job Requests
  createJob: (payload: any) =>
    request<{ message: string; jobRequest: any; matchedWorkersCount: number }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyRequests: () => request<{ requests: any[] }>('/jobs/my-requests'),

  getJobById: (id: string) => request<{ job: any }>(`/jobs/${id}`),

  cancelJob: (id: string) =>
    request<{ message: string; job: any }>(`/jobs/${id}/cancel`, {
      method: 'PATCH',
    }),

  // Quotes & Negotiations
  counterofferQuote: (quoteId: string, payload: { proposedPrice: number; message: string }) =>
    request<{ message: string; quote: any; negotiation: any }>(`/quotes/${quoteId}/counteroffer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  acceptQuote: (quoteId: string) =>
    request<{ message: string; booking: any; acceptedQuote: any }>(`/quotes/${quoteId}/accept`, {
      method: 'POST',
    }),

  rejectQuote: (quoteId: string) =>
    request<{ message: string; quote: any }>(`/quotes/${quoteId}/reject`, {
      method: 'POST',
    }),

  // Worker Bidding / Quotes
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

  // Bookings (Shared & Worker Execution)
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

  // Worker Profile, Availability & Earnings
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

  // Reviews
  createReview: (payload: { bookingId: string; rating: number; comment: string }) =>
    request<{ message: string; review: any }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
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
};
