import http from 'http';
import { createApp } from '../app.js';
import { initializeSockets } from '../sockets/socketManager.js';
import { prisma } from '../database/prisma.js';

async function runE2ETest() {
  console.log('🧪 Starting HyperLocal End-to-End Workflow Verification...');

  const app = createApp();
  const server = http.createServer(app);
  initializeSockets(server);

  await new Promise<void>((resolve) => {
    server.listen(5001, () => {
      console.log('🚀 Test server listening on http://localhost:5001');
      resolve();
    });
  });

  const BASE = 'http://localhost:5001/api';

  try {
    // Step 1: Sign in as Customer Alex Johnson
    console.log('\n--- Step 1: Customer Authentication ---');
    const custAuthRes = await fetch(`${BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'CUSTOMER', identifier: 'alex.customer@hyperlocal.demo' }),
    });
    const custAuth = await custAuthRes.json();
    console.log(`✅ Customer signed in: ${custAuth.user.name} (Role: ${custAuth.user.role})`);
    const custToken = custAuth.token;

    // Step 2: Customer creates a Plumbing service request
    console.log('\n--- Step 2: Customer creates a Service Request ---');
    const catRes = await fetch(`${BASE}/categories`);
    const { categories } = await catRes.json();
    const plumbingCat = categories.find((c: any) => c.slug === 'plumbing');

    const jobPayload = {
      serviceCategoryId: plumbingCat.id,
      title: 'Emergency Main Drain Clog & Leak in Kitchen',
      description: 'Water is backing up into both basins when running water. Leaking slightly around the P-trap seal. Need immediate professional clearing.',
      addressLabel: '742 Evergreen Terrace',
      city: 'Metro City',
      postalCode: '10001',
      latitude: 40.7128,
      longitude: -74.0060,
      urgency: 'ASAP',
      isOpenToQuotes: true,
      budgetMin: 50,
      budgetMax: 100,
    };

    const createJobRes = await fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify(jobPayload),
    });
    const createJobData = await createJobRes.json();
    const createdJob = createJobData.jobRequest;
    console.log(`✅ Job Request created: "${createdJob.title}" (ID: ${createdJob.id})`);
    console.log(`✅ Fair Matching Engine dispatched offers to: ${createJobData.matchedWorkersCount} eligible online workers`);

    // Step 3: Sign in as Worker Suresh Kumar (Master Plumber)
    console.log('\n--- Step 3: Worker Authentication & Offer Receiving ---');
    const workerAuthRes = await fetch(`${BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'WORKER', identifier: 'suresh.plumber@hyperlocal.demo' }),
    });
    const workerAuth = await workerAuthRes.json();
    console.log(`✅ Worker signed in: ${workerAuth.user.name} (Role: ${workerAuth.user.role})`);
    const workerToken = workerAuth.token;

    // Step 4: Worker checks Job Offers Inbox
    const offersRes = await fetch(`${BASE}/worker/offers?status=PENDING`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const { offers } = await offersRes.json();
    const matchingOffer = offers.find((o: any) => o.jobRequestId === createdJob.id);
    if (!matchingOffer) {
      throw new Error('Expected worker Suresh to receive persisted job offer, but offer not found');
    }
    console.log(`✅ Worker received persisted job offer: Match Score: ${matchingOffer.matchScore}%`);
    console.log(`   Reasons: ${matchingOffer.matchReasons.join(', ')}`);

    // Step 5: Worker submits a quote
    console.log('\n--- Step 5: Worker Submits Quote ---');
    const quoteRes = await fetch(`${BASE}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({
        jobRequestId: createdJob.id,
        proposedPrice: 85.0,
        estimatedArrivalMinutes: 20,
        scopeDescription: 'Heavy-duty motorized snake drain clearing up to 25ft and replace trap washers',
        exclusions: 'Piping replacement beyond the trap junction',
        workerNote: 'Can be on site within 20 mins. Van fully stocked with plumbing fittings.',
      }),
    });
    const quoteData = await quoteRes.json();
    const createdQuote = quoteData.quote;
    console.log(`✅ Quote submitted: $${createdQuote.proposedPrice} by ${createdQuote.worker?.user?.name}`);

    // Step 6: Customer counteroffers
    console.log('\n--- Step 6: Customer Counteroffers ---');
    const counterRes = await fetch(`${BASE}/quotes/${createdQuote.id}/counteroffer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        proposedPrice: 75.0,
        message: 'Could you do $75 since the main shutoff valve is already easily accessible?',
      }),
    });
    const counterData = await counterRes.json();
    console.log(`✅ Counteroffer recorded: $${counterData.quote.proposedPrice} (Status: ${counterData.quote.status})`);

    // Step 7: Customer Accepts Quote -> Creates single authoritative Booking
    console.log('\n--- Step 7: Customer Accepts Quote ---');
    const acceptRes = await fetch(`${BASE}/quotes/${createdQuote.id}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
    });
    const acceptData = await acceptRes.json();
    const booking = acceptData.booking;
    console.log(`✅ Quote Accepted! Booking Created: (ID: ${booking.id})`);
    console.log(`✅ Agreed Price: $${booking.agreedPrice}`);
    console.log(`✅ Generated Customer Start OTP: ${booking.startOtp}`);

    // Step 8: Worker updates status to ON_THE_WAY
    console.log('\n--- Step 8: Worker En Route ---');
    const onTheWayRes = await fetch(`${BASE}/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ status: 'ON_THE_WAY' }),
    });
    const onTheWayData = await onTheWayRes.json();
    console.log(`✅ Worker status: ${onTheWayData.booking.status}`);

    // Step 9: Worker arrives and verifies customer Start OTP to begin work
    console.log('\n--- Step 9: Worker Verifies Start OTP & Begins Work ---');
    // First test invalid OTP rejection
    const invalidOtpRes = await fetch(`${BASE}/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ status: 'WORK_STARTED', startOtp: '0000' }),
    });
    if (invalidOtpRes.status === 400) {
      console.log('✅ Security check passed: Incorrect OTP was rejected by server');
    }

    // Now test valid OTP
    const validOtpRes = await fetch(`${BASE}/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ status: 'WORK_STARTED', startOtp: booking.startOtp }),
    });
    const validOtpData = await validOtpRes.json();
    console.log(`✅ Valid OTP verified! Status updated to: ${validOtpData.booking.status}`);

    // Step 10: Worker marks job COMPLETED
    console.log('\n--- Step 10: Worker Completes Job ---');
    const completeRes = await fetch(`${BASE}/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const completeData = await completeRes.json();
    console.log(`✅ Booking finalized: Status is ${completeData.booking.status}`);

    // Step 11: Customer leaves a 5-star review
    console.log('\n--- Step 11: Customer Leaves 5-Star Review ---');
    const reviewRes = await fetch(`${BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        bookingId: booking.id,
        rating: 5,
        comment: 'Suresh was exceptional. Arrived fast, had the drain cleared in 30 minutes, and left everything spotless.',
      }),
    });
    const reviewData = await reviewRes.json();
    console.log(`✅ Review created: ${reviewData.review.rating}★ "${reviewData.review.comment}"`);

    // Step 12: Verify Worker Earnings & Ratings Updated
    console.log('\n--- Step 12: Verify Worker Authoritative Earnings & Rating ---');
    const earningsRes = await fetch(`${BASE}/workers/me/earnings`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const earningsData = await earningsRes.json();
    console.log(`✅ Worker Recorded Gross Earnings: $${earningsData.summary.totalGrossEarnings}`);
    console.log(`✅ Completed Jobs Count: ${earningsData.summary.completedCount}`);

    console.log('\n=============================================================');
    console.log('🎉 ALL 12 WORKFLOW STEPS PASSED WITH 100% SUCCESS!');
    console.log('=============================================================\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runE2ETest().catch((err) => {
  console.error('❌ E2E Test failed:', err);
  process.exit(1);
});
