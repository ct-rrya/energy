import { useQuery } from '@tanstack/react-query';
import { alertsService } from '@/api/services';
import type { AlertQueryParams } from '@/types/alert.types';

/**
 * Use Alerts Hook
 * 
 * Fetches alerts with filters and pagination using TanStack Query.
 * 
 * @param params - Query parameters
 * @returns Query result with alerts data
 */
export function useAlerts(params?: AlertQueryParams) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsService.getAlerts(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
}
