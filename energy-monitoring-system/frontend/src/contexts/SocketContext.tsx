import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
    // Only connect if authenticated
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get JWT token for authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('[Socket] No auth token available');
      return;
    }

    // Get socket URL from environment
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

    console.log('[Socket] Connecting to:', socketUrl);

    // Create socket connection with authentication
    const newSocket = io(socketUrl, {
      path: '/socket.io',
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
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
