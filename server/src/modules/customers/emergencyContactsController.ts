import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { prisma } from '../../database/prisma.js';
import { normalizeIndianPhone, maskPhone, createLookupHash, generateOtp } from '../../utils/security.js';
import { emitToUser } from '../../sockets/socketManager.js';
import { TelephonyService } from '../safety/telephonyProvider.js';

// In-memory verification OTP cache with 5-minute expiry
const contactOtpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

export async function getEmergencyContacts(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Only registered customers can manage emergency contacts.' });
    }

    const contacts = await prisma.customerEmergencyContact.findMany({
      where: { customerId: req.customerProfileId },
      orderBy: { priorityOrder: 'asc' },
    });

    const sanitized = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      relationship: c.relationship,
      maskedPhone: maskPhone(c.phone),
      email: c.email,
      priorityOrder: c.priorityOrder,
      isVerified: c.isVerified,
      verificationStatus: c.verificationStatus,
      createdAt: c.createdAt,
    }));

    res.json({
      contacts: sanitized,
      count: sanitized.length,
      maxAllowed: 3,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve emergency contacts', details: error.message });
  }
}

export async function createEmergencyContact(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Only registered customers can add emergency contacts.' });
    }

    const currentCount = await prisma.customerEmergencyContact.count({
      where: { customerId: req.customerProfileId },
    });

    if (currentCount >= 3) {
      return res.status(400).json({
        error: 'Limit reached. You can register a maximum of three (3) trusted emergency contacts.',
      });
    }

    const { name, relationship, phone, email, priorityOrder } = req.body;

    if (!name || !relationship || !phone) {
      return res.status(400).json({ error: 'Name, relationship, and phone number are required.' });
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }

    const phoneLookupHash = createLookupHash(normalizedPhone);

    // Check if this contact phone is already added by this customer
    const existing = await prisma.customerEmergencyContact.findFirst({
      where: {
        customerId: req.customerProfileId,
        phoneLookupHash,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'This phone number is already registered as an emergency contact.' });
    }

    const assignedPriority = priorityOrder && [1, 2, 3].includes(priorityOrder)
      ? priorityOrder
      : currentCount + 1;

    const contact = await prisma.customerEmergencyContact.create({
      data: {
        customerId: req.customerProfileId,
        name: name.trim(),
        relationship: relationship.trim(),
        phone: normalizedPhone,
        phoneLookupHash,
        email: email ? email.trim().toLowerCase() : null,
        priorityOrder: assignedPriority,
        isVerified: false,
        verificationStatus: 'UNVERIFIED',
      },
    });

    if (req.user?.userId) {
      emitToUser(req.user.userId, 'customer.emergency_contact.updated', {
        action: 'CREATED',
        contactId: contact.id,
      });
    }

    res.status(201).json({
      message: 'Emergency contact added successfully.',
      contact: {
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        maskedPhone: maskPhone(contact.phone),
        email: contact.email,
        priorityOrder: contact.priorityOrder,
        isVerified: contact.isVerified,
        verificationStatus: contact.verificationStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create emergency contact', details: error.message });
  }
}

export async function updateEmergencyContact(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Only registered customers can edit emergency contacts.' });
    }

    const { id } = req.params;
    const { name, relationship, phone, email, priorityOrder } = req.body;

    const existing = await prisma.customerEmergencyContact.findFirst({
      where: { id, customerId: req.customerProfileId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Emergency contact not found.' });
    }

    let normalizedPhone = existing.phone;
    let phoneLookupHash = existing.phoneLookupHash;
    let isVerified = existing.isVerified;
    let verificationStatus = existing.verificationStatus;

    if (phone && phone !== existing.phone) {
      try {
        normalizedPhone = normalizeIndianPhone(phone);
        phoneLookupHash = createLookupHash(normalizedPhone);
        isVerified = false;
        verificationStatus = 'UNVERIFIED';
      } catch (e: any) {
        return res.status(400).json({ error: e.message });
      }
    }

    const updated = await prisma.customerEmergencyContact.update({
      where: { id },
      data: {
        name: name ? name.trim() : existing.name,
        relationship: relationship ? relationship.trim() : existing.relationship,
        phone: normalizedPhone,
        phoneLookupHash,
        email: email !== undefined ? (email ? email.trim().toLowerCase() : null) : existing.email,
        priorityOrder: priorityOrder && [1, 2, 3].includes(priorityOrder) ? priorityOrder : existing.priorityOrder,
        isVerified,
        verificationStatus,
      },
    });

    if (req.user?.userId) {
      emitToUser(req.user.userId, 'customer.emergency_contact.updated', {
        action: 'UPDATED',
        contactId: updated.id,
      });
    }

    res.json({
      message: 'Emergency contact updated successfully.',
      contact: {
        id: updated.id,
        name: updated.name,
        relationship: updated.relationship,
        maskedPhone: maskPhone(updated.phone),
        email: updated.email,
        priorityOrder: updated.priorityOrder,
        isVerified: updated.isVerified,
        verificationStatus: updated.verificationStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update emergency contact', details: error.message });
  }
}

export async function deleteEmergencyContact(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Only registered customers can delete emergency contacts.' });
    }

    const { id } = req.params;

    const existing = await prisma.customerEmergencyContact.findFirst({
      where: { id, customerId: req.customerProfileId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Emergency contact not found.' });
    }

    await prisma.customerEmergencyContact.delete({ where: { id } });

    // Re-index priority order for remaining contacts
    const remaining = await prisma.customerEmergencyContact.findMany({
      where: { customerId: req.customerProfileId },
      orderBy: { priorityOrder: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      await prisma.customerEmergencyContact.update({
        where: { id: remaining[i].id },
        data: { priorityOrder: i + 1 },
      });
    }

    if (req.user?.userId) {
      emitToUser(req.user.userId, 'customer.emergency_contact.updated', {
        action: 'DELETED',
        contactId: id,
      });
    }

    res.json({ message: 'Emergency contact removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete emergency contact', details: error.message });
  }
}

export async function sendContactVerificationOtp(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const { id } = req.params;
    const contact = await prisma.customerEmergencyContact.findFirst({
      where: { id, customerId: req.customerProfileId },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Emergency contact not found.' });
    }

    const otp = generateOtp();
    contactOtpStore.set(id, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    const telephony = TelephonyService.getProvider();
    await telephony.sendEmergencySms(
      contact.phone,
      `Kaam Setu Emergency Contact Verification code: ${otp}. Valid for 5 minutes.`
    );

    res.json({
      message: `Verification OTP dispatched to ${maskPhone(contact.phone)}. (Demo mock mode: check server console or use ${otp})`,
      simulatedOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send verification OTP', details: error.message });
  }
}

export async function verifyContactOtp(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.customerProfileId) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const { id } = req.params;
    const { otp } = req.body;

    const stored = contactOtpStore.get(id);
    if (!stored) {
      return res.status(400).json({ error: 'No OTP requested or OTP has expired. Please request a new code.' });
    }

    if (Date.now() > stored.expiresAt) {
      contactOtpStore.delete(id);
      return res.status(400).json({ error: 'OTP has expired. Please request a fresh code.' });
    }

    if (stored.attempts >= 3) {
      contactOtpStore.delete(id);
      return res.status(400).json({ error: 'Maximum attempts exceeded. Please request a new verification code.' });
    }

    if (stored.otp !== otp?.trim()) {
      stored.attempts += 1;
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    contactOtpStore.delete(id);

    const updated = await prisma.customerEmergencyContact.update({
      where: { id },
      data: {
        isVerified: true,
        verificationStatus: 'VERIFIED',
      },
    });

    if (req.user?.userId) {
      emitToUser(req.user.userId, 'customer.emergency_contact.updated', {
        action: 'VERIFIED',
        contactId: id,
      });
    }

    res.json({
      message: 'Emergency contact successfully verified.',
      contact: {
        id: updated.id,
        isVerified: true,
        verificationStatus: 'VERIFIED',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
  }
}
