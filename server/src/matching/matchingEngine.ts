import { prisma } from '../database/prisma.js';

export interface MatchCandidate {
  workerId: string;
  userId: string;
  workerName: string;
  matchScore: number;
  matchReasons: string[];
  distanceKm: number;
}

// Haversine formula to compute distance between coordinates in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function matchWorkersForJob(jobRequestId: string): Promise<MatchCandidate[]> {
  const job = await prisma.jobRequest.findUnique({
    where: { id: jobRequestId },
    include: {
      serviceCategory: true,
      customer: { include: { user: true } },
    },
  });

  if (!job) {
    throw new Error(`JobRequest with id ${jobRequestId} not found`);
  }

  // Find all active workers offering this service category who are currently available
  const workers = await prisma.workerProfile.findMany({
    where: {
      isAvailable: true,
      user: {
        status: 'ACTIVE',
      },
      workerServices: {
        some: {
          serviceCategoryId: job.serviceCategoryId,
        },
      },
    },
    include: {
      user: {
        include: {
          serviceLocations: true,
        },
      },
      verifications: true,
      workerServices: {
        where: {
          serviceCategoryId: job.serviceCategoryId,
        },
      },
    },
  });

  const candidates: MatchCandidate[] = [];

  for (const worker of workers) {
    const reasons: string[] = [];
    let score = 50; // Base score for category match & active availability

    reasons.push(`Specializes in ${job.serviceCategory.name}`);
    reasons.push('Currently active and available for dispatch');

    // 1. Location & Distance calculation
    const workerLocation = worker.user.serviceLocations[0] || {
      latitude: job.latitude + 0.02,
      longitude: job.longitude + 0.02,
    };

    const distance = calculateDistanceKm(
      job.latitude,
      job.longitude,
      workerLocation.latitude,
      workerLocation.longitude
    );

    // Check if within service radius
    if (distance <= worker.serviceRadiusKm) {
      const proximityBonus = Math.max(0, 20 - distance * 1.2);
      score += proximityBonus;
      reasons.push(`Located within ${distance} km (service radius: ${worker.serviceRadiusKm} km)`);
    } else {
      // Worker is outside their standard radius, small penalty but not totally excluded if urgent
      score -= 10;
      reasons.push(`Approximately ${distance} km away`);
    }

    // 2. Rating & Fairness for new workers
    if (worker.ratingCount >= 3) {
      const ratingBonus = (worker.ratingAvg / 5.0) * 15;
      score += ratingBonus;
      reasons.push(`Proven track record: ${worker.ratingAvg.toFixed(1)} ★ (${worker.ratingCount} reviews)`);
    } else {
      // Neutral baseline for new workers to prevent unfair disadvantage
      score += 12;
      reasons.push('Neighborhood provider with fair trial score');
    }

    // 3. Verification badges
    const verifiedChecks = worker.verifications.filter((v) => v.status === 'VERIFIED');
    if (verifiedChecks.length > 0) {
      score += Math.min(15, verifiedChecks.length * 4);
      const verifiedTypes = verifiedChecks.map((v) => v.type.replace('_', ' ')).join(', ');
      reasons.push(`Verified credentials: ${verifiedTypes}`);
    }

    // 4. Experience bonus
    const serviceInfo = worker.workerServices[0];
    if (serviceInfo && serviceInfo.experienceYears >= 3) {
      score += 5;
      reasons.push(`${serviceInfo.experienceYears}+ years hands-on trade experience`);
    }

    candidates.push({
      workerId: worker.id,
      userId: worker.userId,
      workerName: worker.user.name,
      matchScore: Math.min(100, Math.round(score)),
      matchReasons: reasons,
      distanceKm: distance,
    });
  }

  // Sort descending by match score
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  return candidates;
}
