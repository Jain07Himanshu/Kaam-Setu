import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { TelephonyService } from './telephonyProvider.js';
import { emitToUser, emitToRole } from '../../sockets/socketManager.js';

const triggerSosSchema = z.object({
  bookingId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  triggerType: z.enum(['SOS', 'PANIC_BUTTON', 'MISSED_CHECKIN', 'SAFETY_ALERT']).default('SOS'),
});

const resolveSosSchema = z.object({
  resolutionStatus: z.enum(['RESOLVED', 'CANCELLED']).default('RESOLVED'),
  notes: z.string().min(3, 'Resolution notes are required'),
});

const initCheckinSchema = z.object({
  bookingId: z.string().min(1),
  milestoneType: z.enum(['WORKER_ARRIVAL', 'WORK_STARTED', 'EXPECTED_COMPLETION']).default('WORKER_ARRIVAL'),
  scheduledMinutesFromNow: z.number().int().min(1).max(180).default(30),
});

export async function triggerSos(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can trigger emergency safety SOS' });
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: true,
        emergencyContacts: {
          orderBy: { priorityOrder: 'asc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    const data = triggerSosSchema.parse(req.body);

    let booking = null;
    if (data.bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: {
          worker: { include: { user: true } },
          jobRequest: true,
        },
      });
    }

    const customerName = customer.user.name;
    const locationString = data.address || (booking ? `${booking.jobRequest.addressLabel}, ${booking.jobRequest.city}` : 'Home Address on file');

    // 1. Create persistent SafetyEvent
    const safetyEvent = await prisma.safetyEvent.create({
      data: {
        customerId: customer.id,
        bookingId: data.bookingId || null,
        eventType: data.triggerType === 'PANIC_BUTTON' ? 'SOS' : data.triggerType,
        severity: 'CRITICAL',
        status: 'ACTIVE',
        locationLat: data.latitude || null,
        locationLng: data.longitude || null,
        notes: `Urgent SOS triggered by ${customerName}. Location: ${locationString}`,
      },
    });

    // 2. Automated outbound telephony alert simulation / provider execution
    const telephony = TelephonyService.getProvider();
    const emergencyCallLogs = [];

    const alertMessage = `URGENT KAAM SETU SAFETY ALERT: Customer ${customerName} triggered Emergency SOS during home service. Address: ${locationString}.`;

    for (const contact of customer.emergencyContacts) {
      const callResult = await telephony.initiateEmergencyCall({
        to: contact.phone,
        contactName: contact.name,
        customerName,
        bookingId: data.bookingId,
        safetyEventId: safetyEvent.id,
        messageText: alertMessage,
      });

      await telephony.sendEmergencySms(contact.phone, alertMessage);

      const callLog = await prisma.emergencyCallLog.create({
        data: {
          safetyEventId: safetyEvent.id,
          contactReference: contact.phone,
          provider: callResult.provider,
          providerCallId: callResult.callId,
          callStatus: callResult.status,
          voiceFileUrl: callResult.voiceUrlUsed || null,
          notes: `Alert sent to ${contact.name} (${contact.relationship})`,
        },
      });

      emergencyCallLogs.push(callLog);
    }

    // 3. Support Ticket
    const safetyTicket = await prisma.supportTicket.create({
      data: {
        userId: customer.user.id,
        bookingId: data.bookingId || null,
        category: 'SAFETY_CONCERN',
        subject: `[EMERGENCY SOS] Triggered by ${customerName}`,
        description: `Customer triggered an active SOS alert. Location: ${locationString}. ${customer.emergencyContacts.length} emergency contacts alerted. Safety Event ID: ${safetyEvent.id}`,
        status: 'OPEN',
      },
    });

    // 4. Socket notifications
    emitToUser(customer.user.id, 'safety.sos_active', {
      safetyEvent,
      message: 'SOS Alert activated. Rapid response protocols dispatched.',
    });

    if (booking?.worker?.userId) {
      emitToUser(booking.worker.userId, 'safety.booking_alert', {
        safetyEventId: safetyEvent.id,
        bookingId: booking.id,
        warning: 'Customer has triggered safety protocol. Please cooperate with safety team.',
      });
    }

    emitToRole('ADMIN', 'admin.safety_alert', {
      safetyEvent,
      ticketId: safetyTicket.id,
      emergencyCallLogs,
    });

    return res.status(201).json({
      message: 'Emergency SOS activated. Contacts alerted and response team dispatched.',
      safetyEvent,
      contactsNotifiedCount: customer.emergencyContacts.length,
      callLogs: emergencyCallLogs,
      supportTicketId: safetyTicket.id,
      nationalHelplines: {
        nationalEmergency: '112',
        police: '100',
        womenHelpline: '1091',
        ambulance: '108',
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Trigger SOS error:', error);
    return res.status(500).json({ error: 'Failed to trigger emergency SOS' });
  }
}

export async function resolveSos(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const data = resolveSosSchema.parse(req.body);

    const safetyEvent = await prisma.safetyEvent.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!safetyEvent) {
      return res.status(404).json({ error: 'Safety event not found' });
    }

    if (req.user.role === 'CUSTOMER' && safetyEvent.customer.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to resolve this safety event' });
    }

    const updated = await prisma.safetyEvent.update({
      where: { id },
      data: {
        status: data.resolutionStatus,
        notes: `${safetyEvent.notes ? safetyEvent.notes + '\n' : ''}[Resolution] ${data.notes}`,
        resolvedAt: new Date(),
      },
    });

    emitToUser(safetyEvent.customer.userId, 'safety.sos_resolved', {
      safetyEventId: updated.id,
      status: updated.status,
    });

    return res.status(200).json({
      message: `Safety event marked as ${data.resolutionStatus}`,
      safetyEvent: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Resolve SOS error:', error);
    return res.status(500).json({ error: 'Failed to resolve safety event' });
  }
}

export async function getCustomerSafetyEvents(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can view their safety history' });
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    const events = await prisma.safetyEvent.findMany({
      where: { customerId: customer.id },
      include: {
        callLogs: true,
        booking: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            worker: {
              select: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ safetyEvents: events });
  } catch (error) {
    console.error('Get safety events error:', error);
    return res.status(500).json({ error: 'Failed to retrieve safety events' });
  }
}

export async function initBookingSafetyCheckin(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const data = initCheckinSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const expectedAt = new Date(Date.now() + data.scheduledMinutesFromNow * 60 * 1000);

    const checkIn = await prisma.safetyCheckIn.create({
      data: {
        bookingId: booking.id,
        milestoneType: data.milestoneType,
        expectedAt,
        gracePeriodMinutes: 15,
        status: 'SCHEDULED',
      },
    });

    return res.status(201).json({
      message: 'Safety check-in milestone scheduled',
      checkIn,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Init checkin error:', error);
    return res.status(500).json({ error: 'Failed to initialize safety check-in' });
  }
}

export async function acknowledgeSafetyCheckin(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can acknowledge safety check-ins' });
    }

    const { id } = req.params;

    const checkIn = await prisma.safetyCheckIn.findUnique({
      where: { id },
      include: {
        booking: {
          include: { customer: true },
        },
      },
    });

    if (!checkIn) {
      return res.status(404).json({ error: 'Safety check-in not found' });
    }

    if (checkIn.booking.customer.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to acknowledge this check-in' });
    }

    const updated = await prisma.safetyCheckIn.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: 'Check-in acknowledged: Customer confirmed safe and sound',
      checkIn: updated,
    });
  } catch (error) {
    console.error('Acknowledge checkin error:', error);
    return res.status(500).json({ error: 'Failed to acknowledge check-in' });
  }
}

