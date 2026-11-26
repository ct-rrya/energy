import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiagnosticsPage } from './DiagnosticsPage';

const mockUseSocketContext = vi.fn();
const mockUseDiagnosticInsights = vi.fn();

vi.mock('@/contexts/SocketContext', () => ({
  useSocket: () => mockUseSocketContext(),
}));

vi.mock('@/contexts/HardwareStatusContext', () => ({
  useHardwareStatus: () => ({ status: 'online' }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('../hooks/useDiagnostics', () => ({
  useDiagnosticInsights: () => mockUseDiagnosticInsights(),
}));

vi.mock('../components/HardwarePipelineCard', () => ({
  HardwarePipelineCard: () => (
    <div data-testid="hardware-pipeline-card">Hardware Pipeline Card</div>
  ),
}));

vi.mock('../components/DiagnosticWorkbenchCard', () => ({
  DiagnosticWorkbenchCard: ({ onOpenHistory }: { onOpenHistory?: () => void }) => (
    <div data-testid="diagnostic-workbench-card">
      Diagnostic Workbench Card
      {onOpenHistory && (
        <button type="button" onClick={onOpenHistory}>
          History
        </button>
      )}
    </div>
  ),
}));

vi.mock('../components/FatigueDriftRadarCard', () => ({
  FatigueDriftRadarCard: () => (
    <div data-testid="fatigue-drift-radar-card">Fatigue Drift Radar Card</div>
  ),
}));

vi.mock('../components/DiagnosticHistoryTable', () => ({
  DiagnosticHistoryTable: () => (
    <div data-testid="diagnostic-history-table">Diagnostic History Table</div>
  ),
}));

const renderDiagnosticsPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DiagnosticsPage />
    </QueryClientProvider>,
  );
};

describe('DiagnosticsPage', () => {
  beforeEach(() => {
    mockUseSocketContext.mockReturnValue({
      socket: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
      isConnected: true,
    });

    mockUseDiagnosticInsights.mockReturnValue({
      data: {
        healthScore: 94,
        status: 'healthy',
        scoreBreakdown: { harvesting: 95, consistency: 92, telemetry: 96 },
        pipelineStages: [],
        faultDiagnosis: {
          code: 'NOMINAL',
          severity: 'healthy',
          title: 'All Hardware & Telemetry Signatures Nominal',
          summary: 'Nominal',
          probableCause: 'None',
          recommendedChecks: [],
        },
        fatigueRadar: {
          baseline30dMWhPerStep: 0.005,
          recent7dMWhPerStep: 0.0051,
          driftPercent: 2.0,
          driftStatus: 'stable',
          totalLifetimeSteps: 1200,
          stepsLast7d: 240,
          readingsLast24h: 14,
          avgLatencyMs: 320,
          poorSignalRatioPercent: 0,
          lastReadingAt: new Date().toISOString(),
          dailyTrend: [],
          electricalSnapshot: {
            latestVoltageV: 4.1,
            latestCurrentMA: 8.5,
            latestPowerMW: 34.8,
            latestEnergyMWh: 0.05,
            latestSteps: 10,
            avgVoltage7dV: 4.0,
            avgCurrent7dMA: 8.2,
          },
        },
        generatedAt: new Date().toISOString(),
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and 3 main workbench sections with history collapsed into a modal', async () => {
    const user = userEvent.setup();
    renderDiagnosticsPage();

    expect(screen.getByText('Tile Performance Diagnostics')).toBeInTheDocument();
    expect(screen.getByTestId('hardware-pipeline-card')).toBeInTheDocument();
    expect(screen.getByTestId('diagnostic-workbench-card')).toBeInTheDocument();
    expect(screen.getByTestId('fatigue-drift-radar-card')).toBeInTheDocument();
    expect(screen.queryByTestId('diagnostic-history-table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'History' }));
    expect(screen.getByTestId('diagnostic-history-table')).toBeInTheDocument();
  });

  it('subscribes to live diagnostic and reading WebSocket events and cleans up on unmount', () => {
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };

    mockUseSocketContext.mockReturnValue({
      socket: mockSocket,
      isConnected: true,
    });

    const { unmount } = renderDiagnosticsPage();

    expect(mockSocket.on).toHaveBeenCalledWith('diagnostic:test-completed', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('diagnostic:daily-task-updated', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reading:new', expect.any(Function));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('diagnostic:test-completed', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('reading:new', expect.any(Function));
  });
});
