import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { prisma } from '../../database/prisma.js';
import { normalizeIndianPhone, maskPhone, maskIdentity, generateOtp } from '../../utils/security.js';
import { SmsService } from './smsProvider.js';
import { emitToUser, emitToRole } from '../../sockets/socketManager.js';

// In-memory OTP store for Worker Mobile Verification
interface WorkerOtpRecord {
  otp: string;
  phone: string;
  expiresAt: number;
  attempts: number;
  lastRequestedAt: number;
}
const workerOtpStore = new Map<string, WorkerOtpRecord>();

// -----------------------------------------------------------------------------
// 1. Mobile Phone Verification
// -----------------------------------------------------------------------------

export async function sendWorkerMobileOtp(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'WORKER') {
      return res.status(403).json({ error: 'Only worker accounts can request worker mobile verification.' });
    }

    const { phone } = req.body;
    let targetPhone = phone;

    if (!targetPhone) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      targetPhone = user?.phone;
    }

    if (!targetPhone) {
      return res.status(400).json({ error: 'Mobile phone number is required.' });
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIndianPhone(targetPhone);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }

    // Rate-limiting check: 60-second cooldown
    const existing = workerOtpStore.get(req.user.userId);
    if (existing && Date.now() - existing.lastRequestedAt < 60000) {
      const remainingSecs = Math.ceil((60000 - (Date.now() - existing.lastRequestedAt)) / 1000);
      return res.status(429).json({ error: `Please wait ${remainingSecs} seconds before requesting a new OTP.` });
    }

    const otp = generateOtp();
    workerOtpStore.set(req.user.userId, {
      otp,
      phone: normalizedPhone,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      lastRequestedAt: Date.now(),
    });

    const smsProvider = SmsService.getProvider();
    await smsProvider.sendOtp(
      normalizedPhone,
      otp
    );

    res.json({
      message: `OTP sent to ${maskPhone(normalizedPhone)}. Valid for 5 minutes. (Demo mode: simulated OTP)`,
      simulatedOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      maskedPhone: maskPhone(normalizedPhone),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send mobile verification OTP', details: error.message });
  }
}

export async function verifyWorkerMobileOtp(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'WORKER') {
      return res.status(403).json({ error: 'Only worker accounts can verify phone numbers.' });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ error: 'Verification OTP is required.' });
    }

    const stored = workerOtpStore.get(req.user.userId);
    if (!stored) {
      return res.status(400).json({ error: 'No active OTP request found or OTP has expired.' });
    }

    if (Date.now() > stored.expiresAt) {
      workerOtpStore.delete(req.user.userId);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (stored.attempts >= 3) {
      workerOtpStore.delete(req.user.userId);
      return res.status(400).json({ error: 'Maximum attempts exceeded. Please request a fresh OTP.' });
    }

    if (stored.otp !== otp.trim()) {
      stored.attempts += 1;
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const verifiedPhone = stored.phone;
    workerOtpStore.delete(req.user.userId);

    // Update User record and WorkerVerification
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { phone: verifiedPhone },
    });

    if (req.workerProfileId) {
      await prisma.workerVerification.upsert({
        where: {
          id: `phone-verif-${req.workerProfileId}`,
        },
        create: {
          id: `phone-verif-${req.workerProfileId}`,
          workerId: req.workerProfileId,
          type: 'PHONE',
          status: 'VERIFIED',
          notes: 'Mobile number verified via OTP authentication.',
          reviewedAt: new Date(),
        },
        update: {
          status: 'VERIFIED',
          notes: 'Mobile number re-verified via OTP authentication.',
          reviewedAt: new Date(),
        },
      });
    }

    emitToUser(req.user.userId, 'worker.mobile.verified', {
      phone: verifiedPhone,
      status: 'VERIFIED',
    });

    res.json({
      message: 'Mobile number verified successfully.',
      phone: verifiedPhone,
      status: 'VERIFIED',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify mobile OTP', details: error.message });
  }
}

// -----------------------------------------------------------------------------
// 2. Identity Document Submission
// -----------------------------------------------------------------------------

