import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileText, 
  CalendarCheck, 
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';
import { useDiagnosticHistory, useDailyTaskHistory } from '../hooks/useDiagnostics';
import { DiagnosticResultStatus, DailyDiagnosticTaskStatus } from '@/types/diagnostic.types';
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
  const [activeTab, setActiveTab] = useState<'daily' | 'all'>('daily');
  const limit = 20;

  const { data, isLoading, error, refetch } = useDiagnosticHistory(currentPage, limit);
  const { data: dailyTasks, isLoading: isDailyLoading } = useDailyTaskHistory(30);
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

  if (isLoading || isDailyLoading) {
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
        className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border"
        style={{
          backgroundColor: theme === 'light' ? '#FEF2F2' : 'rgba(127, 29, 29, 0.2)',
          borderColor: theme === 'light' ? '#FCA5A5' : '#991B1B',
          boxShadow: colors.shadow
        }}
      >
        <div>
          <h4 className="text-sm font-semibold" style={{ color: theme === 'light' ? '#991B1B' : '#FCA5A5' }}>
            Diagnostic History Unavailable
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Unable to fetch previous diagnostic records. Please ensure the backend is connected and you are logged in.
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          className="text-xs border"
          style={{ borderColor: theme === 'light' ? '#FCA5A5' : '#991B1B' }}
        >
          Retry Sync
        </Button>
      </div>
    );
  }

  const getDailyStatusBadge = (status: DailyDiagnosticTaskStatus) => {
    switch (status) {
      case DailyDiagnosticTaskStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Completed
          </span>
        );
      case DailyDiagnosticTaskStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            In Progress
          </span>
        );
      case DailyDiagnosticTaskStatus.NEEDS_ATTENTION:
      case DailyDiagnosticTaskStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
            Needs Attention
          </span>
        );
      case DailyDiagnosticTaskStatus.OVERDUE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-700">
            <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            Overdue
          </span>
        );
      case DailyDiagnosticTaskStatus.PENDING:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div 
      className="rounded-2xl overflow-hidden border shadow-xs transition-all"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
      }}
    >
      {/* Header with View Tabs */}
      <div 
        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h3 
              className="text-lg font-bold tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              Diagnostic Logs & Verification History
            </h3>
            <p 
              className="text-xs text-slate-500 dark:text-gray-400 mt-0.5"
            >
              Multi-admin performance records and daily physical step test tasks
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-[#39FF88] shadow-xs'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>Daily Tasks</span>
              {dailyTasks && dailyTasks.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {dailyTasks.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-[#39FF88] shadow-xs'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>All Test Runs</span>
              {data?.pagination?.total !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold">
                  {data.pagination.total}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'all' && data?.tests && data.tests.length > 0 && (
          <Button
            onClick={handleExportCSV}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white cursor-pointer self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        )}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DAILY DIAGNOSTIC TASKS VIEW */}
      {/* ============================================================ */}
      {activeTab === 'daily' && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left" style={{ tableLayout: 'fixed', minWidth: '950px' }}>
            <thead style={{ backgroundColor: colors.hoverBackground }}>
              <tr className="border-b" style={{ borderColor: colors.border }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400" style={{ width: '130px' }}>
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400" style={{ width: '150px' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400" style={{ width: '220px' }}>
                  Verified By
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400" style={{ width: '130px' }}>
                  Measured (mWh)
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400" style={{ width: '130px' }}>
                  Baseline (mWh)
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400" style={{ width: '110px' }}>
                  Deviation
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Verdict / Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.border }}>
              {dailyTasks && dailyTasks.length > 0 ? (
                dailyTasks.map((t) => (
                  <tr key={t.taskDate} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {t.taskDate}
                    </td>
                    <td className="px-4 py-3">
                      {getDailyStatusBadge(t.status)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-300 truncate">
                      {t.performedByName ? (
                        <span>
                          <strong className="font-semibold text-slate-800 dark:text-slate-200">{t.performedByName}</strong>
                          <span className="block text-[10px] text-slate-400 truncate">{t.performedBy}</span>
                        </span>
                      ) : t.performedBy ? (
                        t.performedBy
                      ) : (
                        <span className="text-slate-400 italic">Pending Physical Test</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {t.actualEnergyMWh !== undefined ? t.actualEnergyMWh.toFixed(5) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-slate-600 dark:text-gray-300">
                      {t.expectedEnergyMWh !== undefined ? t.expectedEnergyMWh.toFixed(5) : '0.00510'}
                    </td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums font-semibold">
                      {t.deviationPercentage !== undefined ? (
                        <span className={t.deviationPercentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                          {t.deviationPercentage >= 0 ? '+' : ''}{t.deviationPercentage.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-300 truncate">
                      {t.statusMessage || t.notes || (t.status === DailyDiagnosticTaskStatus.PENDING ? 'Awaiting test' : '—')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs text-slate-500">
                    <CalendarCheck className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <span>No daily diagnostic tasks recorded yet. Today's task will automatically initialize.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ALL STEP TEST LOGS VIEW */}
      {/* ============================================================ */}
      {activeTab === 'all' && (
        <div className="w-full overflow-x-auto">
          {(!data?.tests || data.tests.length === 0) ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                No individual step tests recorded yet
              </h4>
              <p className="text-xs text-slate-500">
                Perform your first footstep verification test above to see individual test runs here.
              </p>
            </div>
          ) : (
            <>
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
            </>
        )}
      </div>
      )}

      {/* Pagination (only for all step test logs) */}
      {activeTab === 'all' && data?.pagination && data.pagination.totalPages > 1 && (
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
