import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';
import { showToast } from '@/components/common/Toast';
import type { Alert } from '@/types/alert.types';

/**
 * Use Live Alerts Hook
 * 
 * Listens to WebSocket events for real-time alert updates.
 * 
 * Events:
 * - alert:created - New alert created
 * - alert:acknowledged - Alert acknowledged
 * - alert:resolved - Alert resolved
 * 
 * @returns WebSocket connection status
 */
export function useLiveAlerts() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle new alert
    const handleAlertCreated = (alert: Alert) => {
      console.log('🔔 New alert received:', alert);
      
      // Invalidate alerts queries to refetch
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      
      // Show toast notification for critical alerts
      if (alert.severity === 'critical') {
        showToast(`Critical Alert: ${alert.title}`, 'error');
      }
    };

    // Handle alert acknowledged
    const handleAlertAcknowledged = (alert: Alert) => {
      console.log('✅ Alert acknowledged:', alert.id);
      
      // Invalidate alerts queries to refetch
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    };

    // Handle alert resolved
    const handleAlertResolved = (alert: Alert) => {
      console.log('✅ Alert resolved:', alert.id);
      
      // Invalidate alerts queries to refetch
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    };

    // Subscribe to events
    socket.on('alert:created', handleAlertCreated);
    socket.on('alert:acknowledged', handleAlertAcknowledged);
    socket.on('alert:resolved', handleAlertResolved);

    // Cleanup
    return () => {
      socket.off('alert:created', handleAlertCreated);
      socket.off('alert:acknowledged', handleAlertAcknowledged);
      socket.off('alert:resolved', handleAlertResolved);
    };
  }, [socket, isConnected, queryClient]);

  return { isConnected };
}
