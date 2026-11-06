import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  emitToCustomer,
  emitToWorker,
  emitToJob,
} from '../../sockets/socketManager.js';

const quoteSchema = z.object({
  jobRequestId: z.string().min(1),
  proposedPrice: z.number().positive('Proposed price must be positive').optional(),
  visitingCharge: z.number().min(0, 'Visiting charge cannot be negative').default(150),
  serviceCharge: z.number().min(0, 'Service charge cannot be negative').default(0),
  additionalCharges: z.number().min(0, 'Additional charges cannot be negative').default(0),
  isVisitingRefundableOrAdjustable: z.boolean().default(true),
  visitingChargeTerms: z.string().optional().nullable(),
  isFinalPriceEstimated: z.boolean().default(false),
  estimatedArrivalMinutes: z.number().int().min(5).default(30),
  scopeDescription: z.string().min(5, 'Scope description is required'),
  exclusions: z.string().optional().nullable(),
  workerNote: z.string().optional().nullable(),
});

const counterofferSchema = z.object({
  proposedPrice: z.number().positive('Counter proposed price must be positive'),
  message: z.string().min(3, 'Message is required for a counteroffer'),
});

const acceptQuoteSchema = z.object({
  acknowledgedVisitingCharge: z.number().min(0, 'Acknowledged visiting charge is required'),
  confirmedAcknowledgement: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm and acknowledge the visiting charge policy' }),
  }),
  termsVersion: z.string().default('v1.0'),
});

export async function createQuote(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.workerProfileId) {
      return res.status(403).json({ error: 'Only registered workers can submit quotes' });
    }

    const data = quoteSchema.parse(req.body);

    const job = await prisma.jobRequest.findUnique({
      where: { id: data.jobRequestId },
      include: {
        customer: { include: { user: true } },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job request not found' });
    }

    if (job.status === 'BOOKED' || job.status === 'COMPLETED' || job.status === 'CANCELLED') {
      return res.status(400).json({ error: `Cannot submit quote: Job request is ${job.status}` });
    }

    // Check if worker already submitted an active quote
    const existingQuote = await prisma.quote.findFirst({
      where: {
        jobRequestId: data.jobRequestId,
        workerId: req.workerProfileId,
      },
    });

    if (existingQuote && existingQuote.status !== 'REJECTED') {
      return res.status(409).json({ error: 'You have already submitted a quote for this job request' });
    }

    const visitingCharge = data.visitingCharge !== undefined ? data.visitingCharge : 150;
    const serviceCharge = data.serviceCharge !== undefined ? data.serviceCharge : (data.proposedPrice ? Math.max(0, data.proposedPrice - visitingCharge) : 0);
    const additionalCharges = data.additionalCharges || 0;
    const calculatedTotal = visitingCharge + serviceCharge + additionalCharges;
    const finalProposedPrice = data.proposedPrice && data.proposedPrice > 0 ? data.proposedPrice : (calculatedTotal > 0 ? calculatedTotal : 150);

    const quote = await prisma.quote.create({
      data: {
        jobRequestId: data.jobRequestId,
        workerId: req.workerProfileId,
        proposedPrice: finalProposedPrice,
        visitingCharge,
        serviceCharge,
        additionalCharges,
        isVisitingRefundableOrAdjustable: data.isVisitingRefundableOrAdjustable ?? true,
        visitingChargeTerms: data.visitingChargeTerms || '₹150 inspection charge upon arrival. 100% deducted from total service invoice if work proceeds.',
        isFinalPriceEstimated: data.isFinalPriceEstimated ?? false,
        termsVersion: 'v1.0',
        customerAcknowledgedAt: null,
        acknowledgedVisitingCharge: null,
        estimatedArrivalMinutes: data.estimatedArrivalMinutes,
        scopeDescription: data.scopeDescription,
        exclusions: data.exclusions,
        workerNote: data.workerNote,
        status: 'PENDING',
      },
      include: {
        worker: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            verifications: true,
          },
        },
        jobRequest: {
          include: { serviceCategory: true },
        },
      },
    });

    // Update worker's offer status to QUOTED
    await prisma.jobOffer.updateMany({
      where: {
        jobRequestId: data.jobRequestId,
        workerId: req.workerProfileId,
      },
      data: {
        status: 'QUOTED',
        respondedAt: new Date(),
      },
    });

    // Update job status to OFFERS_RECEIVED if open
    await prisma.jobRequest.update({
      where: { id: data.jobRequestId },
      data: { status: 'OFFERS_RECEIVED' },
    });

    // Real-time broadcast: Customer sees quote without refreshing page
    emitToCustomer(job.customerId, 'quote.created', {
      quote,
      jobRequestId: data.jobRequestId,
    });
    emitToJob(data.jobRequestId, 'quote.created', {
      quote,
      jobRequestId: data.jobRequestId,
    });

    // Save persistent notification for customer
    await prisma.notification.create({
      data: {
        recipientUserId: job.customer.userId,
        type: 'QUOTE_RECEIVED',
        title: `Quote received: ₹${data.proposedPrice}`,
        message: `${quote.worker?.user.name} sent a quote of ₹${data.proposedPrice} with ${data.estimatedArrivalMinutes} min arrival for "${job.title}".`,
        relatedEntityType: 'QUOTE',
        relatedEntityId: quote.id,
      },
    });

    return res.status(201).json({
      message: 'Quote submitted successfully',
      quote,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create quote error:', error);
    return res.status(500).json({ error: 'Failed to submit quote' });
  }
}

