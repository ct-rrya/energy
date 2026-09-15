/**
 * VoltageCurrentChart Component Tests
 * 
 * Tests for the VoltageCurrentChart component including:
 * - Component rendering with mock data
 * - Loading state display
 * - Empty state display
 * - Error state display with retry functionality
 * - Theme color application
 * - Real-time updates integration
 * 
 * Requirements tested:
 * - 3.1: Two synchronized LineChart components
 * - 3.2: Fetch data from Time_Series_API
 * - 3.10: TanStack Query integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VoltageCurrentChart } from './VoltageCurrentChart';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';

// Mock the hooks
vi.mock('@/features/dashboard/hooks/useTimeSeriesData', () => ({
  useTimeSeriesData: vi.fn(),
}));

vi.mock('@/features/dashboard/hooks/useChartRealTimeUpdates', () => ({
  useChartRealTimeUpdates: vi.fn(),
}));

// Import mocked hooks
import { useTimeSeriesData } from '@/features/dashboard/hooks/useTimeSeriesData';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';

describe('VoltageCurrentChart', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    vi.clearAllMocks();
    
    // Default mock implementation
    (useTimeSeriesData as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    
    (useChartRealTimeUpdates as any).mockReturnValue(undefined);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SocketProvider>
            {component}
          </SocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  it('renders two separate chart containers', () => {
    (useTimeSeriesData as any).mockReturnValue({
      data: {
        metric: 'voltage',
        granularity: 'hour',
        dataPoints: [
          { timestamp: '2024-01-15T12:00:00Z', value: 5.2 },
          { timestamp: '2024-01-15T13:00:00Z', value: 5.3 },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<VoltageCurrentChart />);

    // Should render both voltage and current chart titles
    expect(screen.getByText('Voltage Trend')).toBeInTheDocument();
    expect(screen.getByText('Current Trend')).toBeInTheDocument();
  });

  it('displays loading state when fetching data', () => {
    (useTimeSeriesData as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<VoltageCurrentChart />);

    // Should display loading skeletons (verify by data-testid from ChartLoadingState)
    const loadingStates = screen.getAllByTestId('chart-loading');
    expect(loadingStates).toHaveLength(2); // One for voltage, one for current
  });

  it('displays empty state when no data is available', () => {
    (useTimeSeriesData as any).mockReturnValue({
      data: {
        metric: 'voltage',
        granularity: 'hour',
        dataPoints: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<VoltageCurrentChart />);

    // Should display empty state messages
    const emptyStates = screen.getAllByTestId('chart-empty');
    expect(emptyStates).toHaveLength(2); // One for voltage, one for current
  });

  it('displays error state when data fetching fails', () => {
    const mockError = new Error('Failed to fetch data');
    
    (useTimeSeriesData as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    renderWithProviders(<VoltageCurrentChart />);

    // Should display error states
    const errorStates = screen.getAllByTestId('chart-error');
    expect(errorStates).toHaveLength(2); // One for voltage, one for current
  });

  it('integrates with real-time updates hook', () => {
    (useTimeSeriesData as any).mockReturnValue({
      data: {
        metric: 'voltage',
        granularity: 'hour',
        dataPoints: [{ timestamp: '2024-01-15T12:00:00Z', value: 5.2 }],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<VoltageCurrentChart />);

    // Verify the real-time updates hook was called
    expect(useChartRealTimeUpdates).toHaveBeenCalled();
  });

  it('fetches voltage data with correct parameters', () => {
    (useTimeSeriesData as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<VoltageCurrentChart />);

    // Verify useTimeSeriesData was called with voltage metric
    const calls = (useTimeSeriesData as any).mock.calls;
    const voltageCalls = calls.filter((call: any[]) => call[0].metric === 'voltage');
    expect(voltageCalls.length).toBeGreaterThan(0);
    
    const voltageParams = voltageCalls[0][0];
    expect(voltageParams.metric).toBe('voltage');
    expect(voltageParams.granularity).toBe('hour');
    expect(voltageParams.startDate).toBeDefined();
    expect(voltageParams.endDate).toBeDefined();
  });

  it('fetches current data with correct parameters', () => {
    (useTimeSeriesData as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<VoltageCurrentChart />);

    // Verify useTimeSeriesData was called with current metric
    const calls = (useTimeSeriesData as any).mock.calls;
    const currentCalls = calls.filter((call: any[]) => call[0].metric === 'current');
    expect(currentCalls.length).toBeGreaterThan(0);
    
    const currentParams = currentCalls[0][0];
    expect(currentParams.metric).toBe('current');
    expect(currentParams.granularity).toBe('hour');
    expect(currentParams.startDate).toBeDefined();
    expect(currentParams.endDate).toBeDefined();
  });

  it('applies responsive grid layout classes', () => {
    (useTimeSeriesData as any).mockReturnValue({
      data: {
        metric: 'voltage',
        granularity: 'hour',
        dataPoints: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderWithProviders(<VoltageCurrentChart />);

    // Should have grid layout classes for responsive design
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer?.classList.contains('grid-cols-1')).toBe(true);
    expect(gridContainer?.classList.contains('lg:grid-cols-2')).toBe(true);
  });
});
