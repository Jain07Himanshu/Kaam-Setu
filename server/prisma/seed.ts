import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Kaam Setu Database Seeding...');

  // Check if categories are already present to avoid wiping live production data
  const existingCategoriesCount = await prisma.serviceCategory.count();
  const forceSeed = process.env.FORCE_SEED === 'true';

  if (existingCategoriesCount > 0 && !forceSeed) {
    console.log('⚡ Database already contains seeded categories. Skipping wipe to preserve live user registrations and bookings.');
    console.log('💡 Tip: Set FORCE_SEED=true if you wish to reset and re-seed all demo records.');
    return;
  }

  // 1. Clean existing records for clean idempotent seed
  await prisma.emergencyCallLog.deleteMany({});
  await prisma.safetyCheckIn.deleteMany({});
  await prisma.safetyEvent.deleteMany({});
  await prisma.bookingChargeAcknowledgement.deleteMany({});
  await prisma.certificateVerificationRecord.deleteMany({});
  await prisma.workerSkillEvidence.deleteMany({});
  await prisma.workerIdentityDocument.deleteMany({});
  await prisma.workerTermsAcceptance.deleteMany({});
  await prisma.workerRPLApplication.deleteMany({});
  await prisma.workerBadge.deleteMany({});
  await prisma.visitingCharge.deleteMany({});
  await prisma.customerEmergencyContact.deleteMany({});
  await prisma.customerCareSetting.deleteMany({});
  await prisma.duplicateAccountFlag.deleteMany({});
  await prisma.termsAndPolicy.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.quoteNegotiation.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.jobOffer.deleteMany({});
  await prisma.jobRequest.deleteMany({});
  await prisma.workerVerification.deleteMany({});
  await prisma.workerService.deleteMany({});
  await prisma.serviceLocation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.customerProfile.deleteMany({});
  await prisma.workerProfile.deleteMany({});
  await prisma.serviceCategory.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing records.');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Seed Service Categories with Indian Rupee (₹) standard pricing
  const categoriesData = [
    {
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Pipe leaks, tap/faucet repair, drain unclogging, water tank & geyser installation',
      icon: 'Wrench',
      basePriceEstimate: 349.0,
    },
    {
      name: 'Electrical Work',
      slug: 'electrical',
      description: 'Short circuits, MCB breaker fix, switchboard wiring, fan & light installations',
      icon: 'Zap',
      basePriceEstimate: 299.0,
    },
    {
      name: 'Home Cleaning',
      slug: 'cleaning',
      description: 'Full home deep cleaning, kitchen degreasing, bathroom scrub, sofa sanitization',
      icon: 'Sparkles',
      basePriceEstimate: 499.0,
    },
    {
      name: 'Appliance Repair',
      slug: 'appliances',
      description: 'Washing machines, refrigerators, microwaves, mixer grinders & chimney repair',
      icon: 'Settings',
      basePriceEstimate: 449.0,
    },
    {
      name: 'Carpentry',
      slug: 'carpentry',
      description: 'Furniture repair, door locks & hinges, modular kitchen fittings, custom woodwork',
      icon: 'Hammer',
      basePriceEstimate: 399.0,
    },
    {
      name: 'Painting',
      slug: 'painting',
      description: 'Interior wall painting, touch-ups, waterproof primer, whitewash & exterior walls',
      icon: 'Paintbrush',
      basePriceEstimate: 999.0,
    },
    {
      name: 'AC & HVAC Repair',
      slug: 'ac-repair',
      description: 'Split & window AC servicing, gas refill, cooling coil cleaning, compressor check',
      icon: 'Wind',
      basePriceEstimate: 599.0,
    },
    {
      name: 'Cooking & Household',
      slug: 'household',
      description: 'Home cook, kitchen helper, laundry assistance, daily household chores',
      icon: 'Utensils',
      basePriceEstimate: 299.0,
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const created = await prisma.serviceCategory.create({ data: cat });
    categories[cat.slug] = created;
  }
  console.log(`✅ Seeded ${categoriesData.length} service categories.`);

  // 3. Seed Demo Indian Customers
  const customerAaravUser = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'aarav.customer@kaamsetu.demo',
      phone: '+91 98201 23456',
      role: 'CUSTOMER',
      passwordHash,
      avatarUrl: '/avatars/aarav.svg',
    },
  });

  const customerAaravProfile = await prisma.customerProfile.create({
    data: {
      userId: customerAaravUser.id,
      preferredAddress: 'Flat 402, Shanti Heights, Powai, Mumbai 400076',
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: customerAaravUser.id,
      label: 'Home',
      address: 'Flat 402, Shanti Heights, Central Avenue, Powai',
      city: 'Mumbai',
      postalCode: '400076',
      latitude: 19.1176,
      longitude: 72.9060,
      isDefault: true,
    },
  });

  const customerPoojaUser = await prisma.user.create({
    data: {
      name: 'Pooja Patel',
      email: 'pooja.customer@kaamsetu.demo',
      phone: '+91 98450 87654',
      role: 'CUSTOMER',
      passwordHash,
      avatarUrl: '/avatars/pooja.svg',
    },
  });

  await prisma.customerProfile.create({
    data: {
      userId: customerPoojaUser.id,
      preferredAddress: '12B, Green Glen Layout, Bellandur, Bengaluru 560103',
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: customerPoojaUser.id,
      label: 'Apartment',
      address: '12B, Green Glen Layout, Outer Ring Road, Bellandur',
      city: 'Bengaluru',
      postalCode: '560103',
      latitude: 12.9279,
      longitude: 77.6771,
      isDefault: true,
    },
  });

  console.log('✅ Seeded demo customers (Aarav Sharma, Pooja Patel).');

  // 4. Seed Demo Indian Workers
  // Worker 1: Suresh Kumar - Plumbing
  const workerSureshUser = await prisma.user.create({
    data: {
      name: 'Suresh Kumar',
      email: 'suresh.plumber@kaamsetu.demo',
      phone: '+91 98111 43210',
      role: 'WORKER',
      passwordHash,
      avatarUrl: '/avatars/suresh.svg',
    },
  });

  const workerSureshProfile = await prisma.workerProfile.create({
    data: {
      userId: workerSureshUser.id,
      bio: 'Master Plumber with 10+ years of trade experience in residential societies and apartments. Quick response for pipe leaks, bathroom fixtures, geysers, and drain unclogging. Clear upfront pricing with zero hidden charges.',
      skills: JSON.stringify(['Leak Detection', 'Drain & Pipe Unclogging', 'Geyser Installation', 'Tap & Mixer Replacement', 'Emergency Repairs']),
      serviceRadiusKm: 20.0,
      hourlyRate: 350.0,
      baseRate: 250.0,
      isAvailable: true,
      ratingAvg: 4.9,
      ratingCount: 34,
      completedJobsCount: 52,
    },
  });

  await prisma.workerVerification.createMany({
    data: [
      { workerId: workerSureshProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Aadhaar-linked Mobile Verified via OTP' },
      { workerId: workerSureshProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'Government Aadhaar & PAN Card Verified' },
      { workerId: workerSureshProfile.id, type: 'SKILL_CERT', status: 'VERIFIED', notes: 'National Skill Development (NSDC) Plumbing Certified' },
      { workerId: workerSureshProfile.id, type: 'BACKGROUND_CHECK', status: 'VERIFIED', notes: 'Local Police Verification Cleared' },
    ],
  });

  await prisma.workerService.create({
    data: {
      workerId: workerSureshProfile.id,
      serviceCategoryId: categories['plumbing'].id,
      experienceYears: 10,
      customRate: 350.0,
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: workerSureshUser.id,
      label: 'Suresh Plumbing Service Hub',
      address: 'Shop 4, Hiranandani Market, Powai',
      city: 'Mumbai',
      postalCode: '400076',
      latitude: 19.1190,
      longitude: 72.9050,
      isDefault: true,
    },
  });

  // Worker 2: Priya Sharma - Electrical
  const workerPriyaUser = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.electric@kaamsetu.demo',
      phone: '+91 97222 54321',
      role: 'WORKER',
      passwordHash,
      avatarUrl: '/avatars/priya.svg',
    },
  });

  const workerPriyaProfile = await prisma.workerProfile.create({
    data: {
      userId: workerPriyaUser.id,
      bio: 'Licensed Residential Electrician with 7 years of hands-on experience. Specialist in MCB breaker tripping, inverter wiring, ceiling fans, chandeliers, and home safety earthing.',
      skills: JSON.stringify(['MCB & Breaker Tripping', 'Switchboard Rewiring', 'Ceiling Fan & Lights', 'Inverter Battery Setup', 'Electrical Safety Audit']),
      serviceRadiusKm: 18.0,
      hourlyRate: 400.0,
      baseRate: 300.0,
      isAvailable: true,
      ratingAvg: 4.8,
      ratingCount: 26,
      completedJobsCount: 38,
    },
  });

  await prisma.workerVerification.createMany({
    data: [
      { workerId: workerPriyaProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
      { workerId: workerPriyaProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'Aadhaar Card Verified' },
      { workerId: workerPriyaProfile.id, type: 'SKILL_CERT', status: 'VERIFIED', notes: 'Government Electrical Wireman License' },
    ],
  });

  await prisma.workerService.create({
    data: {
      workerId: workerPriyaProfile.id,
      serviceCategoryId: categories['electrical'].id,
      experienceYears: 7,
      customRate: 400.0,
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: workerPriyaUser.id,
      label: 'Priya Electrical Depot',
      address: '150, Saki Vihar Road, Powai',
      city: 'Mumbai',
      postalCode: '400076',
      latitude: 19.1160,
      longitude: 72.9070,
      isDefault: true,
    },
  });

  // Worker 3: Rajesh Verma - Cleaning
  const workerRajeshUser = await prisma.user.create({
    data: {
      name: 'Rajesh Verma',
      email: 'rajesh.cleaning@kaamsetu.demo',
      phone: '+91 98333 67890',
      role: 'WORKER',
      passwordHash,
      avatarUrl: '/avatars/rajesh.svg',
    },
  });

  const workerRajeshProfile = await prisma.workerProfile.create({
    data: {
      userId: workerRajeshUser.id,
      bio: 'Professional Deep Cleaning Specialist with eco-friendly sanitizing solutions. Equipped with industrial vacuum cleaners, tile scrubbers, and sofa foam shampoo machines.',
      skills: JSON.stringify(['Full House Deep Cleaning', 'Kitchen Chimney & Tile Degreasing', 'Bathroom Descaling', 'Sofa & Carpet Foam Wash']),
      serviceRadiusKm: 25.0,
      hourlyRate: 300.0,
      baseRate: 499.0,
      isAvailable: true,
      ratingAvg: 4.9,
      ratingCount: 52,
      completedJobsCount: 78,
    },
  });

  await prisma.workerVerification.createMany({
    data: [
      { workerId: workerRajeshProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
      { workerId: workerRajeshProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'Aadhaar & Voter ID Verified' },
      { workerId: workerRajeshProfile.id, type: 'BACKGROUND_CHECK', status: 'VERIFIED', notes: 'Police Verification Cleared' },
    ],
  });

  await prisma.workerService.create({
    data: {
      workerId: workerRajeshProfile.id,
      serviceCategoryId: categories['cleaning'].id,
      experienceYears: 5,
      customRate: 499.0,
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: workerRajeshUser.id,
      label: 'Rajesh Cleaning Base',
      address: '88, Chandivali Farm Road, Andheri East',
      city: 'Mumbai',
      postalCode: '400072',
      latitude: 19.1120,
      longitude: 72.9010,
      isDefault: true,
    },
  });

  // Worker 4: Anita Roy - Appliance Repair
  const workerAnitaUser = await prisma.user.create({
    data: {
      name: 'Anita Roy',
      email: 'anita.appliances@kaamsetu.demo',
      phone: '+91 98444 98765',
      role: 'WORKER',
      passwordHash,
      avatarUrl: '/avatars/anita.svg',
    },
  });

  const workerAnitaProfile = await prisma.workerProfile.create({
    data: {
      userId: workerAnitaUser.id,
      bio: 'Certified Home Appliance & Split AC Technician. 6+ years troubleshooting washing machines, refrigerators, microwaves, and air conditioner cooling problems with original spare parts.',
      skills: JSON.stringify(['AC Servicing & Gas Refill', 'Washing Machine Drum & Motor Repair', 'Refrigerator Cooling Fix', 'Microwave Heating Issues']),
      serviceRadiusKm: 22.0,
      hourlyRate: 450.0,
      baseRate: 350.0,
      isAvailable: true,
      ratingAvg: 4.7,
      ratingCount: 19,
      completedJobsCount: 31,
    },
  });

  await prisma.workerVerification.createMany({
    data: [
      { workerId: workerAnitaProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
      { workerId: workerAnitaProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'Government ID Verified' },
      { workerId: workerAnitaProfile.id, type: 'SKILL_CERT', status: 'VERIFIED', notes: 'Appliance & HVAC Technical Certification' },
    ],
  });

  await prisma.workerService.create({
    data: {
      workerId: workerAnitaProfile.id,
      serviceCategoryId: categories['appliances'].id,
      experienceYears: 6,
      customRate: 450.0,
    },
  });

  await prisma.workerService.create({
    data: {
      workerId: workerAnitaProfile.id,
      serviceCategoryId: categories['ac-repair'].id,
      experienceYears: 6,
      customRate: 599.0,
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: workerAnitaUser.id,
      label: 'Anita Appliance Clinic',
      address: '210, JVLR Junction, Powai',
      city: 'Mumbai',
      postalCode: '400076',
      latitude: 19.1220,
      longitude: 72.9090,
      isDefault: true,
    },
  });

  console.log('✅ Seeded demo Indian workers (Suresh, Priya, Rajesh, Anita).');

  // 5. Seed an initial completed job with review in INR (₹)
  const completedJob = await prisma.jobRequest.create({
    data: {
      customerId: customerAaravProfile.id,
      serviceCategoryId: categories['plumbing'].id,
      title: 'Kitchen Sink Faucet & Drainage Pipe Repair',
      description: 'The kitchen sink tap was continuously dripping and the flexible waste pipe was leaking dirty water under the cabinet. Needed new pipe connection and washer replacement.',
      addressLabel: 'Home',
      city: 'Mumbai',
      postalCode: '400076',
      latitude: 19.1176,
      longitude: 72.9060,
      budgetMin: 350,
      budgetMax: 650,
      urgency: 'SCHEDULED',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const completedQuote = await prisma.quote.create({
    data: {
      jobRequestId: completedJob.id,
      workerId: workerSureshProfile.id,
      proposedPrice: 499.0,
      estimatedArrivalMinutes: 25,
      scopeDescription: 'Replaced flexible drain pipe, fitted heavy-duty brass washer, applied Teflon thread sealant, and tested water flow under pressure.',
      exclusions: 'Cost of replacement tap hardware if new fixture is required',
      status: 'ACCEPTED',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const completedBooking = await prisma.booking.create({
    data: {
      jobRequestId: completedJob.id,
      customerId: customerAaravProfile.id,
      workerId: workerSureshProfile.id,
      acceptedQuoteId: completedQuote.id,
      agreedPrice: 499.0,
      agreedScope: completedQuote.scopeDescription,
      startOtp: '8392',
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      bookingId: completedBooking.id,
      reviewerId: customerAaravUser.id,
      revieweeId: workerSureshUser.id,
      rating: 5,
      serviceQuality: 5,
      punctuality: 5,
      professionalism: 5,
      communication: 5,
      comment: 'Suresh ji arrived on time with all necessary spare parts and tools. Fixed the kitchen leak neatly in 40 minutes and tested everything. Very polite and professional work!',
    },
  });

  // 6. Seed Customer Care Setting
  await prisma.customerCareSetting.create({
    data: {
      settingKey: 'CUSTOMER_CARE_PHONE',
      settingValue: process.env.CUSTOMER_CARE_PHONE || '+91 80000 12345',
    },
  });

  // 7. Seed Worker Rights, Visiting Charges and Safety Policies
  await prisma.termsAndPolicy.createMany({
    data: [
      {
        policyType: 'WORKER_RIGHTS_PROTECTION',
        version: 'v1.0',
        title: 'Kaam Setu Worker Dignity, Rights & Protection Charter',
        content: `1. Principle of Respect & Dignity: Every trade professional has the absolute right to a safe, non-discriminatory, and harassment-free work environment.
2. 100% Transparent Visiting Charges: Workers are fully empowered to define their minimum visit/diagnostic fee. No customer may demand a free site visit without prior agreement.
3. Transparent Quotes & Direct Earnings: What you quote is what you receive. Kaam Setu levies zero hidden platform commissions on your quoted quote.
4. Autonomous Schedule & Right to Decline: You maintain total freedom to toggle your availability (Online/Offline) and accept or decline any matched job offer without negative algorithmic penalization.
5. Protection Against Unreasonable Price Slashing: Customers cannot coerce rates lower than your declared base visit fee.
6. Fair Cancellation & Travel Compensation: In the event of an unexcused last-minute customer cancellation after you have departed ('ON_THE_WAY'), you are entitled to visiting charge coverage.
7. Grievance Redressal: Workers can raise formal support and safety dispute tickets with 24/7 dedicated review.`,
        officialReferences: JSON.stringify([
          { name: 'Ministry of Labour and Employment, Government of India', url: 'https://labour.gov.in/' },
          { name: 'Code on Social Security, 2020 (Provisions for Platform and Gig Workers)', url: 'https://www.indiacode.nic.in/handle/123456789/15980' },
          { name: 'Consumer Protection Act, 2019 (E-Commerce Rules)', url: 'https://consumeraffairs.nic.in/' },
        ]),
        effectiveDate: new Date('2026-01-01'),
        active: true,
      },
      {
        policyType: 'VISITING_CHARGES',
        version: 'v1.0',
        title: 'Transparent Visiting & Diagnostic Fee Policy',
        content: `To protect professional travel time, fuel expenses, and on-site expert assessment, all trade pros specify an upfront visiting fee (₹). This fee is fully visible before confirming. If service work commences on-site, the visiting fee is adjustable against the agreed quotation.`,
        officialReferences: JSON.stringify([
          { name: 'Consumer Protection (E-Commerce) Rules, 2020', url: 'https://consumeraffairs.nic.in/' }
        ]),
        effectiveDate: new Date('2026-01-01'),
        active: true,
      },
      {
        policyType: 'CUSTOMER_SAFETY',
        version: 'v1.0',
        title: 'Customer Safety & Neighborhood Protection Protocol',
        content: `Kaam Setu provides SOS emergency assistance, up to 3 trusted emergency contacts, mutual 4-digit start OTP verification, and automated safety check-in milestones for home peace-of-mind.`,
        officialReferences: JSON.stringify([
          { name: 'National Emergency Response System (112 India)', url: 'https://112.gov.in/' }
        ]),
        effectiveDate: new Date('2026-01-01'),
        active: true,
      },
    ],
  });

  // 8. Seed Customer Emergency Contacts for Aarav Sharma
  await prisma.customerEmergencyContact.createMany({
    data: [
      {
        customerId: customerAaravProfile.id,
        name: 'Neha Sharma',
        relationship: 'Spouse',
        phone: '+91 98201 98765',
        phoneLookupHash: 'hash_neha_sharma_9820198765',
        email: 'neha.sharma@example.com',
        verificationStatus: 'VERIFIED',
        isVerified: true,
        priorityOrder: 1,
      },
      {
        customerId: customerAaravProfile.id,
        name: 'Rohan Sharma',
        relationship: 'Brother',
        phone: '+91 98201 11223',
        phoneLookupHash: 'hash_rohan_sharma_9820111223',
        email: 'rohan.sharma@example.com',
        verificationStatus: 'VERIFIED',
        isVerified: true,
        priorityOrder: 2,
      },
    ],
  });

  // 9. Seed Visiting Charges for Trade Workers
  await prisma.visitingCharge.createMany({
    data: [
      {
        workerId: workerSureshProfile.id,
        amount: 199.0,
        isRefundableOrAdjustable: true,
        terms: 'Includes travel and comprehensive plumbing leak diagnosis. 100% adjusted into final bill if repair is approved.',
        active: true,
      },
      {
        workerId: workerPriyaProfile.id,
        amount: 199.0,
        isRefundableOrAdjustable: true,
        terms: 'Covers on-site circuit testing and MCB diagnosis. Adjusted against repair invoice.',
        active: true,
      },
      {
        workerId: workerRajeshProfile.id,
        amount: 149.0,
        isRefundableOrAdjustable: true,
        terms: 'Covers deep cleaning space inspection and material estimate.',
        active: true,
      },
      {
        workerId: workerAnitaProfile.id,
        amount: 249.0,
        isRefundableOrAdjustable: true,
        terms: 'Includes appliance motor & PCB diagnostic check. Deducted from repair bill if work is authorized.',
        active: true,
      },
    ],
  });

  // 10. Seed Booking Charge Acknowledgement for completed booking
  await prisma.bookingChargeAcknowledgement.create({
    data: {
      bookingId: completedBooking.id,
      visitingCharge: 199.0,
      termsVersion: 'v1.0',
      customerAcknowledgedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // 11. Seed Worker Badges (Calculated from verified work history)
  await prisma.workerBadge.createMany({
    data: [
      {
        workerId: workerSureshProfile.id,
        badgeCategory: 'EXPERIENCE',
        badgeType: 'FIRST_JOB',
        badgeName: 'First Job Completed',
        badgeDescription: 'Successfully finalized first verified household repair on Kaam Setu',
        icon: 'Award',
        eligibilityReference: 'Verified booking #1 completed with 5.0 rating',
      },
      {
        workerId: workerSureshProfile.id,
        badgeCategory: 'EXPERIENCE',
        badgeType: 'ON_TIME_PRO',
        badgeName: 'Punctual Professional',
        badgeDescription: 'Arrived at the customer premises within the committed ETA',
        icon: 'Clock',
        eligibilityReference: 'Arrival logged within 25 minutes of booking acceptance',
      },
      {
        workerId: workerSureshProfile.id,
        badgeCategory: 'SKILL',
        badgeType: 'CERTIFIED_PRO',
        badgeName: 'Certified Master Plumber',
        badgeDescription: 'Holds verified National Trade Certificate in Plumbing',
        icon: 'ShieldCheck',
        eligibilityReference: 'Govt ITI Plumbing Trade License #MH-PL-2016-88',
      },
      {
        workerId: workerPriyaProfile.id,
        badgeCategory: 'SKILL',
        badgeType: 'CERTIFIED_PRO',
        badgeName: 'Licensed Electrician',
        badgeDescription: 'Certified electrical wiring & circuit protection technician',
        icon: 'Zap',
        eligibilityReference: 'Electrical Supervisor License #KA-EL-4912',
      },
    ],
  });

  // 12. Seed Worker Terms Acceptance
  await prisma.workerTermsAcceptance.createMany({
    data: [
      {
        workerId: workerSureshProfile.id,
        policyVersion: 'v1.0',
        policyType: 'WORKER_RIGHTS_PROTECTION',
        policyReference: 'Kaam Setu Worker Charter v1.0',
        acceptedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
      },
      {
        workerId: workerPriyaProfile.id,
        policyVersion: 'v1.0',
        policyType: 'WORKER_RIGHTS_PROTECTION',
        policyReference: 'Kaam Setu Worker Charter v1.0',
        acceptedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
      },
    ],
  });

  // 13. Seed Identity Document & Skill Evidence records
  await prisma.workerIdentityDocument.create({
    data: {
      workerId: workerSureshProfile.id,
      documentType: 'AADHAAR',
      secureStorageReference: 'secure://identity/suresh_aadhaar_masked.pdf',
      maskedIdentifier: 'XXXX-XXXX-4912',
      verificationStatus: 'VERIFIED',
      reviewerId: 'ADMIN-SYSTEM',
      reviewerNotes: 'Verified via Government ID manual credential review.',
      reviewedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.workerSkillEvidence.create({
    data: {
      workerId: workerSureshProfile.id,
      skillCategory: 'plumbing',
      evidenceType: 'CERTIFICATE',
      documentTitle: 'ITI National Trade Certificate in Sanitary & Domestic Plumbing',
      issuingOrganisation: 'Directorate General of Training (DGT), Ministry of Skill Development',
      issueDate: new Date('2016-06-15'),
      secureStorageReference: 'secure://skills/suresh_iti_cert.pdf',
      verificationStatus: 'VERIFIED',
      reviewerId: 'ADMIN-SYSTEM',
      reviewerNotes: 'Verified against DGT National Trade Registry.',
      reviewedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  // 14. Seed RPL (Recognition of Prior Learning) for Suresh
  await prisma.workerRPLApplication.create({
    data: {
      workerId: workerSureshProfile.id,
      skillCategory: 'plumbing',
      yearsOfPriorExperience: 10,
      evidenceReference: '10 years practical field experience across Mumbai high-rises and residential colonies',
      assessmentStatus: 'APPROVED',
      assessmentOrganisation: 'National Skill Development Corporation (NSDC) PMKVY RPL Assessor',
      assessmentDate: new Date('2023-11-10'),
      outcome: 'Grade A - Certified Pipe & Pressure Fitting Specialist',
      reviewerId: 'ADMIN-SYSTEM',
      reviewerNotes: 'RPL Practical Assessment verified.',
    },
  });

  console.log('✅ Seeded Safety, Worker Rights, Visiting Charges, RPL & Badges.');
  console.log('✅ Seeded demo completed job with authentic customer review in INR (₹499).');
  console.log('🎉 Kaam Setu Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
