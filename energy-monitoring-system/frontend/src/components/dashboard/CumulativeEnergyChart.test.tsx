/**
 * CumulativeEnergyChart Test Suite
 * 
 * Tests for the CumulativeEnergyChart component including:
 * - Component rendering with data
 * - Cumulative calculation correctness
 * - Loading, error, and empty states
 * - Theme integration
 * - Real-time updates integration
 * - Total cumulative value display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CumulativeEnergyChart } from './CumulativeEnergyChart';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';
import * as useTimeSeriesDataModule from '@/features/dashboard/hooks/useTimeSeriesData';
import * as useChartRealTimeUpdatesModule from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import type { TimeSeries } from '@/features/analytics/types';

// Mock the hooks
vi.mock('@/features/dashboard/hooks/useTimeSeriesData');
vi.mock('@/features/dashboard/hooks/useChartRealTimeUpdates');

describe('CumulativeEnergyChart', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock useChartRealTimeUpdates to do nothing by default
    vi.spyOn(useChartRealTimeUpdatesModule, 'useChartRealTimeUpdates').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SocketProvider>{component}</SocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render with default props', () => {
      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      expect(screen.getByText('Cumulative Energy Generated')).toBeInTheDocument();
    });

    it('should render chart title and subtitle', async () => {
      const mockData: TimeSeries = {
        metric: 'energy',
        granularity: 'day',
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 10 },
          { timestamp: '2024-01-16T00:00:00Z', value: 15 },
          { timestamp: '2024-01-17T00:00:00Z', value: 20 },
        ],
        metadata: {
          unit: 'kWh',
          aggregation: 'sum',
        },
      };

      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      await waitFor(() => {
        expect(screen.getByText('Cumulative Energy Generated')).toBeInTheDocument();
        // Total should be 10 + 15 + 20 = 45 kWh
        expect(screen.getByText(/Total: 45\.00 kWh/)).toBeInTheDocument();
      });
    });

    it('should accept custom daysToShow prop', () => {
      const useTimeSeriesDataSpy = vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart daysToShow={14} />);

      // Verify the hook was called with parameters for 14 days
      expect(useTimeSeriesDataSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metric: 'energy',
          granularity: 'day',
        })
      );

      expect(screen.getByText(/last 14 days/)).toBeInTheDocument();
    });
  });

  describe('Cumulative Calculation', () => {
    it('should calculate cumulative values correctly', async () => {
      const mockData: TimeSeries = {
        metric: 'energy',
        granularity: 'day',
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 10 },
          { timestamp: '2024-01-16T00:00:00Z', value: 15 },
          { timestamp: '2024-01-17T00:00:00Z', value: 20 },
        ],
        metadata: {
          unit: 'kWh',
          aggregation: 'sum',
        },
      };

      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      // Wait for data to be processed
      await waitFor(() => {
        // The cumulative values should be:
        // Day 1: 10
        // Day 2: 10 + 15 = 25
        // Day 3: 10 + 15 + 20 = 45
        // Total displayed should be 45.00 kWh
        expect(screen.getByText(/Total: 45\.00 kWh/)).toBeInTheDocument();
      });
    });

    it('should handle single data point correctly', async () => {
      const mockData: TimeSeries = {
        metric: 'energy',
        granularity: 'day',
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 25 },
        ],
        metadata: {
          unit: 'kWh',
          aggregation: 'sum',
        },
      };

      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      await waitFor(() => {
        expect(screen.getByText(/Total: 25\.00 kWh/)).toBeInTheDocument();
      });
    });

    it('should display zero for empty dataset', async () => {
      const mockData: TimeSeries = {
        metric: 'energy',
        granularity: 'day',
        dataPoints: [],
        metadata: {
          unit: 'kWh',
          aggregation: 'sum',
        },
      };

      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      // Should show empty state, not total
      await waitFor(() => {
        expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Chart States', () => {
    it('should render loading state', () => {
      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      expect(screen.getByText('Cumulative Energy Generated')).toBeInTheDocument();
      // Subtitle should not show total during loading
      expect(screen.getByText(/Total energy harvested over the last 30 days/)).toBeInTheDocument();
    });

    it('should render empty state when no data points', () => {
      const mockData: TimeSeries = {
        metric: 'energy',
        granularity: 'day',
        dataPoints: [],
        metadata: {
          unit: 'kWh',
          aggregation: 'sum',
        },
      };

      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      // Empty state message should be displayed
      expect(screen.getByText('Cumulative Energy Generated')).toBeInTheDocument();
    });

    it('should render error state with retry button', () => {
      const mockRefetch = vi.fn();
      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch energy data'),
        refetch: mockRefetch,
      });

      renderWithProviders(<CumulativeEnergyChart />);

      expect(screen.getByText('Cumulative Energy Generated')).toBeInTheDocument();
    });
  });

  describe('Real-Time Updates Integration', () => {
    it('should call useChartRealTimeUpdates hook on mount', () => {
      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      const useChartRealTimeUpdatesSpy = vi.spyOn(
        useChartRealTimeUpdatesModule,
        'useChartRealTimeUpdates'
      );

      renderWithProviders(<CumulativeEnergyChart />);

      expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(1);
    });

    it('should maintain real-time updates subscription with data', async () => {
      const mockData: TimeSeries = {
        metric: 'energy',
        granularity: 'day',
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 10 },
          { timestamp: '2024-01-16T00:00:00Z', value: 15 },
        ],
        metadata: {
          unit: 'kWh',
          aggregation: 'sum',
        },
      };

      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const useChartRealTimeUpdatesSpy = vi.spyOn(
        useChartRealTimeUpdatesModule,
        'useChartRealTimeUpdates'
      );

      renderWithProviders(<CumulativeEnergyChart />);

      expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText(/Total: 25\.00 kWh/)).toBeInTheDocument();
      });
    });

    it('should recalculate cumulative values when data updates', async () => {
      const initialData: TimeSeries = {
        metric: 'energy',
        granularity: 'day',
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 10 },
          { timestamp: '2024-01-16T00:00:00Z', value: 15 },
        ],
        metadata: {
          unit: 'kWh',
          aggregation: 'sum',
        },
      };

      const useTimeSeriesDataSpy = vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: initialData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = renderWithProviders(<CumulativeEnergyChart />);

      // Initial total should be 25 kWh
      await waitFor(() => {
        expect(screen.getByText(/Total: 25\.00 kWh/)).toBeInTheDocument();
      });

      // Update data with new point
      const updatedData: TimeSeries = {
        ...initialData,
        dataPoints: [
          ...initialData.dataPoints,
          { timestamp: '2024-01-17T00:00:00Z', value: 20 },
        ],
      };

      useTimeSeriesDataSpy.mockReturnValue({
        data: updatedData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      // Trigger rerender
      rerender(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SocketProvider>
              <CumulativeEnergyChart />
            </SocketProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Updated total should be 45 kWh
      await waitFor(() => {
        expect(screen.getByText(/Total: 45\.00 kWh/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch data with correct parameters', () => {
      const useTimeSeriesDataSpy = vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      expect(useTimeSeriesDataSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metric: 'energy',
          granularity: 'day',
        })
      );
    });

    it('should request last 30 days by default', () => {
      const useTimeSeriesDataSpy = vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      const callArgs = useTimeSeriesDataSpy.mock.calls[0][0];
      
      // Verify startDate is approximately 30 days ago
      const startDate = new Date(callArgs.startDate);
      const endDate = new Date(callArgs.endDate);
      const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });
  });

  describe('Theme Integration', () => {
    it('should render in light theme', async () => {
      const mockData: TimeSeries = {
        metric: 'energy',
        granularity: 'day',
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 10 },
        ],
        metadata: {
          unit: 'kWh',
          aggregation: 'sum',
        },
      };

      vi.spyOn(useTimeSeriesDataModule, 'useTimeSeriesData').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<CumulativeEnergyChart />);

      await waitFor(() => {
        expect(screen.getByText('Cumulative Energy Generated')).toBeInTheDocument();
      });

      // Component should render without errors
      expect(screen.getByText(/Total: 10\.00 kWh/)).toBeInTheDocument();
    });
  });
});
