export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  preferredAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationItem {
  id: string;
  workerId: string;
  type: 'PHONE' | 'ID_DOCUMENT' | 'SKILL_CERT' | 'BACKGROUND_CHECK';
  status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED';
  notes?: string | null;
  reviewedAt?: string | null;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  bio?: string | null;
  skills: string[];
  serviceRadiusKm: number;
  hourlyRate?: number | null;
  baseRate?: number | null;
  isAvailable: boolean;
  onboardingStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  ratingAvg: number;
  ratingCount: number;
  completedJobsCount: number;
  verifications?: VerificationItem[];
  user?: User;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  active: boolean;
  basePriceEstimate?: number;
}

export interface ServiceLocation {
  id: string;
  userId: string;
  label: string;
  address: string;
  unit?: string | null;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export type UrgencyType = 'ASAP' | 'SCHEDULED';

export type JobRequestStatus =
  | 'OPEN'
  | 'MATCHING'
  | 'OFFERS_RECEIVED'
  | 'IN_NEGOTIATION'
  | 'BOOKED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface JobRequest {
  id: string;
  customerId: string;
  serviceCategoryId: string;
  serviceCategory?: ServiceCategory;
  customer?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    phone?: string | null;
  };
  title: string;
  description: string;
  addressLabel: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  budgetMin?: number | null;
  budgetMax?: number | null;
  isOpenToQuotes: boolean;
  urgency: UrgencyType;
  scheduledAt?: string | null;
  status: JobRequestStatus;
  createdAt: string;
  updatedAt: string;
  offers?: JobOffer[];
  quotes?: Quote[];
  booking?: Booking | null;
}

export type JobOfferStatus = 'PENDING' | 'VIEWED' | 'QUOTED' | 'DECLINED' | 'EXPIRED';

export interface JobOffer {
  id: string;
  jobRequestId: string;
  workerId: string;
  status: JobOfferStatus;
  matchScore: number;
  matchReasons: string[];
  sentAt: string;
  expiresAt?: string | null;
  respondedAt?: string | null;
  jobRequest?: JobRequest;
  worker?: WorkerProfile;
}

export type QuoteStatus = 'PENDING' | 'COUNTEROFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface QuoteNegotiation {
  id: string;
  quoteId: string;
  senderId: string;
  senderRole: UserRole;
  proposedPrice: number;
  message: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  jobRequestId: string;
  workerId: string;
  proposedPrice: number;
  estimatedArrivalMinutes: number;
  scopeDescription: string;
  exclusions?: string | null;
  workerNote?: string | null;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  worker?: WorkerProfile;
  jobRequest?: JobRequest;
  negotiations?: QuoteNegotiation[];
}

export type BookingStatus =
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'WORK_STARTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface Booking {
  id: string;
  jobRequestId: string;
  customerId: string;
  workerId: string;
  acceptedQuoteId: string;
  agreedPrice: number;
  agreedScope: string;
  scheduledAt?: string | null;
  startOtp: string; // Simulated 4-digit code customer gives to worker
  status: BookingStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  jobRequest?: JobRequest;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  worker?: WorkerProfile;
  review?: Review | null;
}

export type NotificationType =
  | 'JOB_OFFER_RECEIVED'
  | 'QUOTE_RECEIVED'
  | 'QUOTE_COUNTEROFFERED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'BOOKING_CONFIRMED'
  | 'WORKER_ON_THE_WAY'
  | 'WORK_STARTED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'REVIEW_RECEIVED'
  | 'SUPPORT_UPDATE'
  | 'AVAILABILITY_ALERT';

export interface Notification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: 'JOB_REQUEST' | 'QUOTE' | 'BOOKING' | 'SUPPORT_TICKET';
  relatedEntityId: string;
  readAt?: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  reviewer?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface SupportTicket {
  id: string;
  userId: string;
  bookingId?: string | null;
  category: 'GENERAL' | 'BOOKING_ISSUE' | 'PAYMENT_QUERY' | 'SAFETY_REPORT';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// Socket Events
export interface SocketEventPayloads {
  'job.created': { jobRequest: JobRequest };
  'job.offer.created': { offer: JobOffer };
  'job.offer.expiring': { offerId: string; jobRequestId: string };
  'quote.created': { quote: Quote; jobRequestId: string };
  'quote.counteroffered': { quote: Quote; negotiation: QuoteNegotiation };
  'quote.accepted': { quoteId: string; bookingId: string };
  'quote.rejected': { quoteId: string; jobRequestId: string };
  'booking.confirmed': { booking: Booking };
  'booking.status.updated': { bookingId: string; status: BookingStatus; booking: Booking };
  'booking.cancelled': { bookingId: string; reason?: string };
  'notification.created': { notification: Notification };
  'worker.availability.changed': { workerId: string; isAvailable: boolean };
}
