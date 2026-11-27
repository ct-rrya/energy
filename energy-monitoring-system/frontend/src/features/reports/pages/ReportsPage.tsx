import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import { reportsService } from '@/api/services/reports.service';
import { getThemeColors } from '@/lib/theme';
import {
  Plus,
  FileText,
  Download,
  ChevronRight,
} from 'lucide-react';
import { GenerateReportDialog } from '../components/GenerateReportDialog';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { ReportDetailsModal } from '../components/ReportDetailsModal';
import { useReports, useReportActions } from '../hooks';
import { ReportType, ReportFormat, type GenerateReportDto, type Report } from '@/types/report.types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import {
  HourRangeSelector,
  type HourRange,
} from '@/components/common/HourRangeSelector';

/**
 * Reports Page Component
 * 
 * Complete report generation and management workspace for System Administrators.
 * 
 * Features:
 * - Generate reports (Energy Monitoring, Historical Analytics, System Diagnostics, System Summary)
 * - Filter reports by type, format, and date
 * - View, download, and delete reports
 * - Proper empty states for no data
 * - Light/Dark mode support
 * - Responsive design
 */
export function ReportsPage() {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { status: hardwareConnectionStatus } = useHardwareStatus();

  // State
  const [page, setPage] = useState(1);
  const [formatFilter, setFormatFilter] = useState<ReportFormat | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [hourRange, setHourRange] = useState<HourRange | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [detailsReport, setDetailsReport] = useState<Report | null>(null);

  // Compute startDate cutoff for the date filter (Hourly, Today, Last 7 Days, Last 30 Days)
  const dateFilterStartISO = useMemo(() => {
    if (dateFilter === 'all') return undefined;
    const now = new Date();
    switch (dateFilter) {
      case 'hourly':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case 'today': {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return start.toISOString();
      }
      case 'last7':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'last30':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return undefined;
    }
  }, [dateFilter]);

  // Hooks
  const {
    data: reportsData,
    isLoading: reportsLoading,
    isFetching: reportsFetching,
    error: reportsError,
    refetch: refetchReports,
  } = useReports(
    page,
    10,
    undefined,
    formatFilter === 'all' ? undefined : formatFilter,
    dateFilterStartISO
  );

  const {
    generateReport,
    isGenerating,
    downloadReport,
  } = useReportActions();

  const { data: reportQuota } = useQuery({
    queryKey: ['reports', 'quota'],
    queryFn: () => reportsService.getReportQuota(),
    staleTime: 15_000,
  });

  // Handlers
  const handleGenerateReport = (dto: GenerateReportDto) => {
    generateReport(dto, {
      onSuccess: (report) => {
        setIsGenerateDialogOpen(false);
        refetchReports();
        // Automatically download the generated report after a brief delay
        setTimeout(() => {
          downloadReport({ id: report.id, fileName: report.fileName });
        }, 500);
      },
    });
  };

  const handleDownload = (id: string, fileName: string) => {
    downloadReport({ id, fileName });
  };

  const handleViewDetails = (report: Report) => {
    setDetailsReport(report);
  };

  const handleView = (report: Report) => {
    setPreviewReport(report);
  };

  const getReportTypeLabel = (_type: ReportType): string => {
    return 'Energy & Health Report';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const rawReports = reportsData?.data || [];
  const reports = useMemo(() => {
    return rawReports.filter((r) => {
      const created = new Date(r.createdAt);
      if (isNaN(created.getTime())) return true;
      if (dateFilterStartISO) {
        const cutoff = new Date(dateFilterStartISO).getTime();
        if (created.getTime() < cutoff) return false;
      }
      if (hourRange && !(hourRange.startHour === 0 && hourRange.endHour === 23)) {
        const h = created.getHours();
        const inRange =
          hourRange.startHour <= hourRange.endHour
            ? h >= hourRange.startHour && h <= hourRange.endHour
            : h >= hourRange.startHour || h <= hourRange.endHour;
        if (!inRange) return false;
      }
      return true;
    });
  }, [rawReports, dateFilterStartISO, hourRange]);
  const meta = reportsData?.meta;
  const reportCount = dateFilterStartISO || hourRange ? reports.length : (meta?.total || 0);

  return (
    <div className="page">
      {/* Dashboard Header matching EcoStep Central exactly */}
      <DashboardHeader
        greeting="Documentation & Records"
        title="Reports"
        subtitle="Generate and export EcoStep energy reports"
        systemStatus={hardwareConnectionStatus}
      />

      {/* Record-Folder Tabs + Compact Format Dropdown & Generate Report Button */}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
        {/* Record-Folder Tabs (Date Scope) */}
        <div
          className="flex flex-wrap items-end gap-1 max-w-full"
          role="tablist"
          aria-label="Reports date filter tabs"
        >
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'today', label: 'Today' },
            { id: 'last7', label: 'Last 7 Days' },
            { id: 'last30', label: 'Last 30 Days' },
          ].map((tab) => {
            const isActive = dateFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setDateFilter(tab.id);
                  setPage(1);
                }}
                className={`relative px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--card-bg)] text-[var(--t)] border-[var(--line)] -mb-px z-10 pb-2.5'
                    : 'bg-transparent text-[var(--mu)] border-transparent hover:text-[var(--t)] hover:bg-[var(--card-bg)]/50'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full bg-[var(--acc)]"
                    aria-hidden="true"
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Compact Format Dropdown + Public Quota + Generate Button */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {reportQuota && !reportQuota.isUnlimited && reportQuota.limit !== null && reportQuota.remainingToday !== null && (
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                reportQuota.remainingToday <= 0
                  ? 'bg-red-500/10 text-red-500 border-red-500/30'
                  : 'bg-[var(--panel)] text-[var(--mu)] border-[var(--line)]'
              }`}
              title="Public visitors can generate up to 5 reports per day per browser"
            >
              {reportQuota.remainingToday}/{reportQuota.limit} left today
            </span>
          )}

          <select
            aria-label="Filter reports by format"
            value={formatFilter}
            onChange={(e) => {
              setFormatFilter(e.target.value as ReportFormat | 'all');
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
          >
            <option value="all">All Formats</option>
            <option value={ReportFormat.PDF}>PDF</option>
            <option value={ReportFormat.EXCEL}>Excel (.xlsx)</option>
          </select>

          <HourRangeSelector
            value={hourRange}
            onChange={(next) => {
              setHourRange(next);
              setPage(1);
            }}
            label="Hours"
          />

          <button
            type="button"
            data-tour="reports-generate-btn"
            onClick={() => setIsGenerateDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-[0.99] shrink-0"
            style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Connected Folder Content Sheet — Table sits directly on main container */}
      <section className="rounded-b-2xl rounded-tr-2xl border border-[var(--line)] bg-[var(--card-bg)] overflow-hidden">
        {/* Flush Sub-Header Strip */}
        <div className="px-5 sm:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between gap-2 text-xs text-[var(--mu)]">
          <span>
            <strong className="text-[var(--t)]">{reportCount}</strong>{' '}
            {reportCount === 1 ? 'report' : 'reports'}
          </span>
          {reportsFetching && !reportsLoading && (
            <span className="text-[11px] text-[var(--mu)]">Updating...</span>
          )}
        </div>

        {/* Content: Table-Only Loading, Error, Empty State, or Table */}
        {reportsLoading && !reportsData ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" />
          </div>
        ) : reportsError && !reportsData ? (
          <div className="p-10 text-center">
            <FileText className="w-7 h-7 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1.5 text-[var(--t)]">
              Unable to Load Reports
            </h3>
            <p className="text-sm mb-5 text-[var(--mu)]">
              Could not connect to the server. Please ensure the server is running and try again.
            </p>
            <button
              type="button"
              onClick={() => refetchReports()}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: colors.accent, color: '#0D1B14' }}
            >
              Try Again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-[var(--soft)] text-[var(--acc)] border border-[var(--line)]">
              <FileText className="w-6 h-6" />
            </div>
            <h3
              className="text-base font-semibold mb-2 text-[var(--t)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {formatFilter !== 'all' || dateFilter !== 'all'
                ? 'No Reports Match Filters'
                : 'No Reports Yet'}
            </h3>
            <p
              className="text-sm mb-6 max-w-md mx-auto text-[var(--mu)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {formatFilter !== 'all' || dateFilter !== 'all'
                ? 'No reports match the current filter criteria. Try adjusting your filters or generate a new report.'
                : 'Generate your first EcoStep report from monitoring, analytics, or diagnostic data.'}
            </p>
            <button
              onClick={() => setIsGenerateDialogOpen(true)}
              className="px-5 py-2.5 rounded-xl font-semibold transition-all inline-flex items-center gap-2 bg-[var(--acc)] text-white dark:text-[#0D1B14] hover:bg-[var(--bar)] shadow-sm cursor-pointer"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Generate Report</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full" style={{ minWidth: '650px' }}>
                <thead>
                  <tr className="bg-[var(--soft)] border-b border-[var(--line)]">
                    <th
                      className="text-left text-[11px] font-[600] uppercase tracking-[0.08em] px-6 py-3.5 text-[var(--mu)]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Report Name
                    </th>
                    <th
                      className="text-left text-[11px] font-[600] uppercase tracking-[0.08em] px-6 py-3.5 text-[var(--mu)]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Format
                    </th>
                    <th
                      className="text-left text-[11px] font-[600] uppercase tracking-[0.08em] px-6 py-3.5 text-[var(--mu)]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Generated On
                    </th>
                    <th
                      className="text-left text-[11px] font-[600] uppercase tracking-[0.08em] px-6 py-3.5 text-[var(--mu)]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Generated By
                    </th>
                    <th
                      className="text-right text-[11px] font-[600] uppercase tracking-[0.08em] px-6 py-3.5 text-[var(--mu)]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-[var(--line)] hover:bg-[var(--soft)] transition-colors duration-150"
                    >
                      {/* Report Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--soft)] text-[var(--acc)] border border-[var(--line)]"
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div
                              className="text-sm font-medium mb-0.5 text-[var(--t)]"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {getReportTypeLabel(report.type)}
                            </div>
                            <div
                              className="text-xs text-[var(--mu)]"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {formatFileSize(report.fileSize)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Format */}
                      <td className="px-6 py-4">
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--soft)] text-[var(--t)] border border-[var(--line)]"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {report.format.toUpperCase()}
                        </span>
                      </td>

                      {/* Generated On */}
                      <td className="px-6 py-4">
                        <span
                          className="text-[13px] text-[var(--t)] tabular-nums"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {formatDate(report.createdAt)}
                        </span>
                      </td>

                      {/* Generated By */}
                      <td className="px-6 py-4">
                        <span
                          className="text-[13px] text-[var(--t)]"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {report.generatedByName}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(report)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--mint)] text-[var(--t)] transition-colors flex items-center gap-1 cursor-pointer"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            View Details
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(report.id, report.fileName)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--acc)] text-white dark:text-[#0D1B14] hover:bg-[var(--bar)] shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Compact Flat List View (< md, directly on main sheet) */}
            <div className="md:hidden divide-y divide-[var(--line)]">
              {reports.map((report) => (
                <div key={report.id} className="px-4 py-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--t)] truncate">
                        {getReportTypeLabel(report.type)}
                      </div>
                      <div className="text-xs text-[var(--mu)] mt-0.5">
                        {formatDate(report.createdAt)} · By {report.generatedByName}
                      </div>
                    </div>
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mu)] shrink-0">
                      {report.format}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(report)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-transparent text-[var(--t)] hover:bg-[var(--soft)] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(report.id, report.fileName)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--acc)] text-white dark:text-[#0D1B14] hover:opacity-90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Integrated Card Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[var(--line)] flex items-center justify-between">
                <div
                  className="text-xs sm:text-sm text-[var(--mu)] tabular-nums"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Page {meta.page} of {meta.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || reportsLoading}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:bg-[var(--panel)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === meta.totalPages || reportsLoading}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:bg-[var(--panel)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Generate Report Dialog */}
      <GenerateReportDialog
        open={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        onGenerate={handleGenerateReport}
        isGenerating={isGenerating}
        quota={reportQuota}
      />

      {/* Report Preview Modal */}
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Report Details Modal */}
      {detailsReport && (
        <ReportDetailsModal
          report={detailsReport}
          onClose={() => setDetailsReport(null)}
          onDownload={handleDownload}
          onView={handleView}
          getReportTypeLabel={getReportTypeLabel}
          formatDate={formatDate}
          formatFileSize={formatFileSize}
        />
      )}
    </div>
  );
}
