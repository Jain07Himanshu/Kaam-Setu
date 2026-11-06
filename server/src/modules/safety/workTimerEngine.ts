import { prisma } from '../../database/prisma.js';
import { TelephonyService } from './telephonyProvider.js';
import {
  emitToCustomer,
  emitToWorker,
  emitToBooking,
  emitToRole,
} from '../../sockets/socketManager.js';

let monitorInterval: NodeJS.Timeout | null = null;

export class WorkTimerEngine {
  /**
   * Starts the background monitoring loop for timers and automatic SOS escalations.
   */
  static startMonitoring(intervalMs: number = 4000) {
    if (monitorInterval) return;
    monitorInterval = setInterval(async () => {
      try {
        await WorkTimerEngine.tick();
      } catch (err) {
        console.error('Error during WorkTimerEngine tick:', err);
      }
    }, intervalMs);
    console.log(`⏱️ WorkTimerEngine background safety monitor active (interval: ${intervalMs}ms)`);
  }

  static stopMonitoring() {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
  }

  /**
   * Main periodic evaluation tick:
   * 1. Detect expired timers and trigger safety check-in alarms.
   * 2. Detect unacknowledged expired check-ins exceeding grace period and trigger automatic SOS escalation.
   */
  static async tick() {
    const now = new Date();

    // 1. Process active timers that reached or passed expectedCompletionAt
    const expiringTimers = await prisma.workTimer.findMany({
      where: {
        status: 'ACTIVE',
        expectedCompletionAt: { lte: now },
        booking: {
          status: 'WORK_STARTED',
        },
      },
      include: {
        booking: {
          include: {
            customer: { include: { user: true } },
            worker: { include: { user: true } },
            jobRequest: true,
          },
        },
        safetyCheckIns: {
          where: {
            status: 'SCHEDULED',
          },
        },
      },
    });

    for (const timer of expiringTimers) {
      // Mark timer as EXPIRED
      await prisma.workTimer.update({
        where: { id: timer.id },
        data: { status: 'EXPIRED' },
      });

      // Find or create the SafetyCheckIn record
      let checkIn = timer.safetyCheckIns[0];
      if (checkIn) {
        checkIn = await prisma.safetyCheckIn.update({
          where: { id: checkIn.id },
          data: {
            status: 'ALERT_TRIGGERED',
            alertTriggeredAt: now,
          },
        });
      } else {
        checkIn = await prisma.safetyCheckIn.create({
          data: {
            bookingId: timer.bookingId,
            timerId: timer.id,
            milestoneType: 'EXPECTED_COMPLETION',
            expectedAt: timer.expectedCompletionAt,
            alertTriggeredAt: now,
            gracePeriodMinutes: 2,
            status: 'ALERT_TRIGGERED',
          },
        });
      }

      // Real-time Socket broadcasts to Customer and Worker
      const alertPayload = {
        bookingId: timer.bookingId,
        timerId: timer.id,
        checkInId: checkIn.id,
        gracePeriodMinutes: checkIn.gracePeriodMinutes,
        expectedCompletionAt: timer.expectedCompletionAt,
        message: 'Your scheduled service duration has expired. Please confirm your safety.',
      };

      emitToCustomer(timer.customerId, 'booking.timer.expired', alertPayload);
      emitToCustomer(timer.customerId, 'booking.safety.alert.created', alertPayload);
      emitToWorker(timer.workerId, 'booking.timer.expired', alertPayload);
      emitToBooking(timer.bookingId, 'booking.timer.expired', alertPayload);

      // Persist notifications
      await prisma.notification.createMany({
        data: [
          {
            recipientUserId: timer.booking.customer.userId,
            type: 'SAFETY_ALERT',
            title: 'SAFETY CHECK-IN REQUIRED ⚠️',
            message: 'Your scheduled service duration has expired. Please confirm your safety.',
            relatedEntityType: 'BOOKING',
            relatedEntityId: timer.bookingId,
          },
          {
            recipientUserId: timer.booking.worker.userId,
            type: 'SAFETY_ALERT',
            title: 'Service Duration Expired',
            message: 'Expected service duration has elapsed. Safety check-in dispatched to customer.',
            relatedEntityType: 'BOOKING',
            relatedEntityId: timer.bookingId,
          },
        ],
      });

      console.log(`⚠️ Safety Alarm Triggered for Booking ${timer.bookingId}: Timer ${timer.id} expired at ${timer.expectedCompletionAt.toISOString()}`);
    }

    // 2. Process triggered safety check-ins that have exceeded the grace period without customer acknowledgement
    const unacknowledgedCheckIns = await prisma.safetyCheckIn.findMany({
      where: {
        status: 'ALERT_TRIGGERED',
        alertTriggeredAt: { not: null },
        booking: {
          status: 'WORK_STARTED',
        },
      },
      include: {
        booking: {
          include: {
            customer: {
              include: {
                user: true,
                emergencyContacts: {
                  orderBy: { priorityOrder: 'asc' },
                },
              },
            },
            worker: { include: { user: true } },
            jobRequest: true,
          },
        },
        workTimer: true,
      },
    });

    for (const checkIn of unacknowledgedCheckIns) {
      if (!checkIn.alertTriggeredAt) continue;

      const elapsedMs = now.getTime() - checkIn.alertTriggeredAt.getTime();
      const gracePeriodMs = checkIn.gracePeriodMinutes * 60 * 1000;

      if (elapsedMs >= gracePeriodMs) {
        // Idempotency: immediately advance status to prevent duplicate triggers
        await prisma.safetyCheckIn.update({
          where: { id: checkIn.id },
          data: { status: 'ESCALATED' },
        });

        const customer = checkIn.booking.customer;
        const customerName = customer.user.name;
        const locationStr = `${checkIn.booking.jobRequest.addressLabel}, ${checkIn.booking.jobRequest.city}`;

        // 1. Create persistent high-priority SafetyEvent
        const safetyEvent = await prisma.safetyEvent.create({
          data: {
            customerId: customer.id,
            bookingId: checkIn.bookingId,
            eventType: 'SOS',
            severity: 'CRITICAL',
            status: 'ESCALATED',
            notes: `AUTOMATIC SAFETY ESCALATION: Work timer expired and customer did not acknowledge safety alarm within ${checkIn.gracePeriodMinutes} min grace period. Location: ${locationStr}. Assigned Pro: ${checkIn.booking.worker.user.name}.`,
          },
        });

        // 2. Dispatch outbound emergency telephony calls & SMS to customer's registered emergency contacts
        const telephony = TelephonyService.getProvider();
        const callLogs = [];

        const emergencyMsg = `URGENT KAAM SETU SAFETY ALERT: Customer ${customerName} did not respond to automated safety check-in during in-home service. Address: ${locationStr}.`;

        for (const contact of customer.emergencyContacts) {
          const callResult = await telephony.initiateEmergencyCall({
            to: contact.phone,
            contactName: contact.name,
            customerName,
            bookingId: checkIn.bookingId,
            safetyEventId: safetyEvent.id,
            messageText: emergencyMsg,
          });

          await telephony.sendEmergencySms(contact.phone, emergencyMsg);

          const log = await prisma.emergencyCallLog.create({
            data: {
              safetyEventId: safetyEvent.id,
              contactReference: contact.phone,
              provider: callResult.provider,
              providerCallId: callResult.callId,
              callStatus: callResult.status,
              voiceFileUrl: callResult.voiceUrlUsed || null,
              notes: `Automated timer expiration alert dispatched to ${contact.name} (${contact.relationship})`,
            },
          });
          callLogs.push(log);
        }

        // 3. Create high-priority safety ticket for Kaam Setu Safety Support Team
        const safetyTicket = await prisma.supportTicket.create({
          data: {
            userId: customer.userId,
            bookingId: checkIn.bookingId,
            category: 'SAFETY_CONCERN',
            subject: `[AUTOMATIC SOS ESCALATION] Service Timer Overrun for ${customerName}`,
            description: `Automated escalation executed. Work timer expired without customer safety acknowledgement. Emergency contacts dialed: ${customer.emergencyContacts.length}. Location: ${locationStr}. Safety Event ID: ${safetyEvent.id}`,
            status: 'OPEN',
          },
        });

        // 4. Real-time Socket broadcasts
        const escalationPayload = {
          bookingId: checkIn.bookingId,
          safetyEventId: safetyEvent.id,
          ticketId: safetyTicket.id,
          status: 'ESCALATED',
          contactsAlertedCount: customer.emergencyContacts.length,
          callLogs,
          timestamp: now.toISOString(),
        };

        emitToCustomer(customer.id, 'booking.safety.escalated', escalationPayload);
        emitToBooking(checkIn.bookingId, 'booking.safety.escalated', escalationPayload);
        emitToWorker(checkIn.booking.workerId, 'booking.safety.escalated', {
          bookingId: checkIn.bookingId,
          safetyEventId: safetyEvent.id,
          warning: 'Automatic safety alert escalated. Please cooperate with customer and safety support.',
        });
        emitToRole('ADMIN', 'admin.safety_alert', {
          safetyEvent,
          ticketId: safetyTicket.id,
          callLogs,
        });

        // 5. Create persistent notifications
        await prisma.notification.createMany({
          data: [
            {
              recipientUserId: customer.userId,
              type: 'SAFETY_ALERT',
              title: 'EMERGENCY CONTACTS ALERTED 🚨',
              message: `Safety check-in was unanswered. Automated emergency calls and SMS have been dispatched to ${customer.emergencyContacts.length} registered emergency contacts.`,
              relatedEntityType: 'SAFETY_EVENT',
              relatedEntityId: safetyEvent.id,
            },
            {
              recipientUserId: checkIn.booking.worker.userId,
              type: 'SAFETY_ALERT',
              title: 'Safety Alert Escalated to Support',
              message: 'Customer safety alarm was not acknowledged. Kaam Setu safety response team has been alerted.',
              relatedEntityType: 'SAFETY_EVENT',
              relatedEntityId: safetyEvent.id,
            },
          ],
        });

        console.log(`🚨 AUTOMATIC SOS ESCALATION COMPLETE for Booking ${checkIn.bookingId}: ${customer.emergencyContacts.length} contacts dialed.`);
      }
    }
  }

