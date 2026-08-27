import { useQuery } from '@tanstack/react-query';
import { alertsService } from '@/api/services';

/**
 * Use Alert Stats Hook
 * 
 * Fetches alert statistics using TanStack Query.
 * 
 * @returns Query result with alert statistics
 */
export function useAlertStats() {
  return useQuery({
    queryKey: ['alerts', 'stats'],
    queryFn: () => alertsService.getAlertStats(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
}
