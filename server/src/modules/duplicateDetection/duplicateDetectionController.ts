import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { prisma } from '../../database/prisma.js';
import { detectDuplicateRegistration } from './duplicateDetectionService.js';

export async function checkDuplicate(req: Request, res: Response) {
  try {
    const { email, phone, role, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for pre-registration check.' });
    }

    const result = await detectDuplicateRegistration({
      email,
      phone,
      role: role || 'CUSTOMER',
      name: name || '',
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify account duplication', details: error.message });
  }
}

export async function getDuplicateFlags(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin privileges required to review duplicate account flags.' });
    }

    const flags = await prisma.duplicateAccountFlag.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ flags });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch duplicate flags', details: error.message });
  }
}

export async function reviewDuplicateFlag(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin privileges required to review duplicate account flags.' });
    }

    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['RESOLVED_LEGITIMATE', 'RESOLVED_DUPLICATE', 'UNDER_REVIEW'].includes(status)) {
      return res.status(400).json({ error: 'Invalid review status.' });
    }

    const updated = await prisma.duplicateAccountFlag.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: req.user.userId,
        action: 'REVIEW_DUPLICATE_FLAG',
        entityType: 'DUPLICATE_FLAG',
        entityId: id,
        metadata: JSON.stringify({ status, reviewNotes }),
      },
    });

    res.json({ message: 'Duplicate flag reviewed successfully.', flag: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to review duplicate flag', details: error.message });
  }
}
