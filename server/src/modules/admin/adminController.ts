import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { evaluateAndAwardWorkerBadges } from '../credibility/badgesEngine.js';

const reviewDocSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

const reviewSkillSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'ADDITIONAL_INFO_REQUIRED']),
  reviewerNotes: z.string().optional(),
});

const reviewRplSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewerNotes: z.string().optional(),
});

const resolveDuplicateSchema = z.object({
  resolutionAction: z.enum(['RESOLVED_LEGITIMATE', 'RESOLVED_DUPLICATE']),
  reviewNotes: z.string().min(5, 'Review notes are required'),
});

export async function getPendingIdentityVerifications(req: AuthenticatedRequest, res: Response) {
  try {
    const status = (req.query.status as string) || 'SUBMITTED';

    const documents = await prisma.workerIdentityDocument.findMany({
      where: status === 'ALL' ? undefined : { verificationStatus: status },
      include: {
        worker: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true, createdAt: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.status(200).json({ documents });
  } catch (error) {
    console.error('Get identity verifications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve identity verification queue' });
  }
}

export async function reviewIdentityDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = reviewDocSchema.parse(req.body);

    const doc = await prisma.workerIdentityDocument.findUnique({
      where: { id },
      include: { worker: true },
    });

    if (!doc) {
      return res.status(404).json({ error: 'Identity document not found' });
    }

    const updated = await prisma.workerIdentityDocument.update({
      where: { id },
      data: {
        verificationStatus: status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        reviewedAt: new Date(),
        reviewerId: req.user?.userId || 'ADMIN',
      },
    });

    await evaluateAndAwardWorkerBadges(doc.workerId);

    return res.status(200).json({
      message: `Document status updated to ${status}`,
      document: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Review identity document error:', error);
    return res.status(500).json({ error: 'Failed to review identity document' });
  }
}

export async function getPendingSkillEvidences(req: AuthenticatedRequest, res: Response) {
  try {
    const status = (req.query.status as string) || 'SUBMITTED';

    const evidences = await prisma.workerSkillEvidence.findMany({
      where: status === 'ALL' ? undefined : { verificationStatus: status },
      include: {
        worker: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        certificateVerificationRecords: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.status(200).json({ evidences });
  } catch (error) {
    console.error('Get skill evidences error:', error);
    return res.status(500).json({ error: 'Failed to retrieve skill evidences queue' });
  }
}

export async function reviewSkillEvidence(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, reviewerNotes } = reviewSkillSchema.parse(req.body);

    const evidence = await prisma.workerSkillEvidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Skill evidence not found' });
    }

    const updated = await prisma.workerSkillEvidence.update({
      where: { id },
      data: {
        verificationStatus: status,
        reviewerNotes: reviewerNotes || null,
        reviewedAt: new Date(),
        reviewerId: req.user?.userId || 'ADMIN',
      },
    });

    if (status === 'VERIFIED') {
      await evaluateAndAwardWorkerBadges(evidence.workerId);
    }

    return res.status(200).json({
      message: `Skill evidence marked as ${status}`,
      evidence: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Review skill evidence error:', error);
    return res.status(500).json({ error: 'Failed to review skill evidence' });
  }
}

export async function getPendingRplApplications(req: AuthenticatedRequest, res: Response) {
  try {
    const status = (req.query.status as string) || 'SUBMITTED';

    const applications = await prisma.workerRPLApplication.findMany({
      where: status === 'ALL' ? undefined : { assessmentStatus: status },
      include: {
        worker: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ applications });
  } catch (error) {
    console.error('Get RPL applications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve RPL applications queue' });
  }
}

export async function reviewRplApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, reviewerNotes } = reviewRplSchema.parse(req.body);

    const app = await prisma.workerRPLApplication.findUnique({
      where: { id },
    });

    if (!app) {
      return res.status(404).json({ error: 'RPL application not found' });
    }

    const updated = await prisma.workerRPLApplication.update({
      where: { id },
      data: {
        assessmentStatus: status,
        reviewerNotes: reviewerNotes || null,
        reviewerId: req.user?.userId || 'ADMIN',
        assessmentDate: new Date(),
        outcome: status === 'APPROVED' ? 'Approved through portfolio verification' : 'Rejected - insufficient trade evidence',
      },
    });

    if (status === 'APPROVED') {
      await evaluateAndAwardWorkerBadges(app.workerId);
    }

    return res.status(200).json({
      message: `RPL Application marked as ${status}`,
      application: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Review RPL application error:', error);
    return res.status(500).json({ error: 'Failed to review RPL application' });
  }
}

export async function getDuplicateFlags(req: AuthenticatedRequest, res: Response) {
  try {
    const flags = await prisma.duplicateAccountFlag.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ duplicateFlags: flags });
  } catch (error) {
    console.error('Get duplicate flags error:', error);
    return res.status(500).json({ error: 'Failed to retrieve duplicate flags' });
  }
}

export async function resolveDuplicateFlag(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { resolutionAction, reviewNotes } = resolveDuplicateSchema.parse(req.body);

    const flag = await prisma.duplicateAccountFlag.findUnique({
      where: { id },
    });

    if (!flag) {
      return res.status(404).json({ error: 'Duplicate flag record not found' });
    }

    const updated = await prisma.duplicateAccountFlag.update({
      where: { id },
      data: {
        status: resolutionAction,
        reviewNotes: `${flag.reviewNotes ? flag.reviewNotes + '\n' : ''}[Resolution: ${resolutionAction}] ${reviewNotes}`,
        reviewedBy: req.user?.userId || 'ADMIN',
        reviewedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: 'Duplicate flag resolved successfully',
      duplicateFlag: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Resolve duplicate flag error:', error);
    return res.status(500).json({ error: 'Failed to resolve duplicate flag' });
  }
}

export async function getSafetyIncidents(req: AuthenticatedRequest, res: Response) {
  try {
    const incidents = await prisma.safetyEvent.findMany({
      include: {
        customer: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        callLogs: true,
        booking: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            worker: {
              select: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ safetyIncidents: incidents });
  } catch (error) {
    console.error('Get safety incidents error:', error);
    return res.status(500).json({ error: 'Failed to retrieve safety incidents' });
  }
}
