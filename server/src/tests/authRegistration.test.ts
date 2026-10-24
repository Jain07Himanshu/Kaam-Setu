import http from 'http';
import { createApp } from '../app.js';
import { initializeSockets } from '../sockets/socketManager.js';
import { prisma } from '../database/prisma.js';

async function runAuthRegistrationTest() {
  console.log('🧪 Starting Kaam Setu Auth & Registration System Verification...');

  const app = createApp();
  const server = http.createServer(app);
  initializeSockets(server);

  await new Promise<void>((resolve) => {
    server.listen(5002, () => {
      console.log('🚀 Test server listening on http://localhost:5002');
      resolve();
    });
  });

  const BASE = 'http://localhost:5002/api';

  try {
    const timestamp = Date.now();

    // 1. Test Customer Registration
    console.log('\n--- 1. Testing Customer Registration ---');
    const customerPayload = {
      name: 'Rohan Mehra',
      email: `rohan.test.${timestamp}@example.com`,
      phone: '+91 98765 43210',
      password: 'SecurePassword123!',
      role: 'CUSTOMER',
      city: 'Delhi',
      address: 'Flat 502, Green Park, South Delhi',
      postalCode: '110016',
      latitude: 28.5583,
      longitude: 77.2028,
    };

    const regCustRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerPayload),
    });

    if (!regCustRes.ok) {
      const err = await regCustRes.text();
      throw new Error(`Customer registration failed: ${regCustRes.status} - ${err}`);
    }

    const regCustData = await regCustRes.json();
    console.log(`✅ Customer registered: ID=${regCustData.user.id}, Name=${regCustData.user.name}, Role=${regCustData.user.role}`);
    console.log(`✅ Customer profile created: Address=${regCustData.user.customerProfile?.preferredAddress}`);

    // 2. Test Customer Login
    console.log('\n--- 2. Testing Customer Login ---');
    const loginCustRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerPayload.email,
        password: customerPayload.password,
      }),
    });

    if (!loginCustRes.ok) {
      const err = await loginCustRes.text();
      throw new Error(`Customer login failed: ${loginCustRes.status} - ${err}`);
    }

    const loginCustData = await loginCustRes.json();
    console.log(`✅ Customer login successful! Token received: ${loginCustData.token.substring(0, 20)}...`);

    // 3. Test Worker Registration
    console.log('\n--- 3. Testing Worker Pro Registration ---');
    const workerPayload = {
      name: 'Vikas Sharma',
      email: `vikas.electrician.${timestamp}@example.com`,
      phone: '+91 99887 76655',
      password: 'ProPassword456!',
      role: 'WORKER',
      serviceCategoryId: 'electrical',
      experienceYears: 7,
      hourlyRate: 450,
      baseRate: 299,
      city: 'Bengaluru',
      address: 'Indiranagar Service Depot',
      bio: 'Certified Master Electrician with 7+ years of residential and commercial wiring experience.',
    };

    const regWorkerRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerPayload),
    });

    if (!regWorkerRes.ok) {
      const err = await regWorkerRes.text();
      throw new Error(`Worker registration failed: ${regWorkerRes.status} - ${err}`);
    }

    const regWorkerData = await regWorkerRes.json();
    console.log(`✅ Worker registered: ID=${regWorkerData.user.id}, Name=${regWorkerData.user.name}, Role=${regWorkerData.user.role}`);
    console.log(`✅ Worker profile created: Exp=${regWorkerData.user.workerProfile?.experienceYears} yrs, Hourly Rate=₹${regWorkerData.user.workerProfile?.hourlyRate}`);

    // 4. Test Worker Login
    console.log('\n--- 4. Testing Worker Login ---');
    const loginWorkerRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: workerPayload.email,
        password: workerPayload.password,
      }),
    });

    if (!loginWorkerRes.ok) {
      const err = await loginWorkerRes.text();
      throw new Error(`Worker login failed: ${loginWorkerRes.status} - ${err}`);
    }

    const loginWorkerData = await loginWorkerRes.json();
    console.log(`✅ Worker login successful! Token received: ${loginWorkerData.token.substring(0, 20)}...`);

    // 5. Test Authenticated Profile /me endpoint
    console.log('\n--- 5. Testing Authenticated /me endpoint ---');
    const meRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${loginWorkerData.token}` },
    });
    const meData = await meRes.json();
    console.log(`✅ Verified /me profile for Worker: ${meData.user.name} (Role: ${meData.user.role})`);

    console.log('\n🎉 ALL REGISTRATION AND LOGIN TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runAuthRegistrationTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
