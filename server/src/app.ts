import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import { authenticate } from './middleware/auth.js';

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

  // 404 Handler
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
