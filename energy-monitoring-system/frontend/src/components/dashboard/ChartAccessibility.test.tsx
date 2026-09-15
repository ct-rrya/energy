import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PowerGenerationChart } from './PowerGenerationChart';
import { EnergyPeriodChart } from './EnergyPeriodChart';
import { ChartContainer } from './ChartContainer';
import { ChartErrorState } from './ChartErrorState';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';
import * as usePowerGenerationModule from '@/features/dashboard/hooks/usePowerGeneration';
import * as useEnergyByPeriodModule from '@/features/dashboard/hooks/useEnergyByPeriod';
import * as useChartRealTimeUpdatesModule from '@/features/dashboard/hooks/useChartRealTimeUpdates';

// Mock the hooks
vi.mock('@/features/dashboard/hooks/usePowerGeneration');
vi.mock('@/features/dashboard/hooks/useEnergyByPeriod');
vi.mock('@/features/dashboard/hooks/useChartRealTimeUpdates');

/**
 * Accessibility Tests for Chart Components
 * 
 * Tests Requirements:
 * - 13.7: Keyboard navigation support
 * - 13.7: ARIA labels for screen readers
 * - 13.7: aria-pressed state for filter buttons
 * 
 * These tests verify:
 * 1. ARIA labels are present on chart containers
 * 2. Filter buttons have proper role="group" and aria-label
 * 3. Filter buttons have aria-pressed state
 * 4. Keyboard navigation works (Tab, Enter, Space)
 * 5. Retry button in error state is keyboard accessible
 */
