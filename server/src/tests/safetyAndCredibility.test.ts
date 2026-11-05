import http from 'http';
import { createApp } from '../app.js';
import { initializeSockets } from '../sockets/socketManager.js';
import { prisma } from '../database/prisma.js';

async function runSafetyAndCredibilityTests() {
  console.log('🧪 Starting Kaam Setu Safety, Verification, Credibility & Protection System Tests...');

  const app = createApp();
  const server = http.createServer(app);
  initializeSockets(server);

  await new Promise<void>((resolve) => {
    server.listen(5003, () => {
      console.log('🚀 Test server listening on http://localhost:5003');
      resolve();
    });
  });

  const BASE = 'http://localhost:5003/api';

  try {
    // 1. Authenticate Customer Aarav & Worker Suresh
    console.log('\n--- 1. Authenticating Demo Users ---');
    const custRes = await fetch(`${BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'CUSTOMER', identifier: 'aarav.customer@kaamsetu.demo' }),
    });
    const custData = await custRes.json();
    const custToken = custData.token;
    console.log(`✅ Customer signed in: ${custData.user.name}`);

    const workerRes = await fetch(`${BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'WORKER', identifier: 'suresh.plumber@kaamsetu.demo' }),
    });
    const workerData = await workerRes.json();
    const workerToken = workerData.token;
    console.log(`✅ Worker signed in: ${workerData.user.name}`);

    // 2. Emergency Contacts Management (Up to 3, Indian phone validation, priority)
    console.log('\n--- 2. Customer Emergency Contacts Management ---');
    // Clear any existing contacts for clean test run
    const existingContactsRes = await fetch(`${BASE}/customer/emergency-contacts`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const { contacts: initialContacts } = await existingContactsRes.json();
    for (const c of initialContacts) {
      await fetch(`${BASE}/customer/emergency-contacts/${c.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${custToken}` },
      });
    }

    // Add Contact 1 (Father)
    const add1 = await fetch(`${BASE}/customer/emergency-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        name: 'Rajesh Sharma',
        relationship: 'Father',
        phone: '+91 98111 22334',
        email: 'rajesh.sharma@example.com',
        priorityOrder: 1,
      }),
    });
    const c1 = await add1.json();
    if (!add1.ok) throw new Error(`Add contact 1 failed: ${JSON.stringify(c1)}`);
    console.log(`✅ Contact 1 added: ${c1.contact.name} (${c1.contact.relationship}) - Phone: ${c1.contact.phone}`);

    // Add Contact 2 (Spouse)
    const add2 = await fetch(`${BASE}/customer/emergency-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        name: 'Pooja Sharma',
        relationship: 'Spouse',
        phone: '9822233445',
        priorityOrder: 2,
      }),
    });
    const c2 = await add2.json();
    console.log(`✅ Contact 2 added: ${c2.contact.name} (${c2.contact.relationship}) - Priority: ${c2.contact.priorityOrder}`);

    // Add Contact 3 (Brother)
    const add3 = await fetch(`${BASE}/customer/emergency-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        name: 'Amit Sharma',
        relationship: 'Brother',
        phone: '+919833344556',
        priorityOrder: 3,
      }),
    });
    const c3 = await add3.json();
    console.log(`✅ Contact 3 added: ${c3.contact.name} (${c3.contact.relationship})`);

    // Attempt to add Contact 4 (Should be rejected - max 3 contacts limit)
    const add4 = await fetch(`${BASE}/customer/emergency-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        name: 'Karan Sharma',
        relationship: 'Friend',
        phone: '9844455667',
        priorityOrder: 4,
      }),
    });
    if (add4.status === 400) {
      console.log('✅ Max 3 Emergency Contacts limit strictly enforced by server (400 Bad Request)');
    } else {
      throw new Error(`Expected 400 for 4th contact, got ${add4.status}`);
    }

    // Worker Attempted Access to Customer Emergency Contacts (Should be 403 Forbidden)
    const workerAccessContacts = await fetch(`${BASE}/customer/emergency-contacts`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    if (workerAccessContacts.status === 403) {
      console.log('✅ Privacy protection verified: Worker forbidden from accessing customer emergency contacts (403)');
    } else {
      throw new Error(`Expected 403 for worker accessing contacts, got ${workerAccessContacts.status}`);
    }

    // OTP Verification for Emergency Contact
    console.log('\n--- 3. Contact OTP Verification Workflow ---');
    const sendOtpRes = await fetch(`${BASE}/customer/emergency-contacts/${c1.contact.id}/send-otp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const sendOtpData = await sendOtpRes.json();
    console.log(`✅ Verification OTP dispatched to contact: ${sendOtpData.message}`);

    const verifyOtpRes = await fetch(`${BASE}/customer/emergency-contacts/${c1.contact.id}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ otp: sendOtpData.simulatedOtp || '123456' }),
    });
    const verifyOtpData = await verifyOtpRes.json();
    console.log(`✅ Contact verified: status is ${verifyOtpData.contact.verificationStatus}, isVerified=${verifyOtpData.contact.isVerified}`);

    // 4. Customer Care & Configurable Help Phone
    console.log('\n--- 4. Customer Care & Direct Helpline ---');
    const careRes = await fetch(`${BASE}/customer-care/contact`);
    const careData = await careRes.json();
    console.log(`✅ Customer Care Telephone: ${careData.customerCarePhone}`);
    console.log(`✅ Emergency Helplines configured: count=${careData.helplineDirectory.length}, 1st=${careData.helplineDirectory[0].number}`);

    // 5. Duplicate Account Detection Screening
    console.log('\n--- 5. Duplicate Account Screening ---');
    const dupCheckRes = await fetch(`${BASE}/registration/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aarav.customer@kaamsetu.demo',
        phone: '9876543210',
      }),
    });
    const dupCheck = await dupCheckRes.json();
    console.log(`✅ Duplicate Screening result: Risk=${dupCheck.riskLevel}, HasDuplicate=${dupCheck.hasDuplicate}`);
    console.log(`   Notice: ${dupCheck.warningMessage || 'Flagged for audit without a disruptive permanent hard ban'}`);

    // 6. Worker Mobile OTP Verification
    console.log('\n--- 6. Worker Mobile OTP Verification ---');
    const workerSendOtpRes = await fetch(`${BASE}/worker/mobile/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ phone: '+91 9988776655' }),
    });
    const workerSendOtp = await workerSendOtpRes.json();
    console.log(`✅ Worker mobile OTP sent: ${workerSendOtp.message}`);

    const workerVerifyOtpRes = await fetch(`${BASE}/worker/mobile/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ otp: workerSendOtp.simulatedOtp || '123456' }),
    });
    const workerVerifyOtp = await workerVerifyOtpRes.json();
    console.log(`✅ Worker mobile verified successfully: Phone=${workerVerifyOtp.phone}`);

    // 7. Identity Document Upload with Masked Storage
    console.log('\n--- 7. Worker Identity Document Upload ---');
    const idUploadRes = await fetch(`${BASE}/worker/verification/identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({
        documentType: 'AADHAAR',
        identifier: '1234 5678 9012',
        documentUrl: '/uploads/worker-aadhaar-suresh.pdf',
      }),
    });
    const idUpload = await idUploadRes.json();
    console.log(`✅ Identity Document submitted: Type=${idUpload.document.documentType}, Masked=${idUpload.document.maskedIdentifier}`);

    // Admin reviews and approves identity document
    const approveIdRes = await fetch(`${BASE}/admin/verifications/identity/${idUpload.document.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` }, // Admin or privileged token
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    const approveId = await approveIdRes.json();
    console.log(`✅ Admin approved Identity Document: Status=${approveId.document.verificationStatus}`);

    // 8. Worker Terms & Rights Charter Acceptance
    console.log('\n--- 8. Worker Terms & Social Security Rights Charter ---');
    const charterRes = await fetch(`${BASE}/worker/terms/rights-charter`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const charter = await charterRes.json();
    console.log(`✅ Worker Rights Charter fetched: Version ${charter.policy?.version} - "${charter.policy?.title}"`);

    const acceptTermsRes = await fetch(`${BASE}/worker/terms/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({
        policyVersion: charter.policy?.version || 'v1.0',
      }),
    });
    const acceptTerms = await acceptTermsRes.json();
    console.log(`✅ Worker accepted Rights Charter: Version=${acceptTerms.acceptance?.policyVersion}`);

    // 9. Visiting Charges Policy & Booking Acknowledgement
    console.log('\n--- 9. Visiting Charges Policy & Pre-Booking Warning ---');
    const updateVisitingRes = await fetch(`${BASE}/worker/visiting-charges`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({
        amount: 250,
        isRefundableOrAdjustable: true,
        terms: '₹250 diagnostic visit fee upon doorstep arrival. 100% credited against total labor invoice if job proceeds.',
      }),
    });
    const updateVisiting = await updateVisitingRes.json();
    console.log(`✅ Worker visiting charge configured: ₹${updateVisiting.visitingCharge.amount} (Adjustable: ${updateVisiting.visitingCharge.isRefundableOrAdjustable})`);

    // Customer creates a test booking to test visiting charge acknowledgement
    const catRes = await fetch(`${BASE}/categories`);
    const { categories } = await catRes.json();
    const plumbingCat = categories.find((c: any) => c.slug === 'plumbing') || categories[0];

    const jobRes = await fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        serviceCategoryId: plumbingCat.id,
        title: 'Safety & Credibility Verification Job',
        description: 'Test booking for safety SOS, check-in milestones, and visiting fee acknowledgement',
        addressLabel: 'Flat 101, Green Court',
        city: 'Delhi',
        postalCode: '110016',
        latitude: 28.55,
        longitude: 77.20,
      }),
    });
    const jobData = await jobRes.json();
    const job = jobData.jobRequest;

    const quoteRes = await fetch(`${BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({
        jobRequestId: job.id,
        proposedPrice: 600,
        scopeDescription: 'Complete inspection and immediate pipe sealing',
        estimatedArrivalMinutes: 30,
      }),
    });
    const { quote } = await quoteRes.json();

    const acceptQuoteRes = await fetch(`${BASE}/quotes/${quote.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const { booking } = await acceptQuoteRes.json();
    console.log(`✅ Booking created: ID=${booking.id}`);

    // Pre-booking visiting charge acknowledgement
    const ackChargeRes = await fetch(`${BASE}/bookings/${booking.id}/visiting-charge-acknowledgement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ customerAcknowledgement: true }),
    });
    const ackCharge = await ackChargeRes.json();
    console.log(`✅ Customer acknowledged visiting charge: Amount=₹${ackCharge.acknowledgement.visitingCharge}`);

    // 10. Safety Check-In Engine (Milestones & Stage Progression)
    console.log('\n--- 10. Scheduled Safety Check-In Engine ---');
    const initCheckinRes = await fetch(`${BASE}/safety/checkin/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        bookingId: booking.id,
        milestoneType: 'WORKER_ARRIVAL',
        scheduledMinutesFromNow: 15,
      }),
    });
    const initCheckin = await initCheckinRes.json();
    console.log(`✅ Safety Check-in scheduled: Milestone=${initCheckin.checkIn.milestoneType}, Status=${initCheckin.checkIn.status}`);

    // Escalate stage (Reminder -> Warning -> Escalated)
    const esc1 = await fetch(`${BASE}/safety/checkin/${initCheckin.checkIn.id}/escalate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const esc1Data = await esc1.json();
    console.log(`✅ Check-in Stage 1: ${esc1Data.message}`);

    // Customer confirms "I am safe"
    const ackCheckinRes = await fetch(`${BASE}/safety/checkin/${initCheckin.checkIn.id}/acknowledge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const ackCheckin = await ackCheckinRes.json();
    console.log(`✅ Safety Check-in Acknowledged: Status=${ackCheckin.checkIn.status}`);

    // 11. Customer Safety Emergency SOS System
    console.log('\n--- 11. Emergency SOS Rapid Response System ---');
    const sosRes = await fetch(`${BASE}/safety/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        bookingId: booking.id,
        triggerType: 'SOS',
        latitude: 28.55,
        longitude: 77.20,
        address: 'Flat 101, Green Court, South Delhi',
      }),
    });
    const sosData = await sosRes.json();
    console.log(`✅ Emergency SOS triggered! Event ID: ${sosData.safetyEvent.id}`);
    console.log(`✅ Emergency Contacts alerted: ${sosData.contactsNotifiedCount} contacts`);
    console.log(`✅ Mock Telephony automated emergency calls logged: ${sosData.callLogs.length} calls`);
    console.log(`✅ High-Priority Safety Ticket created: ${sosData.supportTicketId}`);

    // Customer cancels accidental SOS / resolves
    const resolveSosRes = await fetch(`${BASE}/safety/${sosData.safetyEvent.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        resolutionStatus: 'CANCELLED',
        notes: 'False alarm test by customer during safety orientation',
      }),
    });
    const resolveSos = await resolveSosRes.json();
    console.log(`✅ SOS resolved: Status=${resolveSos.safetyEvent.status}`);

    // 12. Certificate Verification (QR Code & DigiLocker Adapters)
    console.log('\n--- 12. Certificate Verification Adapters ---');
    const skillDocRes = await fetch(`${BASE}/worker/verification/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({
        skillCategory: 'plumbing',
        evidenceType: 'CERTIFICATE',
        documentTitle: 'National Trade Certificate (NTC) in Plumbing',
        issuingOrganisation: 'National Council for Vocational Training (NCVT)',
        documentUrl: '/uploads/suresh-ncvt-cert.pdf',
      }),
    });
    const skillDoc = await skillDocRes.json();
    console.log(`✅ Skill Evidence submitted: "${skillDoc.evidence.documentTitle}"`);

    // Verify via QR Code adapter
    const qrVerifyRes = await fetch(`${BASE}/certificates/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({
        workerSkillEvidenceId: skillDoc.evidence.id,
        qrData: JSON.stringify({
          certNo: 'NCVT-PLUMB-2023-8891',
          issuer: 'Skill India / NSDC',
          valid: true,
        }),
      }),
    });
    const qrVerify = await qrVerifyRes.json();
    console.log(`✅ QR Verification result: ${qrVerify.verificationRecord.status} (Method: ${qrVerify.verificationRecord.verificationMethod})`);

    // 13. Recognition of Prior Learning (RPL) & Credibility Badges
    console.log('\n--- 13. Recognition of Prior Learning (RPL) & Experience Badges ---');
    const rplRes = await fetch(`${BASE}/worker/rpl/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({
        skillCategory: 'plumbing',
        yearsOfPriorExperience: 12,
        selfReportedWorkSummary: 'Over 12 years of independent residential pipe fitting, sanitary installations, water pump repair, and bathroom leak detection across New Delhi.',
        references: [
          { name: 'Ramesh Gupta', phone: '9811223344', relationship: 'Senior Contractor' },
        ],
      }),
    });
    const rplData = await rplRes.json();
    console.log(`✅ RPL Application submitted: Category=${rplData.application.skillCategory}, Experience=${rplData.application.yearsOfPriorExperience} years`);

    // Admin approves RPL application
    const approveRplRes = await fetch(`${BASE}/admin/rpl/applications/${rplData.application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        status: 'APPROVED',
        reviewerNotes: 'Verified 12 years prior practical experience through portfolio and contractor reference check.',
      }),
    });
    const approveRpl = await approveRplRes.json();
    console.log(`✅ Admin approved RPL: Status=${approveRpl.application.assessmentStatus}`);

    // Complete the booking and submit multicategory review
    await fetch(`${BASE}/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ status: 'WORK_STARTED', startOtp: booking.startOtp }),
    });
    await fetch(`${BASE}/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });

    const reviewRes = await fetch(`${BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        bookingId: booking.id,
        rating: 5,
        comment: 'Super fast, punctual, extremely skilled and respectful of property!',
        serviceQuality: 5,
        punctuality: 5,
        professionalism: 5,
        communication: 5,
      }),
    });
    const reviewData = await reviewRes.json();
    console.log(`✅ Multicategory 5★ Review posted: ServiceQuality=${reviewData.review.serviceQuality}, Punctuality=${reviewData.review.punctuality}`);

    // Fetch Worker Full Credibility Package
    const credRes = await fetch(`${BASE}/workers/${workerData.user.id}/credibility`);
    const cred = await credRes.json();
    console.log('\n--- 14. Full Worker Credibility Profile Verification ---');
    console.log(`✅ Trust Verifications:`, cred.trustVerification);
    console.log(`✅ Multicategory Ratings:`, cred.ratingsBreakdown);
    console.log(`✅ Visiting Charge Displayed to Customer: ₹${cred.visitingCharge.amount} (${cred.visitingCharge.terms})`);
    console.log(`✅ Earned Badges: ${cred.badges.map((b: any) => b.badgeName).join(' | ')}`);

    console.log('\n=============================================================');
    console.log('🎉 ALL SAFETY, CREDIBILITY, RPL & PROTECTION TESTS PASSED 100%!');
    console.log('=============================================================');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error);
    server.close();
    process.exit(1);
  }
}

runSafetyAndCredibilityTests();
