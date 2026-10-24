const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken(): string | null {
  return localStorage.getItem('hyperlocal_customer_token');
}

export function setToken(token: string) {
  localStorage.setItem('hyperlocal_customer_token', token);
}

export function clearToken() {
  localStorage.removeItem('hyperlocal_customer_token');
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

  demoLogin: (identifier: string = 'alex.customer@hyperlocal.demo') =>
    request<{ token: string; user: any }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'CUSTOMER', identifier }),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  // Categories
  getCategories: () => request<{ categories: any[] }>('/categories'),

  // Workers
  getWorkers: (params?: { category?: string; availableOnly?: boolean; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.availableOnly) query.append('availableOnly', 'true');
    if (params?.search) query.append('search', params.search);
    return request<{ workers: any[] }>(`/workers?${query.toString()}`);
  },

  getWorkerById: (id: string) => request<{ worker: any }>(`/workers/${id}`),

  // Job Requests
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

  // Quotes
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

  // Bookings
  getBookings: () => request<{ bookings: any[] }>('/bookings'),

  getBookingById: (id: string) => request<{ booking: any }>(`/bookings/${id}`),

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
  createSupportTicket: (payload: { category: string; subject: string; description: string; bookingId?: string }) =>
    request<{ message: string; ticket: any }>('/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMySupportTickets: () => request<{ tickets: any[] }>('/support'),
};
