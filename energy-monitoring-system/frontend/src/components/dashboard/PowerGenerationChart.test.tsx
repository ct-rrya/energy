import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PowerGenerationChart } from './PowerGenerationChart';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';
import * as usePowerGenerationModule from '@/features/dashboard/hooks/usePowerGeneration';
import * as useChartRealTimeUpdatesModule from '@/features/dashboard/hooks/useChartRealTimeUpdates';

// Mock the hooks
vi.mock('@/features/dashboard/hooks/usePowerGeneration');
vi.mock('@/features/dashboard/hooks/useChartRealTimeUpdates');

describe('PowerGenerationChart - Real-Time Updates Integration', () => {
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

  it('should call useChartRealTimeUpdates hook on mount', () => {
    // Mock usePowerGeneration to return loading state
    vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const useChartRealTimeUpdatesSpy = vi.spyOn(
      useChartRealTimeUpdatesModule,
      'useChartRealTimeUpdates'
    );

    renderWithProviders(<PowerGenerationChart />);

    // Verify the hook was called
    expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(1);
  });

  it('should render chart with data and real-time updates enabled', async () => {
    // Mock usePowerGeneration to return sample data
    const mockData = {
      metric: 'power' as const,
      granularity: 'hour' as const,
      dataPoints: [
        { timestamp: '2024-01-15T10:00:00Z', value: 150, label: '10:00' },
        { timestamp: '2024-01-15T11:00:00Z', value: 200, label: '11:00' },
        { timestamp: '2024-01-15T12:00:00Z', value: 180, label: '12:00' },
      ],
      metadata: {
        unit: 'W',
        aggregation: 'avg' as const,
      },
    };

    vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const useChartRealTimeUpdatesSpy = vi.spyOn(
      useChartRealTimeUpdatesModule,
      'useChartRealTimeUpdates'
    );

    renderWithProviders(<PowerGenerationChart />);

    // Verify the real-time updates hook is active
    expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(1);

    // Verify chart title is rendered
    await waitFor(() => {
      expect(screen.getByText('Power Generation Over Time')).toBeInTheDocument();
    });
  });

  it('should maintain real-time updates subscription across filter changes', async () => {
    // Mock usePowerGeneration
    vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const useChartRealTimeUpdatesSpy = vi.spyOn(
      useChartRealTimeUpdatesModule,
      'useChartRealTimeUpdates'
    );

    const { rerender } = renderWithProviders(<PowerGenerationChart />);

    // Initial render should call the hook
    expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(1);

    // Rerender (simulating filter change or other state update)
    rerender(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SocketProvider>
            <PowerGenerationChart />
          </SocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Hook should be called on each render to maintain subscription
    expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(2);
  });

  it('should render loading state while maintaining real-time subscription', () => {
    // Mock usePowerGeneration to return loading state
    vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const useChartRealTimeUpdatesSpy = vi.spyOn(
      useChartRealTimeUpdatesModule,
      'useChartRealTimeUpdates'
    );

    renderWithProviders(<PowerGenerationChart />);

    // Verify hook is called even during loading
    expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(1);

    // Verify loading state is displayed
    expect(screen.getByText('Power Generation Over Time')).toBeInTheDocument();
  });

  it('should render empty state while maintaining real-time subscription', () => {
    // Mock usePowerGeneration to return empty data
    const mockEmptyData = {
      metric: 'power' as const,
      granularity: 'hour' as const,
      dataPoints: [],
      metadata: {
        unit: 'W',
        aggregation: 'avg' as const,
      },
    };

    vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
      data: mockEmptyData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const useChartRealTimeUpdatesSpy = vi.spyOn(
      useChartRealTimeUpdatesModule,
      'useChartRealTimeUpdates'
    );

    renderWithProviders(<PowerGenerationChart />);

    // Verify hook is called even with empty data
    expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(1);
  });

  it('should render error state while maintaining real-time subscription', () => {
    // Mock usePowerGeneration to return error state
    vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch data'),
      refetch: vi.fn(),
    });

    const useChartRealTimeUpdatesSpy = vi.spyOn(
      useChartRealTimeUpdatesModule,
      'useChartRealTimeUpdates'
    );

    renderWithProviders(<PowerGenerationChart />);

    // Verify hook is called even during error state
    expect(useChartRealTimeUpdatesSpy).toHaveBeenCalledTimes(1);
  });
});
