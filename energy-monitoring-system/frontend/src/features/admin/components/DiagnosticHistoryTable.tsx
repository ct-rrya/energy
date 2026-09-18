import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors, TYPOGRAPHY } from '@/lib/theme';
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
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

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
      <div 
        className="rounded-lg p-6"
        style={{
          backgroundColor: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow
        }}
      >
        <div className="animate-pulse space-y-4">
          <div 
            className="h-4 rounded w-1/4"
            style={{ backgroundColor: colors.hoverBackground }}
          ></div>
          <div 
            className="h-10 rounded"
            style={{ backgroundColor: colors.hoverBackground }}
          ></div>
          <div 
            className="h-10 rounded"
            style={{ backgroundColor: colors.hoverBackground }}
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="rounded-lg p-6"
        style={{
          backgroundColor: theme === 'light' ? '#FEF2F2' : 'rgba(127, 29, 29, 0.2)',
          border: `1px solid ${theme === 'light' ? '#FCA5A5' : '#991B1B'}`,
          boxShadow: colors.shadow
        }}
      >
        <p 
          className="text-sm"
          style={{ color: theme === 'light' ? '#991B1B' : '#FCA5A5' }}
        >
          Failed to load diagnostic history. Please try again.
        </p>
      </div>
    );
  }

  if (!data?.tests || data.tests.length === 0) {
    return (
      <div 
        className="rounded-lg p-12 text-center"
        style={{
          backgroundColor: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow
        }}
      >
        <FileText 
          className="h-12 w-12 mx-auto mb-4"
          style={{ color: colors.textMuted }}
        />
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ 
            color: colors.textPrimary,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }}
        >
          No diagnostic tests performed yet
        </h3>
        <p 
          className="text-sm"
          style={{ color: colors.textSecondary }}
        >
          Run your first diagnostic test above to start tracking system performance.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: colors.cardBackground,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow
      }}
    >
      {/* Header */}
      <div 
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div>
          <h3 
            className="text-lg font-semibold"
            style={{ 
              color: colors.textPrimary,
              fontWeight: TYPOGRAPHY.fontWeight.semibold
            }}
          >
            Diagnostic History
          </h3>
          <p 
            className="text-sm mt-1"
            style={{ color: colors.textSecondary }}
          >
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

      {/* Table Container - Prevents horizontal page overflow */}
      <div className="w-full overflow-x-auto">
        {/* Table - Desktop */}
        <div className="hidden sm:block min-w-full">
          <table className="w-full" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
            <thead style={{ backgroundColor: colors.hoverBackground }}>
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ 
                    color: colors.textSecondary,
                    width: '180px'
                  }}
                >
                  Date
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ 
                    color: colors.textSecondary,
                    width: '200px'
                  }}
                >
                  Performed By
                </th>
                <th 
                  className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ 
                    color: colors.textSecondary,
                    width: '110px'
                  }}
                >
                  Expected (Wh)
                </th>
                <th 
                  className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ 
                    color: colors.textSecondary,
                    width: '110px'
                  }}
                >
                  Actual (Wh)
                </th>
                <th 
                  className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ 
                    color: colors.textSecondary,
                    width: '120px'
                  }}
                >
                  Difference (Wh)
                </th>
                <th 
                  className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ 
                    color: colors.textSecondary,
                    width: '110px'
                  }}
                >
                  Performance (%)
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ 
                    color: colors.textSecondary,
                    width: '170px'
                  }}
                >
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {data.tests.map((test, index) => (
                <tr
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderTop: index > 0 ? `1px solid ${colors.border}` : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.hoverBackground;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td 
                    className="px-4 py-4 text-sm"
                    style={{ color: colors.textPrimary }}
                  >
                    {new Date(test.testDate).toLocaleString()}
                  </td>
                  <td 
                    className="px-4 py-4 text-sm overflow-hidden text-ellipsis"
                    style={{ color: colors.textSecondary }}
                  >
                    {test.performedBy}
                  </td>
                  <td 
                    className="px-3 py-4 text-sm text-right font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {test.expectedEnergy.toFixed(3)}
                  </td>
                  <td 
                    className="px-3 py-4 text-sm text-right font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {test.actualEnergy.toFixed(3)}
                  </td>
                  <td 
                    className="px-3 py-4 text-sm text-right font-medium"
                    style={{ 
                      color: test.difference >= 0 ? colors.accent : colors.error
                    }}
                  >
                    {test.difference >= 0 ? '+' : ''}{test.difference.toFixed(4)}
                  </td>
                  <td 
                    className="px-3 py-4 text-sm text-right font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {test.performancePercentage.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
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
        <div 
          className="sm:hidden"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          {data.tests.map((test, index) => (
            <div
              key={test.id}
              onClick={() => setSelectedTest(test)}
              className="p-4 cursor-pointer transition-colors"
              style={{
                borderTop: index > 0 ? `1px solid ${colors.border}` : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.hoverBackground;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {new Date(test.testDate).toLocaleDateString()}
                </p>
                <Badge variant={getResultBadgeVariant(test.result)}>
                  {test.result}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span style={{ color: colors.textSecondary }}>Expected: </span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {test.expectedEnergy.toFixed(3)} Wh
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.textSecondary }}>Actual: </span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {test.actualEnergy.toFixed(3)} Wh
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.textSecondary }}>Difference: </span>
                  <span 
                    className="font-medium"
                    style={{ 
                      color: test.difference >= 0 ? colors.accent : colors.error
                    }}
                  >
                    {test.difference >= 0 ? '+' : ''}{test.difference.toFixed(4)} Wh
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.textSecondary }}>Performance: </span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {test.performancePercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <p 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
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
                <p 
                  className="text-xs font-medium mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Test Date
                </p>
                <p 
                  className="text-sm"
                  style={{ color: colors.textPrimary }}
                >
                  {new Date(selectedTest.testDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p 
                  className="text-xs font-medium mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Performed By
                </p>
                <p 
                  className="text-sm"
                  style={{ color: colors.textPrimary }}
                >
                  {selectedTest.performedBy}
                </p>
              </div>
            </div>

            {/* Result Badge */}
            <div 
              className="flex items-center justify-center p-4 rounded-lg"
              style={{ backgroundColor: colors.hoverBackground }}
            >
              <Badge variant={getResultBadgeVariant(selectedTest.result)} className="text-base px-4 py-1">
                {selectedTest.result}
              </Badge>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: colors.hoverBackground }}
              >
                <p 
                  className="text-xs font-medium mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Expected Energy
                </p>
                <p 
                  className="text-lg font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {selectedTest.expectedEnergy.toFixed(3)} Wh
                </p>
              </div>
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: colors.hoverBackground }}
              >
                <p 
                  className="text-xs font-medium mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Actual Energy
                </p>
                <p 
                  className="text-lg font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {selectedTest.actualEnergy.toFixed(3)} Wh
                </p>
              </div>
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: colors.hoverBackground }}
              >
                <p 
                  className="text-xs font-medium mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Difference
                </p>
                <p 
                  className="text-lg font-bold"
                  style={{ 
                    color: selectedTest.difference >= 0 ? colors.accent : colors.error
                  }}
                >
                  {selectedTest.difference >= 0 ? '+' : ''}{selectedTest.difference.toFixed(4)} Wh
                </p>
              </div>
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: colors.hoverBackground }}
              >
                <p 
                  className="text-xs font-medium mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Performance
                </p>
                <p 
                  className="text-lg font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {selectedTest.performancePercentage.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Reference Configuration */}
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.hoverBackground }}
            >
              <p 
                className="text-xs font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Reference Configuration Used
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p 
                    className="font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {selectedTest.referenceConfig.appliedWeightKg} kg
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Applied Weight
                  </p>
                </div>
                <div>
                  <p 
                    className="font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {selectedTest.referenceConfig.expectedEnergyWh} Wh
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Expected Energy
                  </p>
                </div>
                <div>
                  <p 
                    className="font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    ±{selectedTest.referenceConfig.tolerancePercent}%
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Tolerance
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedTest.notes && (
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: colors.hoverBackground }}
              >
                <p 
                  className="text-xs font-medium mb-2"
                  style={{ color: colors.textSecondary }}
                >
                  Notes
                </p>
                <p 
                  className="text-sm"
                  style={{ color: colors.textPrimary }}
                >
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
