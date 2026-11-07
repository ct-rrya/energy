import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { HardwareStatusProvider, useHardwareStatus } from './HardwareStatusContext';
import apiClient from '@/api/client';

// Mock SocketContext
vi.mock('./SocketContext', () => ({
  useSocket: () => ({
    socket: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isConnected: true,
  }),
}));

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

// Mock apiClient
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

function TestConsumer() {
  const { status, statusLabel, markHardwareConnected, markHardwareDisconnected } = useHardwareStatus();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="statusLabel">{statusLabel}</span>
      <button onClick={() => markHardwareConnected()} data-testid="btn-connect">Connect</button>
      <button onClick={() => markHardwareDisconnected()} data-testid="btn-disconnect">Disconnect</button>
    </div>
  );
}

describe('HardwareStatusContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('initializes in waiting state when no hardware has ever connected', async () => {
    render(
      <HardwareStatusProvider>
        <TestConsumer />
      </HardwareStatusProvider>
    );

    expect(screen.getByTestId('status').textContent).toBe('waiting');
    expect(screen.getByTestId('statusLabel').textContent).toBe('Waiting for hardware connection');
  });

  it('transitions to Connected when telemetry arrives', async () => {
    render(
      <HardwareStatusProvider>
        <TestConsumer />
      </HardwareStatusProvider>
    );

    act(() => {
      screen.getByTestId('btn-connect').click();
    });

    expect(screen.getByTestId('status').textContent).toBe('connected');
    expect(screen.getByTestId('statusLabel').textContent).toBe('Connected');
  });

  it('transitions to Connection Lost when connection is lost', async () => {
    render(
      <HardwareStatusProvider>
        <TestConsumer />
      </HardwareStatusProvider>
    );

    act(() => {
      screen.getByTestId('btn-connect').click();
    });
    expect(screen.getByTestId('status').textContent).toBe('connected');

    act(() => {
      screen.getByTestId('btn-disconnect').click();
    });
    expect(screen.getByTestId('status').textContent).toBe('disconnected');
    expect(screen.getByTestId('statusLabel').textContent).toBe('Connection Lost');
  });

  it('sets Connected status if initial reading from API is fresh (< 60s)', async () => {
    const recentDate = new Date(Date.now() - 5000).toISOString();
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [{
        sensorId: 'sensor-1',
        voltage: 3.3,
        current: 12.5,
        power: 41.25,
        energy: 0.15,
        stepCount: 10,
        timestamp: recentDate,
      }],
    });

    render(
      <HardwareStatusProvider>
        <TestConsumer />
      </HardwareStatusProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('status').textContent).toBe('connected');
    expect(screen.getByTestId('statusLabel').textContent).toBe('Connected');
  });
});

