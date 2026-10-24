import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Kaam Setu Database Seeding...');

  // 1. Clean existing records for clean idempotent seed
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
      comment: 'Suresh ji arrived on time with all necessary spare parts and tools. Fixed the kitchen leak neatly in 40 minutes and tested everything. Very polite and professional work!',
    },
  });

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
