import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { matchWorkersForJob } from '../../matching/matchingEngine.js';
import {
  emitToCustomer,
  emitToWorker,
  emitToJob,
} from '../../sockets/socketManager.js';

const createJobSchema = z.object({
  serviceCategoryId: z.string().min(1, 'Service category is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Please describe the work needed (at least 10 characters)'),
  addressLabel: z.string().default('Home Address'),
  city: z.string().default('Metro City'),
  postalCode: z.string().default('10001'),
  latitude: z.number().default(40.7128),
  longitude: z.number().default(-74.006),
  budgetMin: z.number().optional().nullable(),
  budgetMax: z.number().optional().nullable(),
  isOpenToQuotes: z.boolean().default(true),
  urgency: z.enum(['ASAP', 'SCHEDULED']).default('ASAP'),
  scheduledAt: z.string().optional().nullable(),
});

export async function createJobRequest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can create service requests' });
    }

    let customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!customerProfile) {
      customerProfile = await prisma.customerProfile.create({
        data: { userId: req.user.userId },
      });
    }

    const data = createJobSchema.parse(req.body);

    const job = await prisma.jobRequest.create({
      data: {
        customerId: customerProfile.id,
        serviceCategoryId: data.serviceCategoryId,
        title: data.title,
        description: data.description,
        addressLabel: data.addressLabel,
        city: data.city,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        isOpenToQuotes: data.isOpenToQuotes,
        urgency: data.urgency,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: 'MATCHING',
      },
      include: {
        serviceCategory: true,
        customer: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, phone: true },
            },
          },
        },
      },
    });

    // Run Fair Matching Engine to find eligible online workers
    const matchedCandidates = await matchWorkersForJob(job.id);
    const createdOffers = [];

    for (const candidate of matchedCandidates) {
      try {
        const offer = await prisma.jobOffer.create({
          data: {
            jobRequestId: job.id,
            workerId: candidate.workerId,
            status: 'PENDING',
            matchScore: candidate.matchScore,
            matchReasons: JSON.stringify(candidate.matchReasons),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
          },
          include: {
            jobRequest: {
              include: {
                serviceCategory: true,
                customer: {
                  include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
        });

        createdOffers.push(offer);

        // Real-time dispatch to worker room
        emitToWorker(candidate.workerId, 'job.offer.created', {
          offer,
          matchScore: candidate.matchScore,
          matchReasons: candidate.matchReasons,
        });

        // Durable in-app notification saved to database
        await prisma.notification.create({
          data: {
            recipientUserId: candidate.userId,
            type: 'JOB_OFFER_RECEIVED',
            title: `New ${job.serviceCategory.name} Request nearby!`,
            message: `"${job.title}" - ${candidate.distanceKm} km away. Match score: ${candidate.matchScore}%`,
            relatedEntityType: 'JOB_REQUEST',
            relatedEntityId: job.id,
          },
        });
      } catch (e) {
        // Unique constraint on (jobRequestId, workerId) prevents duplicate offers
      }
    }

    // Update job status to OFFERS_RECEIVED if any matched, or leave in OPEN
    const updatedStatus = createdOffers.length > 0 ? 'OFFERS_RECEIVED' : 'OPEN';
    const finalJob = await prisma.jobRequest.update({
      where: { id: job.id },
      data: { status: updatedStatus },
      include: {
        serviceCategory: true,
        offers: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
                verifications: true,
              },
            },
          },
        },
      },
    });

    // Notify customer
    emitToCustomer(customerProfile.id, 'job.created', { jobRequest: finalJob });

    return res.status(201).json({
      message: 'Service request created successfully',
      jobRequest: finalJob,
      matchedWorkersCount: createdOffers.length,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create job request error:', error);
    return res.status(500).json({ error: 'Failed to create service request' });
  }
}

export async function getMyRequests(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Only customers can view their requests' });
    }

    const requests = await prisma.jobRequest.findMany({
      where: { customerId: req.customerProfileId },
      include: {
        serviceCategory: true,
        quotes: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
                verifications: true,
              },
            },
            negotiations: { orderBy: { createdAt: 'asc' } },
          },
        },
        booking: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
                verifications: true,
              },
            },
            review: true,
          },
        },
        offers: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ requests });
  } catch (error) {
    console.error('Error fetching my requests:', error);
    return res.status(500).json({ error: 'Failed to fetch service requests' });
  }
}

export async function getJobById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const job = await prisma.jobRequest.findUnique({
      where: { id },
      include: {
        serviceCategory: true,
        customer: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
          },
        },
        quotes: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
                verifications: true,
              },
            },
            negotiations: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { proposedPrice: 'asc' },
        },
        booking: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
                verifications: true,
              },
            },
            review: true,
          },
        },
        offers: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job request not found' });
    }

    // Role-based privacy protection:
    // If requester is a worker, they should only see their own quote and shouldn't see competing workers' quotes
    if (req.user?.role === 'WORKER') {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: req.user.userId },
      });
      if (workerProfile) {
        job.quotes = job.quotes.filter((q) => q.workerId === workerProfile.id);
      }
    }

    return res.json({ job });
  } catch (error) {
    console.error('Error fetching job details:', error);
    return res.status(500).json({ error: 'Failed to fetch job request details' });
  }
}

export async function cancelJob(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const job = await prisma.jobRequest.findUnique({
      where: { id },
      include: { customer: true, booking: true },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job request not found' });
    }

    if (job.customer.userId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to cancel this job request' });
    }

    if (job.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Completed jobs cannot be cancelled' });
    }

    const updatedJob = await prisma.jobRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // If there is an active booking, cancel it as well
    if (job.booking) {
      await prisma.booking.update({
        where: { id: job.booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: 'Cancelled by customer',
        },
      });

      emitToJob(job.id, 'booking.cancelled', { bookingId: job.booking.id });
    }

    emitToJob(job.id, 'job.cancelled', { jobId: job.id });

    return res.json({ message: 'Job request cancelled', job: updatedJob });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return res.status(500).json({ error: 'Failed to cancel job request' });
  }
}
