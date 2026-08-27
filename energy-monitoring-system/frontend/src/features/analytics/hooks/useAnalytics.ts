import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/api/services';
import type { DashboardAnalytics } from '../types';

/**
 * Use Analytics Hook
 * 
 * Fetches dashboard analytics data.
 * Optimized single query for all dashboard metrics.
 * 
 * @returns Dashboard analytics query
 */
export function useAnalytics() {
  return useQuery<DashboardAnalytics>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsService.getDashboardAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes (slow-changing data)
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}
