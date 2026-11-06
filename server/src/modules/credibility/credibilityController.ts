import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { evaluateAndAwardWorkerBadges } from './badgesEngine.js';

const submitRplSchema = z.object({
  skillCategory: z.string().min(2, 'Skill category is required'),
  yearsOfPriorExperience: z.number().int().min(1, 'Years of experience must be at least 1').max(50),
  selfReportedWorkSummary: z.string().min(20, 'Please provide a detailed work summary (min 20 characters)'),
  references: z.array(z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    relationship: z.string().min(2),
  })).optional(),
});

export async function submitRplApplication(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'WORKER') {
      return res.status(403).json({ error: 'Only registered workers can submit RPL applications' });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const data = submitRplSchema.parse(req.body);

    const application = await prisma.workerRPLApplication.create({
      data: {
        workerId: worker.id,
        skillCategory: data.skillCategory,
        yearsOfPriorExperience: data.yearsOfPriorExperience,
        evidenceReference: JSON.stringify({
          workSummary: data.selfReportedWorkSummary,
          references: data.references || [],
        }),
        assessmentStatus: 'SUBMITTED',
      },
    });

    return res.status(201).json({
      message: 'RPL (Recognition of Prior Learning) application submitted for admin review',
      application,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Submit RPL error:', error);
    return res.status(500).json({ error: 'Failed to submit RPL application' });
  }
}

export async function getWorkerRplStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'WORKER') {
      return res.status(403).json({ error: 'Only workers can access their RPL status' });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: req.user.userId },
      include: {
        rplApplications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    return res.status(200).json({
      applications: worker.rplApplications,
    });
  } catch (error) {
    console.error('Get RPL status error:', error);
    return res.status(500).json({ error: 'Failed to fetch RPL status' });
  }
}