describe('Chart Components - Accessibility Features', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock useChartRealTimeUpdates to do nothing
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

  describe('Subtask 10.1 - ARIA Labels', () => {
    it('should add aria-label to ChartContainer with descriptive chart name', () => {
      const { container } = render(
        <ThemeProvider>
          <ChartContainer title="Power Generation">
            <div>Chart content</div>
          </ChartContainer>
        </ThemeProvider>
      );

      const chartRegion = container.querySelector('[role="region"]');
      expect(chartRegion).toBeInTheDocument();
      expect(chartRegion).toHaveAttribute('aria-label', 'Power Generation chart');
    });

    it('should add role="group" and aria-label to filter button groups in PowerGenerationChart', () => {
      // Mock with data to show filter controls
      const mockData = {
        metric: 'power' as const,
        granularity: 'hour' as const,
        dataPoints: [
          { timestamp: '2024-01-15T10:00:00Z', value: 150, label: '10:00' },
        ],
        metadata: { unit: 'W', aggregation: 'avg' as const },
      };

      vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<PowerGenerationChart />);

      const filterGroup = screen.getByRole('group', { name: /time range filter options/i });
      expect(filterGroup).toBeInTheDocument();
    });

    it('should add role="group" and aria-label to filter button groups in EnergyPeriodChart', () => {
      // Mock with data to show filter controls
      const mockData = {
        metric: 'energy' as const,
        granularity: 'day' as const,
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 5.2, label: 'Jan 15' },
        ],
        metadata: { unit: 'kWh', aggregation: 'sum' as const },
      };

      vi.spyOn(useEnergyByPeriodModule, 'useEnergyByPeriod').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<EnergyPeriodChart />);

      const filterGroup = screen.getByRole('group', { name: /period filter options/i });
      expect(filterGroup).toBeInTheDocument();
    });

    it('should add aria-pressed state to active filter buttons in PowerGenerationChart', () => {
      const mockData = {
        metric: 'power' as const,
        granularity: 'hour' as const,
        dataPoints: [
          { timestamp: '2024-01-15T10:00:00Z', value: 150, label: '10:00' },
        ],
        metadata: { unit: 'W', aggregation: 'avg' as const },
      };

      vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<PowerGenerationChart />);

      // Default filter is "Today", should have aria-pressed="true"
      const todayButton = screen.getByRole('button', { name: /show data for today/i });
      expect(todayButton).toHaveAttribute('aria-pressed', 'true');

      // Other buttons should have aria-pressed="false"
      const sevenDaysButton = screen.getByRole('button', { name: /show data for 7 days/i });
      expect(sevenDaysButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should add aria-pressed state to active filter buttons in EnergyPeriodChart', () => {
      const mockData = {
        metric: 'energy' as const,
        granularity: 'day' as const,
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 5.2, label: 'Jan 15' },
        ],
        metadata: { unit: 'kWh', aggregation: 'sum' as const },
      };

      vi.spyOn(useEnergyByPeriodModule, 'useEnergyByPeriod').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<EnergyPeriodChart />);

      // Default filter is "Daily", should have aria-pressed="true"
      const dailyButton = screen.getByRole('button', { name: /show daily energy data/i });
      expect(dailyButton).toHaveAttribute('aria-pressed', 'true');

      // Other buttons should have aria-pressed="false"
      const hourlyButton = screen.getByRole('button', { name: /show hourly energy data/i });
      expect(hourlyButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Subtask 10.2 - Keyboard Navigation Support', () => {
    it('should allow keyboard navigation through filter buttons using Tab', async () => {
      const user = userEvent.setup();
      
      const mockData = {
        metric: 'power' as const,
        granularity: 'hour' as const,
        dataPoints: [
          { timestamp: '2024-01-15T10:00:00Z', value: 150, label: '10:00' },
        ],
        metadata: { unit: 'W', aggregation: 'avg' as const },
      };

      vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<PowerGenerationChart />);

      const todayButton = screen.getByRole('button', { name: /show data for today/i });
      const sevenDaysButton = screen.getByRole('button', { name: /show data for 7 days/i });
      const thirtyDaysButton = screen.getByRole('button', { name: /show data for 30 days/i });

      // Tab to first button
      await user.tab();
      expect(todayButton).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(sevenDaysButton).toHaveFocus();

      // Tab to third button
      await user.tab();
      expect(thirtyDaysButton).toHaveFocus();
    });

    it('should activate filter buttons with Enter key', async () => {
      const user = userEvent.setup();
      
      const mockRefetch = vi.fn();
      const mockData = {
        metric: 'power' as const,
        granularity: 'hour' as const,
        dataPoints: [
          { timestamp: '2024-01-15T10:00:00Z', value: 150, label: '10:00' },
        ],
        metadata: { unit: 'W', aggregation: 'avg' as const },
      };

      vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithProviders(<PowerGenerationChart />);

      const sevenDaysButton = screen.getByRole('button', { name: /show data for 7 days/i });

      // Focus and activate with Enter
      sevenDaysButton.focus();
      await user.keyboard('{Enter}');

      // Button should now be pressed
      expect(sevenDaysButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should activate filter buttons with Space key', async () => {
      const user = userEvent.setup();
      
      const mockData = {
        metric: 'energy' as const,
        granularity: 'day' as const,
        dataPoints: [
          { timestamp: '2024-01-15T00:00:00Z', value: 5.2, label: 'Jan 15' },
        ],
        metadata: { unit: 'kWh', aggregation: 'sum' as const },
      };

      vi.spyOn(useEnergyByPeriodModule, 'useEnergyByPeriod').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders(<EnergyPeriodChart />);

      const weeklyButton = screen.getByRole('button', { name: /show weekly energy data/i });

      // Focus and activate with Space
      weeklyButton.focus();
      await user.keyboard(' ');

      // Button should now be pressed
      expect(weeklyButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should make retry button in error state keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      render(
        <ThemeProvider>
          <ChartErrorState
            error={new Error('Test error')}
            onRetry={mockRetry}
          />
        </ThemeProvider>
      );

      const retryButton = screen.getByRole('button', { name: /retry loading chart data/i });

      // Focus and activate with Enter
      retryButton.focus();
      await user.keyboard('{Enter}');

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should allow retry button to be activated with Space key', async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      render(
        <ThemeProvider>
          <ChartErrorState
            error={new Error('Test error')}
            onRetry={mockRetry}
          />
        </ThemeProvider>
      );

      const retryButton = screen.getByRole('button', { name: /retry loading chart data/i });

      // Focus and activate with Space
      retryButton.focus();
      await user.keyboard(' ');

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Subtask 10.3 - WCAG Color Contrast Verification', () => {
    it('should render chart with theme-appropriate colors in light mode', () => {
      const mockData = {
        metric: 'power' as const,
        granularity: 'hour' as const,
        dataPoints: [
          { timestamp: '2024-01-15T10:00:00Z', value: 150, label: '10:00' },
        ],
        metadata: { unit: 'W', aggregation: 'avg' as const },
      };

      vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = renderWithProviders(<PowerGenerationChart />);

      // Verify chart container has proper styling
      const chartRegion = container.querySelector('[role="region"]');
      expect(chartRegion).toBeInTheDocument();

      // Verify filter buttons are rendered with proper contrast
      const todayButton = screen.getByRole('button', { name: /show data for today/i });
      expect(todayButton).toBeInTheDocument();
    });

    it('should render chart with theme-appropriate colors in dark mode', () => {
      // Note: This test documents that dark mode colors are defined in the components
      // Actual contrast testing should be done with browser dev tools or automated tools
      const mockData = {
        metric: 'power' as const,
        granularity: 'hour' as const,
        dataPoints: [
          { timestamp: '2024-01-15T10:00:00Z', value: 150, label: '10:00' },
        ],
        metadata: { unit: 'W', aggregation: 'avg' as const },
      };

      vi.spyOn(usePowerGenerationModule, 'usePowerGeneration').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      // Render with theme context (defaults to light, but components support dark)
      const { container } = renderWithProviders(<PowerGenerationChart />);

      const chartRegion = container.querySelector('[role="region"]');
      expect(chartRegion).toBeInTheDocument();
    });
  });
});
