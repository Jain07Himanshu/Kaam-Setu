import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting HyperLocal Database Seeding...');

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

  // 2. Seed Service Categories
  const categoriesData = [
    {
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Pipe leaks, faucet repair, drain unclogging, water heater installation',
      icon: 'Wrench',
      basePriceEstimate: 50.0,
    },
    {
      name: 'Electrical Work',
      slug: 'electrical',
      description: 'Wiring issues, breaker boxes, light fixture installs, switches & outlets',
      icon: 'Zap',
      basePriceEstimate: 55.0,
    },
    {
      name: 'Home Cleaning',
      slug: 'cleaning',
      description: 'Deep cleaning, regular housekeeping, move-out cleaning, sofa sanitization',
      icon: 'Sparkles',
      basePriceEstimate: 40.0,
    },
    {
      name: 'Appliance Repair',
      slug: 'appliances',
      description: 'Washing machines, refrigerators, microwaves, dishwashers',
      icon: 'Settings',
      basePriceEstimate: 60.0,
    },
    {
      name: 'Carpentry',
      slug: 'carpentry',
      description: 'Furniture repair, door installation, custom shelving, woodwork',
      icon: 'Hammer',
      basePriceEstimate: 45.0,
    },
    {
      name: 'Painting',
      slug: 'painting',
      description: 'Interior wall painting, touch-ups, waterproof coating, exterior fences',
      icon: 'Paintbrush',
      basePriceEstimate: 70.0,
    },
    {
      name: 'AC & HVAC Repair',
      slug: 'ac-repair',
      description: 'Air conditioning servicing, gas refill, filter cleaning, cooling repair',
      icon: 'Wind',
      basePriceEstimate: 65.0,
    },
    {
      name: 'Cooking & Household',
      slug: 'household',
      description: 'Meal preparation, kitchen helper, laundry, household assistance',
      icon: 'Utensils',
      basePriceEstimate: 35.0,
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const created = await prisma.serviceCategory.create({ data: cat });
    categories[cat.slug] = created;
  }
  console.log(`✅ Seeded ${categoriesData.length} service categories.`);

  // 3. Seed Demo Customers
  const customerAlexUser = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'alex.customer@hyperlocal.demo',
      phone: '+1 (555) 234-5678',
      role: 'CUSTOMER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    },
  });

  const customerAlexProfile = await prisma.customerProfile.create({
    data: {
      userId: customerAlexUser.id,
      preferredAddress: '742 Evergreen Terrace, Metro City',
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: customerAlexUser.id,
      label: 'Home',
      address: '742 Evergreen Terrace',
      city: 'Metro City',
      postalCode: '10001',
      latitude: 40.7128,
      longitude: -74.006,
      isDefault: true,
    },
  });

  const customerSarahUser = await prisma.user.create({
    data: {
      name: 'Sarah Mehta',
      email: 'sarah.customer@hyperlocal.demo',
      phone: '+1 (555) 876-5432',
      role: 'CUSTOMER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    },
  });

  await prisma.customerProfile.create({
    data: {
      userId: customerSarahUser.id,
      preferredAddress: '120 Oakridge Lane, Metro City',
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: customerSarahUser.id,
      label: 'Apartment',
      address: '120 Oakridge Lane, Apt 4B',
      city: 'Metro City',
      postalCode: '10002',
      latitude: 40.718,
      longitude: -74.002,
      isDefault: true,
    },
  });

  console.log('✅ Seeded demo customers (Alex Johnson, Sarah Mehta).');

  // 4. Seed Demo Workers
  // Worker 1: Suresh Kumar - Plumbing
  const workerSureshUser = await prisma.user.create({
    data: {
      name: 'Suresh Kumar',
      email: 'suresh.plumber@hyperlocal.demo',
      phone: '+1 (555) 432-1098',
      role: 'WORKER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    },
  });

  const workerSureshProfile = await prisma.workerProfile.create({
    data: {
      userId: workerSureshUser.id,
      bio: 'Licensed Master Plumber with over 10 years of experience serving neighborhood homes. Fast emergency response, upfront pricing, and guaranteed workmanship.',
      skills: JSON.stringify(['Leak Detection', 'Pipe Unclogging', 'Water Heaters', 'Bathroom Remodel', 'Emergency Repair']),
      serviceRadiusKm: 20.0,
      hourlyRate: 55.0,
      baseRate: 40.0,
      isAvailable: true,
      ratingAvg: 4.9,
      ratingCount: 28,
      completedJobsCount: 42,
    },
  });

  await prisma.workerVerification.createMany({
    data: [
      { workerId: workerSureshProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified via SMS' },
      { workerId: workerSureshProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'State ID Verified' },
      { workerId: workerSureshProfile.id, type: 'SKILL_CERT', status: 'VERIFIED', notes: 'Master Plumber Certification' },
      { workerId: workerSureshProfile.id, type: 'BACKGROUND_CHECK', status: 'VERIFIED', notes: 'Clean criminal record check' },
    ],
  });

  await prisma.workerService.create({
    data: {
      workerId: workerSureshProfile.id,
      serviceCategoryId: categories['plumbing'].id,
      experienceYears: 10,
      customRate: 55.0,
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: workerSureshUser.id,
      label: 'Suresh Plumbing Hub',
      address: '220 Market St',
      city: 'Metro City',
      postalCode: '10001',
      latitude: 40.714,
      longitude: -74.005,
      isDefault: true,
    },
  });

  // Worker 2: Priya Sharma - Electrical
  const workerPriyaUser = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.electric@hyperlocal.demo',
      phone: '+1 (555) 765-4321',
      role: 'WORKER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    },
  });

  const workerPriyaProfile = await prisma.workerProfile.create({
    data: {
      userId: workerPriyaUser.id,
      bio: 'Certified Electrician specializing in residential circuits, breaker panels, light fixtures, and smart home electrical upgrades.',
      skills: JSON.stringify(['Circuit Breakers', 'Wiring Upgrades', 'Chandelier Hanging', 'EV Chargers', 'Safety Audits']),
      serviceRadiusKm: 18.0,
      hourlyRate: 65.0,
      baseRate: 50.0,
      isAvailable: true,
      ratingAvg: 4.8,
      ratingCount: 21,
      completedJobsCount: 31,
    },
  });

  await prisma.workerVerification.createMany({
    data: [
      { workerId: workerPriyaProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
      { workerId: workerPriyaProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'National ID Verified' },
      { workerId: workerPriyaProfile.id, type: 'SKILL_CERT', status: 'VERIFIED', notes: 'Journeyman Electrician License' },
    ],
  });

  await prisma.workerService.create({
    data: {
      workerId: workerPriyaProfile.id,
      serviceCategoryId: categories['electrical'].id,
      experienceYears: 7,
      customRate: 65.0,
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: workerPriyaUser.id,
      label: 'Priya Electrical Workshop',
      address: '150 Franklin Ave',
      city: 'Metro City',
      postalCode: '10001',
      latitude: 40.716,
      longitude: -74.007,
      isDefault: true,
    },
  });

  // Worker 3: Rajesh Verma - Cleaning
  const workerRajeshUser = await prisma.user.create({
    data: {
      name: 'Rajesh Verma',
      email: 'rajesh.cleaning@hyperlocal.demo',
      phone: '+1 (555) 345-6789',
      role: 'WORKER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    },
  });

  const workerRajeshProfile = await prisma.workerProfile.create({
    data: {
      userId: workerRajeshUser.id,
      bio: 'Professional cleaner committed to eco-friendly, thorough deep home and kitchen sanitization. Equipped with commercial-grade vacuums and steamers.',
      skills: JSON.stringify(['Deep Cleaning', 'Kitchen Degreasing', 'Carpet Steaming', 'Post-Renovation Cleaning']),
      serviceRadiusKm: 25.0,
      hourlyRate: 40.0,
      baseRate: 35.0,
      isAvailable: true,
      ratingAvg: 4.9,
      ratingCount: 45,
      completedJobsCount: 62,
    },
  });

  await prisma.workerVerification.createMany({
    data: [
      { workerId: workerRajeshProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
      { workerId: workerRajeshProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'ID Document Verified' },
      { workerId: workerRajeshProfile.id, type: 'BACKGROUND_CHECK', status: 'VERIFIED', notes: 'Background check cleared' },
    ],
  });

  await prisma.workerService.create({
    data: {
      workerId: workerRajeshProfile.id,
      serviceCategoryId: categories['cleaning'].id,
      experienceYears: 5,
      customRate: 40.0,
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: workerRajeshUser.id,
      label: 'CleanPro Base',
      address: '88 Canal Street',
      city: 'Metro City',
      postalCode: '10001',
      latitude: 40.711,
      longitude: -74.004,
      isDefault: true,
    },
  });

  // Worker 4: Anita Roy - Appliance Repair
  const workerAnitaUser = await prisma.user.create({
    data: {
      name: 'Anita Roy',
      email: 'anita.appliances@hyperlocal.demo',
      phone: '+1 (555) 987-6543',
      role: 'WORKER',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    },
  });

  const workerAnitaProfile = await prisma.workerProfile.create({
    data: {
      userId: workerAnitaUser.id,
      bio: 'Certified Major Appliance & HVAC repair technician. Fast diagnosis for washing machines, refrigerators, microwaves, and split AC units.',
      skills: JSON.stringify(['Refrigerator Cooling', 'Washer Drum Fix', 'AC Gas Refill', 'Oven Heating Elements']),
      serviceRadiusKm: 22.0,
      hourlyRate: 60.0,
      baseRate: 45.0,
      isAvailable: true,
      ratingAvg: 4.7,
      ratingCount: 16,
      completedJobsCount: 25,
    },
  });

  await prisma.workerVerification.createMany({
    data: [
      { workerId: workerAnitaProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
      { workerId: workerAnitaProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'ID Document Verified' },
      { workerId: workerAnitaProfile.id, type: 'SKILL_CERT', status: 'VERIFIED', notes: 'HVAC & Appliance Tech Certification' },
    ],
  });

  await prisma.workerService.create({
    data: {
      workerId: workerAnitaProfile.id,
      serviceCategoryId: categories['appliances'].id,
      experienceYears: 6,
      customRate: 60.0,
    },
  });

  await prisma.workerService.create({
    data: {
      workerId: workerAnitaProfile.id,
      serviceCategoryId: categories['ac-repair'].id,
      experienceYears: 6,
      customRate: 65.0,
    },
  });

  await prisma.serviceLocation.create({
    data: {
      userId: workerAnitaUser.id,
      label: 'Anita Fixit Depot',
      address: '310 Grand Ave',
      city: 'Metro City',
      postalCode: '10001',
      latitude: 40.72,
      longitude: -74.009,
      isDefault: true,
    },
  });

  console.log('✅ Seeded demo workers (Suresh, Priya, Rajesh, Anita).');

  // 5. Seed an initial completed job with review to show historical track record
  const completedJob = await prisma.jobRequest.create({
    data: {
      customerId: customerAlexProfile.id,
      serviceCategoryId: categories['plumbing'].id,
      title: 'Kitchen Sink Faucet Replacement',
      description: 'The old single-handle faucet is dripping continuously under the cabinet. Need replacement and new supply lines connected.',
      addressLabel: 'Home',
      city: 'Metro City',
      postalCode: '10001',
      latitude: 40.7128,
      longitude: -74.006,
      budgetMin: 50,
      budgetMax: 90,
      urgency: 'SCHEDULED',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  const completedQuote = await prisma.quote.create({
    data: {
      jobRequestId: completedJob.id,
      workerId: workerSureshProfile.id,
      proposedPrice: 75.0,
      estimatedArrivalMinutes: 25,
      scopeDescription: 'Remove old faucet, install new homeowner-provided fixture, replace 2x braided stainless lines, and pressure test.',
      exclusions: 'Cost of replacement faucet hardware',
      status: 'ACCEPTED',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const completedBooking = await prisma.booking.create({
    data: {
      jobRequestId: completedJob.id,
      customerId: customerAlexProfile.id,
      workerId: workerSureshProfile.id,
      acceptedQuoteId: completedQuote.id,
      agreedPrice: 75.0,
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
      reviewerId: customerAlexUser.id,
      revieweeId: workerSureshUser.id,
      rating: 5,
      comment: 'Suresh arrived right on time with all the proper tools. Replaced our dripping kitchen faucet cleanly and tested all seals. Outstanding work!',
    },
  });

  console.log('✅ Seeded demo completed job with authentic customer review.');
  console.log('🎉 HyperLocal Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
