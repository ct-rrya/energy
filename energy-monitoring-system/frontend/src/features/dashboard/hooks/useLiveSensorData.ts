import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useSocket } from '@/contexts/SocketContext';
import type { SensorReading } from '../types/dashboard.types';

/**
 * Custom hook for live sensor data
 * 
 * Uses WebSocket for INSTANT real-time updates when ESP32 sends data.
 * Falls back to REST API polling if WebSocket unavailable.
 * 
 * Updates:
 * - WebSocket: Instant (< 100ms)
 * - Fallback: Every 10 seconds
 */
export function useLiveSensorData() {
  const { socket, isConnected: isSocketConnected } = useSocket();
  const [lastReading, setLastReading] = useState<SensorReading | undefined>(undefined);

  // Fetch initial/fallback data from REST API
  const { data: apiData } = useQuery<SensorReading | undefined>({
    queryKey: ['sensor', 'latest'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any[]>('/energy/recent', {
          params: { limit: 1 }
        });
        
        const readings = response.data;
        if (!readings || readings.length === 0) {
          return undefined;
        }

        const latestReading = readings[0];
        return {
          voltage: latestReading.voltage || 0,
          current: latestReading.current || 0,
          power: latestReading.power || 0,
          stepCount: latestReading.stepCount || 0,
          timestamp: new Date(latestReading.timestamp),
        } as SensorReading;
      } catch (error) {
        console.warn('[useLiveSensorData] Failed to fetch latest reading:', error);
        return undefined;
      }
    },
    refetchInterval: isSocketConnected ? false : 10000, // Only poll if WebSocket disconnected
    staleTime: 5000,
    retry: 2,
  });

  // Set initial reading from API
  useEffect(() => {
    if (apiData && !lastReading) {
      setLastReading(apiData);
    }
  }, [apiData]);

  // Subscribe to WebSocket events for INSTANT updates
  useEffect(() => {
    if (!socket) return;

    console.log('[useLiveSensorData] Subscribing to WebSocket events');

    // Listen for new sensor readings (sent when ESP32 uploads)
    const handleNewReading = (data: any) => {
      console.log('[useLiveSensorData] New reading from WebSocket:', data);
      
      setLastReading({
        voltage: data.voltage || 0,
        current: data.current || 0,
        power: data.power || 0,
        stepCount: data.stepCount || 0,
        timestamp: new Date(data.timestamp),
      });
    };

    socket.on('reading:new', handleNewReading);

    // Cleanup
    return () => {
      socket.off('reading:new', handleNewReading);
    };
  }, [socket]);

  return {
    lastReading,
    isConnected: isSocketConnected,
  };
}
