import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useSocket } from '@/contexts/SocketContext';
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
  const [lastReading, setLastReading] = useState<SensorReading | undefined>(undefined);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

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
        return undefined;
      }
    },
    refetchInterval: (isFirebaseConnected || isSocketConnected) ? false : 10000, // Only poll if both Firebase + Socket.IO down
    staleTime: 5000,
    retry: 2,
  });

  // Set initial reading from API
  useEffect(() => {
    if (apiData && !lastReading) {
      setLastReading(apiData);
    }
  }, [apiData]);

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
          setIsFirebaseConnected(true);
        }
      },
      (error) => {
        console.error('[useLiveSensorData] Firestore listener error:', error);
        setIsFirebaseConnected(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []); // Empty deps — attach once on mount

  // FALLBACK: Subscribe to WebSocket events if Firebase unavailable
  useEffect(() => {
    if (!socket) return;

    console.log('[useLiveSensorData] Subscribing to WebSocket events');

    // Listen for new sensor readings (sent when ESP32 uploads)
    const handleNewReading = (data: any) => {
      // Only use Socket.IO if Firebase is disconnected
      if (!isFirebaseConnected) {
        console.log('[useLiveSensorData] New reading from WebSocket (Firebase unavailable)');
        
        setLastReading({
          sensorId: data.sensorId || '',
          voltage: data.voltage || 0,
          current: data.current || 0,
          power: data.power || 0,
          energy: data.energy || 0,
          stepCount: data.stepCount || 0,
          timestamp: new Date(data.timestamp).toISOString(),
        });
      } else {
        console.log('[useLiveSensorData] Ignoring WebSocket (Firebase active)');
      }
    };

    socket.on('reading:new', handleNewReading);

    // Cleanup
    return () => {
      socket.off('reading:new', handleNewReading);
    };
  }, [socket, isFirebaseConnected]); // Re-subscribe when Firebase state changes

  return {
    lastReading,
    isConnected: isFirebaseConnected || isSocketConnected, // Connected if either Firebase or Socket.IO active
  };
}
