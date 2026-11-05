import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

const supportTicketSchema = z.object({
  bookingId: z.string().optional().nullable(),
  category: z.enum([
    'GENERAL',
    'BOOKING_ISSUE',
    'WORKER_BEHAVIOUR',
    'PRICING_DISPUTE',
    'CANCELLATION',
    'PAYMENT_ISSUE',
    'PAYMENT_QUERY',
    'SAFETY_CONCERN',
    'SAFETY_REPORT',
    'TECHNICAL_PROBLEM',
    'OTHER',
  ]).default('GENERAL'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(10, 'Please provide more details in the description'),
});

export async function createSupportTicket(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const data = supportTicketSchema.parse(req.body);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.userId,
        bookingId: data.bookingId,
        category: data.category,
        subject: data.subject,
        description: data.description,
        status: 'OPEN',
      },
    });

    return res.status(201).json({
      message: 'Support ticket submitted successfully. Our team will review your case.',
      ticket,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create ticket error:', error);
    return res.status(500).json({ error: 'Failed to create support ticket' });
  }
}

export async function getMySupportTickets(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ tickets });
  } catch (error: any) {
    console.error('Get tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
}

export async function getSupportTicketById(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found.' });
    }

    if (ticket.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied to this support ticket.' });
    }

    return res.json({ ticket });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve ticket', details: error.message });
  }
}
