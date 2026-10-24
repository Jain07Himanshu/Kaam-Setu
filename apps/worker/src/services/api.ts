const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken(): string | null {
  return localStorage.getItem('hyperlocal_worker_token');
}

export function setToken(token: string) {
  localStorage.setItem('hyperlocal_worker_token', token);
}

export function clearToken() {
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

  demoLogin: (identifier: string = 'suresh.plumber@kaamsetu.demo') =>
    request<{ token: string; user: any }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'WORKER', identifier }),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  // Offers Inbox
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

  // Availability & Profile
  updateAvailability: (isAvailable: boolean) =>
    request<{ message: string; isAvailable: boolean }>('/workers/me/availability', {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    }),

  updateProfile: (payload: any) =>
    request<{ message: string; worker: any }>('/workers/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getEarnings: () =>
    request<{ summary: any; completedBookings: any[] }>('/workers/me/earnings'),

  // Bookings
  getBookings: () => request<{ bookings: any[] }>('/bookings'),

  getBookingById: (id: string) => request<{ booking: any }>(`/bookings/${id}`),

  updateBookingStatus: (id: string, payload: { status: string; startOtp?: string; cancellationReason?: string }) =>
    request<{ message: string; booking: any }>(`/bookings/${id}/status`, {
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
  createSupportTicket: (payload: { category: string; subject: string; description: string; bookingId?: string }) =>
    request<{ message: string; ticket: any }>('/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMySupportTickets: () => request<{ tickets: any[] }>('/support'),
};
