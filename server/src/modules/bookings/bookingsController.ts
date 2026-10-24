import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  emitToCustomer,
  emitToWorker,
  emitToBooking,
} from '../../sockets/socketManager.js';

const statusUpdateSchema = z.object({
  status: z.enum(['ON_THE_WAY', 'WORK_STARTED', 'COMPLETED', 'CANCELLED']),
  startOtp: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export async function getBookings(req: AuthenticatedRequest, res: Response) {
  try {
    const role = req.user?.role;
    let whereClause: any = {};

    if (role === 'CUSTOMER') {
      if (!req.customerProfileId) {
        return res.status(403).json({ error: 'Customer profile required' });
      }
      whereClause.customerId = req.customerProfileId;
    } else if (role === 'WORKER') {
      if (!req.workerProfileId) {
        return res.status(403).json({ error: 'Worker profile required' });
      }
      whereClause.workerId = req.workerProfileId;
    } else if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        jobRequest: {
          include: { serviceCategory: true },
        },
        customer: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
          },
        },
        worker: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            verifications: true,
          },
        },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

export async function getBookingById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        jobRequest: {
          include: { serviceCategory: true },
        },
        customer: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
          },
        },
        worker: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            verifications: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Role check
    const isCustomer = req.user?.role === 'CUSTOMER' && booking.customer.userId === req.user.userId;
    const isWorker = req.user?.role === 'WORKER' && booking.worker.userId === req.user.userId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isCustomer && !isWorker && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to view this booking' });
    }

    // Customer security: full customer address is protected and only revealed to confirmed worker
    return res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return res.status(500).json({ error: 'Failed to fetch booking details' });
  }
}

export async function updateBookingStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = statusUpdateSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { include: { user: true } },
        worker: { include: { user: true } },
        jobRequest: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.worker.userId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the assigned worker can update booking execution status' });
    }

    const updatePayload: any = {
      status: data.status,
    };

    if (data.status === 'WORK_STARTED') {
      // Require matching OTP verification for safety
      if (!data.startOtp || data.startOtp.trim() !== booking.startOtp.trim()) {
        return res.status(400).json({
          error: 'Invalid start OTP. Please ask the customer for their 4-digit start verification code.',
        });
      }
      updatePayload.startedAt = new Date();
    } else if (data.status === 'COMPLETED') {
      updatePayload.completedAt = new Date();
    } else if (data.status === 'CANCELLED') {
      updatePayload.cancelledAt = new Date();
      updatePayload.cancellationReason = data.cancellationReason || 'Cancelled by worker';
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updatePayload,
      include: {
        jobRequest: { include: { serviceCategory: true } },
        customer: {
          include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
        },
        worker: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            verifications: true,
          },
        },
        review: true,
      },
    });

    // If completed, update worker's completedJobsCount and job request status
    if (data.status === 'COMPLETED') {
      await prisma.workerProfile.update({
        where: { id: booking.workerId },
        data: { completedJobsCount: { increment: 1 } },
      });
      await prisma.jobRequest.update({
        where: { id: booking.jobRequestId },
        data: { status: 'COMPLETED' },
      });
    }

    // Real-time broadcasts
    emitToBooking(booking.id, 'booking.status.updated', {
      bookingId: booking.id,
      status: data.status,
      booking: updatedBooking,
    });
    emitToCustomer(booking.customerId, 'booking.status.updated', {
      bookingId: booking.id,
      status: data.status,
      booking: updatedBooking,
    });
    emitToWorker(booking.workerId, 'booking.status.updated', {
      bookingId: booking.id,
      status: data.status,
      booking: updatedBooking,
    });

    // Notifications for customer
    let notificationTitle = 'Booking Status Updated';
    let notificationMsg = `Status is now ${data.status}`;

    if (data.status === 'ON_THE_WAY') {
      notificationTitle = 'Worker is On The Way! 🚗';
      notificationMsg = `${booking.worker.user.name} is on the way to your location.`;
    } else if (data.status === 'WORK_STARTED') {
      notificationTitle = 'Work Started ⏱️';
      notificationMsg = `${booking.worker.user.name} verified start OTP and started work.`;
    } else if (data.status === 'COMPLETED') {
      notificationTitle = 'Service Completed! ⭐';
      notificationMsg = `${booking.worker.user.name} marked the service complete. Please review your experience.`;
    }

    await prisma.notification.create({
      data: {
        recipientUserId: booking.customer.userId,
        type:
          data.status === 'ON_THE_WAY'
            ? 'WORKER_ON_THE_WAY'
            : data.status === 'WORK_STARTED'
            ? 'WORK_STARTED'
            : 'BOOKING_COMPLETED',
        title: notificationTitle,
        message: notificationMsg,
        relatedEntityType: 'BOOKING',
        relatedEntityId: booking.id,
      },
    });

    return res.json({
      message: `Booking status updated to ${data.status}`,
      booking: updatedBooking,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Update booking status error:', error);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
}
