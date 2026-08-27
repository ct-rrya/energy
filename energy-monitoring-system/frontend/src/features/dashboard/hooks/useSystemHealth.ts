import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/api/services';
import type { SystemStatus, ConnectionStatus } from '../types/dashboard.types';

/**
 * Custom hook to check system health
 * Maps backend health response to SystemStatus
 */
export function useSystemHealth() {
  return useQuery<SystemStatus>({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      try {
        const response = await healthService.check();
        
        // Map backend health response to SystemStatus
        const status: ConnectionStatus = response.success ? 'connected' : 'error';
        
        // Check database status (backend returns database object with status property)
        const dbStatus: ConnectionStatus = 
          response.data?.database && 
          typeof response.data.database === 'object' && 
          'status' in response.data.database &&
          response.data.database.status === 'healthy' 
            ? 'connected' 
            : 'error';
        
        return {
          api: status,
          database: dbStatus,
          websocket: 'disconnected', // Will be updated by WebSocket context
          uptime: response.data?.uptime || 0,
        };
      } catch {
        // Return error state
        return {
          api: 'error',
          database: 'error',
          websocket: 'error',
          uptime: 0,
        };
      }
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Data is fresh for 30 seconds
    retry: 1,
  });
}
