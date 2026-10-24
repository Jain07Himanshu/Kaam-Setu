import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { emitToRole } from '../../sockets/socketManager.js';

export async function getWorkers(req: Request, res: Response) {
  try {
    const { category, availableOnly, search } = req.query;

    const whereClause: any = {
      user: { status: 'ACTIVE' },
    };

    if (availableOnly === 'true') {
      whereClause.isAvailable = true;
    }

    if (category) {
      whereClause.workerServices = {
        some: {
          serviceCategory: {
            OR: [
              { id: category as string },
              { slug: category as string },
            ],
          },
        },
      };
    }

    if (search) {
      whereClause.OR = [
        { user: { name: { contains: search as string } } },
        { bio: { contains: search as string } },
      ];
    }

    const workers = await prisma.workerProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, phone: true },
        },
        verifications: true,
        workerServices: {
          include: { serviceCategory: true },
        },
      },
      orderBy: { ratingAvg: 'desc' },
    });

    const formatted = workers.map((w) => {
      let parsedSkills = [];
      try {
        parsedSkills = typeof w.skills === 'string' ? JSON.parse(w.skills) : w.skills;
      } catch (e) {
        parsedSkills = [];
      }
      return {
        ...w,
        skills: parsedSkills,
      };
    });

    return res.json({ workers: formatted });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return res.status(500).json({ error: 'Failed to fetch workers' });
  }
}

export async function getWorkerById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const worker = await prisma.workerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, phone: true, createdAt: true },
        },
        verifications: true,
        workerServices: {
          include: { serviceCategory: true },
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Get recent reviews
    const reviews = await prisma.review.findMany({
      where: { revieweeId: worker.userId },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let parsedSkills = [];
    try {
      parsedSkills = typeof worker.skills === 'string' ? JSON.parse(worker.skills) : worker.skills;
    } catch (e) {
      parsedSkills = [];
    }

    return res.json({
      worker: {
        ...worker,
        skills: parsedSkills,
        reviews,
      },
    });
  } catch (error) {
    console.error('Error fetching worker profile:', error);
    return res.status(500).json({ error: 'Failed to fetch worker profile' });
  }
}

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export async function updateAvailability(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker authentication required' });
    }

    const { isAvailable } = updateAvailabilitySchema.parse(req.body);

    const updatedWorker = await prisma.workerProfile.update({
      where: { id: req.workerProfileId },
      data: { isAvailable },
    });

    // Notify clients of availability update
    emitToRole('CUSTOMER', 'worker.availability.changed', {
      workerId: updatedWorker.id,
      isAvailable,
    });

    return res.json({
      message: `Availability updated to ${isAvailable ? 'AVAILABLE (Online)' : 'UNAVAILABLE (Offline)'}`,
      isAvailable: updatedWorker.isAvailable,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Error updating availability:', error);
    return res.status(500).json({ error: 'Failed to update availability' });
  }
}

const updateProfileSchema = z.object({
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  serviceRadiusKm: z.number().positive().optional(),
  hourlyRate: z.number().positive().optional(),
  baseRate: z.number().positive().optional(),
});

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker authentication required' });
    }

    const data = updateProfileSchema.parse(req.body);
    const updatePayload: any = {};

    if (data.bio !== undefined) updatePayload.bio = data.bio;
    if (data.skills !== undefined) updatePayload.skills = JSON.stringify(data.skills);
    if (data.serviceRadiusKm !== undefined) updatePayload.serviceRadiusKm = data.serviceRadiusKm;
    if (data.hourlyRate !== undefined) updatePayload.hourlyRate = data.hourlyRate;
    if (data.baseRate !== undefined) updatePayload.baseRate = data.baseRate;

    const updatedWorker = await prisma.workerProfile.update({
      where: { id: req.workerProfileId },
      data: updatePayload,
      include: {
        verifications: true,
        workerServices: { include: { serviceCategory: true } },
      },
    });

    return res.json({ message: 'Profile updated successfully', worker: updatedWorker });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function getEarnings(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker authentication required' });
    }

    const completedBookings = await prisma.booking.findMany({
      where: {
        workerId: req.workerProfileId,
        status: 'COMPLETED',
      },
      include: {
        jobRequest: { include: { serviceCategory: true } },
        customer: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const totalGrossEarnings = completedBookings.reduce((sum, b) => sum + b.agreedPrice, 0);
    const completedCount = completedBookings.length;
    const averageJobValue = completedCount > 0 ? Math.round(totalGrossEarnings / completedCount) : 0;

    return res.json({
      summary: {
        totalGrossEarnings,
        completedCount,
        averageJobValue,
        currency: 'INR',
      },
      completedBookings,
    });
  } catch (error) {
    console.error('Error fetching worker earnings:', error);
    return res.status(500).json({ error: 'Failed to fetch earnings' });
  }
}
