import { useState, useCallback } from 'react';
import type { DateRange, DateRangePreset } from '../types';

/**
 * Use Date Range Hook
 * 
 * Manages date range state with preset support.
 * 
 * @returns Date range state and setter
 */
export function useDateRange() {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    // Default to last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    return {
      start,
      end,
      preset: 'last7days',
    };
  });

  /**
   * Set date range by preset
   */
  const setPreset = useCallback((preset: DateRangePreset) => {
    const end = new Date();
    let start = new Date();

    switch (preset) {
      case 'today':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;

      case 'yesterday':
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;

      case 'last7days':
        start.setDate(end.getDate() - 7);
        break;

      case 'last30days':
        start.setDate(end.getDate() - 30);
        break;

      case 'thisWeek':
        // Start of week (Monday)
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        break;

      case 'thisMonth':
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;

      case 'custom':
        // Don't change dates for custom
        return;
    }

    setDateRange({ start, end, preset });
  }, []);

  /**
   * Set custom date range
   */
  const setCustomRange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end, preset: 'custom' });
  }, []);

  return {
    dateRange,
    setPreset,
    setCustomRange,
    setDateRange,
  };
}