export async function submitIdentityDocument(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker profile required.' });
    }

    const { documentType, identifier, documentUrl, notes } = req.body;

    if (!documentType || !identifier) {
      return res.status(400).json({ error: 'Document type and document number/identifier are required.' });
    }

    const validTypes = ['AADHAAR', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE', 'OTHER'];
    if (!validTypes.includes(documentType.toUpperCase())) {
      return res.status(400).json({ error: `Invalid document type. Allowed types: ${validTypes.join(', ')}` });
    }

    const masked = maskIdentity(identifier);
    const storageRef = documentUrl || `secure://identity/${req.workerProfileId}/${documentType.toLowerCase()}.enc`;

    const doc = await prisma.workerIdentityDocument.create({
      data: {
        workerId: req.workerProfileId,
        documentType: documentType.toUpperCase(),
        secureStorageReference: storageRef,
        maskedIdentifier: masked,
        verificationStatus: 'SUBMITTED',
        reviewerNotes: notes ? notes.trim() : 'Submitted by worker for routine identity verification.',
      },
    });

    // Notify admins of new identity verification review queue item
    emitToRole('ADMIN', 'worker.identity.submitted', {
      workerId: req.workerProfileId,
      documentId: doc.id,
      documentType: doc.documentType,
    });

    res.status(201).json({
      message: 'Government identity document submitted successfully for verification.',
      document: {
        id: doc.id,
        documentType: doc.documentType,
        maskedIdentifier: doc.maskedIdentifier,
        verificationStatus: doc.verificationStatus,
        submittedAt: doc.submittedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit identity document', details: error.message });
  }
}

export async function getIdentityDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker profile required.' });
    }

    const documents = await prisma.workerIdentityDocument.findMany({
      where: { workerId: req.workerProfileId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        maskedIdentifier: true,
        verificationStatus: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
      },
    });

    res.json({ documents });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve identity documents', details: error.message });
  }
}

// -----------------------------------------------------------------------------
// 3. Skill Proof & Experience Verification
// -----------------------------------------------------------------------------

export async function submitSkillEvidence(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker profile required.' });
    }

    const {
      skillCategory,
      evidenceType,
      documentTitle,
      issuingOrganisation,
      issueDate,
      expiryDate,
      documentUrl,
    } = req.body;

    if (!skillCategory || !documentTitle) {
      return res.status(400).json({ error: 'Skill category and document title are required.' });
    }

    const validEvidenceTypes = ['CERTIFICATE', 'TRAINING', 'EXPERIENCE_LETTER', 'APPRENTICESHIP', 'PORTFOLIO', 'OTHER'];
    const assignedType = evidenceType && validEvidenceTypes.includes(evidenceType.toUpperCase())
      ? evidenceType.toUpperCase()
      : 'CERTIFICATE';

    const storageRef = documentUrl || `secure://skills/${req.workerProfileId}/${skillCategory}-${Date.now()}.enc`;

    const evidence = await prisma.workerSkillEvidence.create({
      data: {
        workerId: req.workerProfileId,
        skillCategory: skillCategory.toLowerCase(),
        evidenceType: assignedType,
        documentTitle: documentTitle.trim(),
        issuingOrganisation: issuingOrganisation ? issuingOrganisation.trim() : null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        secureStorageReference: storageRef,
        verificationStatus: 'SUBMITTED',
      },
    });

    res.status(201).json({
      message: 'Skill proof / certificate submitted successfully for review.',
      evidence: {
        id: evidence.id,
        skillCategory: evidence.skillCategory,
        evidenceType: evidence.evidenceType,
        documentTitle: evidence.documentTitle,
        issuingOrganisation: evidence.issuingOrganisation,
        verificationStatus: evidence.verificationStatus,
        submittedAt: evidence.submittedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit skill proof', details: error.message });
  }
}

export async function getSkillEvidences(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker profile required.' });
    }

    const evidences = await prisma.workerSkillEvidence.findMany({
      where: { workerId: req.workerProfileId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        skillCategory: true,
        evidenceType: true,
        documentTitle: true,
        issuingOrganisation: true,
        issueDate: true,
        expiryDate: true,
        verificationStatus: true,
        reviewerNotes: true,
        submittedAt: true,
        reviewedAt: true,
      },
    });

    res.json({ evidences });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve skill proofs', details: error.message });
  }
}