export async function counterofferQuote(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { proposedPrice, message } = counterofferSchema.parse(req.body);

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        jobRequest: {
          include: { customer: { include: { user: true } } },
        },
        worker: {
          include: { user: true },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status === 'ACCEPTED' || quote.status === 'REJECTED') {
      return res.status(400).json({ error: `Cannot negotiate a quote that is ${quote.status}` });
    }

    const senderRole = req.user?.role || 'CUSTOMER';
    let recipientUserId = '';

    if (senderRole === 'CUSTOMER') {
      if (quote.jobRequest.customer.userId !== req.user?.userId) {
        return res.status(403).json({ error: 'Unauthorized to counter this quote' });
      }
      recipientUserId = quote.worker.userId;
    } else if (senderRole === 'WORKER') {
      if (quote.worker.userId !== req.user?.userId) {
        return res.status(403).json({ error: 'Unauthorized to counter this quote' });
      }
      recipientUserId = quote.jobRequest.customer.userId;
    }

    // Create negotiation record
    const negotiation = await prisma.quoteNegotiation.create({
      data: {
        quoteId: quote.id,
        senderId: req.user!.userId,
        senderRole,
        proposedPrice,
        message,
      },
    });

    // Update quote proposed price & status to COUNTEROFFERED and reset customer acknowledgement
    const updatedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'COUNTEROFFERED',
        proposedPrice,
        customerAcknowledgedAt: null,
        acknowledgedVisitingCharge: null,
      },
      include: {
        worker: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        negotiations: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Real-time broadcast
    emitToJob(quote.jobRequestId, 'quote.counteroffered', {
      quote: updatedQuote,
      negotiation,
    });

    if (senderRole === 'CUSTOMER') {
      emitToWorker(quote.workerId, 'quote.counteroffered', {
        quote: updatedQuote,
        negotiation,
      });
    } else {
      emitToCustomer(quote.jobRequest.customerId, 'quote.counteroffered', {
        quote: updatedQuote,
        negotiation,
      });
    }

    // Durable notification
    await prisma.notification.create({
      data: {
        recipientUserId,
        type: 'QUOTE_COUNTEROFFERED',
        title: `Counteroffer: ₹${proposedPrice}`,
        message: `${req.user?.role === 'CUSTOMER' ? 'Customer' : 'Worker'} sent a counteroffer of ₹${proposedPrice}: "${message}"`,
        relatedEntityType: 'QUOTE',
        relatedEntityId: quote.id,
      },
    });

    return res.json({
      message: 'Counteroffer submitted',
      quote: updatedQuote,
      negotiation,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Counteroffer error:', error);
    return res.status(500).json({ error: 'Failed to submit counteroffer' });
  }
}

export async function acceptQuote(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        jobRequest: {
          include: { customer: { include: { user: true } } },
        },
        worker: {
          include: { user: true, verifications: true },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Only customer can accept quote
    if (quote.jobRequest.customer.userId !== req.user?.userId) {
      return res.status(403).json({ error: 'Only the customer who created the request can accept a quote' });
    }

    if (quote.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'Quote has already been accepted' });
    }

    // Check if another quote was already accepted or job booked
    const existingBooking = await prisma.booking.findUnique({
      where: { jobRequestId: quote.jobRequestId },
    });

    if (existingBooking) {
      return res.status(409).json({ error: 'A quote has already been accepted for this job request' });
    }

    // Validate Visiting Charge Acknowledgement
    const validationResult = acceptQuoteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Mandatory Visiting Charge Acknowledgement required: Please confirm you have read and understood the visiting charges and conditions before accepting this quotation.',
        details: validationResult.error.errors,
      });
    }

    const { acknowledgedVisitingCharge, termsVersion } = validationResult.data;

    // Verify acknowledged visiting charge matches the quotation
    if (Math.abs(acknowledgedVisitingCharge - quote.visitingCharge) > 0.01) {
      return res.status(400).json({
        error: `Quotation terms mismatch. The quotation visiting fee is ₹${quote.visitingCharge}, but ₹${acknowledgedVisitingCharge} was acknowledged. Please review the updated quotation.`,
      });
    }

    // Generate a secure 4-digit start OTP
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Use Prisma Transaction to ensure atomic consistency:
    // 1. Mark accepted quote ACCEPTED with acknowledgement timestamp
    // 2. Reject all competing quotes for this job request
    // 3. Create single Booking record
    // 4. Create BookingChargeAcknowledgement record linked to booking & quote
    // 5. Update JobRequest status to BOOKED
    const result = await prisma.$transaction(async (tx) => {
      const acceptedQuote = await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: 'ACCEPTED',
          customerAcknowledgedAt: new Date(),
          acknowledgedVisitingCharge: quote.visitingCharge,
          termsVersion,
        },
      });

      const booking = await tx.booking.create({
        data: {
          jobRequestId: quote.jobRequestId,
          customerId: quote.jobRequest.customerId,
          workerId: quote.workerId,
          acceptedQuoteId: quote.id,
          agreedPrice: quote.proposedPrice,
          agreedScope: quote.scopeDescription,
          startOtp,
          status: 'CONFIRMED',
        },
        include: {
          jobRequest: { include: { serviceCategory: true } },
          customer: {
            include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
          },
          worker: {
            include: {
              user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
              verifications: true,
            },
          },
        },
      });

      await tx.bookingChargeAcknowledgement.create({
        data: {
          bookingId: booking.id,
          quotationId: quote.id,
          visitingCharge: quote.visitingCharge,
          serviceCharge: quote.serviceCharge,
          totalQuotationAmount: quote.proposedPrice,
          isRefundableOrAdjustable: quote.isVisitingRefundableOrAdjustable,
          terms: quote.visitingChargeTerms || 'Standard diagnostic inspection fee. Deducted from final service bill upon hire.',
          termsVersion,
          customerAcknowledgedAt: new Date(),
        },
      });

      await tx.quote.updateMany({
        where: {
          jobRequestId: quote.jobRequestId,
          id: { not: quote.id },
        },
        data: { status: 'REJECTED' },
      });

      await tx.jobRequest.update({
        where: { id: quote.jobRequestId },
        data: { status: 'BOOKED' },
      });

      return { acceptedQuote, booking };
    });

    const { acceptedQuote, booking } = result;

    // Real-time events
    emitToJob(quote.jobRequestId, 'quote.accepted', {
      quoteId: quote.id,
      bookingId: booking.id,
    });
    emitToWorker(quote.workerId, 'quote.accepted', {
      quoteId: quote.id,
      bookingId: booking.id,
    });
    emitToWorker(quote.workerId, 'booking.confirmed', { booking });
    emitToCustomer(quote.jobRequest.customerId, 'booking.confirmed', { booking });

    // Durable Notifications
    await prisma.notification.createMany({
      data: [
        {
          recipientUserId: quote.worker.userId,
          type: 'QUOTE_ACCEPTED',
          title: 'Quote Accepted! Booking Confirmed 🎉',
          message: `Your quote of ₹${quote.proposedPrice} was accepted for "${quote.jobRequest.title}". Ready for dispatch.`,
          relatedEntityType: 'BOOKING',
          relatedEntityId: booking.id,
        },
        {
          recipientUserId: quote.jobRequest.customer.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed!',
          message: `Worker ${quote.worker.user.name} is booked for ₹${quote.proposedPrice}. Verification Start Code: ${startOtp}`,
          relatedEntityType: 'BOOKING',
          relatedEntityId: booking.id,
        },
      ],
    });

    return res.json({
      message: 'Quote accepted and booking confirmed!',
      booking,
      acceptedQuote,
    });
  } catch (error) {
    console.error('Accept quote error:', error);
    return res.status(500).json({ error: 'Failed to accept quote' });
  }
}

export async function rejectQuote(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        jobRequest: { include: { customer: true } },
        worker: true,
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.jobRequest.customer.userId !== req.user?.userId) {
      return res.status(403).json({ error: 'Unauthorized to reject this quote' });
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    emitToJob(quote.jobRequestId, 'quote.rejected', {
      quoteId: quote.id,
      jobRequestId: quote.jobRequestId,
    });
    emitToWorker(quote.workerId, 'quote.rejected', {
      quoteId: quote.id,
      jobRequestId: quote.jobRequestId,
    });

    return res.json({ message: 'Quote rejected', quote: updated });
  } catch (error) {
    console.error('Reject quote error:', error);
    return res.status(500).json({ error: 'Failed to reject quote' });
  }
}
