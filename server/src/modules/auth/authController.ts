import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { generateToken } from '../../utils/jwt.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'WORKER', 'ADMIN']).default('CUSTOMER'),
  phone: z.string().optional(),
  // Worker-specific optional fields
  serviceCategoryId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  serviceRadiusKm: z.number().optional().default(15),
  hourlyRate: z.number().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        passwordHash,
        status: 'ACTIVE',
      },
    });

    let customerProfile = null;
    let workerProfile = null;

    if (data.role === 'CUSTOMER') {
      customerProfile = await prisma.customerProfile.create({
        data: {
          userId: user.id,
        },
      });

      // Create a default service location
      await prisma.serviceLocation.create({
        data: {
          userId: user.id,
          label: 'Home',
          address: '742 Evergreen Terrace',
          city: 'Metro City',
          postalCode: '10001',
          latitude: 40.7128,
          longitude: -74.006,
          isDefault: true,
        },
      });
    } else if (data.role === 'WORKER') {
      workerProfile = await prisma.workerProfile.create({
        data: {
          userId: user.id,
          skills: JSON.stringify(data.skills || ['General Maintenance']),
          serviceRadiusKm: data.serviceRadiusKm,
          hourlyRate: data.hourlyRate || 45,
          isAvailable: true,
          onboardingStatus: 'COMPLETED',
        },
      });

      // Add default verification badges
      await prisma.workerVerification.createMany({
        data: [
          { workerId: workerProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
          { workerId: workerProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'Government ID Verified' },
          { workerId: workerProfile.id, type: 'SKILL_CERT', status: 'VERIFIED', notes: 'Trades skill certified' },
        ],
      });

      // Link service category if provided
      if (data.serviceCategoryId) {
        await prisma.workerService.create({
          data: {
            workerId: workerProfile.id,
            serviceCategoryId: data.serviceCategoryId,
            experienceYears: 4,
          },
        });
      }

      // Worker default location
      await prisma.serviceLocation.create({
        data: {
          userId: user.id,
          label: 'Service Base',
          address: '100 Service Blvd',
          city: 'Metro City',
          postalCode: '10001',
          latitude: 40.7135,
          longitude: -74.0055,
          isDefault: true,
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role as any,
      email: user.email,
    });

    return res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        customerProfileId: customerProfile?.id,
        workerProfileId: workerProfile?.id,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        workerProfile: {
          include: { verifications: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role as any,
      email: user.email,
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        customerProfile: user.customerProfile,
        workerProfile: user.workerProfile,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        customerProfile: true,
        workerProfile: {
          include: {
            verifications: true,
            workerServices: {
              include: { serviceCategory: true },
            },
          },
        },
        serviceLocations: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Failed to retrieve current user' });
  }
}

// Demo quick sign-in switcher for hackathon judges & instant testing
export async function demoLogin(req: Request, res: Response) {
  try {
    const { role, identifier } = req.body; // e.g. role: 'CUSTOMER' or 'WORKER'

    let targetEmail: string;

    if (identifier) {
      targetEmail = identifier;
    } else if (role === 'WORKER') {
      targetEmail = 'suresh.plumber@hyperlocal.demo';
    } else {
      targetEmail = 'alex.customer@hyperlocal.demo';
    }

    const user = await prisma.user.findFirst({
      where: { email: targetEmail },
      include: {
        customerProfile: true,
        workerProfile: {
          include: {
            verifications: true,
            workerServices: { include: { serviceCategory: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: `Demo user ${targetEmail} not found. Please ensure seed script has run.`,
      });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role as any,
      email: user.email,
    });

    return res.json({
      message: `Demo sign-in successful as ${user.name} (${user.role})`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        customerProfile: user.customerProfile,
        workerProfile: user.workerProfile,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Demo login failed' });
  }
}
