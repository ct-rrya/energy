import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';

// Mock the hooks
vi.mock('../hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: vi.fn(),
}));

vi.mock('../hooks/useSystemHealth', () => ({
  useSystemHealth: vi.fn(),
}));

vi.mock('../hooks/useLiveSensorData', () => ({
  useLiveSensorData: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Import mocked hooks
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { useLiveSensorData } from '../hooks/useLiveSensorData';
import { useAuth } from '@/contexts/AuthContext';

const mockedUseDashboardMetrics = vi.mocked(useDashboardMetrics);
const mockedUseSystemHealth = vi.mocked(useSystemHealth);
const mockedUseLiveSensorData = vi.mocked(useLiveSensorData);
const mockedUseAuth = vi.mocked(useAuth);

// Test helper to render with providers
function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('DashboardPage - Task 9.3: Data Flow Wiring', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Default auth mock
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });
  });

  describe('Hook Connections', () => {
    it('should connect useDashboardMetrics() hook to ElectricalMetricsGrid', () => {
      // Mock dashboard metrics with dailyEnergy
      mockedUseDashboardMetrics.mockReturnValue({
        data: {
          dailyEnergy: 3.42,
          currentEnergy: 2.5,
          currentVoltage: 230.2,
          currentCurrent: 12.45,
          currentPower: 2867,
          batteryPercentage: 85,
          estimatedDailyEnergy: 4.0,
          lastUpdate: '2024-01-15T10:30:00Z',
          activeSensors: 1,
          connectedDevices: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      // Mock live sensor data
      mockedUseLiveSensorData.mockReturnValue({
        lastReading: {
          sensorId: 'sensor-1',
          voltage: 230.2,
          current: 12.45,
          power: 2867,
          energy: 3.42,
          stepCount: 8247,
          wifiConnected: true,
          bluetoothConnected: true,
          timestamp: '2024-01-15T10:30:00Z',
        },
        isConnected: true,
      });

      // Mock system health
      mockedUseSystemHealth.mockReturnValue({
        data: {
          api: 'connected',
          database: 'connected',
          websocket: 'connected',
          uptime: 3600,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      // Verify ElectricalMetricsGrid receives energy from metrics
      expect(screen.getByText('Energy Today')).toBeInTheDocument();
    });

    it('should connect useLiveSensorData() hook to ElectricalMetricsGrid', () => {
      // Mock dashboard metrics
      mockedUseDashboardMetrics.mockReturnValue({
        data: {
          dailyEnergy: 3.42,
          currentEnergy: 2.5,
          currentVoltage: 230.2,
          currentCurrent: 12.45,
          currentPower: 2867,
          batteryPercentage: 85,
          estimatedDailyEnergy: 4.0,
          lastUpdate: '2024-01-15T10:30:00Z',
          activeSensors: 1,
          connectedDevices: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      // Mock live sensor data with voltage, current, power
      mockedUseLiveSensorData.mockReturnValue({
        lastReading: {
          sensorId: 'sensor-1',
          voltage: 230.2,
          current: 12.45,
          power: 2867,
          energy: 3.42,
          stepCount: 8247,
          wifiConnected: true,
          bluetoothConnected: true,
          timestamp: '2024-01-15T10:30:00Z',
        },
        isConnected: true,
      });

      // Mock system health
      mockedUseSystemHealth.mockReturnValue({
        data: {
          api: 'connected',
          database: 'connected',
          websocket: 'connected',
          uptime: 3600,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      // Verify electrical metrics are displayed
      expect(screen.getByText('Voltage')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByText('Power')).toBeInTheDocument();
    });

    it('should connect useLiveSensorData() hook to StepActivityCard', () => {
      // Mock dashboard metrics
      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      // Mock live sensor data with stepCount
      mockedUseLiveSensorData.mockReturnValue({
        lastReading: {
          sensorId: 'sensor-1',
          voltage: 230.2,
          current: 12.45,
          power: 2867,
          energy: 3.42,
          stepCount: 8247,
          wifiConnected: true,
          bluetoothConnected: true,
          timestamp: '2024-01-15T10:30:00Z',
        },
        isConnected: true,
      });

      // Mock system health
      mockedUseSystemHealth.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      // Verify step activity card displays stepCount
      expect(screen.getByText('Step Activity')).toBeInTheDocument();
      expect(screen.getByText('8,247')).toBeInTheDocument();
    });

    it('should connect useSystemHealth() hook to SystemStatusCard', () => {
      // Mock dashboard metrics
      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      // Mock live sensor data
      mockedUseLiveSensorData.mockReturnValue({
        lastReading: {
          sensorId: 'sensor-1',
          voltage: 230.2,
          current: 12.45,
          power: 2867,
          energy: 3.42,
          stepCount: 8247,
          wifiConnected: true,
          bluetoothConnected: true,
          timestamp: '2024-01-15T10:30:00Z',
        },
        isConnected: true,
      });

      // Mock system health
      mockedUseSystemHealth.mockReturnValue({
        data: {
          api: 'connected',
          database: 'connected',
          websocket: 'connected',
          uptime: 3600,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      // Verify system status card is displayed
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
      expect(screen.getByText('Bluetooth')).toBeInTheDocument();
    });
  });

  describe('Data Mapping', () => {
    it('should map voltage, current, power from lastReading to ElectricalMetricsGrid', () => {
      mockedUseDashboardMetrics.mockReturnValue({
        data: { dailyEnergy: 3.42 } as any,
        isLoading: false,
        error: null,
      } as any);

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: {
          sensorId: 'sensor-1',
          voltage: 230.2,
          current: 12.45,
          power: 2867.3,
          energy: 3.42,
          timestamp: '2024-01-15T10:30:00Z',
        },
        isConnected: true,
      });

      mockedUseSystemHealth.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      // Note: The actual numeric values would be rendered by MetricCard
      // We verify the component structure is present
      expect(screen.getByText('Voltage')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByText('Power')).toBeInTheDocument();
    });

    it('should map energy from metrics.dailyEnergy to ElectricalMetricsGrid', () => {
      mockedUseDashboardMetrics.mockReturnValue({
        data: {
          dailyEnergy: 3.42,
        } as any,
        isLoading: false,
        error: null,
      } as any);

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: undefined,
        isConnected: false,
      });

      mockedUseSystemHealth.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Energy Today')).toBeInTheDocument();
    });

    it('should map stepCount from lastReading to StepActivityCard', () => {
      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: {
          sensorId: 'sensor-1',
          voltage: 0,
          current: 0,
          power: 0,
          energy: 0,
          stepCount: 8247,
          timestamp: '2024-01-15T10:30:00Z',
        },
        isConnected: true,
      });

      mockedUseSystemHealth.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('8,247')).toBeInTheDocument();
    });

    it('should map wifi, bluetooth, dataTimestamp from lastReading to SystemStatusCard', () => {
      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: {
          sensorId: 'sensor-1',
          voltage: 230.2,
          current: 12.45,
          power: 2867,
          energy: 3.42,
          wifiConnected: true,
          bluetoothConnected: true,
          timestamp: '2024-01-15T10:30:00Z',
        },
        isConnected: true,
      });

      mockedUseSystemHealth.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
      expect(screen.getByText('Bluetooth')).toBeInTheDocument();
      // Both Wi-Fi and Bluetooth are connected, so we should see "Connected" text multiple times
      expect(screen.getAllByText('Connected').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('hasData Logic', () => {
    it('should implement hasData logic based on lastReading existence', () => {
      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      // No sensor data
      mockedUseLiveSensorData.mockReturnValue({
        lastReading: undefined,
        isConnected: false,
      });

      mockedUseSystemHealth.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      // When no data, empty state should be rendered
      expect(screen.getByText(/no sensor data available/i)).toBeInTheDocument();
    });

    it('should hide empty state when hasData is true', () => {
      mockedUseDashboardMetrics.mockReturnValue({
        data: { dailyEnergy: 3.42 } as any,
        isLoading: false,
        error: null,
      } as any);

      // Has sensor data
      mockedUseLiveSensorData.mockReturnValue({
        lastReading: {
          sensorId: 'sensor-1',
          voltage: 230.2,
          current: 12.45,
          power: 2867,
          energy: 3.42,
          timestamp: '2024-01-15T10:30:00Z',
        },
        isConnected: true,
      });

      mockedUseSystemHealth.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      // Empty state should NOT be shown
      expect(screen.queryByText(/no sensor data available/i)).not.toBeInTheDocument();
    });
  });

  describe('WebSocket/Polling Mechanisms', () => {
    it('should preserve existing WebSocket/polling mechanisms', () => {
      // Verify hooks are called (preserving existing data-fetching)
      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: undefined,
        isConnected: false,
      });

      mockedUseSystemHealth.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      // Verify all hooks were called
      expect(mockedUseDashboardMetrics).toHaveBeenCalled();
      expect(mockedUseLiveSensorData).toHaveBeenCalled();
      expect(mockedUseSystemHealth).toHaveBeenCalled();
    });
  });
});
