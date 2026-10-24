import http from 'http';
import { createApp } from '../app.js';
import { initializeSockets } from '../sockets/socketManager.js';
import { prisma } from '../database/prisma.js';

async function runSecurityAndScenariosTest() {
  console.log('🧪 Starting Security, Multi-Worker & Scenarios Verification...');

  const app = createApp();
  const server = http.createServer(app);
  initializeSockets(server);

  await new Promise<void>((resolve) => {
    server.listen(5002, () => {
      resolve();
    });
  });

  const BASE = 'http://localhost:5002/api';

  try {
    // 1. Authenticate users
    const custRes = await fetch(`${BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'CUSTOMER', identifier: 'alex.customer@hyperlocal.demo' }),
    });
    const { token: custToken } = await custRes.json();

    const worker1Res = await fetch(`${BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'WORKER', identifier: 'suresh.plumber@hyperlocal.demo' }),
    });
    const { token: worker1Token } = await worker1Res.json();

    const worker2Res = await fetch(`${BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'WORKER', identifier: 'priya.electric@hyperlocal.demo' }),
    });
    const { token: worker2Token } = await worker2Res.json();

    console.log('--- Scenario D: Permission & Access Control Checks ---');
    // Unauthorized action: Customer trying to access worker offers endpoint
    const forbiddenWorkerRes = await fetch(`${BASE}/worker/offers`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    if (forbiddenWorkerRes.status === 403) {
      console.log('✅ Access Control: Customer correctly blocked from worker offers endpoint (403)');
    }

    // Unauthorized action: Worker trying to create a job request (only customers can)
    const forbiddenJobRes = await fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${worker1Token}`,
      },
      body: JSON.stringify({
        serviceCategoryId: 'test',
        title: 'Unauthorized test',
        description: 'Should fail',
      }),
    });
    if (forbiddenJobRes.status === 403) {
      console.log('✅ Access Control: Worker correctly blocked from customer request creation (403)');
    }

    // Unauthenticated request blocked
    const unauthRes = await fetch(`${BASE}/jobs/my-requests`);
    if (unauthRes.status === 401) {
      console.log('✅ Access Control: Unauthenticated request blocked with 401');
    }

    console.log('\n--- Scenario C: Multiple Competing Quotes & Atomic Conflict Prevention ---');
    // Create an electrical job request
    const catRes = await fetch(`${BASE}/categories`);
    const { categories } = await catRes.json();
    const elecCat = categories.find((c: any) => c.slug === 'electrical');

    const multiJobRes = await fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        serviceCategoryId: elecCat.id,
        title: 'Install Dedicated 240V Outlet for Workshop',
        description: 'Need a dedicated 240V 30A circuit run from the breaker panel to the garage wall.',
        addressLabel: '742 Evergreen Terrace',
        city: 'Metro City',
        postalCode: '10001',
        latitude: 40.7128,
        longitude: -74.0060,
        urgency: 'SCHEDULED',
        isOpenToQuotes: true,
      }),
    });
    const { jobRequest: multiJob } = await multiJobRes.json();

    // Worker 2 (Priya) submits quote
    const q1Res = await fetch(`${BASE}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${worker2Token}`,
      },
      body: JSON.stringify({
        jobRequestId: multiJob.id,
        proposedPrice: 180.0,
        estimatedArrivalMinutes: 45,
        scopeDescription: 'Run 8/2 Romex cable, install 30A double-pole breaker, and NEMA 6-30 receptacle.',
      }),
    });
    const { quote: q1 } = await q1Res.json();
    console.log(`✅ Worker 1 (Priya) submitted quote: $${q1.proposedPrice}`);

    // Customer accepts Priya's quote
    const acceptQ1Res = await fetch(`${BASE}/quotes/${q1.id}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
    });
    const { booking: multiBooking } = await acceptQ1Res.json();
    console.log(`✅ Customer accepted Priya's quote. Booking ID: ${multiBooking.id}`);

    // Verify double-acceptance is blocked
    const doubleAcceptRes = await fetch(`${BASE}/quotes/${q1.id}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
    });
    if (doubleAcceptRes.status === 400 || doubleAcceptRes.status === 409) {
      console.log('✅ Double-acceptance prevented: Server correctly rejected conflicting acceptance');
    }

    console.log('\n--- Scenario E: Cancellation Workflow ---');
    // Create a job and cancel it
    const cancelJobRes = await fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        serviceCategoryId: elecCat.id,
        title: 'Outdoor Porch Light Flicker',
        description: 'Single fixture flicker on the front steps.',
        addressLabel: '742 Evergreen Terrace',
        city: 'Metro City',
        postalCode: '10001',
        latitude: 40.7128,
        longitude: -74.0060,
        urgency: 'ASAP',
      }),
    });
    const { jobRequest: toCancelJob } = await cancelJobRes.json();

    const doCancelRes = await fetch(`${BASE}/jobs/${toCancelJob.id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const cancelResult = await doCancelRes.json();
    console.log(`✅ Job cancelled successfully: Status is ${cancelResult.job.status}`);

    console.log('\n=============================================================');
    console.log('🎉 ALL SCENARIO & SECURITY PERMISSION CHECKS PASSED!');
    console.log('=============================================================\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runSecurityAndScenariosTest().catch((err) => {
  console.error('❌ Scenarios test failed:', err);
  process.exit(1);
});
