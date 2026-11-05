import crypto from 'crypto';
import { config } from '../config/index.js';

const SECRET_KEY = config.jwtSecret || 'kaam_setu_secure_key_2026';

/**
 * Normalizes Indian mobile numbers into the canonical format: +91XXXXXXXXXX
 * Accepts: "+91 98201 12345", "9820112345", "09820112345", "+91-98201-12345"
 */
export function normalizeIndianPhone(input: string): string {
  if (!input) return '';
  // Strip non-digit characters except leading +
  let cleaned = input.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Validate 10-digit Indian mobile format (starts with 6, 7, 8, or 9)
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    throw new Error('Invalid Indian mobile number. Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
  }

  return `+91${cleaned}`;
}

/**
 * Masks a phone number for safe non-public or partial display
 * e.g., "+919820112345" -> "+91 98201 •••••"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length >= 10) {
    const visibleStart = digits.slice(-10, -5);
    return `+91 ${visibleStart} •••••`;
  }
  return '••••••••••';
}

/**
 * Masks an Aadhaar, Passport, or government identity number
 * e.g., "123456789012" -> "••••-••••-9012"
 */
export function maskIdentity(identifier: string): string {
  if (!identifier) return '';
  const cleaned = identifier.trim().replace(/[\s-]/g, '');
  if (cleaned.length >= 4) {
    const last4 = cleaned.slice(-4);
    return `••••-••••-${last4}`;
  }
  return '••••-••••-••••';
}

/**
 * Generates an HMAC SHA-256 keyed lookup hash for privacy-preserving equality matching
 */
export function createLookupHash(value: string): string {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  return crypto.createHmac('sha256', SECRET_KEY).update(normalized).digest('hex');
}

/**
 * Normalizes email address (trims, lowercases, canonicalizes)
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP
 */
export function generateOtp(): string {
  const randomBuffer = crypto.randomBytes(4);
  const num = randomBuffer.readUInt32BE(0) % 900000 + 100000;
  return num.toString();
}
