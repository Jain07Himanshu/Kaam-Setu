import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { emitToUser } from '../../sockets/socketManager.js';

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
});

export async function createReview(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can leave reviews' });
    }

    const { bookingId, rating, comment } = createReviewSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        worker: { include: { user: true } },
        jobRequest: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customer.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to review this booking' });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed bookings' });
    }

    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this booking' });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: req.user.userId,
        revieweeId: booking.worker.userId,
        rating,
        comment,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Authoritatively re-calculate worker's average rating
    const allWorkerReviews = await prisma.review.findMany({
      where: { revieweeId: booking.worker.userId },
      select: { rating: true },
    });

    const newCount = allWorkerReviews.length;
    const newAvg = allWorkerReviews.reduce((sum, r) => sum + r.rating, 0) / newCount;

    await prisma.workerProfile.update({
      where: { id: booking.workerId },
      data: {
        ratingAvg: Math.round(newAvg * 10) / 10,
        ratingCount: newCount,
      },
    });

    // Notify worker
    emitToUser(booking.worker.userId, 'review.received', { review });

    await prisma.notification.create({
      data: {
        recipientUserId: booking.worker.userId,
        type: 'REVIEW_RECEIVED',
        title: `New ${rating}★ Review from ${booking.customer.userId}!`,
        message: `"${comment}" for completed booking.`,
        relatedEntityType: 'BOOKING',
        relatedEntityId: booking.id,
      },
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
}