// -----------------------------------------------------------------------------
// 4. Worker Terms, Dignity & Rights Acceptance
// -----------------------------------------------------------------------------

export async function getCurrentWorkerTerms(req: AuthenticatedRequest, res: Response) {
  try {
    const policy = await prisma.termsAndPolicy.findUnique({
      where: { policyType: 'WORKER_RIGHTS_PROTECTION' },
    });

    let hasAccepted = false;
    let acceptedRecord: any = null;

    if (req.workerProfileId) {
      acceptedRecord = await prisma.workerTermsAcceptance.findFirst({
        where: {
          workerId: req.workerProfileId,
          policyType: 'WORKER_RIGHTS_PROTECTION',
        },
        orderBy: { acceptedAt: 'desc' },
      });
      hasAccepted = !!acceptedRecord;
    }

    res.json({
      policy: policy || {
        version: 'v1.0',
        title: 'Kaam Setu Worker Dignity, Rights & Protection Charter',
        content: 'Default Worker Rights Policy: Fair transparent pricing, autonomous availability, zero hidden commission cuts.',
        officialReferences: '[]',
      },
      hasAccepted,
      acceptedRecord,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch worker terms', details: error.message });
  }
}

export async function acceptWorkerTerms(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker profile required.' });
    }

    const { policyVersion } = req.body;

    const acceptance = await prisma.workerTermsAcceptance.create({
      data: {
        workerId: req.workerProfileId,
        policyVersion: policyVersion || 'v1.0',
        policyType: 'WORKER_RIGHTS_PROTECTION',
        policyReference: 'Kaam Setu Worker Rights & Dignity Charter v1.0',
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({
      message: 'Worker terms and protection rights charter accepted.',
      acceptance,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record terms acceptance', details: error.message });
  }
}

// -----------------------------------------------------------------------------
// 5. Worker Complete Verification Dashboard Status
// -----------------------------------------------------------------------------

export async function getWorkerVerificationDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Worker profile required.' });
    }

    const [user, worker, verifications, idDocs, skillEvidences, terms, rpl, badges, visitingCharge] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: req.user?.userId } }),
        prisma.workerProfile.findUnique({ where: { id: req.workerProfileId } }),
        prisma.workerVerification.findMany({ where: { workerId: req.workerProfileId } }),
        prisma.workerIdentityDocument.findMany({ where: { workerId: req.workerProfileId } }),
        prisma.workerSkillEvidence.findMany({ where: { workerId: req.workerProfileId } }),
        prisma.workerTermsAcceptance.findMany({ where: { workerId: req.workerProfileId } }),
        prisma.workerRPLApplication.findMany({ where: { workerId: req.workerProfileId } }),
        prisma.workerBadge.findMany({ where: { workerId: req.workerProfileId } }),
        prisma.visitingCharge.findUnique({ where: { workerId: req.workerProfileId } }),
      ]);

    const phoneVerified = verifications.some((v) => v.type === 'PHONE' && v.status === 'VERIFIED');
    const idVerified = idDocs.some((d) => d.verificationStatus === 'VERIFIED');
    const skillReviewed = skillEvidences.some((s) => s.verificationStatus === 'VERIFIED');
    const termsAccepted = terms.length > 0;
    const rplApproved = rpl.some((r) => r.assessmentStatus === 'APPROVED');

    res.json({
      summary: {
        phoneVerified,
        idVerified,
        skillReviewed,
        termsAccepted,
        rplApproved,
        badgesCount: badges.length,
        hasVisitingChargeConfigured: !!visitingCharge,
      },
      workerPhone: maskPhone(user?.phone || ''),
      verifications,
      idDocs,
      skillEvidences,
      terms,
      rpl,
      badges,
      visitingCharge,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch worker verification summary', details: error.message });
  }
}
