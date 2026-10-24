import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { prisma } from '../database/prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  customerProfileId?: string;
  workerProfileId?: string;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }

  req.user = payload;

  try {
    if (payload.role === 'CUSTOMER') {
      const customer = await prisma.customerProfile.findUnique({
        where: { userId: payload.userId },
      });
      if (customer) {
        req.customerProfileId = customer.id;
      }
    } else if (payload.role === 'WORKER') {
      const worker = await prisma.workerProfile.findUnique({
        where: { userId: payload.userId },
      });
      if (worker) {
        req.workerProfileId = worker.id;
      }
    }
  } catch (err) {
    console.error('Error fetching profile in auth middleware:', err);
  }

  next();
}

export function requireRole(...allowedRoles: ('CUSTOMER' | 'WORKER' | 'ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
