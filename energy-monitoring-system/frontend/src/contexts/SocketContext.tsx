import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Socket Provider
 * 
 * Manages WebSocket connection to the backend dashboard gateway.
 * Provides real-time updates for sensor readings and system events.
 * 
 * Connection:
 * - URL: ws://localhost:3000 (from VITE_SOCKET_URL)
 * - Namespace: /dashboard
 * - Auth: JWT token from localStorage
 * 
 * Events Received:
 * - reading:new - New sensor reading
 * - statistics:update - System statistics update
 * - sensor:online - Sensor came online
 * - sensor:offline - Sensor went offline
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Get JWT token if authenticated; otherwise connect as public read-only viewer
    const token = isAuthenticated ? localStorage.getItem('auth_token') : null;

    // Resolve socket URL: prefer explicit VITE_SOCKET_URL, else derive origin from VITE_API_BASE_URL
    const resolveSocketUrl = (): string => {
      const explicitUrl = import.meta.env.VITE_SOCKET_URL?.trim();
      if (explicitUrl) {
        return explicitUrl;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
      if (apiBaseUrl && /^https?:\/\//i.test(apiBaseUrl)) {
        try {
          return new URL(apiBaseUrl).origin;
        } catch {
          // Fall through to default
        }
      }

      if (typeof window !== 'undefined' && !import.meta.env.DEV) {
        return window.location.origin;
      }

      return 'http://localhost:3000';
    };

    const socketUrl = resolveSocketUrl();

    console.log('[Socket] Connecting to:', socketUrl);

    // Create socket connection (authenticated admin or public viewer)
    const newSocket = io(socketUrl, {
      path: '/socket.io',
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    });

    // Connection established
    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    // Disconnected
    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    // Unauthorized (invalid token)
    newSocket.on('unauthorized', (error) => {
      console.error('[Socket] Unauthorized:', error);
      newSocket.disconnect();
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('[Socket] Cleaning up connection');
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
