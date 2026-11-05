import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsPage } from './AnalyticsPage';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

// Mock System Health & Live Sensor Data
vi.mock('@/features/dashboard/hooks/useSystemHealth', () => ({
  useSystemHealth: () => ({
    data: { database: 'connected' },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/features/dashboard/hooks/useLiveSensorData', () => ({
  useLiveSensorData: () => ({
    lastReading: null,
    isConnected: true,
  }),
}));

// Mock the heavy chart components
vi.mock('@/components/dashboard/PowerGenerationChart', () => ({
  PowerGenerationChart: () => <div data-testid="power-chart">Power Generation Chart</div>,
}));

vi.mock('@/components/dashboard/EnergyPeriodChart', () => ({
  EnergyPeriodChart: () => <div data-testid="energy-period-chart">Energy Period Chart</div>,
}));

vi.mock('@/components/dashboard/CumulativeEnergyChart', () => ({
  CumulativeEnergyChart: () => <div data-testid="cumulative-energy-chart">Cumulative Energy Chart</div>,
}));

vi.mock('@/components/dashboard/StepsChart', () => ({
  StepsChart: () => <div data-testid="steps-chart">Steps Chart</div>,
}));

vi.mock('@/components/dashboard/VoltageCurrentChart', () => ({
  VoltageCurrentChart: () => <div data-testid="voltage-current-chart">Voltage Current Chart</div>,
}));

vi.mock('../components/HistoricalDataView', () => ({
  HistoricalDataView: () => <div data-testid="historical-data-view">Historical Data View</div>,
}));

describe('AnalyticsPage - Mobile Clutter Reduction & Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });
  });

  describe('Header & Title Optimization (Requirements 2, 4, 5)', () => {
    it('renders the title Analytics and shortened subtitle "Energy trends and historical data."', () => {
      render(<AnalyticsPage />);
      expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument();
      expect(screen.getByText('Energy trends and historical data.')).toBeInTheDocument();
    });

    it('renders the timestamp in smaller secondary text with calendar icon', () => {
      const { container } = render(<AnalyticsPage />);
      const year = new Date().getFullYear().toString();
      const timeElement = screen.getByText(new RegExp(year));
      expect(timeElement).toBeInTheDocument();
      
      const calendarSvg = container.querySelector('svg.lucide-calendar');
      expect(calendarSvg).toBeInTheDocument();
    });
  });

  describe('Guest Mode Banner Removal', () => {
    it('does not render the guest mode banner on Analytics page', () => {
      render(<AnalyticsPage />);
      expect(screen.queryByText('Guest Mode')).not.toBeInTheDocument();
    });
  });

  describe('Compact Equal-Width Segmented Control (Requirement 6)', () => {
    it('renders Chart View and Historical View as equal-width buttons in a 2-column grid on mobile', () => {
      const { container } = render(<AnalyticsPage />);
      const segmentedControl = container.querySelector('.grid-cols-2');
      expect(segmentedControl).toBeInTheDocument();

      const chartBtn = screen.getByRole('button', { name: /switch to chart view/i });
      const historicalBtn = screen.getByRole('button', { name: /switch to historical data view/i });
      expect(chartBtn).toBeInTheDocument();
      expect(historicalBtn).toBeInTheDocument();
    });

    it('toggles between Chart View and Historical View while keeping functionality intact', async () => {
      const user = userEvent.setup();
      render(<AnalyticsPage />);

      // Initially on Chart View
      expect(screen.getByTestId('power-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('historical-data-view')).not.toBeInTheDocument();

      // Switch to Historical View
      const historicalBtn = screen.getByRole('button', { name: /switch to historical data view/i });
      await user.click(historicalBtn);

      expect(screen.getByTestId('historical-data-view')).toBeInTheDocument();
      expect(screen.queryByTestId('power-chart')).not.toBeInTheDocument();

      // Switch back to Chart View
      const chartBtn = screen.getByRole('button', { name: /switch to chart view/i });
      await user.click(chartBtn);

      expect(screen.getByTestId('power-chart')).toBeInTheDocument();
    });
  });

  describe('Horizontal Scrollable Period Filters (Requirement 7)', () => {
    it('renders period filters in a single horizontally scrollable row with no-scrollbar and nowrap buttons', () => {
      const { container } = render(<AnalyticsPage />);
      const scrollRow = container.querySelector('.overflow-x-auto');
      expect(scrollRow).toBeInTheDocument();
      expect(scrollRow).toHaveClass('no-scrollbar');

      // Verify all 5 period buttons exist and have shrink-0 whitespace-nowrap
      const buttons = ['All Time', 'Today', 'Last 7 Days', 'Last 30 Days', '3 Months'];
      buttons.forEach((label) => {
        const btn = screen.getByRole('button', { name: label });
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveClass('shrink-0', 'whitespace-nowrap');
      });
    });

    it('changes selected period filter when clicked', async () => {
      const user = userEvent.setup();
      render(<AnalyticsPage />);

      const todayBtn = screen.getByRole('button', { name: 'Today' });
      await user.click(todayBtn);
      expect(todayBtn).toHaveAttribute('aria-pressed', 'true');

      const allTimeBtn = screen.getByRole('button', { name: 'All Time' });
      expect(allTimeBtn).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