export async function getWorkerCredibility(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const worker = await prisma.workerProfile.findFirst({
      where: {
        OR: [
          { id },
          { userId: id },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
            avatarUrl: true,
          },
        },
        workerServices: {
          include: { serviceCategory: true },
        },
        identityDocuments: true,
        skillEvidences: {
          select: {
            id: true,
            skillCategory: true,
            documentTitle: true,
            issuingOrganisation: true,
            verificationStatus: true,
            reviewedAt: true,
            submittedAt: true,
            issueDate: true,
          },
        },
        rplApplications: {
          where: { assessmentStatus: 'APPROVED' },
          select: {
            id: true,
            skillCategory: true,
            yearsOfPriorExperience: true,
            assessmentStatus: true,
            assessmentDate: true,
          },
        },
        badges: {
          orderBy: { awardedAt: 'desc' },
        },
        visitingCharge: true,
      },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Refresh badges automatically based on current DB state
    await evaluateAndAwardWorkerBadges(worker.id);

    const refreshedBadges = await prisma.workerBadge.findMany({
      where: { workerId: worker.id },
      orderBy: { awardedAt: 'desc' },
    });

    // Compute multicategory reviews
    const reviews = await prisma.review.findMany({
      where: { revieweeId: worker.userId },
      select: {
        rating: true,
        serviceQuality: true,
        punctuality: true,
        professionalism: true,
        communication: true,
        comment: true,
        createdAt: true,
        reviewer: {
          select: { name: true, avatarUrl: true },
        },
      },
    });

    const totalReviews = reviews.length;
    let avgServiceQuality: number | null = null;
    let avgPunctuality: number | null = null;
    let avgProfessionalism: number | null = null;
    let avgCommunication: number | null = null;

    if (totalReviews > 0) {
      const sqList = reviews.map(r => r.serviceQuality).filter((v): v is number => v !== null && v !== undefined);
      const puncList = reviews.map(r => r.punctuality).filter((v): v is number => v !== null && v !== undefined);
      const profList = reviews.map(r => r.professionalism).filter((v): v is number => v !== null && v !== undefined);
      const commList = reviews.map(r => r.communication).filter((v): v is number => v !== null && v !== undefined);

      if (sqList.length > 0) avgServiceQuality = Math.round((sqList.reduce((a, b) => a + b, 0) / sqList.length) * 10) / 10;
      if (puncList.length > 0) avgPunctuality = Math.round((puncList.reduce((a, b) => a + b, 0) / puncList.length) * 10) / 10;
      if (profList.length > 0) avgProfessionalism = Math.round((profList.reduce((a, b) => a + b, 0) / profList.length) * 10) / 10;
      if (commList.length > 0) avgCommunication = Math.round((commList.reduce((a, b) => a + b, 0) / commList.length) * 10) / 10;
    }

    // Verified certificate records
    const verifiedCertificates = await prisma.certificateVerificationRecord.findMany({
      where: {
        workerSkillEvidence: { workerId: worker.id },
        status: 'VERIFIED_BY_ISSUER',
      },
      select: {
        id: true,
        certificateNumber: true,
        issuingAuthority: true,
        verificationMethod: true,
        status: true,
        verifiedAt: true,
        workerSkillEvidence: {
          select: {
            documentTitle: true,
            skillCategory: true,
          },
        },
      },
    });

    const isIdentityVerified = worker.identityDocuments.some(v => v.verificationStatus === 'VERIFIED');
    const pendingIdentity = worker.identityDocuments.some(v => v.verificationStatus === 'SUBMITTED' || v.verificationStatus === 'UNDER_REVIEW');

    const primaryCategory = worker.workerServices[0]?.serviceCategory?.name || 'Trade Professional';
    const experienceYears = worker.workerServices[0]?.experienceYears || 5;
    const serviceArea = `Within ${worker.serviceRadiusKm} km radius`;

    return res.status(200).json({
      workerId: worker.id,
      userId: worker.userId,
      name: worker.user.name,
      avatarUrl: worker.user.avatarUrl,
      bio: worker.bio,
      category: primaryCategory,
      serviceCategories: worker.workerServices.map(ws => ws.serviceCategory.name),
      experienceYears,
      serviceArea,
      skills: JSON.parse(worker.skills || '[]'),
      overallRating: worker.ratingAvg,
      reviewCount: worker.ratingCount,
      completedJobsCount: worker.completedJobsCount,
      trustVerification: {
        phoneVerified: Boolean(worker.user.phone),
        identityVerified: isIdentityVerified,
        identityStatus: isIdentityVerified ? 'VERIFIED' : (pendingIdentity ? 'PENDING' : 'NOT_SUBMITTED'),
        hasVerifiedSkillDocs: worker.skillEvidences.some(s => s.verificationStatus === 'VERIFIED'),
        hasVerifiedCertificates: verifiedCertificates.length > 0,
        hasRplRecognition: worker.rplApplications.length > 0,
      },
      visitingCharge: worker.visitingCharge ? {
        amount: worker.visitingCharge.amount,
        isRefundableOrAdjustable: worker.visitingCharge.isRefundableOrAdjustable,
        terms: worker.visitingCharge.terms,
      } : {
        amount: 150,
        isRefundableOrAdjustable: true,
        terms: 'Standard visiting inspection fee, adjusted against final service bill upon hire.',
      },
      ratingsBreakdown: {
        overall: worker.ratingAvg,
        serviceQuality: avgServiceQuality || worker.ratingAvg,
        punctuality: avgPunctuality || worker.ratingAvg,
        professionalism: avgProfessionalism || worker.ratingAvg,
        communication: avgCommunication || worker.ratingAvg,
        totalReviews,
      },
      verifiedSkillEvidences: worker.skillEvidences.filter(s => s.verificationStatus === 'VERIFIED'),
      skillEvidences: worker.skillEvidences,
      rplRecognitions: worker.rplApplications,
      verifiedCertificates,
      badges: refreshedBadges,
      recentReviews: reviews,
    });
  } catch (error) {
    console.error('Get worker credibility error:', error);
    return res.status(500).json({ error: 'Failed to retrieve worker credibility' });
  }
}
