import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useDiagnosticHistory } from '../hooks/useDiagnostics';
import { DiagnosticResultStatus } from '@/types/diagnostic.types';
import type { DiagnosticTest } from '@/types/diagnostic.types';

/**
 * Diagnostic History Table Component
 * 
 * Displays paginated history of diagnostic tests with color-coded results.
 * Includes row click for detailed view and CSV export functionality.
 */
export function DiagnosticHistoryTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null);
  const limit = 20;

  const { data, isLoading, error } = useDiagnosticHistory(currentPage, limit);

  const getResultBadgeVariant = (result: string) => {
    switch (result) {
      case DiagnosticResultStatus.WITHIN_RANGE:
        return 'success';
      case DiagnosticResultStatus.ABOVE_EXPECTED:
        return 'warning';
      case DiagnosticResultStatus.BELOW_EXPECTED:
        return 'danger';
      default:
        return 'default';
    }
  };

  const handleExportCSV = () => {
    if (!data?.tests || data.tests.length === 0) return;

    // CSV Headers
    const headers = [
      'Date',
      'Performed By',
      'Expected Energy (Wh)',
      'Actual Energy (Wh)',
      'Difference (Wh)',
      'Performance (%)',
      'Result',
      'Notes',
    ];

    // CSV Rows
    const rows = data.tests.map((test) => [
      new Date(test.testDate).toLocaleString(),
      test.performedBy,
      test.expectedEnergy.toFixed(3),
      test.actualEnergy.toFixed(3),
      test.difference.toFixed(4),
      test.performancePercentage.toFixed(2),
      test.result,
      test.notes || '',
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnostic-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2A2E37] bg-white dark:bg-[#1C1F26] p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#E5E7EB] dark:bg-[#2A2E37] rounded w-1/4"></div>
          <div className="h-10 bg-[#E5E7EB] dark:bg-[#2A2E37] rounded"></div>
          <div className="h-10 bg-[#E5E7EB] dark:bg-[#2A2E37] rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm">
        <p className="text-sm text-red-800 dark:text-red-200">
          Failed to load diagnostic history. Please try again.
        </p>
      </div>
    );
  }

  if (!data?.tests || data.tests.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2A2E37] bg-white dark:bg-[#1C1F26] p-12 shadow-sm text-center">
        <FileText className="h-12 w-12 text-[#9CA3AF] dark:text-[#6B7280] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#1A1D23] dark:text-[#EDEEF0] mb-2">
          No diagnostic tests performed yet
        </h3>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
          Run your first diagnostic test above to start tracking system performance.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2A2E37] bg-white dark:bg-[#1C1F26] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2A2E37] flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1A1D23] dark:text-[#EDEEF0]">
            Diagnostic History
          </h3>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            {data.pagination.total} test{data.pagination.total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table - Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F5F6F8] dark:bg-[#2A2E37]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                Performed By
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                Expected (Wh)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                Actual (Wh)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                Difference (Wh)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                Performance (%)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2A2E37]">
            {data.tests.map((test) => (
              <tr
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className="hover:bg-[#F5F6F8] dark:hover:bg-[#2A2E37] cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1A1D23] dark:text-[#EDEEF0]">
                  {new Date(test.testDate).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                  {test.performedBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#1A1D23] dark:text-[#EDEEF0] font-medium">
                  {test.expectedEnergy.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#1A1D23] dark:text-[#EDEEF0] font-medium">
                  {test.actualEnergy.toFixed(3)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                  test.difference >= 0
                    ? 'text-[#2FBF71] dark:text-[#3ED98A]'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {test.difference >= 0 ? '+' : ''}{test.difference.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#1A1D23] dark:text-[#EDEEF0] font-medium">
                  {test.performancePercentage.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Badge variant={getResultBadgeVariant(test.result)}>
                    {test.result}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table - Mobile */}
      <div className="sm:hidden divide-y divide-[#E5E7EB] dark:divide-[#2A2E37]">
        {data.tests.map((test) => (
          <div
            key={test.id}
            onClick={() => setSelectedTest(test)}
            className="p-4 hover:bg-[#F5F6F8] dark:hover:bg-[#2A2E37] cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#1A1D23] dark:text-[#EDEEF0]">
                {new Date(test.testDate).toLocaleDateString()}
              </p>
              <Badge variant={getResultBadgeVariant(test.result)}>
                {test.result}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Expected: </span>
                <span className="font-medium text-[#1A1D23] dark:text-[#EDEEF0]">
                  {test.expectedEnergy.toFixed(3)} Wh
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Actual: </span>
                <span className="font-medium text-[#1A1D23] dark:text-[#EDEEF0]">
                  {test.actualEnergy.toFixed(3)} Wh
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Difference: </span>
                <span className={`font-medium ${
                  test.difference >= 0
                    ? 'text-[#2FBF71] dark:text-[#3ED98A]'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {test.difference >= 0 ? '+' : ''}{test.difference.toFixed(4)} Wh
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Performance: </span>
                <span className="font-medium text-[#1A1D23] dark:text-[#EDEEF0]">
                  {test.performancePercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#2A2E37] flex items-center justify-between">
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="ghost"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={currentPage === data.pagination.totalPages}
              variant="ghost"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTest && (
        <Dialog
          open={!!selectedTest}
          onClose={() => setSelectedTest(null)}
          title="Diagnostic Test Details"
          size="md"
        >
          <div className="space-y-6">
            {/* Test Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Test Date
                </p>
                <p className="text-sm text-[#1A1D23] dark:text-[#EDEEF0]">
                  {new Date(selectedTest.testDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Performed By
                </p>
                <p className="text-sm text-[#1A1D23] dark:text-[#EDEEF0]">
                  {selectedTest.performedBy}
                </p>
              </div>
            </div>

            {/* Result Badge */}
            <div className="flex items-center justify-center p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
              <Badge variant={getResultBadgeVariant(selectedTest.result)} className="text-base px-4 py-1">
                {selectedTest.result}
              </Badge>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Expected Energy
                </p>
                <p className="text-lg font-bold text-[#1A1D23] dark:text-[#EDEEF0]">
                  {selectedTest.expectedEnergy.toFixed(3)} Wh
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Actual Energy
                </p>
                <p className="text-lg font-bold text-[#1A1D23] dark:text-[#EDEEF0]">
                  {selectedTest.actualEnergy.toFixed(3)} Wh
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Difference
                </p>
                <p className={`text-lg font-bold ${
                  selectedTest.difference >= 0
                    ? 'text-[#2FBF71] dark:text-[#3ED98A]'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedTest.difference >= 0 ? '+' : ''}{selectedTest.difference.toFixed(4)} Wh
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Performance
                </p>
                <p className="text-lg font-bold text-[#1A1D23] dark:text-[#EDEEF0]">
                  {selectedTest.performancePercentage.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Reference Configuration */}
            <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
              <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                Reference Configuration Used
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[#1A1D23] dark:text-[#EDEEF0] font-medium">
                    {selectedTest.referenceConfig.appliedWeightKg} kg
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Applied Weight</p>
                </div>
                <div>
                  <p className="text-[#1A1D23] dark:text-[#EDEEF0] font-medium">
                    {selectedTest.referenceConfig.expectedEnergyWh} Wh
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Expected Energy</p>
                </div>
                <div>
                  <p className="text-[#1A1D23] dark:text-[#EDEEF0] font-medium">
                    ±{selectedTest.referenceConfig.tolerancePercent}%
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Tolerance</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedTest.notes && (
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                  Notes
                </p>
                <p className="text-sm text-[#1A1D23] dark:text-[#EDEEF0]">
                  {selectedTest.notes}
                </p>
              </div>
            )}

            {/* Close Button */}
            <Button onClick={() => setSelectedTest(null)} variant="primary" fullWidth>
              Close
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
