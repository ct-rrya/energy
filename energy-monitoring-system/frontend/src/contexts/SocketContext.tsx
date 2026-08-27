import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ConnectionStatus, SensorReading } from '@/features/dashboard/types/dashboard.types';

/**
 * Socket Context State
 */
interface SocketContextState {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  lastReading: SensorReading | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Socket Context
 */
const SocketContext = createContext<SocketContextState | undefined>(undefined);

/**
 * Socket Provider Props
 */
interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Socket Provider Component
 * Manages WebSocket connection to backend for real-time updates
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastReading, setLastReading] = useState<SensorReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (socket?.connected) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    setConnectionStatus('connecting');
    setError(null);

    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err.message);
      setIsConnected(false);
      setConnectionStatus('error');
      setError(err.message);
    });

    // Dashboard events
    newSocket.on('dashboard:metrics', (data) => {
      console.log('📊 Dashboard metrics update:', data);
    });

    // Sensor reading events
    newSocket.on('sensor:reading', (data: SensorReading) => {
      console.log('📡 Sensor reading:', data);
      setLastReading(data);
    });

    // System status events
    newSocket.on('system:status', (data) => {
      console.log('🔧 System status update:', data);
    });

    setSocket(newSocket);
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [socket]);

  // Auto-connect on mount (optional - can be disabled)
  useEffect(() => {
    // Uncomment to enable auto-connection
    // connect();

    return () => {
      if (socket) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: SocketContextState = {
    socket,
    isConnected,
    connectionStatus,
    lastReading,
    error,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

/**
 * Custom hook to use Socket Context
 */
export function useSocket(): SocketContextState {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
