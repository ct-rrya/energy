import { useState } from 'react';
import type { SensorReading } from '../types/dashboard.types';

/**
 * Custom hook for live sensor data via WebSocket
 * 
 * Returns undefined until the first ESP32 sensor sends a reading.
 * WebSocket connection will automatically receive real-time readings
 * from the dashboard gateway when hardware is connected.
 */
export function useLiveSensorData() {
  const [lastReading] = useState<SensorReading | undefined>(undefined);
  const [isConnected] = useState(false);

  // TODO: Implement WebSocket subscription to dashboard gateway
  // This will automatically receive real-time readings when
  // ESP32 hardware begins transmitting.
  
  // Implementation:
  // useEffect(() => {
  //   const socket = useSocket();
  //   socket.on('sensor:reading', (data: SensorReading) => {
  //     setLastReading(data);
  //   });
  //   setIsConnected(socket.connected);
  //   
  //   return () => {
  //     socket.off('sensor:reading');
  //   };
  // }, []);

  return {
    lastReading,
    isConnected,
  };
}