export async function escalateSafetyCheckin(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const checkIn = await prisma.safetyCheckIn.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: {
              include: {
                user: true,
                emergencyContacts: true,
              },
            },
          },
        },
      },
    });

    if (!checkIn) {
      return res.status(404).json({ error: 'Safety check-in not found' });
    }

    if (checkIn.status === 'ACKNOWLEDGED' || checkIn.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Check-in is already acknowledged or resolved' });
    }

    let nextStatus: 'REMINDER_SENT' | 'WARNING_SENT' | 'ESCALATED' = 'REMINDER_SENT';

    if (checkIn.status === 'SCHEDULED') {
      nextStatus = 'REMINDER_SENT';
    } else if (checkIn.status === 'REMINDER_SENT') {
      nextStatus = 'WARNING_SENT';
    } else {
      nextStatus = 'ESCALATED';

      const telephony = TelephonyService.getProvider();
      const customer = checkIn.booking.customer;
      const customerName = customer.user.name;

      for (const contact of customer.emergencyContacts) {
        await telephony.initiateEmergencyCall({
          to: contact.phone,
          contactName: contact.name,
          customerName,
          bookingId: checkIn.bookingId,
          messageText: `Safety Check-in Unanswered: Customer ${customerName} did not respond to automated safety check-in for booking #${checkIn.bookingId}.`,
        });
      }
    }

    const updated = await prisma.safetyCheckIn.update({
      where: { id },
      data: { status: nextStatus },
    });

    return res.status(200).json({
      message: `Safety check-in updated to status: ${nextStatus}`,
      checkIn: updated,
    });
  } catch (error) {
    console.error('Escalate checkin error:', error);
    return res.status(500).json({ error: 'Failed to advance check-in stage' });
  }
}

export async function getBookingSafetyStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            emergencyContacts: {
              select: {
                id: true,
                name: true,
                relationship: true,
                priorityOrder: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const safetyEvents = await prisma.safetyEvent.findMany({
      where: { bookingId: id },
      include: { callLogs: true },
      orderBy: { createdAt: 'desc' },
    });

    const checkIns = await prisma.safetyCheckIn.findMany({
      where: { bookingId: id },
      orderBy: { expectedAt: 'desc' },
    });

    const hasActiveSos = safetyEvents.some(e => e.status === 'ACTIVE');

    return res.status(200).json({
      bookingId: id,
      hasActiveSos,
      safetyEvents,
      checkIns,
      emergencyContactsCount: booking.customer.emergencyContacts.length,
      emergencyContacts: booking.customer.emergencyContacts,
    });
  } catch (error) {
    console.error('Get booking safety status error:', error);
    return res.status(500).json({ error: 'Failed to retrieve booking safety status' });
  }
}
