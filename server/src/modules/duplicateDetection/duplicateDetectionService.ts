import { prisma } from '../../database/prisma.js';
import { normalizeIndianPhone, normalizeEmail, createLookupHash } from '../../utils/security.js';

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  canProceed: boolean;
  flagId?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warningMessage?: string;
}

export async function detectDuplicateRegistration(params: {
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'WORKER';
  name: string;
}): Promise<DuplicateCheckResult> {
  const normalizedEmail = normalizeEmail(params.email);
  let normalizedPhone = '';

  if (params.phone) {
    try {
      normalizedPhone = normalizeIndianPhone(params.phone);
    } catch {
      // If phone normalization fails, will be caught by validator
    }
  }

  // 1. Email check: Hard uniqueness constraint
  const existingEmailUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingEmailUser) {
    return {
      hasDuplicate: true,
      canProceed: false,
      riskLevel: 'HIGH',
      warningMessage: 'An account with this email address already exists. Please sign in or use password recovery.',
    };
  }

  // 2. Phone check: Risk-based detection (Families may legitimately share phone)
  if (normalizedPhone) {
    const matchingPhoneUsers = await prisma.user.findMany({
      where: { phone: normalizedPhone },
      select: { id: true, name: true, role: true, createdAt: true },
    });

    if (matchingPhoneUsers.length > 0) {
      const sameRoleUser = matchingPhoneUsers.find((u) => u.role === params.role);

      // Flag for administrative review instead of an outright hard ban
      const riskLevel = sameRoleUser ? 'MEDIUM' : 'LOW';
      const warningMessage = sameRoleUser
        ? 'Note: This mobile number is associated with another profile in our system. Your account is flagged for routine verification, but you may proceed.'
        : undefined;

      return {
        hasDuplicate: true,
        canProceed: true, // Allow proceeding; audited for manual review
        riskLevel,
        warningMessage,
      };
    }
  }

  return {
    hasDuplicate: false,
    canProceed: true,
    riskLevel: 'LOW',
  };
}

export async function recordDuplicateFlag(userId: string, matchedUserId?: string, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM', detectionType: string = 'PHONE_MATCH') {
  try {
    return await prisma.duplicateAccountFlag.create({
      data: {
        userId,
        matchedUserId,
        detectionType,
        riskLevel,
        status: 'FLAGGED',
        reviewNotes: 'Automated detection: shared mobile number identified during registration.',
      },
    });
  } catch (err) {
    console.error('Error recording duplicate flag:', err);
    return null;
  }
}
