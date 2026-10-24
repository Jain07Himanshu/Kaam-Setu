import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../database/prisma.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  customerProfileId?: string;
  workerProfileId?: string;
}

let io: Server | null = null;

export function initializeSockets(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows local customer (5173), worker (5174), or network IP
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Authentication Middleware for Sockets
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (socket.handshake.query?.token as string);

      if (!token) {
        // Allow unauthenticated connection for public broadcasts or guest views,
        // but mark as unauthenticated
        return next();
      }

      const payload = verifyToken(token);
      if (payload) {
        socket.userId = payload.userId;
        socket.role = payload.role;

        if (payload.role === 'CUSTOMER') {
          const customer = await prisma.customerProfile.findUnique({
            where: { userId: payload.userId },
          });
          if (customer) socket.customerProfileId = customer.id;
        } else if (payload.role === 'WORKER') {
          const worker = await prisma.workerProfile.findUnique({
            where: { userId: payload.userId },
          });
          if (worker) socket.workerProfileId = worker.id;
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`[Socket] Client connected: ${socket.id} (user: ${socket.userId || 'guest'}, role: ${socket.role || 'none'})`);

    // Auto-join private rooms
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
    if (socket.role) {
      socket.join(`role:${socket.role}`);
    }
    if (socket.customerProfileId) {
      socket.join(`customer:${socket.customerProfileId}`);
    }
    if (socket.workerProfileId) {
      socket.join(`worker:${socket.workerProfileId}`);
    }

    // Room subscription for a specific Job Request
    socket.on('join:job', async (jobId: string) => {
      if (!jobId) return;
      socket.join(`job:${jobId}`);
      console.log(`[Socket] ${socket.id} joined job room: job:${jobId}`);
    });

    socket.on('leave:job', (jobId: string) => {
      if (!jobId) return;
      socket.leave(`job:${jobId}`);
    });

    // Room subscription for a specific Booking
    socket.on('join:booking', async (bookingId: string) => {
      if (!bookingId) return;
      socket.join(`booking:${bookingId}`);
      console.log(`[Socket] ${socket.id} joined booking room: booking:${bookingId}`);
    });

    socket.on('leave:booking', (bookingId: string) => {
      if (!bookingId) return;
      socket.leave(`booking:${bookingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

// Durable real-time helpers
export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToWorker(workerId: string, event: string, data: any) {
  if (io) {
    io.to(`worker:${workerId}`).emit(event, data);
  }
}

export function emitToCustomer(customerId: string, event: string, data: any) {
  if (io) {
    io.to(`customer:${customerId}`).emit(event, data);
  }
}

export function emitToJob(jobId: string, event: string, data: any) {
  if (io) {
    io.to(`job:${jobId}`).emit(event, data);
  }
}

export function emitToBooking(bookingId: string, event: string, data: any) {
  if (io) {
    io.to(`booking:${bookingId}`).emit(event, data);
  }
}

export function emitToRole(role: 'CUSTOMER' | 'WORKER' | 'ADMIN', event: string, data: any) {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
}
