import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('DashboardPage - Task 2.3: Last-Known-Good Caching', () => {
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

    // Default system health mock
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
  });

  describe('Sensor Reading Validation and Caching - Requirements: 19.2, 19.4, 19.5, 19.6', () => {
    it('should cache valid sensor readings', async () => {
      // Mock valid sensor data
      const validReading = {
        sensorId: 'sensor-1',
        voltage: 230.2,
        current: 12.45,
        power: 2867,
        energy: 3.42,
        stepCount: 8247,
        timestamp: '2024-01-15T10:30:00Z',
      };

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: validReading,
        isConnected: true,
      });

      mockedUseDashboardMetrics.mockReturnValue({
        data: { dailyEnergy: 3.42 } as any,
        isLoading: false,
        error: null,
      } as any);

      const { rerender } = renderWithProviders(<DashboardPage />);

      // Verify data is displayed
      await waitFor(() => {
        expect(screen.getByText('230.2')).toBeInTheDocument(); // Voltage
      });

      // Now provide invalid data (voltage out of range)
      const invalidReading = {
        ...validReading,
        voltage: 600, // Exceeds max of 500V
      };

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: invalidReading,
        isConnected: true,
      });

      // Rerender with invalid data
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Should still display the last valid voltage (230.2), not the invalid 600
      await waitFor(() => {
        expect(screen.getByText('230.2')).toBeInTheDocument();
      });
    });

    it('should fall back to cached data when validation fails - Requirement: 19.6', async () => {
      // Start with valid data
      const validReading = {
        sensorId: 'sensor-1',
        voltage: 220.0,
        current: 10.0,
        power: 2200,
        energy: 2.5,
        stepCount: 5000,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: validReading,
        isConnected: true,
      });

      mockedUseDashboardMetrics.mockReturnValue({
        data: { dailyEnergy: 2.5 } as any,
        isLoading: false,
        error: null,
      } as any);

      const { rerender } = renderWithProviders(<DashboardPage />);

      // Verify initial valid data is displayed
      await waitFor(() => {
        expect(screen.getByText('220.0')).toBeInTheDocument();
      });

      // Provide invalid data (multiple fields out of range)
      const invalidReading = {
        sensorId: 'sensor-1',
        voltage: -10, // Negative voltage (invalid)
        current: 150, // Exceeds max of 100A
        power: 60000, // Exceeds max of 50000W
        energy: 2.5,
        stepCount: 5000,
        timestamp: '2024-01-15T10:30:00Z',
      };

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: invalidReading,
        isConnected: true,
      });

      // Rerender with invalid data
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Should still show the last valid data (220.0), not invalid data
      await waitFor(() => {
        expect(screen.getByText('220.0')).toBeInTheDocument();
      });
    });

    it('should validate voltage range (0-500V) - Requirement: 16.8', async () => {
      const invalidReading = {
        sensorId: 'sensor-1',
        voltage: 550, // Exceeds 500V max
        current: 10,
        power: 2200,
        energy: 2.5,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: invalidReading,
        isConnected: true,
      });

      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Dashboard] Sensor reading validation failed'),
          expect.anything()
        );
      });

      consoleSpy.mockRestore();
    });

    it('should validate current range (0-100A) - Requirement: 16.9', async () => {
      const invalidReading = {
        sensorId: 'sensor-1',
        voltage: 230,
        current: 120, // Exceeds 100A max
        power: 2200,
        energy: 2.5,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: invalidReading,
        isConnected: true,
      });

      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Dashboard] Sensor reading validation failed'),
          expect.anything()
        );
      });

      consoleSpy.mockRestore();
    });

    it('should validate power range (0-50000W) - Requirement: 16.10', async () => {
      const invalidReading = {
        sensorId: 'sensor-1',
        voltage: 230,
        current: 10,
        power: 60000, // Exceeds 50000W max
        energy: 2.5,
        timestamp: '2024-01-15T10:00:00Z',
      };

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: invalidReading,
        isConnected: true,
      });

      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Dashboard] Sensor reading validation failed'),
          expect.anything()
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Metrics Validation and Caching - Requirements: 17.6, 19.4, 19.5', () => {
    it('should cache valid dashboard metrics', async () => {
      const validMetrics = {
        dailyEnergy: 5.5,
        currentEnergy: 2.5,
        currentVoltage: 230,
        currentCurrent: 12,
        currentPower: 2760,
        batteryPercentage: 85,
        estimatedDailyEnergy: 6.0,
        lastUpdate: '2024-01-15T10:30:00Z',
        activeSensors: 1,
        connectedDevices: 1,
      };

      mockedUseDashboardMetrics.mockReturnValue({
        data: validMetrics,
        isLoading: false,
        error: null,
      } as any);

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: undefined,
        isConnected: false,
      });

      const { rerender } = renderWithProviders(<DashboardPage />);

      // Verify energy is displayed (formatted with 2 decimal places)
      await waitFor(() => {
        expect(screen.getByText('5.50')).toBeInTheDocument();
      });

      // Provide invalid metrics (dailyEnergy out of range)
      const invalidMetrics = {
        ...validMetrics,
        dailyEnergy: 1500, // Exceeds max of 1000 kWh
      };

      mockedUseDashboardMetrics.mockReturnValue({
        data: invalidMetrics,
        isLoading: false,
        error: null,
      } as any);

      // Rerender
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Should still show cached valid value (5.50 - formatted with 2 decimals)
      await waitFor(() => {
        expect(screen.getByText('5.50')).toBeInTheDocument();
      });
    });

    it('should validate dailyEnergy range (0-1000 kWh) - Requirement: 17.6', async () => {
      const invalidMetrics = {
        dailyEnergy: -5, // Negative energy (invalid)
        currentEnergy: 2.5,
        currentVoltage: 230,
        currentCurrent: 12,
        currentPower: 2760,
        batteryPercentage: 85,
        estimatedDailyEnergy: 6.0,
        lastUpdate: '2024-01-15T10:30:00Z',
        activeSensors: 1,
        connectedDevices: 1,
      };

      mockedUseDashboardMetrics.mockReturnValue({
        data: invalidMetrics,
        isLoading: false,
        error: null,
      } as any);

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: undefined,
        isConnected: false,
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Dashboard] Invalid daily energy value'),
          -5
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling with Cached Data - Requirements: 19.2, 19.4', () => {
    it('should continue displaying last good data when WebSocket disconnects - Requirement: 19.2', async () => {
      // Start with valid data and connected WebSocket
      const validReading = {
        sensorId: 'sensor-1',
        voltage: 230.2,
        current: 12.45,
        power: 2867,
        energy: 3.42,
        timestamp: '2024-01-15T10:30:00Z',
      };

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: validReading,
        isConnected: true,
      });

      mockedUseDashboardMetrics.mockReturnValue({
        data: { dailyEnergy: 3.42 } as any,
        isLoading: false,
        error: null,
      } as any);

      const { rerender } = renderWithProviders(<DashboardPage />);

      // Verify data is displayed
      await waitFor(() => {
        expect(screen.getByText('230.2')).toBeInTheDocument();
      });

      // Simulate WebSocket disconnection (no new data)
      mockedUseLiveSensorData.mockReturnValue({
        lastReading: undefined,
        isConnected: false,
      });

      // Rerender
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Should still display the last good data (230.2)
      await waitFor(() => {
        expect(screen.getByText('230.2')).toBeInTheDocument();
      });
    });

    it('should use cached metrics when API request fails - Requirement: 19.4', async () => {
      // Start with successful metrics fetch
      const validMetrics = {
        dailyEnergy: 4.2,
        currentEnergy: 2.5,
        currentVoltage: 230,
        currentCurrent: 12,
        currentPower: 2760,
        batteryPercentage: 85,
        estimatedDailyEnergy: 5.0,
        lastUpdate: '2024-01-15T10:30:00Z',
        activeSensors: 1,
        connectedDevices: 1,
      };

      mockedUseDashboardMetrics.mockReturnValue({
        data: validMetrics,
        isLoading: false,
        error: null,
      } as any);

      mockedUseLiveSensorData.mockReturnValue({
        lastReading: undefined,
        isConnected: false,
      });

      const { rerender } = renderWithProviders(<DashboardPage />);

      // Verify energy is displayed (formatted with 2 decimal places)
      await waitFor(() => {
        expect(screen.getByText('4.20')).toBeInTheDocument();
      });

      // Simulate API error (no new data)
      mockedUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
      } as any);

      // Rerender
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Should still display cached energy value (4.20 - formatted with 2 decimals)
      await waitFor(() => {
        expect(screen.getByText('4.20')).toBeInTheDocument();
      });
    });
  });
});
