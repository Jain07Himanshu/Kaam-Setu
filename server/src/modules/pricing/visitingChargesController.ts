import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

const updateVisitingChargeSchema = z.object({
  amount: z.number().min(0, 'Amount must be non-negative').max(5000, 'Visiting charge cannot exceed ₹5,000'),
  isRefundableOrAdjustable: z.boolean().default(true),
  terms: z.string().min(5, 'Terms and conditions must be specified (min 5 characters)'),
});

const acknowledgeChargeSchema = z.object({
  customerAcknowledgement: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm and acknowledge the visiting charge policy' }),
  }),
});

export async function getWorkerVisitingChargesById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const worker = await prisma.workerProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        visitingCharge: true,
      },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    if (!worker.visitingCharge) {
      return res.status(200).json({
        workerId: worker.id,
        amount: 150,
        isRefundableOrAdjustable: true,
        terms: 'Standard visiting inspection fee, adjusted against final service bill upon hire.',
        isDefault: true,
      });
    }

    return res.status(200).json({
      workerId: worker.id,
      amount: worker.visitingCharge.amount,
      isRefundableOrAdjustable: worker.visitingCharge.isRefundableOrAdjustable,
      terms: worker.visitingCharge.terms,
      updatedAt: worker.visitingCharge.updatedAt,
      isDefault: false,
    });
  } catch (error) {
    console.error('Get worker visiting charges error:', error);
    return res.status(500).json({ error: 'Failed to retrieve visiting charges' });
  }
}

export async function getMyVisitingCharges(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'WORKER') {
      return res.status(403).json({ error: 'Only workers can access their visiting charge settings' });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: req.user.userId },
      include: { visitingCharge: true },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    if (!worker.visitingCharge) {
      const defaultCharge = await prisma.visitingCharge.create({
        data: {
          workerId: worker.id,
          amount: 150,
          isRefundableOrAdjustable: true,
          terms: '₹150 inspection charge upon technician arrival. 100% deducted from total service invoice if work is approved and executed.',
        },
      });
      return res.status(200).json(defaultCharge);
    }

    return res.status(200).json(worker.visitingCharge);
  } catch (error) {
    console.error('Get my visiting charges error:', error);
    return res.status(500).json({ error: 'Failed to retrieve visiting charges' });
  }
}

export async function updateMyVisitingCharges(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'WORKER') {
      return res.status(403).json({ error: 'Only workers can configure visiting charges' });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const data = updateVisitingChargeSchema.parse(req.body);

    const updated = await prisma.visitingCharge.upsert({
      where: { workerId: worker.id },
      create: {
        workerId: worker.id,
        amount: data.amount,
        isRefundableOrAdjustable: data.isRefundableOrAdjustable,
        terms: data.terms,
      },
      update: {
        amount: data.amount,
        isRefundableOrAdjustable: data.isRefundableOrAdjustable,
        terms: data.terms,
      },
    });

    return res.status(200).json({
      message: 'Visiting charge policy updated successfully',
      visitingCharge: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Update visiting charge error:', error);
    return res.status(500).json({ error: 'Failed to update visiting charges' });
  }
}

export async function acknowledgeBookingVisitingCharge(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can acknowledge visiting charges' });
    }

    const { id } = req.params; // bookingId
    acknowledgeChargeSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        worker: {
          include: { visitingCharge: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customer.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to acknowledge this booking charge' });
    }

    const chargeAmount = booking.worker.visitingCharge?.amount ?? 150;

    const acknowledgement = await prisma.bookingChargeAcknowledgement.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        visitingCharge: chargeAmount,
        termsVersion: 'v1.0',
      },
      update: {
        visitingCharge: chargeAmount,
        customerAcknowledgedAt: new Date(),
      },
    });

    return res.status(201).json({
      message: 'Visiting charge acknowledged successfully',
      acknowledgement,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Acknowledge visiting charge error:', error);
    return res.status(500).json({ error: 'Failed to acknowledge visiting charge' });
  }
}
