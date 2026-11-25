import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useSocket } from '@/contexts/SocketContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { SensorReading } from '../types/dashboard.types';

/**
 * Custom hook for live sensor data
 * 
 * Data source priority:
 * 1. Firebase Firestore (PRIMARY): Real-time listener on liveReadings/latest
 * 2. Socket.IO WebSocket (FALLBACK): Instant updates if Firebase unavailable
 * 3. REST API Polling (FALLBACK): Every 10 seconds if both Firebase + Socket.IO down
 * 
 * Stale Data Detection:
 * - Firebase connected: isFirebaseConnected = true
 * - Firebase disconnected: isFirebaseConnected = false (use Socket.IO or REST)
 * - No updates for >30s: Data considered stale (timestamp check in parent component)
 * 
 * Updates:
 * - Firebase: Instant (< 100ms)
 * - WebSocket: Instant (< 100ms)
 * - REST Fallback: Every 10 seconds
 */
export function useLiveSensorData() {
  const { socket, isConnected: isSocketConnected } = useSocket();
  const { lastReading: globalLastReading } = useHardwareStatus();
  const queryClient = useQueryClient();
  const initialSnapshotHandledRef = useRef(false);
  const [lastReading, setLastReading] = useState<SensorReading | undefined>(undefined);
  const [hasLiveFirebasePush, setHasLiveFirebasePush] = useState(false);

  // Fetch initial/fallback data from REST API (keep lightweight 8s safety poll unless live push is active)
  const { data: apiData } = useQuery<SensorReading | null>({
    queryKey: ['sensor', 'latest'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any[]>('/energy/recent', {
          params: { limit: 1 }
        });
        
        const readings = response.data;
        if (!readings || readings.length === 0) {
          return null;
        }

        const latestReading = readings[0];
        return {
          sensorId: latestReading.sensorId || '',
          voltage: latestReading.voltage || 0,
          current: latestReading.current || 0,
          power: latestReading.power || 0,
          energy: latestReading.energy || 0,
          stepCount: latestReading.stepCount || 0,
          timestamp: new Date(latestReading.timestamp).toISOString(),
        };
      } catch (error) {
        console.warn('[useLiveSensorData] Failed to fetch latest reading:', error);
        return null;
      }
    },
    refetchInterval: (hasLiveFirebasePush || isSocketConnected) ? false : 8000,
    staleTime: 5000,
    retry: 2,
  });

  // Mirror newer global readings discovered by HardwareStatusContext (Socket.IO, Firestore, BLE, or safety poll)
  useEffect(() => {
    if (!globalLastReading) return;
    setLastReading((prev) => {
      if (!prev) return globalLastReading;
      const prevMs = new Date(prev.timestamp).getTime();
      const nextMs = new Date(globalLastReading.timestamp).getTime();
      if (!Number.isFinite(prevMs) || (Number.isFinite(nextMs) && nextMs >= prevMs)) {
        return globalLastReading;
      }
      return prev;
    });
  }, [globalLastReading]);

  // Sync initial and polled REST API readings whenever a newer reading arrives
  useEffect(() => {
    if (!apiData) return;

    setLastReading((prev) => {
      if (!prev) {
        return apiData;
      }

      const prevMs = new Date(prev.timestamp).getTime();
      const nextMs = new Date(apiData.timestamp).getTime();
      if (!Number.isFinite(prevMs) || (Number.isFinite(nextMs) && nextMs > prevMs)) {
        void queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
        void queryClient.invalidateQueries({ queryKey: ['milestones'] });
        return apiData;
      }

      return prev;
    });
  }, [apiData, queryClient]);

  // PRIMARY: Subscribe to Firebase Firestore for real-time updates
  useEffect(() => {
    console.log('[useLiveSensorData] Subscribing to Firebase Firestore');
    
    const unsubscribe = onSnapshot(
      doc(db, 'liveReadings', 'latest'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('[useLiveSensorData] New reading from Firebase:', data);
          
          setLastReading({
            sensorId: data.sensorId || '',
            voltage: data.voltage || 0,
            current: data.current || 0,
            power: data.power || 0,
            energy: data.energy || 0,
            stepCount: data.stepCount || 0,
            timestamp: data.timestamp, // Already ISO string from backend
          });

          if (initialSnapshotHandledRef.current) {
            setHasLiveFirebasePush(true);
            void queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
            void queryClient.invalidateQueries({ queryKey: ['milestones'] });
          } else {
            initialSnapshotHandledRef.current = true;
          }
        }
      },
      (error) => {
        console.error('[useLiveSensorData] Firestore listener error:', error);
        setHasLiveFirebasePush(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [queryClient]);

  // Subscribe to WebSocket events alongside Firestore so whichever arrives first updates the UI
  useEffect(() => {
    if (!socket) return;

    console.log('[useLiveSensorData] Subscribing to WebSocket events');

    // Listen for new sensor readings (sent when ESP32 uploads)
    const handleNewReading = (data: any) => {
      console.log('[useLiveSensorData] New reading from WebSocket:', data);

      setLastReading({
        sensorId: data.sensorId || '',
        voltage: data.voltage || 0,
        current: data.current || 0,
        power: data.power || 0,
        energy: data.energy || 0,
        stepCount: data.stepCount || 0,
        timestamp: data.timestamp
          ? new Date(data.timestamp).toISOString()
          : new Date().toISOString(),
      });

      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      void queryClient.invalidateQueries({ queryKey: ['milestones'] });
    };

    socket.on('reading:new', handleNewReading);

    // Cleanup
    return () => {
      socket.off('reading:new', handleNewReading);
    };
  }, [socket, queryClient]);

  return {
    lastReading,
    isConnected: hasLiveFirebasePush || isSocketConnected,
  };
}
