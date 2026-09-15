import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';
import type { SensorReading } from '@/features/dashboard/types/dashboard.types';

/**
 * Hook to subscribe to WebSocket events and update chart data in real-time
 * 
 * Listens for 'sensor:reading' events from the WebSocket connection and
 * invalidates relevant TanStack Query cache entries to trigger automatic
 * refetch of chart data. This provides near-real-time updates for all charts.
 * 
 * Implements throttling to prevent excessive invalidations (max once every 5 seconds)
 * to optimize performance during high-frequency sensor updates.
 * 
 * Uses the existing SocketContext and invalidates cache keys for all metrics
 * (power, voltage, current, energy) to ensure charts stay up-to-date with
 * latest sensor readings.
 * 
 * @example
 * ```tsx
 * function ChartsLayoutContainer() {
 *   // Subscribe to real-time updates for all charts
 *   useChartRealTimeUpdates();
 *   
 *   return (
 *     <div>
 *       <PowerGenerationChart />
 *       <VoltageCurrentChart />
 *       <EnergyPeriodChart />
 *       <CumulativeEnergyChart />
 *     </div>
 *   );
 * }
 * ```
 */
export function useChartRealTimeUpdates(): void {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  
  // Track last invalidation timestamp for throttling (Requirement 9.3, 9.4)
  // Prevents invalidation more than once every 5 seconds to optimize performance
  const lastInvalidationRef = useRef<number>(0);
  const THROTTLE_INTERVAL = 5000; // 5 seconds in milliseconds

  useEffect(() => {
    // Only subscribe if socket is available and connected
    if (!socket || !isConnected) return;

    /**
     * Handle incoming sensor reading events
     * Invalidates all time-series queries to trigger refetch with throttling
     */
    const handleSensorReading = (reading: SensorReading) => {
      const now = Date.now();
      const timeSinceLastInvalidation = now - lastInvalidationRef.current;
      
      // Throttle invalidations to once every 5 seconds
      if (timeSinceLastInvalidation < THROTTLE_INTERVAL) {
        console.log(`📊 Chart update throttled (${(THROTTLE_INTERVAL - timeSinceLastInvalidation) / 1000}s remaining)`);
        return;
      }
      
      console.log('📊 Chart update triggered by sensor reading:', reading.sensorId);
      
      // Update last invalidation timestamp
      lastInvalidationRef.current = now;

      // Invalidate all time-series cache entries for all metrics
      // This ensures all charts refetch their data with the latest readings
      queryClient.invalidateQueries({ queryKey: ['analytics', 'time-series', 'power'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'time-series', 'voltage'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'time-series', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'time-series', 'energy'] });
    };

    // Subscribe to sensor reading events
    socket.on('sensor:reading', handleSensorReading);

    // Cleanup: unsubscribe on unmount or when dependencies change
    return () => {
      socket.off('sensor:reading', handleSensorReading);
    };
  }, [socket, isConnected, queryClient]);
}