  /**
   * Initializes a work timer for a booking after OTP verification.
   */
  static async startWorkTimer(params: {
    bookingId: string;
    workerId: string;
    expectedDurationMinutes: number;
    gracePeriodMinutes?: number;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        worker: { include: { user: true } },
        customer: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.workerId !== params.workerId) {
      throw new Error('Only the assigned worker can start the work timer');
    }

    if (booking.status !== 'WORK_STARTED') {
      throw new Error('Work timer can only be started after successful customer OTP verification (status must be WORK_STARTED)');
    }

    if (params.expectedDurationMinutes <= 0) {
      throw new Error('Expected work duration must be greater than 0 minutes');
    }

    const startedAt = new Date();
    const expectedCompletionAt = new Date(startedAt.getTime() + params.expectedDurationMinutes * 60 * 1000);

    // Cancel any previous active timers for this booking
    await prisma.workTimer.updateMany({
      where: {
        bookingId: booking.id,
        status: { in: ['ACTIVE', 'EXPIRED'] },
      },
      data: { status: 'CANCELLED' },
    });

    const previousTimersCount = await prisma.workTimer.count({
      where: { bookingId: booking.id },
    });

    // Create authoritative WorkTimer record
    const workTimer = await prisma.workTimer.create({
      data: {
        bookingId: booking.id,
        workerId: booking.workerId,
        customerId: booking.customerId,
        startedAt,
        expectedDurationMinutes: params.expectedDurationMinutes,
        expectedCompletionAt,
        status: 'ACTIVE',
        cycleNumber: previousTimersCount + 1,
      },
    });

    // Create accompanying SafetyCheckIn scheduled at expected completion time
    const safetyCheckIn = await prisma.safetyCheckIn.create({
      data: {
        bookingId: booking.id,
        timerId: workTimer.id,
        milestoneType: 'EXPECTED_COMPLETION',
        expectedAt: expectedCompletionAt,
        gracePeriodMinutes: params.gracePeriodMinutes || 2,
        status: 'SCHEDULED',
      },
    });

    // Real-time broadcasts
    const timerPayload = {
      bookingId: booking.id,
      timer: workTimer,
      safetyCheckIn,
      workerName: booking.worker.user.name,
      startedAt: startedAt.toISOString(),
      expectedCompletionAt: expectedCompletionAt.toISOString(),
    };

    emitToCustomer(booking.customerId, 'booking.timer.started', timerPayload);
    emitToWorker(booking.workerId, 'booking.timer.started', timerPayload);
    emitToBooking(booking.id, 'booking.timer.started', timerPayload);

    // Durable Notification for customer
    const formattedTime = expectedCompletionAt.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    await prisma.notification.create({
      data: {
        recipientUserId: booking.customer.userId,
        type: 'WORK_STARTED',
        title: 'Work Timer Started ⏱️',
        message: `Your service professional ${booking.worker.user.name} has started working. The expected completion time is ${formattedTime}.`,
        relatedEntityType: 'BOOKING',
        relatedEntityId: booking.id,
      },
    });

    return { workTimer, safetyCheckIn };
  }

