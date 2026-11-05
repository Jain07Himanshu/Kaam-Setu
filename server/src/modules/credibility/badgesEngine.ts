import { prisma } from '../../database/prisma.js';

export async function evaluateAndAwardWorkerBadges(workerId: string) {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    include: {
      bookings: { where: { status: 'COMPLETED' } },
      skillEvidences: { where: { verificationStatus: 'VERIFIED' } },
      rplApplications: { where: { assessmentStatus: 'APPROVED' } },
      verifications: true,
      badges: true,
    },
  });

  if (!worker) return [];

  const existingBadgeTypes = new Set(worker.badges.map((b) => b.badgeType));
  const newBadgesToCreate = [];

  const completedCount = worker.completedJobsCount || worker.bookings.length;

  // 1. First Job Completed Badge
  if (completedCount >= 1 && !existingBadgeTypes.has('FIRST_JOB')) {
    newBadgesToCreate.push({
      workerId,
      badgeCategory: 'EXPERIENCE',
      badgeType: 'FIRST_JOB',
      badgeName: 'First Job Completed',
      badgeDescription: 'Successfully finalized first verified household trade job on Kaam Setu',
      icon: 'Award',
      eligibilityReference: `Achieved upon completing first verified booking`,
    });
  }

  // 2. 10 Jobs Completed Milestone
  if (completedCount >= 10 && !existingBadgeTypes.has('JOBS_10')) {
    newBadgesToCreate.push({
      workerId,
      badgeCategory: 'EXPERIENCE',
      badgeType: 'JOBS_10',
      badgeName: '10 Jobs Milestone',
      badgeDescription: 'Accomplished 10 verified household service bookings',
      icon: 'CheckCircle2',
      eligibilityReference: `Calculated from ${completedCount} completed bookings in system`,
    });
  }

  // 3. 25 Jobs Completed Milestone
  if (completedCount >= 25 && !existingBadgeTypes.has('JOBS_25')) {
    newBadgesToCreate.push({
      workerId,
      badgeCategory: 'EXPERIENCE',
      badgeType: 'JOBS_25',
      badgeName: '25 Jobs Milestone',
      badgeDescription: 'Proven neighborhood track record with 25 completed jobs',
      icon: 'CheckCircle2',
      eligibilityReference: `Calculated from ${completedCount} completed bookings in system`,
    });
  }

  // 4. Experienced Professional (5+ jobs and >= 4.8 rating)
  if (completedCount >= 5 && worker.ratingAvg >= 4.8 && !existingBadgeTypes.has('EXPERIENCED_PRO')) {
    newBadgesToCreate.push({
      workerId,
      badgeCategory: 'EXPERIENCE',
      badgeType: 'EXPERIENCED_PRO',
      badgeName: 'Experienced Professional',
      badgeDescription: 'Consistently maintains an exceptional customer satisfaction rating (4.8+ ★)',
      icon: 'Star',
      eligibilityReference: `Earned with ${worker.ratingAvg}★ average over ${completedCount} completed bookings`,
    });
  }

  // 5. Certification Badges (from verified skill evidences)
  for (const skill of worker.skillEvidences) {
    const certBadgeType = `CERT_${skill.skillCategory.toUpperCase()}`;
    if (!existingBadgeTypes.has(certBadgeType)) {
      newBadgesToCreate.push({
        workerId,
        badgeCategory: 'CERTIFICATION',
        badgeType: certBadgeType,
        badgeName: `${skill.documentTitle}`,
        badgeDescription: `Verified credential issued by ${skill.issuingOrganisation || 'Authorized Skill Board'}`,
        icon: 'ShieldCheck',
        eligibilityReference: `Document verified via manual credential review on ${skill.reviewedAt?.toLocaleDateString() || 'Record'}`,
      });
      existingBadgeTypes.add(certBadgeType);
    }
  }

  // 6. RPL Recognition Badge
  if (worker.rplApplications.length > 0 && !existingBadgeTypes.has('RPL_RECOGNIZED')) {
    const approvedRpl = worker.rplApplications[0];
    newBadgesToCreate.push({
      workerId,
      badgeCategory: 'RPL',
      badgeType: 'RPL_RECOGNIZED',
      badgeName: 'RPL Skill Recognized',
      badgeDescription: `Recognized for ${approvedRpl.yearsOfPriorExperience}+ years of hands-on practical trade mastery`,
      icon: 'Sparkles',
      eligibilityReference: `Assessed by ${approvedRpl.assessmentOrganisation || 'Kaam Setu Trade Board'}: ${approvedRpl.outcome || 'Approved'}`,
    });
  }

  if (newBadgesToCreate.length > 0) {
    await prisma.workerBadge.createMany({
      data: newBadgesToCreate,
    });
  }

  return prisma.workerBadge.findMany({ where: { workerId } });
}
