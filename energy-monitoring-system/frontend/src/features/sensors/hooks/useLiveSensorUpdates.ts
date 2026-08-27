import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';
import type { SensorReading } from '../types/sensor.types';

/**
 * Custom hook for live sensor data updates via WebSocket
 * 
 * Subscribes to WebSocket 'reading:new' events and updates
 * TanStack Query cache automatically.
 * 
 * @param onNewReading - Optional callback for new readings
 */
export function useLiveSensorUpdates(
  onNewReading?: (reading: SensorReading) => void
) {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe to new reading events
    const handleNewReading = (data: any) => {
      console.log('📡 New sensor reading received:', data);

      // Invalidate latest readings query to trigger refetch
      queryClient.invalidateQueries({ 
        queryKey: ['sensors', 'readings', 'latest'] 
      });

      // Invalidate specific sensor reading query
      if (data.sensorId) {
        queryClient.invalidateQueries({ 
          queryKey: ['sensor', 'reading', data.sensorId] 
        });
      }

      // Call optional callback
      if (onNewReading) {
        onNewReading(data);
      }
    };

    // Subscribe to WebSocket event
    socket.on('reading:new', handleNewReading);

    // Cleanup on unmount
    return () => {
      socket.off('reading:new', handleNewReading);
    };
  }, [socket, isConnected, queryClient, onNewReading]);

  return { isConnected };
}