  /**
   * Worker requests an extension to the active work timer.
   */
  static async requestExtension(params: {
    bookingId: string;
    workerId: string;
    additionalMinutes: number;
    reason: string;
  }) {
    if (params.additionalMinutes <= 0) {
      throw new Error('Additional time requested must be greater than 0 minutes');
    }

    if (!params.reason || params.reason.trim().length < 3) {
      throw new Error('A reason for the extension is required (min 3 characters)');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        customer: { include: { user: true } },
        worker: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.workerId !== params.workerId) {
      throw new Error('Only the assigned worker can request a timer extension');
    }

    if (booking.status !== 'WORK_STARTED') {
      throw new Error('Cannot request extension: service is not currently in progress');
    }

    // Get current timer
    const currentTimer = await prisma.workTimer.findFirst({
      where: {
        bookingId: booking.id,
        status: { in: ['ACTIVE', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentTimer) {
      throw new Error('No active work timer found for this booking');
    }

    // Calculate proposed completion time from current expectedCompletionAt (or now if already expired)
    const baseTime = currentTimer.expectedCompletionAt > new Date() ? currentTimer.expectedCompletionAt : new Date();
    const proposedCompletionAt = new Date(baseTime.getTime() + params.additionalMinutes * 60 * 1000);

    const extensionRequest = await prisma.timerExtensionRequest.create({
      data: {
        bookingId: booking.id,
        timerId: currentTimer.id,
        requestedBy: params.workerId,
        additionalMinutes: params.additionalMinutes,
        reason: params.reason.trim(),
        proposedCompletionAt,
        status: 'PENDING',
      },
    });

    const payload = {
      bookingId: booking.id,
      extension: extensionRequest,
      currentCompletionAt: currentTimer.expectedCompletionAt.toISOString(),
      proposedCompletionAt: proposedCompletionAt.toISOString(),
      additionalMinutes: params.additionalMinutes,
      reason: params.reason.trim(),
      workerName: booking.worker.user.name,
    };

    emitToCustomer(booking.customerId, 'booking.timer.extension.requested', payload);
    emitToBooking(booking.id, 'booking.timer.extension.requested', payload);

    await prisma.notification.create({
      data: {
        recipientUserId: booking.customer.userId,
        type: 'SAFETY_ALERT',
        title: 'Work Extension Requested ⏳',
        message: `Your service professional has requested an additional ${params.additionalMinutes} minutes to complete the work. Reason: "${params.reason.trim()}"`,
        relatedEntityType: 'BOOKING',
        relatedEntityId: booking.id,
      },
    });

    return extensionRequest;
  }

  /**
   * Customer approves or rejects a timer extension.
   */
  static async respondToExtension(params: {
    bookingId: string;
    customerId: string;
    extensionId: string;
    action: 'APPROVE' | 'REJECT';
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        customer: { include: { user: true } },
        worker: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.customerId !== params.customerId) {
      throw new Error('Only the customer who booked the service can approve or reject timer extensions');
    }

    const extension = await prisma.timerExtensionRequest.findUnique({
      where: { id: params.extensionId },
      include: { workTimer: true },
    });

    if (!extension || extension.bookingId !== booking.id) {
      throw new Error('Extension request not found');
    }

    if (extension.status !== 'PENDING') {
      throw new Error(`Extension request has already been ${extension.status.toLowerCase()}`);
    }

    const now = new Date();

    if (params.action === 'APPROVE') {
      // 1. Update extension request
      const updatedExtension = await prisma.timerExtensionRequest.update({
        where: { id: extension.id },
        data: {
          status: 'APPROVED',
          respondedAt: now,
        },
      });

      // 2. Extend WorkTimer
      const updatedTimer = await prisma.workTimer.update({
        where: { id: extension.timerId },
        data: {
          expectedDurationMinutes: extension.workTimer.expectedDurationMinutes + extension.additionalMinutes,
          expectedCompletionAt: extension.proposedCompletionAt,
          status: 'ACTIVE',
        },
      });

      // 3. Reset pending safety check-ins and reschedule to new completion time
      await prisma.safetyCheckIn.updateMany({
        where: {
          timerId: extension.timerId,
          status: { in: ['SCHEDULED', 'ALERT_TRIGGERED'] },
        },
        data: {
          expectedAt: extension.proposedCompletionAt,
          alertTriggeredAt: null,
          status: 'SCHEDULED',
        },
      });

      const payload = {
        bookingId: booking.id,
        timer: updatedTimer,
        extension: updatedExtension,
        newCompletionAt: extension.proposedCompletionAt.toISOString(),
      };

      emitToCustomer(booking.customerId, 'booking.timer.extension.approved', payload);
      emitToWorker(booking.workerId, 'booking.timer.extension.approved', payload);
      emitToBooking(booking.id, 'booking.timer.extension.approved', payload);

      await prisma.notification.createMany({
        data: [
          {
            recipientUserId: booking.worker.userId,
            type: 'SAFETY_ALERT',
            title: 'Timer Extension Approved ✅',
            message: `Customer approved additional ${extension.additionalMinutes} mins. New expected completion: ${extension.proposedCompletionAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`,
            relatedEntityType: 'BOOKING',
            relatedEntityId: booking.id,
          },
          {
            recipientUserId: booking.customer.userId,
            type: 'SAFETY_ALERT',
            title: 'Work Timer Extended',
            message: `Service duration extended by ${extension.additionalMinutes} mins. New expected completion: ${extension.proposedCompletionAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`,
            relatedEntityType: 'BOOKING',
            relatedEntityId: booking.id,
          },
        ],
      });

      return { extension: updatedExtension, timer: updatedTimer };
    } else {
      // REJECT
      const updatedExtension = await prisma.timerExtensionRequest.update({
        where: { id: extension.id },
        data: {
          status: 'REJECTED',
          respondedAt: now,
        },
      });

      const payload = {
        bookingId: booking.id,
        extensionId: extension.id,
        status: 'REJECTED',
      };

      emitToCustomer(booking.customerId, 'booking.timer.extension.rejected', payload);
      emitToWorker(booking.workerId, 'booking.timer.extension.rejected', payload);
      emitToBooking(booking.id, 'booking.timer.extension.rejected', payload);

      await prisma.notification.create({
        data: {
          recipientUserId: booking.worker.userId,
          type: 'SAFETY_ALERT',
          title: 'Extension Request Rejected ❌',
          message: `Customer declined the extension request for ${extension.additionalMinutes} minutes. Original completion time remains in effect.`,
          relatedEntityType: 'BOOKING',
          relatedEntityId: booking.id,
        },
      });

      return { extension: updatedExtension, timer: extension.workTimer };
    }
  }

  /**
   * Customer confirms "I'M SAFE / STOP ALARM" on expired safety check-in.
   */
  static async acknowledgeSafe(params: {
    bookingId: string;
    customerId: string;
    timerId?: string;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        customer: { include: { user: true } },
        worker: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.customerId !== params.customerId) {
      throw new Error('Only the customer can confirm safety acknowledgement');
    }

    const now = new Date();

    // 1. Mark SafetyCheckIn as ACKNOWLEDGED
    await prisma.safetyCheckIn.updateMany({
      where: {
        bookingId: booking.id,
        status: { in: ['ALERT_TRIGGERED', 'SCHEDULED', 'REMINDER_SENT'] },
      },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: now,
      },
    });

    // 2. Mark WorkTimer as ACKNOWLEDGED
    const timer = await prisma.workTimer.findFirst({
      where: {
        bookingId: booking.id,
        status: { in: ['EXPIRED', 'ACTIVE'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (timer) {
      await prisma.workTimer.update({
        where: { id: timer.id },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: now,
        },
      });
    }

    const payload = {
      bookingId: booking.id,
      timerId: timer?.id,
      acknowledgedAt: now.toISOString(),
      message: 'Customer confirmed safe. Safety alarm stopped.',
    };

    emitToCustomer(booking.customerId, 'booking.safety.alert.acknowledged', payload);
    emitToWorker(booking.workerId, 'booking.safety.alert.acknowledged', payload);
    emitToBooking(booking.id, 'booking.safety.alert.acknowledged', payload);

    await prisma.notification.create({
      data: {
        recipientUserId: booking.worker.userId,
        type: 'SAFETY_ALERT',
        title: 'Customer Confirmed Safe 🛡️',
        message: 'Customer acknowledged safety check-in and stopped the alarm. Please update expected duration if work is continuing.',
        relatedEntityType: 'BOOKING',
        relatedEntityId: booking.id,
      },
    });

    return { success: true, acknowledgedAt: now };
  }

  /**
   * Resets safety-check-in cycle by having the worker establish a new duration.
   */
  static async resetCycle(params: {
    bookingId: string;
    workerId: string;
    newDurationMinutes: number;
  }) {
    return await WorkTimerEngine.startWorkTimer({
      bookingId: params.bookingId,
      workerId: params.workerId,
      expectedDurationMinutes: params.newDurationMinutes,
    });
  }

  /**
   * Retrieves complete live timer, extensions, and check-in status for a booking.
   */
  static async getBookingTimerStatus(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: {
            id: true,
            userId: true,
            emergencyContacts: {
              select: { id: true, name: true, relationship: true, priorityOrder: true, isVerified: true },
            },
          },
        },
        worker: {
          select: {
            id: true,
            userId: true,
            user: { select: { name: true, phone: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!booking) return null;

    const timers = await prisma.workTimer.findMany({
      where: { bookingId },
      include: {
        extensionRequests: { orderBy: { requestedAt: 'desc' } },
        safetyCheckIns: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeOrLatestTimer = timers[0] || null;

    const safetyCheckIns = await prisma.safetyCheckIn.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    const safetyEvents = await prisma.safetyEvent.findMany({
      where: { bookingId },
      include: { callLogs: true },
      orderBy: { createdAt: 'desc' },
    });

    const activeAlarm = safetyCheckIns.find(c => c.status === 'ALERT_TRIGGERED');
    const isEscalated = safetyEvents.some(e => e.status === 'ESCALATED') || safetyCheckIns.some(c => c.status === 'ESCALATED');

    const pendingExtension = activeOrLatestTimer?.extensionRequests.find(e => e.status === 'PENDING') || null;

    return {
      bookingId,
      bookingStatus: booking.status,
      serverTime: new Date().toISOString(),
      currentTimer: activeOrLatestTimer,
      hasActiveTimer: activeOrLatestTimer?.status === 'ACTIVE',
      hasActiveAlarm: Boolean(activeAlarm),
      activeAlarmGracePeriodMinutes: activeAlarm?.gracePeriodMinutes || 2,
      alarmTriggeredAt: activeAlarm?.alertTriggeredAt || null,
      isEscalated,
      pendingExtension,
      allTimers: timers,
      safetyCheckIns,
      safetyEvents,
      emergencyContacts: booking.customer.emergencyContacts,
    };
  }
}

