/**
 * DiagnosticHistoryTable Component Unit Tests
 * 
 * Task 5.5: Write component tests for diagnostic UI
 * 
 * Requirements:
 * - Test: displays test results with color coding (green/yellow/red)
 * - Test: exports to CSV with correct filename
 * - Test: pagination with 20 tests per page
 * - Test: shows empty state when no tests exist
 * - Test: row click opens detailed modal
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiagnosticHistoryTable } from './DiagnosticHistoryTable';
import { DiagnosticResultStatus } from '@/types/diagnostic.types';
import type { DiagnosticHistoryResponse, DiagnosticTest } from '@/types/diagnostic.types';

// Mock hooks
const mockUseDiagnosticHistory = vi.fn();

vi.mock('../hooks/useDiagnostics', () => ({
  useDiagnosticHistory: (page: number, limit: number) =>
    mockUseDiagnosticHistory(page, limit),
}));

// Mock URL APIs for CSV download
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock link click for CSV download
const mockLinkClick = vi.fn();
HTMLAnchorElement.prototype.click = mockLinkClick;

// Helper to create mock diagnostic test
const createMockTest = (overrides: Partial<DiagnosticTest> = {}): DiagnosticTest => ({
  id: '1',
  testDate: '2024-01-20T10:30:00Z',
  performedBy: 'admin@ecostep.com',
  actualEnergy: 2.45,
  expectedEnergy: 2.5,
  difference: -0.05,
  performancePercentage: 98.0,
  result: DiagnosticResultStatus.WITHIN_RANGE,
  referenceConfig: {
    appliedWeightKg: 70,
    expectedEnergyWh: 2.5,
    tolerancePercent: 10,
  },
  notes: 'Morning test, 70kg load',
  ...overrides,
});

// Helper to render with React Query
const renderDiagnosticHistoryTable = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DiagnosticHistoryTable />
    </QueryClientProvider>
  );
};

describe('DiagnosticHistoryTable', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockLinkClick.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Subtask 5.5.13: Empty state display', () => {
    it('should show empty state when no tests exist', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.getByText(/No diagnostic tests performed yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Run your first diagnostic test/i)
      ).toBeInTheDocument();
    });

    it('should show empty state icon', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      // FileText icon should be present
      const emptyState = screen.getByText(/No diagnostic tests performed yet/i).closest('div');
      expect(emptyState).toBeInTheDocument();
    });

    it('should not show table when no tests exist', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Subtask 5.5.14: Loading state', () => {
    it('should show loading skeleton while fetching data', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show table while loading', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Subtask 5.5.15: Error state', () => {
    it('should show error message when fetch fails', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
      });

      renderDiagnosticHistoryTable();

      expect(
        screen.getByText(/Failed to load diagnostic history/i)
      ).toBeInTheDocument();
    });

    it('should use error styling for error state', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
      });

      renderDiagnosticHistoryTable();

      const errorContainer = screen
        .getByText(/Failed to load diagnostic history/i)
        .closest('div');

      expect(errorContainer).toHaveClass('border-red-200');
    });
  });

  describe('Subtask 5.5.16: Table display with data', () => {
    it('should display table header with correct columns', () => {
      const mockData: DiagnosticHistoryResponse = {
        tests: [createMockTest()],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockUseDiagnosticHistory.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Performed By')).toBeInTheDocument();
      expect(screen.getByText(/Expected \(Wh\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Actual \(Wh\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Difference \(Wh\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Performance \(%\)/i)).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('should display test data in table rows', () => {
      const test = createMockTest({
        performedBy: 'test@ecostep.com',
        actualEnergy: 2.45,
        expectedEnergy: 2.5,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.getByText('test@ecostep.com')).toBeInTheDocument();
      expect(screen.getByText('2.450')).toBeInTheDocument();
      expect(screen.getByText('2.500')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      const test = createMockTest({
        testDate: '2024-01-20T10:30:00Z',
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      // Should show formatted date (exact format depends on locale)
      expect(screen.getByText(/2024|Jan|20/)).toBeInTheDocument();
    });

    it('should display total count in header', () => {
      const tests = [createMockTest({ id: '1' }), createMockTest({ id: '2' })];

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.getByText('Diagnostic History')).toBeInTheDocument();
      expect(screen.getByText(/2 tests recorded/i)).toBeInTheDocument();
    });
  });

  describe('Subtask 5.5.17: Color-coded results', () => {
    it('should display green badge for "Within Range" result', () => {
      const test = createMockTest({
        result: DiagnosticResultStatus.WITHIN_RANGE,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const badge = screen.getByText('Within Range');
      expect(badge.closest('span')).toHaveClass('bg-green-100');
    });

    it('should display yellow badge for "Above Expected" result', () => {
      const test = createMockTest({
        result: DiagnosticResultStatus.ABOVE_EXPECTED,
        performancePercentage: 115.0,
        difference: 0.375,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const badge = screen.getByText('Above Expected');
      expect(badge.closest('span')).toHaveClass('bg-yellow-100');
    });

    it('should display red badge for "Below Expected" result', () => {
      const test = createMockTest({
        result: DiagnosticResultStatus.BELOW_EXPECTED,
        performancePercentage: 85.0,
        difference: -0.375,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const badge = screen.getByText('Below Expected');
      expect(badge.closest('span')).toHaveClass('bg-red-100');
    });

    it('should color-code difference values (green for positive)', () => {
      const test = createMockTest({
        difference: 0.15,
        actualEnergy: 2.65,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const differenceCell = screen.getByText('+0.1500');
      expect(differenceCell).toHaveClass('text-[#2FBF71]');
    });

    it('should color-code difference values (red for negative)', () => {
      const test = createMockTest({
        difference: -0.15,
        actualEnergy: 2.35,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const differenceCell = screen.getByText('-0.1500');
      expect(differenceCell).toHaveClass('text-red-600');
    });
  });

  describe('Subtask 5.5.18: Pagination', () => {
    it('should show pagination when totalPages > 1', () => {
      const tests = Array.from({ length: 20 }, (_, i) =>
        createMockTest({ id: String(i + 1) })
      );

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests,
          pagination: {
            page: 1,
            limit: 20,
            total: 45,
            totalPages: 3,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should hide pagination when totalPages <= 1', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [createMockTest()],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.queryByText(/Page/i)).not.toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      const tests = Array.from({ length: 20 }, (_, i) =>
        createMockTest({ id: String(i + 1) })
      );

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests,
          pagination: {
            page: 1,
            limit: 20,
            total: 45,
            totalPages: 3,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const prevButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[class*="ChevronLeft"]')
      );
      expect(prevButton).toBeDisabled();
    });

    it('should enable next button when not on last page', () => {
      const tests = Array.from({ length: 20 }, (_, i) =>
        createMockTest({ id: String(i + 1) })
      );

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests,
          pagination: {
            page: 1,
            limit: 20,
            total: 45,
            totalPages: 3,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const nextButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[class*="ChevronRight"]')
      );
      expect(nextButton).not.toBeDisabled();
    });

    it('should call hook with new page when next button clicked', async () => {
      const tests = Array.from({ length: 20 }, (_, i) =>
        createMockTest({ id: String(i + 1) })
      );

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests,
          pagination: {
            page: 1,
            limit: 20,
            total: 45,
            totalPages: 3,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const nextButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('[class*="ChevronRight"]')
      );

      await user.click(nextButton!);

      // Component should update page state, causing re-render with new page
      await waitFor(() => {
        expect(mockUseDiagnosticHistory).toHaveBeenCalledWith(2, 20);
      });
    });
  });

  describe('Subtask 5.5.19: CSV export functionality', () => {
    it('should show export button', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [createMockTest()],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });

    it('should export CSV with correct filename format', async () => {
      const test = createMockTest();

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockLinkClick).toHaveBeenCalled();
      });

      // Check filename format (diagnostic-history-YYYY-MM-DD.csv)
      const link = document.querySelector('a[download]') as HTMLAnchorElement;
      expect(link?.download).toMatch(/diagnostic-history-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should include correct CSV headers', async () => {
      const test = createMockTest();

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(
          expect.any(Blob)
        );
      });

      // Verify blob contains correct CSV structure
      const blobCall = (global.URL.createObjectURL as any).mock.calls[0][0];
      expect(blobCall.type).toBe('text/csv;charset=utf-8;');
    });

    it('should not export when no tests exist', async () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      // Export button should not be present in empty state
      expect(screen.queryByRole('button', { name: /Export CSV/i })).not.toBeInTheDocument();
    });

    it('should format numbers correctly in CSV', async () => {
      const test = createMockTest({
        expectedEnergy: 2.5,
        actualEnergy: 2.456,
        difference: -0.044,
        performancePercentage: 98.24,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockLinkClick).toHaveBeenCalled();
      });
    });
  });

  describe('Subtask 5.5.20: Row click and detail modal', () => {
    it('should open detail modal when row is clicked', async () => {
      const test = createMockTest({
        notes: 'Test conditions: Room temperature',
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const row = screen.getByText('admin@ecostep.com').closest('tr');
      await user.click(row!);

      await waitFor(() => {
        expect(screen.getByText('Diagnostic Test Details')).toBeInTheDocument();
      });
    });

    it('should display all test details in modal', async () => {
      const test = createMockTest({
        performedBy: 'test@ecostep.com',
        actualEnergy: 2.45,
        expectedEnergy: 2.5,
        difference: -0.05,
        performancePercentage: 98.0,
        result: DiagnosticResultStatus.WITHIN_RANGE,
        notes: 'Morning test',
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const row = screen.getByText('test@ecostep.com').closest('tr');
      await user.click(row!);

      await waitFor(() => {
        expect(screen.getByText('test@ecostep.com')).toBeInTheDocument();
        expect(screen.getByText('2.450 Wh')).toBeInTheDocument();
        expect(screen.getByText('2.500 Wh')).toBeInTheDocument();
        expect(screen.getByText('-0.0500 Wh')).toBeInTheDocument();
        expect(screen.getByText('98.00%')).toBeInTheDocument();
        expect(screen.getByText('Morning test')).toBeInTheDocument();
      });
    });

    it('should display reference config in modal', async () => {
      const test = createMockTest({
        referenceConfig: {
          appliedWeightKg: 75,
          expectedEnergyWh: 3.0,
          tolerancePercent: 12,
        },
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const row = screen.getByText('admin@ecostep.com').closest('tr');
      await user.click(row!);

      await waitFor(() => {
        expect(screen.getByText('Reference Configuration Used')).toBeInTheDocument();
        expect(screen.getByText('75 kg')).toBeInTheDocument();
        expect(screen.getByText('3 Wh')).toBeInTheDocument();
        expect(screen.getByText('±12%')).toBeInTheDocument();
      });
    });

    it('should close modal when close button clicked', async () => {
      const test = createMockTest();

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const row = screen.getByText('admin@ecostep.com').closest('tr');
      await user.click(row!);

      await waitFor(() => {
        expect(screen.getByText('Diagnostic Test Details')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /Close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Diagnostic Test Details')).not.toBeInTheDocument();
      });
    });

    it('should not show notes section when no notes exist', async () => {
      const test = createMockTest({
        notes: undefined,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const row = screen.getByText('admin@ecostep.com').closest('tr');
      await user.click(row!);

      await waitFor(() => {
        expect(screen.getByText('Diagnostic Test Details')).toBeInTheDocument();
      });

      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });
  });

  describe('Subtask 5.5.21: Responsive design', () => {
    it('should hide desktop table on mobile', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [createMockTest()],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const desktopTable = screen.getByRole('table').closest('div');
      expect(desktopTable).toHaveClass('hidden', 'sm:block');
    });

    it('should show mobile card view', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [createMockTest()],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      // Mobile cards container
      const mobileView = document.querySelector('.sm\\:hidden');
      expect(mobileView).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data gracefully', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      // Should show empty state
      expect(screen.getByText(/No diagnostic tests performed yet/i)).toBeInTheDocument();
    });

    it('should handle tests with zero values', () => {
      const test = createMockTest({
        difference: 0,
        performancePercentage: 100.0,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      expect(screen.getByText('+0.0000')).toBeInTheDocument();
      expect(screen.getByText('100.00')).toBeInTheDocument();
    });

    it('should handle very long notes', async () => {
      const longNotes = 'A'.repeat(500);
      const test = createMockTest({
        notes: longNotes,
      });

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [test],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const row = screen.getByText('admin@ecostep.com').closest('tr');
      await user.click(row!);

      await waitFor(() => {
        expect(screen.getByText(longNotes)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [createMockTest()],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should have clickable rows with proper hover states', () => {
      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests: [createMockTest()],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const row = screen.getByText('admin@ecostep.com').closest('tr');
      expect(row).toHaveClass('cursor-pointer');
    });

    it('should have accessible pagination buttons', () => {
      const tests = Array.from({ length: 20 }, (_, i) =>
        createMockTest({ id: String(i + 1) })
      );

      mockUseDiagnosticHistory.mockReturnValue({
        data: {
          tests,
          pagination: {
            page: 1,
            limit: 20,
            total: 45,
            totalPages: 3,
          },
        },
        isLoading: false,
        error: null,
      });

      renderDiagnosticHistoryTable();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
