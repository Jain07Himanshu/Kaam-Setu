import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinJobRoom: (jobId: string) => void;
  leaveJobRoom: (jobId: string) => void;
  joinBookingRoom: (bookingId: string) => void;
  leaveBookingRoom: (bookingId: string) => void;
  lastEvent: { type: string; payload: any } | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:5000');

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.IO Connected successfully. ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket.IO Disconnected');
      setIsConnected(false);
    });

    // Real-time listeners
    const eventNames = [
      'quote.created',
      'quote.counteroffered',
      'quote.accepted',
      'quote.rejected',
      'booking.confirmed',
      'booking.status.updated',
      'booking.cancelled',
      'notification.created',
      'review.received',
    ];

    eventNames.forEach((eventName) => {
      newSocket.on(eventName, (payload: any) => {
        console.log(`[Customer Socket Event] ${eventName}:`, payload);
        setLastEvent({ type: eventName, payload });
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  const joinJobRoom = (jobId: string) => {
    if (socket && jobId) {
      socket.emit('join:job', jobId);
    }
  };

  const leaveJobRoom = (jobId: string) => {
    if (socket && jobId) {
      socket.emit('leave:job', jobId);
    }
  };

  const joinBookingRoom = (bookingId: string) => {
    if (socket && bookingId) {
      socket.emit('join:booking', bookingId);
    }
  };

  const leaveBookingRoom = (bookingId: string) => {
    if (socket && bookingId) {
      socket.emit('leave:booking', bookingId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinJobRoom,
        leaveJobRoom,
        joinBookingRoom,
        leaveBookingRoom,
        lastEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
