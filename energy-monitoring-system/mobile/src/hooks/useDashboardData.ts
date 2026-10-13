/**
 * useDashboardData Hook
 * 
 * Custom hook for fetching dashboard metrics.
 * Wraps getDashboardMetrics() from dashboard.service.
 * 
 * Features:
 * - Loads data on mount
 * - Provides loading, error, and data states
 * - Exposes refetch function for manual refresh
 * - Does not poll (real-time updates are Stage 4)
 */

import { useState, useEffect, useCallback } from 'react';
import { getDashboardMetrics } from '../api/services/dashboard.service';
import type { DashboardMetrics } from '../types';

interface UseDashboardDataReturn {
  data: DashboardMetrics | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch dashboard metrics
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const metrics = await getDashboardMetrics();
      setData(metrics);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setIsError(true);
      setError(error);
      console.error('Failed to fetch dashboard metrics:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load data on mount
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchData,
  };
}
