import { Response } from 'express';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

export async function getWorkerOffers(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Only registered workers can access job offers' });
    }

    const { status } = req.query;

    const whereClause: any = {
      workerId: req.workerProfileId,
    };

    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }

    const offers = await prisma.jobOffer.findMany({
      where: whereClause,
      include: {
        jobRequest: {
          include: {
            serviceCategory: true,
            customer: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
            quotes: {
              where: { workerId: req.workerProfileId },
              include: {
                negotiations: { orderBy: { createdAt: 'asc' } },
              },
            },
            booking: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    // Parse JSON matchReasons if string
    const formattedOffers = offers.map((offer) => {
      let parsedReasons: string[] = [];
      try {
        parsedReasons = typeof offer.matchReasons === 'string' ? JSON.parse(offer.matchReasons) : offer.matchReasons;
      } catch (e) {
        parsedReasons = ['Category & Area match'];
      }
      return {
        ...offer,
        matchReasons: parsedReasons,
      };
    });

    return res.json({ offers: formattedOffers });
  } catch (error) {
    console.error('Error fetching worker offers:', error);
    return res.status(500).json({ error: 'Failed to fetch job offers' });
  }
}

export async function getOfferById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker authentication required' });
    }

    const offer = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        jobRequest: {
          include: {
            serviceCategory: true,
            customer: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
            quotes: {
              where: { workerId: req.workerProfileId },
              include: { negotiations: { orderBy: { createdAt: 'asc' } } },
            },
          },
        },
      },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Job offer not found' });
    }

    // Authorization check
    if (offer.workerId !== req.workerProfileId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view this job offer' });
    }

    // Mark as VIEWED if previously PENDING
    if (offer.status === 'PENDING') {
      await prisma.jobOffer.update({
        where: { id },
        data: { status: 'VIEWED' },
      });
      offer.status = 'VIEWED';
    }

    let parsedReasons: string[] = [];
    try {
      parsedReasons = typeof offer.matchReasons === 'string' ? JSON.parse(offer.matchReasons) : offer.matchReasons;
    } catch (e) {
      parsedReasons = ['Category & Area match'];
    }

    return res.json({
      offer: {
        ...offer,
        matchReasons: parsedReasons,
      },
    });
  } catch (error) {
    console.error('Error fetching offer details:', error);
    return res.status(500).json({ error: 'Failed to fetch job offer details' });
  }
}

export async function declineOffer(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker authentication required' });
    }

    const offer = await prisma.jobOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    if (offer.workerId !== req.workerProfileId) {
      return res.status(403).json({ error: 'Unauthorized to decline this offer' });
    }

    const updatedOffer = await prisma.jobOffer.update({
      where: { id },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
    });

    return res.json({ message: 'Offer declined', offer: updatedOffer });
  } catch (error) {
    console.error('Error declining offer:', error);
    return res.status(500).json({ error: 'Failed to decline offer' });
  }
}
