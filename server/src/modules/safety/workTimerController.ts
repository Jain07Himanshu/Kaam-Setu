import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { WorkTimerEngine } from './workTimerEngine.js';

const startTimerSchema = z.object({
  hours: z.number().int().min(0).max(24).default(0),
  minutes: z.number().int().min(0).max(59).default(0),
  durationMinutes: z.number().int().positive().optional(),
  gracePeriodMinutes: z.number().int().min(1).max(30).optional(),
});

const extensionRequestSchema = z.object({
  additionalHours: z.number().int().min(0).max(12).default(0),
  additionalMinutes: z.number().int().min(0).max(59).default(0),
  totalAdditionalMinutes: z.number().int().positive().optional(),
  reason: z.string().min(3, 'Please describe why additional time is required (min 3 characters)'),
});

const extensionResponseSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});

export async function startWorkTimer(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Only the assigned worker can configure and start the work timer' });
    }

    const { id } = req.params;
    const body = startTimerSchema.parse(req.body);

    const calculatedMinutes = body.durationMinutes || (body.hours * 60 + body.minutes);

    if (calculatedMinutes <= 0) {
      return res.status(400).json({ error: 'Expected duration must be greater than 0 minutes' });
    }

    const result = await WorkTimerEngine.startWorkTimer({
      bookingId: id,
      workerId: req.workerProfileId,
      expectedDurationMinutes: calculatedMinutes,
      gracePeriodMinutes: body.gracePeriodMinutes || 2,
    });

    return res.status(201).json({
      message: 'Work timer started successfully',
      timer: result.workTimer,
      safetyCheckIn: result.safetyCheckIn,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Start work timer error:', error);
    return res.status(400).json({ error: error.message || 'Failed to start work timer' });
  }
}

export async function getBookingTimerStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const status = await WorkTimerEngine.getBookingTimerStatus(id);

    if (!status) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.status(200).json(status);
  } catch (error: any) {
    console.error('Get booking timer status error:', error);
    return res.status(500).json({ error: 'Failed to retrieve timer status' });
  }
}

export async function requestTimerExtension(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Only registered workers can request timer extensions' });
    }

    const { id } = req.params;
    const body = extensionRequestSchema.parse(req.body);

    const additionalMinutes = body.totalAdditionalMinutes || (body.additionalHours * 60 + body.additionalMinutes);

    if (additionalMinutes <= 0) {
      return res.status(400).json({ error: 'Additional time requested must be greater than 0 minutes' });
    }

    const extension = await WorkTimerEngine.requestExtension({
      bookingId: id,
      workerId: req.workerProfileId,
      additionalMinutes,
      reason: body.reason,
    });

    return res.status(201).json({
      message: 'Extension request sent to customer for approval',
      extension,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Request timer extension error:', error);
    return res.status(400).json({ error: error.message || 'Failed to request extension' });
  }
}

export async function respondToTimerExtension(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Only the customer can approve or reject timer extensions' });
    }

    const { id, extensionId } = req.params;
    const body = extensionResponseSchema.parse(req.body);

    const result = await WorkTimerEngine.respondToExtension({
      bookingId: id,
      customerId: req.customerProfileId,
      extensionId,
      action: body.action,
    });

    return res.status(200).json({
      message: `Timer extension request ${body.action === 'APPROVE' ? 'approved' : 'rejected'}`,
      ...result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Respond to timer extension error:', error);
    return res.status(400).json({ error: error.message || 'Failed to respond to extension' });
  }
}

export async function acknowledgeSafe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Only the customer can acknowledge the safety check-in alarm' });
    }

    const { id } = req.params;

    const result = await WorkTimerEngine.acknowledgeSafe({
      bookingId: id,
      customerId: req.customerProfileId,
    });

    return res.status(200).json({
      message: 'Safety check-in acknowledged. Alarm stopped successfully.',
      ...result,
    });
  } catch (error: any) {
    console.error('Acknowledge safe error:', error);
    return res.status(400).json({ error: error.message || 'Failed to acknowledge safety check-in' });
  }
}

export async function resetTimerCycle(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Only the assigned worker can set an updated duration' });
    }

    const { id } = req.params;
    const body = startTimerSchema.parse(req.body);

    const calculatedMinutes = body.durationMinutes || (body.hours * 60 + body.minutes);

    if (calculatedMinutes <= 0) {
      return res.status(400).json({ error: 'Duration must be greater than 0 minutes' });
    }

    const result = await WorkTimerEngine.resetCycle({
      bookingId: id,
      workerId: req.workerProfileId,
      newDurationMinutes: calculatedMinutes,
    });

    return res.status(201).json({
      message: 'Updated service duration established successfully',
      timer: result.workTimer,
      safetyCheckIn: result.safetyCheckIn,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Reset timer cycle error:', error);
    return res.status(400).json({ error: error.message || 'Failed to update duration' });
  }
}

