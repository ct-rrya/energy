/**
 * useRecentReading Hook
 * 
 * Custom hook for fetching the most recent energy reading.
 * Wraps getRecentReadings(1) from energy.service.
 * 
 * Features:
 * - Loads single most recent reading on mount
 * - Provides loading, error, and reading states
 * - Exposes refetch function for manual refresh
 * - Extracts first reading from array or returns null if empty
 * - Does not poll (real-time updates are Stage 4)
 */

import { useState, useEffect, useCallback } from 'react';
import { getRecentReadings } from '../api/services/energy.service';
import type { EnergyReading } from '../types';

interface UseRecentReadingReturn {
  reading: EnergyReading | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRecentReading(): UseRecentReadingReturn {
  const [reading, setReading] = useState<EnergyReading | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch most recent reading
   */
  const fetchReading = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const readings = await getRecentReadings(1);
      
      // Extract first reading or null if array is empty
      const latestReading = readings.length > 0 ? readings[0] : null;
      setReading(latestReading);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setIsError(true);
      setError(error);
      console.error('Failed to fetch recent reading:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load reading on mount
   */
  useEffect(() => {
    fetchReading();
  }, [fetchReading]);

  return {
    reading,
    isLoading,
    isError,
    error,
    refetch: fetchReading,
  };
}
