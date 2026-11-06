import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileText, 
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useDiagnosticHistory, useDailyTaskHistory } from '../hooks/useDiagnostics';
import { DiagnosticResultStatus, DailyDiagnosticTaskStatus } from '@/types/diagnostic.types';
import type { DiagnosticTest, DailyDiagnosticTask } from '@/types/diagnostic.types';

interface GroupedDailyTask {
  isGrouped: boolean;
  dateLabel: string;
  count?: number;
  status: DailyDiagnosticTaskStatus;
  task?: DailyDiagnosticTask;
}

/**
 * Diagnostic History Table Component
 * 
 * Clean, uncluttered layout matching the reference spec:
 * - Header with section title and segmented pill tab switcher
 * - Modern grid with clean dividers, status pills, and monospaced readings
 * - Intelligent collapse of consecutive overdue days into single summaries
 * - Preserves full test inspectability via dialog modal and CSV export
 */
export function DiagnosticHistoryTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'all'>('daily');
  const [showAllDaily, setShowAllDaily] = useState(false);
  const limit = 20;

  const { data, isLoading, error, refetch } = useDiagnosticHistory(currentPage, limit);
  const { data: dailyTasks, isLoading: isDailyLoading } = useDailyTaskHistory(60);

  // Group consecutive overdue tasks for clean presentation
  const groupedTasks: GroupedDailyTask[] = useMemo(() => {
    if (!dailyTasks || dailyTasks.length === 0) return [];

    const result: GroupedDailyTask[] = [];
    let i = 0;

    while (i < dailyTasks.length) {
      const task = dailyTasks[i];
      const isOverdueEmpty = 
        task.status === DailyDiagnosticTaskStatus.OVERDUE && 
        (task.actualEnergyMWh === undefined || task.actualEnergyMWh === null);

      if (isOverdueEmpty && !showAllDaily) {
        // Look ahead for consecutive overdue empty days
        let j = i + 1;
        while (
          j < dailyTasks.length && 
          dailyTasks[j].status === DailyDiagnosticTaskStatus.OVERDUE &&
          (dailyTasks[j].actualEnergyMWh === undefined || dailyTasks[j].actualEnergyMWh === null)
        ) {
          j++;
        }

        const count = j - i;
        if (count >= 3) {
          const startShort = dailyTasks[j - 1].taskDate.slice(5);
          const endShort = task.taskDate.slice(5);
          result.push({
            isGrouped: true,
            dateLabel: `${startShort} → ${endShort}`,
            count,
            status: DailyDiagnosticTaskStatus.OVERDUE,
            task,
          });
          i = j;
          continue;
        }
      }

      // Single standard row
      result.push({
        isGrouped: false,
        dateLabel: task.taskDate.slice(5),
        status: task.status,
        task,
      });
      i++;
    }

    return result;
  }, [dailyTasks, showAllDaily]);

  const handleExportCSV = () => {
    if (!data?.tests || data.tests.length === 0) return;

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

    const rows = data.tests.map((test) => [
      new Date(test.testDate).toLocaleString(),
      test.performedBy,
      test.expectedEnergy.toFixed(5),
      test.actualEnergy.toFixed(5),
      test.difference.toFixed(5),
      test.performancePercentage.toFixed(2),
      test.result,
      test.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

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
      <section className="cd !p-6 sm:!p-8 rounded-[24px]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded w-1/4 bg-[var(--soft)]" />
          <div className="h-12 rounded bg-[var(--soft)]" />
          <div className="h-12 rounded bg-[var(--soft)]" />
          <div className="h-12 rounded bg-[var(--soft)]" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="cd !p-6 sm:!p-8 rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-rose-500/30 bg-rose-500/10">
        <div>
          <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            Diagnostic History Unavailable
          </h4>
          <p className="text-xs text-[var(--mu)] mt-1">
            Unable to fetch previous diagnostic records. Please ensure the backend is connected.
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          className="text-xs border border-rose-500/30 text-rose-600 dark:text-rose-400"
        >
          Retry Sync
        </Button>
      </section>
    );
  }

  return (
    <section 
      className="cd !p-5 sm:!p-6 rounded-[22px] flex flex-col gap-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ─────────────────────────────────────────────────────────────
          HEADER ROW: Title + Segmented Pill Tab Switcher + CSV Action
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] sm:text-[20px] font-[600] text-[var(--t)]">
          History
        </h2>

        <div className="flex items-center gap-3">
          {/* Segmented Pill Tabs matching Mockup */}
          <div className="flex gap-1 bg-[var(--soft)] dark:bg-[#0a120e] rounded-full p-1 border border-[var(--line)] dark:border-[#1d3326]">
            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`min-h-[32px] sm:min-h-[34px] px-3.5 border-0 rounded-full text-[12px] sm:text-[13px] font-[600] transition-all cursor-pointer select-none ${
                activeTab === 'daily'
                  ? 'bg-[var(--mint)] dark:bg-[#1d3a29] text-[var(--acc)] dark:text-[#4ade80] shadow-xs'
                  : 'bg-transparent text-[var(--mu)] hover:text-[var(--t)]'
              }`}
            >
              Daily tasks · {dailyTasks?.length ?? 0}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`min-h-[32px] sm:min-h-[34px] px-3.5 border-0 rounded-full text-[12px] sm:text-[13px] font-[500] transition-all cursor-pointer select-none ${
                activeTab === 'all'
                  ? 'bg-[var(--mint)] dark:bg-[#1d3a29] text-[var(--acc)] dark:text-[#4ade80] shadow-xs font-[600]'
                  : 'bg-transparent text-[var(--mu)] hover:text-[var(--t)]'
              }`}
            >
              All runs · {data?.pagination?.total ?? 0}
            </button>
          </div>

          {/* CSV Export for All Runs */}
          {activeTab === 'all' && data?.tests && data.tests.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="min-h-[32px] sm:min-h-[34px] px-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--soft)] text-[12px] font-[500] text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--panel)] transition-all cursor-pointer select-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: DAILY DIAGNOSTIC TASKS VIEW (SPEC GRID)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Table Column Headers */}
            <div className="grid grid-cols-[110px_170px_minmax(0,1fr)_100px_100px] gap-3 pb-2 border-b border-[var(--line)] dark:border-[#1d3326] text-[11px] font-[600] tracking-[0.08em] uppercase text-[var(--mu)]">
              <span>Date</span>
              <span>Status</span>
              <span>Verified by</span>
              <span className="text-right">Measured</span>
              <span className="text-right">Deviation</span>
            </div>

            {/* Table Rows */}
            {groupedTasks.length > 0 ? (
              groupedTasks.map((item, idx) => {
                const { task } = item;

                // Grouped consecutive overdue days row
                if (item.isGrouped) {
                  return (
                    <div
                      key={`grouped-${idx}`}
                      className="grid grid-cols-[110px_170px_minmax(0,1fr)] gap-3 items-center py-2.5 sm:py-3 border-b border-[var(--line)] dark:border-[#1d3326]"
                    >
                      <span className="font-['DM_Sans',sans-serif] text-[13px] sm:text-[14px] font-[500] text-[var(--mu)] tabular-nums">
                        {item.dateLabel}
                      </span>
                      <span>
                        <span className="inline-block text-[11px] sm:text-[12px] font-[600] text-rose-500 dark:text-[#f87171] bg-rose-500/15 dark:bg-[#2c1213] border border-rose-500/30 dark:border-[#6b1f22] rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          {item.count} overdue
                        </span>
                      </span>
                      <span className="text-[13px] sm:text-[14px] text-[var(--mu)]">
                        No test recorded on these days
                      </span>
                    </div>
                  );
                }

                if (!task) return null;

                const isTaskCompleted = task.status === DailyDiagnosticTaskStatus.COMPLETED;
                const isTaskPending = task.status === DailyDiagnosticTaskStatus.PENDING;
                const isTaskNeedsAttention = 
                  task.status === DailyDiagnosticTaskStatus.NEEDS_ATTENTION || 
                  task.status === DailyDiagnosticTaskStatus.FAILED;
                const isTaskOverdue = task.status === DailyDiagnosticTaskStatus.OVERDUE;

                return (
                  <div
                    key={task.taskDate}
                    className="grid grid-cols-[110px_170px_minmax(0,1fr)_100px_100px] gap-3 items-center py-2.5 sm:py-3 border-b border-[var(--line)] dark:border-[#1d3326] hover:bg-[var(--soft)]/50 transition-colors"
                  >
                    {/* Date */}
                    <span className="font-['DM_Sans',sans-serif] text-[13px] sm:text-[14px] font-[500] text-[var(--t)] tabular-nums">
                      {item.dateLabel}
                    </span>

                    {/* Status Badge */}
                    <span>
                      {isTaskCompleted ? (
                        <span className="inline-block text-[11px] sm:text-[12px] font-[600] text-emerald-600 dark:text-[#4ade80] bg-emerald-500/15 dark:bg-[#0f2a1a] border border-emerald-500/30 dark:border-[#1d4a2e] rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          Completed
                        </span>
                      ) : isTaskNeedsAttention ? (
                        <span className="inline-block text-[11px] sm:text-[12px] font-[600] text-amber-600 dark:text-[#fb923c] bg-amber-500/15 dark:bg-[#2b1a0b] border border-amber-500/30 dark:border-[#6b3a12] rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          Needs attention
                        </span>
                      ) : isTaskOverdue ? (
                        <span className="inline-block text-[11px] sm:text-[12px] font-[600] text-rose-500 dark:text-[#f87171] bg-rose-500/15 dark:bg-[#2c1213] border border-rose-500/30 dark:border-[#6b1f22] rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] sm:text-[12px] font-[600] text-amber-600 dark:text-[#fbbf24] bg-amber-500/15 dark:bg-[#2a2108] border border-amber-500/30 dark:border-[#5a4710] rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          Pending
                        </span>
                      )}
                    </span>

                    {/* Verified By */}
                    <div className="flex flex-col min-w-0 pr-2">
                      {isTaskPending && !task.performedByName && !task.performedBy ? (
                        <span className="text-[13px] sm:text-[14px] italic text-[var(--mu)]">
                          Awaiting physical test
                        </span>
                      ) : (
                        <>
                          <span className="text-[13px] sm:text-[14px] font-[500] text-[var(--t)] truncate">
                            {task.performedByName || task.performedBy || 'System'}
                          </span>
                          {task.performedBy && (
                            <span className="text-[11px] sm:text-[12px] text-[var(--mu)] truncate">
                              {task.performedBy}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Measured (mWh) */}
                    <span className="text-right font-['DM_Sans',sans-serif] text-[13px] sm:text-[14px] font-[500] tabular-nums text-[var(--t)]">
                      {task.actualEnergyMWh !== undefined && task.actualEnergyMWh !== null
                        ? task.actualEnergyMWh.toFixed(5)
                        : <span className="text-[var(--mu)]">—</span>}
                    </span>

                    {/* Deviation (%) */}
                    <span className="text-right font-['DM_Sans',sans-serif] text-[13px] sm:text-[14px] font-[500] tabular-nums">
                      {task.deviationPercentage !== undefined && task.deviationPercentage !== null ? (
                        <span className={task.deviationPercentage >= 0 ? 'text-amber-500 dark:text-[#fbbf24]' : 'text-emerald-500 dark:text-[#4ade80]'}>
                          {task.deviationPercentage >= 0 ? '+' : ''}{task.deviationPercentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[var(--mu)]">—</span>
                      )}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-[var(--mu)]">
                <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span>No daily diagnostic tasks recorded yet.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ALL TEST RUNS VIEW
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'all' && (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Table Column Headers */}
            <div className="grid grid-cols-[130px_160px_minmax(0,1fr)_100px_100px] gap-3 pb-2 border-b border-[var(--line)] dark:border-[#1d3326] text-[11px] font-[600] tracking-[0.08em] uppercase text-[var(--mu)]">
              <span>Timestamp</span>
              <span>Result</span>
              <span>Performed by</span>
              <span className="text-right">Measured</span>
              <span className="text-right">Deviation</span>
            </div>

            {data?.tests && data.tests.length > 0 ? (
              data.tests.map((test) => {
                const isWithin = test.result === DiagnosticResultStatus.WITHIN_RANGE;
                const dateStr = new Date(test.testDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
                const timeStr = new Date(test.testDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

                return (
                  <div
                    key={test.id}
                    onClick={() => setSelectedTest(test)}
                    className="grid grid-cols-[130px_160px_minmax(0,1fr)_100px_100px] gap-3 items-center py-2.5 sm:py-3 border-b border-[var(--line)] dark:border-[#1d3326] hover:bg-[var(--soft)]/50 transition-colors cursor-pointer"
                  >
                    <span className="font-['DM_Sans',sans-serif] text-[13px] sm:text-[14px] font-[500] text-[var(--t)] tabular-nums">
                      {dateStr} {timeStr}
                    </span>

                    <span>
                      <span className={`inline-block text-[11px] sm:text-[12px] font-[600] rounded-full px-2.5 py-0.5 whitespace-nowrap border ${
                        isWithin 
                          ? 'text-emerald-600 dark:text-[#4ade80] bg-emerald-500/15 dark:bg-[#0f2a1a] border-emerald-500/30 dark:border-[#1d4a2e]' 
                          : 'text-amber-600 dark:text-[#fbbf24] bg-amber-500/15 dark:bg-[#2a2108] border-amber-500/30 dark:border-[#5a4710]'
                      }`}>
                        {test.result}
                      </span>
                    </span>

                    <span className="text-[13px] sm:text-[14px] font-[500] text-[var(--t)] truncate">
                      {test.performedBy}
                    </span>

                    <span className="text-right font-['DM_Sans',sans-serif] text-[13px] sm:text-[14px] font-[500] tabular-nums text-[var(--t)]">
                      {test.actualEnergy.toFixed(5)}
                    </span>

                    <span className="text-right font-['DM_Sans',sans-serif] text-[13px] sm:text-[14px] font-[500] tabular-nums">
                      <span className={test.difference >= 0 ? 'text-amber-500 dark:text-[#fbbf24]' : 'text-emerald-500 dark:text-[#4ade80]'}>
                        {test.difference >= 0 ? '+' : ''}{((test.difference / (test.expectedEnergy || 1)) * 100).toFixed(1)}%
                      </span>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-[var(--mu)]">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span>No individual test runs recorded yet.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FOOTER ACTIONS: Show All Tasks Toggle / Pagination
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {activeTab === 'daily' && dailyTasks && dailyTasks.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllDaily(!showAllDaily)}
            className="self-start min-h-[38px] px-4 border-[1.5px] border-[var(--line)] dark:border-[#264232] rounded-full bg-transparent text-[var(--acc)] dark:text-[#4ade80] text-[13px] font-[500] hover:bg-[var(--soft)] transition-all cursor-pointer select-none"
          >
            {showAllDaily ? 'Collapse overdue groups' : `Show all ${dailyTasks.length} tasks`}
          </button>
        )}

        {activeTab === 'all' && data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-[var(--mu)] tabular-nums">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={currentPage === data.pagination.totalPages}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TEST DETAIL DIALOG MODAL (PRESERVED)
          ───────────────────────────────────────────────────────────── */}
      {selectedTest && (
        <Dialog
          open={!!selectedTest}
          onClose={() => setSelectedTest(null)}
          title="Diagnostic Test Record"
          size="md"
        >
          <div className="space-y-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--mu)] mb-0.5">Test Timestamp</p>
                <p className="text-sm font-medium text-[var(--t)]">{new Date(selectedTest.testDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--mu)] mb-0.5">Verified By</p>
                <p className="text-sm font-medium text-[var(--t)]">{selectedTest.performedBy}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]">
              <div>
                <span className="text-[11px] font-[600] uppercase tracking-[0.08em] text-[var(--mu)]">Actual</span>
                <p className="text-base font-medium tabular-nums font-['DM_Sans',sans-serif] text-[var(--t)] mt-0.5">{selectedTest.actualEnergy.toFixed(5)} <span className="text-xs font-normal">mWh</span></p>
              </div>
              <div>
                <span className="text-[11px] font-[600] uppercase tracking-[0.08em] text-[var(--mu)]">Expected</span>
                <p className="text-base font-medium tabular-nums font-['DM_Sans',sans-serif] text-[var(--t)] mt-0.5">{selectedTest.expectedEnergy.toFixed(5)} <span className="text-xs font-normal">mWh</span></p>
              </div>
              <div>
                <span className="text-[11px] font-[600] uppercase tracking-[0.08em] text-[var(--mu)]">Deviation</span>
                <p className="text-base font-medium tabular-nums font-['DM_Sans',sans-serif] text-amber-500 mt-0.5">{selectedTest.performancePercentage.toFixed(2)}%</p>
              </div>
            </div>

            {selectedTest.notes && (
              <div>
                <p className="text-xs font-medium text-[var(--mu)] mb-1">Notes</p>
                <p className="text-xs text-[var(--t)] p-3 rounded-lg bg-[var(--soft)] border border-[var(--line)]">{selectedTest.notes}</p>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </section>
  );
}
