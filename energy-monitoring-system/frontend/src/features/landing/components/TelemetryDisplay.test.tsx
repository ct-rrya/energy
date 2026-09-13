import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import TelemetryDisplay from './TelemetryDisplay';
import api from '../../../lib/api';

/**
 * Mock the API module
 * Requirements: 14.7, 14.8
 */
vi.mock('../../../lib/api', () => ({
  default: {
    telemetry: {
      getCurrent: vi.fn(),
    },
  },
}));

const mockTelemetryData = {
  voltage: 12.5,
  current: 2.3,
  power: 28.75,
  energyToday: 0.145,
  timestamp: new Date().toISOString(),
  status: 'online' as const,
};

describe('TelemetryDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test: Should fetch and display telemetry on mount
   * Requirements: 14.7
   */
  it('should fetch and display telemetry on mount', async () => {
    // Mock successful API response
    vi.mocked(api.telemetry.getCurrent).mockResolvedValueOnce(mockTelemetryData);

    render(<TelemetryDisplay />);

    // Should show loading state initially
    expect(screen.getByText('Loading telemetry data...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('⚡ Real-Time System Status')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Should display all telemetry values
    expect(screen.getByText('12.50')).toBeInTheDocument(); // voltage
    expect(screen.getByText('2.30')).toBeInTheDocument(); // current
    expect(screen.getByText('28.75')).toBeInTheDocument(); // power
    expect(screen.getByText('0.145')).toBeInTheDocument(); // energy

    // Should show units
    expect(screen.getByText('V')).toBeInTheDocument(); // voltage unit
    expect(screen.getByText('A')).toBeInTheDocument(); // current unit
    expect(screen.getByText('W')).toBeInTheDocument(); // power unit
    expect(screen.getByText('kWh')).toBeInTheDocument(); // energy unit

    // Should show online status
    expect(screen.getByText('Online')).toBeInTheDocument();
  }, 15000);

  /**
   * Test: Should poll for updates at interval
   * Requirements: 14.7
   */
  it('should poll for updates at interval', async () => {
    vi.mocked(api.telemetry.getCurrent).mockResolvedValue(mockTelemetryData);
    vi.useFakeTimers();

    render(<TelemetryDisplay refreshInterval={5000} />);

    // Initial call on mount
    await waitFor(() => {
      expect(api.telemetry.getCurrent).toHaveBeenCalledTimes(1);
    });

    // Advance time by 5 seconds
    await vi.advanceTimersByTimeAsync(5000);

    // Should make second call
    await waitFor(() => {
      expect(api.telemetry.getCurrent).toHaveBeenCalledTimes(2);
    });

    // Advance time by another 5 seconds
    await vi.advanceTimersByTimeAsync(5000);

    // Should make third call
    await waitFor(() => {
      expect(api.telemetry.getCurrent).toHaveBeenCalledTimes(3);
    });

    vi.useRealTimers();
  }, 15000);

  /**
   * Test: Should display offline state
   * Requirements: 14.8
   */
  it('should display offline state on error', async () => {
    // Mock API error
    vi.mocked(api.telemetry.getCurrent).mockRejectedValueOnce(
      new Error('No recent sensor data available')
    );

    render(<TelemetryDisplay />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('System Offline')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Should display error message
    expect(screen.getByText('No recent sensor data available')).toBeInTheDocument();
  }, 15000);

  /**
   * Test: Should implement exponential backoff on errors
   * Requirements: 9.2
   */
  it('should implement exponential backoff on errors', async () => {
    // Mock API error
    vi.mocked(api.telemetry.getCurrent).mockRejectedValue(
      new Error('Connection failed')
    );
    vi.useFakeTimers();

    render(<TelemetryDisplay refreshInterval={10000} />);

    // Initial call fails
    await waitFor(() => {
      expect(api.telemetry.getCurrent).toHaveBeenCalledTimes(1);
    });

    // Wait for doubled interval (20s after error)
    await vi.advanceTimersByTimeAsync(20000);

    // Second call should happen after doubled interval
    await waitFor(() => {
      expect(api.telemetry.getCurrent).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  }, 15000);

  /**
   * Test: Should display last updated timestamp
   * Requirements: 9.2
   */
  it('should display last updated timestamp', async () => {
    // Mock data with timestamp 5 seconds ago
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    vi.mocked(api.telemetry.getCurrent).mockResolvedValueOnce({
      ...mockTelemetryData,
      timestamp: fiveSecondsAgo,
    });

    render(<TelemetryDisplay />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Updated \d+s ago/)).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000);

  /**
   * Test: Should show "just now" for recent updates
   * Requirements: 9.2
   */
  it('should show "just now" for very recent updates', async () => {
    // Mock data with current timestamp
    vi.mocked(api.telemetry.getCurrent).mockResolvedValueOnce({
      ...mockTelemetryData,
      timestamp: new Date().toISOString(),
    });

    render(<TelemetryDisplay />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Updated just now')).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000);

  /**
   * Test: Should recover from error state when API succeeds
   * Requirements: 3.8, 9.2
   */
  it('should recover from error state when API succeeds', async () => {
    // First call fails, second succeeds
    vi.mocked(api.telemetry.getCurrent)
      .mockRejectedValueOnce(new Error('Connection failed'))
      .mockResolvedValueOnce(mockTelemetryData);

    vi.useFakeTimers();

    render(<TelemetryDisplay />);

    // Should show offline state
    await waitFor(() => {
      expect(screen.getByText('System Offline')).toBeInTheDocument();
    });

    // Advance time to trigger retry (doubled interval = 20s)
    await vi.advanceTimersByTimeAsync(20000);

    // Should recover and show data
    await waitFor(() => {
      expect(screen.getByText('⚡ Real-Time System Status')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    vi.useRealTimers();
  }, 15000);

  /**
   * Test: Should cleanup interval on unmount
   * Requirements: 3.9
   */
  it('should cleanup interval on unmount', async () => {
    vi.mocked(api.telemetry.getCurrent).mockResolvedValue(mockTelemetryData);
    vi.useFakeTimers();

    const { unmount } = render(<TelemetryDisplay />);

    // Wait for initial load
    await waitFor(() => {
      expect(api.telemetry.getCurrent).toHaveBeenCalledTimes(1);
    });

    // Unmount component
    unmount();

    // Advance time significantly
    await vi.advanceTimersByTimeAsync(30000);

    // Should not make additional calls after unmount
    expect(api.telemetry.getCurrent).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  }, 15000);
});
