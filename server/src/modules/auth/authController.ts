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
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Worker-specific optional fields
  serviceCategoryId: z.string().optional(),
  experienceYears: z.number().optional().default(3),
  skills: z.array(z.string()).optional(),
  serviceRadiusKm: z.number().optional().default(15),
  hourlyRate: z.number().optional().default(399),
  baseRate: z.number().optional().default(249),
  bio: z.string().optional(),
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

    const defaultAvatar = data.role === 'CUSTOMER' ? '/avatars/aarav.svg' : '/avatars/suresh.svg';

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        avatarUrl: defaultAvatar,
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
          address: data.address || 'B-402, Hiranandani Gardens, Powai',
          city: data.city || 'Mumbai',
          postalCode: data.postalCode || '400076',
          latitude: data.latitude || 19.1176,
          longitude: data.longitude || 72.9060,
          isDefault: true,
        },
      });
    } else if (data.role === 'WORKER') {
      workerProfile = await prisma.workerProfile.create({
        data: {
          userId: user.id,
          skills: JSON.stringify(data.skills || ['General Maintenance']),
          serviceRadiusKm: data.serviceRadiusKm,
          hourlyRate: data.hourlyRate || 399,
          baseRate: data.baseRate || 249,
          bio: data.bio || `Verified professional with ${data.experienceYears || 3} years of hands-on field experience. Equipped with high-grade tools and parts.`,
          isAvailable: true,
          onboardingStatus: 'COMPLETED',
        },
      });

      // Add default verification badges
      await prisma.workerVerification.createMany({
        data: [
          { workerId: workerProfile.id, type: 'PHONE', status: 'VERIFIED', notes: 'Phone verified' },
          { workerId: workerProfile.id, type: 'ID_DOCUMENT', status: 'VERIFIED', notes: 'Government ID Verified' },
          { workerId: workerProfile.id, type: 'SKILL_CERT', status: 'VERIFIED', notes: 'Trade skill certified' },
        ],
      });

      // Link service category if provided (accepts either category ID or slug)
      if (data.serviceCategoryId) {
        const cat = await prisma.serviceCategory.findFirst({
          where: {
            OR: [
              { id: data.serviceCategoryId },
              { slug: data.serviceCategoryId.toLowerCase() },
            ],
          },
        });

        if (cat) {
          await prisma.workerService.create({
            data: {
              workerId: workerProfile.id,
              serviceCategoryId: cat.id,
              experienceYears: data.experienceYears || 3,
            },
          });
        }
      }

      // Worker default location
      await prisma.serviceLocation.create({
        data: {
          userId: user.id,
          label: 'Service Base',
          address: data.address || 'Powai Service Hub',
          city: data.city || 'Mumbai',
          postalCode: data.postalCode || '400076',
          latitude: data.latitude || 19.1176,
          longitude: data.longitude || 72.9060,
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

    const emailMap: Record<string, string> = {
      'alex.customer@hyperlocal.demo': 'aarav.customer@kaamsetu.demo',
      'sarah.customer@hyperlocal.demo': 'pooja.customer@kaamsetu.demo',
      'suresh.plumber@hyperlocal.demo': 'suresh.plumber@kaamsetu.demo',
      'priya.electric@hyperlocal.demo': 'priya.electric@kaamsetu.demo',
      'rajesh.cleaning@hyperlocal.demo': 'rajesh.cleaning@kaamsetu.demo',
      'anita.appliances@hyperlocal.demo': 'anita.appliances@kaamsetu.demo',
    };

    let targetEmail: string;

    if (identifier) {
      targetEmail = emailMap[identifier] || identifier;
    } else if (role === 'WORKER') {
      targetEmail = 'suresh.plumber@kaamsetu.demo';
    } else {
      targetEmail = 'aarav.customer@kaamsetu.demo';
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
