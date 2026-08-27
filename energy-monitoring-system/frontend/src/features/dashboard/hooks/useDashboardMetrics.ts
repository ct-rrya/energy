import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/api/services';
import type { DashboardMetrics } from '../types/dashboard.types';

/**
 * Custom hook to fetch dashboard metrics
 * Uses TanStack Query for caching and auto-refetch
 */
export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const response = await dashboardService.getMetrics();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Data is fresh for 20 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
