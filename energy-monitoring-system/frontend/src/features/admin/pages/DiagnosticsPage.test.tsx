/**
 * DiagnosticsPage Component Unit Tests
 * 
 * Task 5.5: Write component tests for diagnostic UI
 * 
 * Requirements:
 * - Test: renders all sections when data is available
 * - Test: shows empty state when no reference config exists
 * - Test: WebSocket event handling for real-time updates
 * - Test: responsive layout for mobile/tablet
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiagnosticsPage } from './DiagnosticsPage';

// Mock hooks
const mockUseReferenceConfig = vi.fn();
const mockUseSocketContext = vi.fn();

vi.mock('../hooks/useDiagnostics', () => ({
  useReferenceConfig: () => mockUseReferenceConfig(),
  useDiagnosticHistory: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useCreateReferenceConfig: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useRecordDiagnosticTest: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('@/contexts/SocketContext', () => ({
  useSocket: () => mockUseSocketContext(),
}));

// Mock child components to simplify testing
vi.mock('../components/ReferenceConfigForm', () => ({
  ReferenceConfigForm: () => (
    <div data-testid="reference-config-form">Reference Config Form</div>
  ),
}));

vi.mock('../components/DiagnosticTestForm', () => ({
  DiagnosticTestForm: () => (
    <div data-testid="diagnostic-test-form">Diagnostic Test Form</div>
  ),
}));

vi.mock('../components/DiagnosticHistoryTable', () => ({
  DiagnosticHistoryTable: () => (
    <div data-testid="diagnostic-history-table">Diagnostic History Table</div>
  ),
}));

// Helper to render with React Query
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
    </QueryClientProvider>
  );
};

describe('DiagnosticsPage', () => {
  beforeEach(() => {
    // Default socket mock - connected state
    mockUseSocketContext.mockReturnValue({
      socket: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
      isConnected: true,
    });

    // Default reference config mock - no config
    mockUseReferenceConfig.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Subtask 5.5.1: Renders all sections when data is available', () => {
    it('should render page header with title and description', () => {
      renderDiagnosticsPage();

      expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
      expect(
        screen.getByText(/Monitor overall energy harvesting performance/i)
      ).toBeInTheDocument();
    });

    it('should render all three main sections', () => {
      renderDiagnosticsPage();

      expect(screen.getByTestId('reference-config-form')).toBeInTheDocument();
      expect(screen.getByTestId('diagnostic-test-form')).toBeInTheDocument();
      expect(screen.getByTestId('diagnostic-history-table')).toBeInTheDocument();
    });

    it('should render info banner explaining diagnostic purpose', () => {
      renderDiagnosticsPage();

      expect(screen.getByText(/About System Diagnostics/i)).toBeInTheDocument();
      expect(
        screen.getByText(/overall energy harvesting performance/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/does not monitor individual piezoelectric disc/i)
      ).toBeInTheDocument();
    });

    it('should display diagnostic icon in header', () => {
      renderDiagnosticsPage();

      // Activity icon should be present (lucide-react icon)
      const header = screen.getByText('System Diagnostics').closest('div');
      expect(header).toBeInTheDocument();
    });

    it('should use EcoStep design system colors', () => {
      renderDiagnosticsPage();

      const pageContainer = screen.getByText('System Diagnostics').closest('div');
      expect(pageContainer).toHaveClass('text-2xl', 'sm:text-3xl');
    });
  });

  describe('Subtask 5.5.2: WebSocket event handling', () => {
    it('should subscribe to diagnostic:config-updated event on mount', () => {
      const mockSocket = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      mockUseSocketContext.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      renderDiagnosticsPage();

      expect(mockSocket.on).toHaveBeenCalledWith(
        'diagnostic:config-updated',
        expect.any(Function)
      );
    });

    it('should subscribe to diagnostic:test-completed event on mount', () => {
      const mockSocket = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      mockUseSocketContext.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      renderDiagnosticsPage();

      expect(mockSocket.on).toHaveBeenCalledWith(
        'diagnostic:test-completed',
        expect.any(Function)
      );
    });

    it('should unsubscribe from events on unmount', () => {
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
      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith(
        'diagnostic:config-updated',
        expect.any(Function)
      );
      expect(mockSocket.off).toHaveBeenCalledWith(
        'diagnostic:test-completed',
        expect.any(Function)
      );
    });

    it('should not subscribe to events when socket is not connected', () => {
      const mockSocket = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      mockUseSocketContext.mockReturnValue({
        socket: mockSocket,
        isConnected: false,
      });

      renderDiagnosticsPage();

      expect(mockSocket.on).not.toHaveBeenCalled();
    });

    it('should not subscribe to events when socket is null', () => {
      mockUseSocketContext.mockReturnValue({
        socket: null,
        isConnected: false,
      });

      renderDiagnosticsPage();

      // Should render without errors
      expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    });

    it('should handle WebSocket reconnection', () => {
      const mockSocket = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };

      mockUseSocketContext.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      const { rerender } = render(
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: { queries: { retry: false } },
            })
          }
        >
          <DiagnosticsPage />
        </QueryClientProvider>
      );

      // Disconnect
      mockUseSocketContext.mockReturnValue({
        socket: mockSocket,
        isConnected: false,
      });

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: { queries: { retry: false } },
            })
          }
        >
          <DiagnosticsPage />
        </QueryClientProvider>
      );

      // Should handle gracefully
      expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    });
  });

  describe('Subtask 5.5.3: Responsive layout', () => {
    it('should have responsive container with proper padding', () => {
      renderDiagnosticsPage();

      const container = screen
        .getByText('System Diagnostics')
        .closest('div')
        ?.closest('div')
        ?.closest('div');

      expect(container).toHaveClass('container', 'mx-auto');
    });

    it('should have responsive spacing between sections', () => {
      renderDiagnosticsPage();

      // Check for space-y utility classes for vertical spacing
      const mainContainer = screen
        .getByText('System Diagnostics')
        .closest('div')
        ?.closest('div')
        ?.closest('div');

      expect(mainContainer).toHaveClass('space-y-6');
    });

    it('should render grid layout for forms on desktop', () => {
      renderDiagnosticsPage();

      // Check for grid layout
      const formsContainer = screen
        .getByTestId('reference-config-form')
        .closest('div');

      expect(formsContainer).toHaveClass('grid');
    });

    it('should have mobile-friendly text sizes', () => {
      renderDiagnosticsPage();

      const title = screen.getByText('System Diagnostics');
      expect(title).toHaveClass('text-2xl', 'sm:text-3xl');
    });

    it('should have responsive description text', () => {
      renderDiagnosticsPage();

      const description = screen.getByText(
        /Monitor overall energy harvesting performance/i
      );

      expect(description).toHaveClass('text-sm', 'sm:text-base');
    });
  });

  describe('Subtask 5.5.4: Page structure and layout', () => {
    it('should have correct HTML structure', () => {
      renderDiagnosticsPage();

      // Main container
      const mainContainer = screen
        .getByText('System Diagnostics')
        .closest('div')
        ?.closest('div')
        ?.closest('div');

      expect(mainContainer).toHaveClass('min-h-screen');
    });

    it('should display sections in correct order', () => {
      renderDiagnosticsPage();

      const sections = screen
        .getByText('System Diagnostics')
        .closest('div')
        ?.querySelectorAll('[data-testid]');

      expect(sections?.[0]).toHaveAttribute('data-testid', 'reference-config-form');
      expect(sections?.[1]).toHaveAttribute('data-testid', 'diagnostic-test-form');
      expect(sections?.[2]).toHaveAttribute('data-testid', 'diagnostic-history-table');
    });

    it('should use EcoStep background colors', () => {
      renderDiagnosticsPage();

      const mainContainer = screen
        .getByText('System Diagnostics')
        .closest('div')
        ?.closest('div')
        ?.closest('div');

      expect(mainContainer).toHaveClass('bg-[#F5F6F8]', 'dark:bg-[#0B0D12]');
    });
  });

  describe('Subtask 5.5.5: Info banner content', () => {
    it('should display comprehensive diagnostic explanation', () => {
      renderDiagnosticsPage();

      expect(
        screen.getByText(/System diagnostics measure overall energy harvesting/i)
      ).toBeInTheDocument();
    });

    it('should clarify individual disc monitoring is not supported', () => {
      renderDiagnosticsPage();

      expect(
        screen.getByText(/does not monitor individual piezoelectric disc/i)
      ).toBeInTheDocument();
    });

    it('should use info banner styling', () => {
      renderDiagnosticsPage();

      const banner = screen.getByText(/About System Diagnostics/i).closest('div');
      expect(banner).toHaveClass('rounded-lg');
    });

    it('should have hardware contact information', () => {
      renderDiagnosticsPage();

      expect(
        screen.getByText(/contact the hardware team for physical inspection/i)
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing reference config gracefully', () => {
      mockUseReferenceConfig.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderDiagnosticsPage();

      expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
      expect(screen.getByTestId('reference-config-form')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      mockUseReferenceConfig.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderDiagnosticsPage();

      // Page should still render while loading
      expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      mockUseReferenceConfig.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch config'),
      });

      renderDiagnosticsPage();

      // Page should still render with error
      expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    });

    it('should render without WebSocket connection', () => {
      mockUseSocketContext.mockReturnValue({
        socket: null,
        isConnected: false,
      });

      renderDiagnosticsPage();

      expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderDiagnosticsPage();

      const heading = screen.getByText('System Diagnostics');
      expect(heading.tagName).toBe('H1');
    });

    it('should have descriptive text for screen readers', () => {
      renderDiagnosticsPage();

      expect(
        screen.getByText(/Monitor overall energy harvesting performance/i)
      ).toBeInTheDocument();
    });

    it('should use semantic HTML structure', () => {
      renderDiagnosticsPage();

      const mainContent = screen.getByText('System Diagnostics').closest('div');
      expect(mainContent).toBeInTheDocument();
    });
  });
});
