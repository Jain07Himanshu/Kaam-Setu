import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { authenticate } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Controllers
import * as authController from './modules/auth/authController.js';
import * as servicesController from './modules/services/servicesController.js';
import * as jobsController from './modules/jobs/jobsController.js';
import * as offersController from './modules/offers/offersController.js';
import * as quotesController from './modules/quotes/quotesController.js';
import * as bookingsController from './modules/bookings/bookingsController.js';
import * as workersController from './modules/workers/workersController.js';
import * as notificationsController from './modules/notifications/notificationsController.js';
import * as reviewsController from './modules/reviews/reviewsController.js';
import * as supportController from './modules/support/supportController.js';
import * as emergencyContactsController from './modules/customers/emergencyContactsController.js';
import * as customerCareController from './modules/customers/customerCareController.js';
import * as duplicateDetectionController from './modules/duplicateDetection/duplicateDetectionController.js';
import * as workerVerificationController from './modules/workers/workerVerificationController.js';
import * as credibilityController from './modules/credibility/credibilityController.js';
import * as visitingChargesController from './modules/pricing/visitingChargesController.js';
import * as safetyController from './modules/safety/safetyController.js';
import * as certificateVerificationController from './modules/certificates/certificateVerificationController.js';
import * as adminController from './modules/admin/adminController.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'HyperLocal API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Authentication Routes
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/demo-login', authController.demoLogin);
  app.get('/api/auth/me', authenticate, authController.getCurrentUser);
  app.patch('/api/auth/profile', authenticate, authController.updateUserProfile);

  // 2. Service Categories
  app.get('/api/categories', servicesController.getCategories);
  app.get('/api/categories/:slug', servicesController.getCategoryBySlug);

  // 3. Workers Directory & Profile
  app.get('/api/workers', workersController.getWorkers);
  app.get('/api/workers/:id', workersController.getWorkerById);
  app.patch('/api/workers/me/availability', authenticate, workersController.updateAvailability);
  app.patch('/api/workers/me', authenticate, workersController.updateProfile);
  app.get('/api/workers/me/earnings', authenticate, workersController.getEarnings);

  // 4. Service Requests (Job Requests)
  app.post('/api/jobs', authenticate, jobsController.createJobRequest);
  app.get('/api/jobs/my-requests', authenticate, jobsController.getMyRequests);
  app.get('/api/jobs/:id', authenticate, jobsController.getJobById);
  app.patch('/api/jobs/:id/cancel', authenticate, jobsController.cancelJob);

  // 5. Worker Offers Inbox
  app.get('/api/worker/offers', authenticate, offersController.getWorkerOffers);
  app.get('/api/worker/offers/:id', authenticate, offersController.getOfferById);
  app.post('/api/worker/offers/:id/decline', authenticate, offersController.declineOffer);

  // 6. Quotes & Negotiations
  app.post('/api/quotes', authenticate, quotesController.createQuote);
  app.post('/api/quotes/:id/counteroffer', authenticate, quotesController.counterofferQuote);
  app.post('/api/quotes/:id/accept', authenticate, quotesController.acceptQuote);
  app.post('/api/quotes/:id/reject', authenticate, quotesController.rejectQuote);

  // 7. Bookings Management
  app.get('/api/bookings', authenticate, bookingsController.getBookings);
  app.get('/api/bookings/:id', authenticate, bookingsController.getBookingById);
  app.patch('/api/bookings/:id/status', authenticate, bookingsController.updateBookingStatus);

  // 8. Notifications
  app.get('/api/notifications', authenticate, notificationsController.getNotifications);
  app.patch('/api/notifications/:id/read', authenticate, notificationsController.markNotificationAsRead);
  app.post('/api/notifications/read-all', authenticate, notificationsController.markAllNotificationsAsRead);

  // 9. Reviews
  app.post('/api/reviews', authenticate, reviewsController.createReview);

  // 10. Support Tickets
  app.post('/api/support', authenticate, supportController.createSupportTicket);
  app.get('/api/support', authenticate, supportController.getMySupportTickets);
  app.get('/api/support/:id', authenticate, supportController.getSupportTicketById);

  // 11. Customer Safety & Care
  app.get('/api/customer/emergency-contacts', authenticate, emergencyContactsController.getEmergencyContacts);
  app.post('/api/customer/emergency-contacts', authenticate, emergencyContactsController.createEmergencyContact);
  app.patch('/api/customer/emergency-contacts/:id', authenticate, emergencyContactsController.updateEmergencyContact);
  app.delete('/api/customer/emergency-contacts/:id', authenticate, emergencyContactsController.deleteEmergencyContact);
  app.post('/api/customer/emergency-contacts/:id/send-otp', authenticate, emergencyContactsController.sendContactVerificationOtp);
  app.post('/api/customer/emergency-contacts/:id/verify-otp', authenticate, emergencyContactsController.verifyContactOtp);
  app.get('/api/customer-care/contact', customerCareController.getCustomerCareInfo);

  // 12. Duplicate Account Screening
  app.post('/api/registration/check-duplicate', duplicateDetectionController.checkDuplicate);

  // 13. Worker Mobile OTP & Verifications
  app.post('/api/worker/mobile/send-otp', authenticate, workerVerificationController.sendWorkerMobileOtp);
  app.post('/api/worker/mobile/verify-otp', authenticate, workerVerificationController.verifyWorkerMobileOtp);
  app.post('/api/worker/verification/identity', authenticate, workerVerificationController.submitIdentityDocument);
  app.get('/api/worker/verification/identity', authenticate, workerVerificationController.getIdentityDocuments);
  app.post('/api/worker/verification/skills', authenticate, workerVerificationController.submitSkillEvidence);
  app.get('/api/worker/verification/skills', authenticate, workerVerificationController.getSkillEvidences);
  app.get('/api/worker/terms/rights-charter', authenticate, workerVerificationController.getCurrentWorkerTerms);
  app.post('/api/worker/terms/accept', authenticate, workerVerificationController.acceptWorkerTerms);
  app.get('/api/worker/verification/dashboard', authenticate, workerVerificationController.getWorkerVerificationDashboard);

  // 14. Worker Credibility, Badges & RPL
  app.post('/api/worker/rpl/applications', authenticate, credibilityController.submitRplApplication);
  app.get('/api/worker/rpl/status', authenticate, credibilityController.getWorkerRplStatus);
  app.get('/api/workers/:id/credibility', credibilityController.getWorkerCredibility);

  // 15. Visiting Charges & Callout Policies
  app.get('/api/workers/:id/visiting-charges', visitingChargesController.getWorkerVisitingChargesById);
  app.get('/api/worker/visiting-charges', authenticate, visitingChargesController.getMyVisitingCharges);
  app.patch('/api/worker/visiting-charges', authenticate, visitingChargesController.updateMyVisitingCharges);
  app.post('/api/bookings/:id/visiting-charge-acknowledgement', authenticate, visitingChargesController.acknowledgeBookingVisitingCharge);

  // 16. Customer Safety & Emergency SOS Engine
  app.post('/api/safety/sos', authenticate, safetyController.triggerSos);
  app.post('/api/safety/:id/acknowledge', authenticate, safetyController.resolveSos);
  app.post('/api/safety/:id/cancel', authenticate, safetyController.resolveSos);
  app.get('/api/customer/safety-events', authenticate, safetyController.getCustomerSafetyEvents);
  app.post('/api/safety/checkin/init', authenticate, safetyController.initBookingSafetyCheckin);
  app.post('/api/safety/checkin/:id/acknowledge', authenticate, safetyController.acknowledgeSafetyCheckin);
  app.post('/api/safety/checkin/:id/escalate', authenticate, safetyController.escalateSafetyCheckin);
  app.get('/api/bookings/:id/safety-status', authenticate, safetyController.getBookingSafetyStatus);

  // 17. Certificate Verification Adapters (QR & DigiLocker)
  app.post('/api/certificates/verify-qr', authenticate, certificateVerificationController.verifyCertificateQr);
  app.post('/api/certificates/digilocker/fetch', authenticate, certificateVerificationController.fetchDigilockerCertificate);
  app.get('/api/worker/certificates', authenticate, certificateVerificationController.getWorkerCertificates);

  // 18. Admin Review System
  app.get('/api/admin/verifications/identity', authenticate, adminController.getPendingIdentityVerifications);
  app.patch('/api/admin/verifications/identity/:id', authenticate, adminController.reviewIdentityDocument);
  app.get('/api/admin/verifications/skills', authenticate, adminController.getPendingSkillEvidences);
  app.patch('/api/admin/verifications/skills/:id', authenticate, adminController.reviewSkillEvidence);
  app.get('/api/admin/rpl/applications', authenticate, adminController.getPendingRplApplications);
  app.patch('/api/admin/rpl/applications/:id', authenticate, adminController.reviewRplApplication);
  app.get('/api/admin/duplicate-flags', authenticate, adminController.getDuplicateFlags);
  app.patch('/api/admin/duplicate-flags/:id/resolve', authenticate, adminController.resolveDuplicateFlag);
  app.get('/api/admin/safety/incidents', authenticate, adminController.getSafetyIncidents);

  // 11. Statically Serve Unified Frontend Client (Full-Stack Deployment)
  const clientDistPath = path.resolve(__dirname, '../../apps/customer/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // 404 Handler for API routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  return app;
}
