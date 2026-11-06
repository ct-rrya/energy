import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';
import { 
  Plus, 
  FileText, 
  Download, 
  ChevronRight,
  ChevronDown,
  Filter
} from 'lucide-react';
import { GenerateReportDialog } from '../components/GenerateReportDialog';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { ReportDetailsModal } from '../components/ReportDetailsModal';
import { useReports, useReportActions } from '../hooks';
import { ReportType, ReportFormat, type GenerateReportDto, type Report } from '@/types/report.types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CustomDropdown } from '@/components/common';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';

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
  
  // State
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<ReportFormat | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [detailsReport, setDetailsReport] = useState<Report | null>(null);

  // Hooks
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useReports(
    page,
    10,
    typeFilter === 'all' ? undefined : typeFilter,
    formatFilter === 'all' ? undefined : formatFilter
  );

  const {
    generateReport,
    isGenerating,
    downloadReport,
  } = useReportActions();

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

  const getReportTypeLabel = (type: ReportType): string => {
    switch (type) {
      case ReportType.ENERGY_MONITORING:
        return 'Energy Generation';
      case ReportType.HISTORICAL_ANALYTICS:
        return 'Energy Trends';
      case ReportType.SYSTEM_DIAGNOSTICS:
        return 'System Performance';
      case ReportType.SYSTEM_SUMMARY:
        return 'System Overview';
      case ReportType.DAILY:
        return 'Daily';
      case ReportType.WEEKLY:
        return 'Weekly';
      case ReportType.MONTHLY:
        return 'Monthly';
      case ReportType.CUSTOM:
        return 'Custom';
      default:
        return type;
    }
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

  const reports = reportsData?.data || [];
  const meta = reportsData?.meta;
  const reportCount = meta?.total || 0;

  // Loading state
  if (reportsLoading && !reportsData) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (reportsError && !reportsData) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div 
            className="rounded-lg p-8 text-center"
            style={{
              backgroundColor: colors.cardBackground,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)'
              }}
            >
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <h3 
              className="text-base font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Unable to Load Reports
            </h3>
            <p 
              className="text-sm mb-6"
              style={{ color: colors.textSecondary }}
            >
              Could not connect to the server. Please ensure the server is running and try again.
            </p>
            <button
              onClick={() => refetchReports()}
              className="px-5 py-2.5 rounded-lg font-medium transition-colors duration-200"
              style={{
                backgroundColor: colors.accent,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#35c27b' : '#35c27b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent;
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + (formatFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0);

  return (
    <div className="page">
      {/* Dashboard Header matching EcoStep Central exactly */}
      <DashboardHeader
        greeting="Documentation & Records"
        title="Reports"
        subtitle="Generate, view, and export reports from EcoStep monitoring, analytics, and diagnostic data"
        systemStatus="connected"
        isWebSocketConnected={true}
      />

      {/* Reports Section with Integrated Compact Filter Toolbar */}
      <div className="cd !p-0 overflow-hidden">
        {/* Card Header: Title + Report Count + Filters + Generate Report Button */}
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--line)] flex flex-col min-[900px]:flex-row min-[900px]:items-center justify-between gap-3.5 min-[900px]:gap-4">
          {/* Left: Title & Count Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <h2 
              className="text-[16px] sm:text-[18px] font-[600] tracking-tight text-[var(--t)] m-0"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Generated Reports
            </h2>
            <span 
              className="text-[11px] font-[600] px-2.5 py-0.5 rounded-full bg-[var(--soft)] text-[var(--acc)] border border-[var(--line)] whitespace-nowrap"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {reportCount} {reportCount === 1 ? 'report' : 'reports'}
            </span>
          </div>

          {/* Right Controls Container */}
          <div className="flex flex-col min-[900px]:flex-row min-[900px]:items-center gap-3 min-[900px]:gap-0 w-full min-[900px]:w-auto">
            {/* Phone Width: Collapsed Single "Filters" Button (< sm) */}
            <div className="sm:hidden flex flex-col gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((prev) => !prev)}
                className="min-h-[44px] h-[44px] px-4 rounded-full border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--panel)] transition-colors flex items-center justify-between gap-2 text-[13px] font-[500] text-[var(--t)] select-none w-full cursor-pointer"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <span className="inline-flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[var(--mu)] shrink-0" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-[700] px-2 py-0.5 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f] tabular-nums">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--mu)] transition-transform duration-200 shrink-0 ${
                    mobileFiltersOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileFiltersOpen && (
                <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)]">
                  <CustomDropdown
                    value={typeFilter}
                    onChange={(value) => {
                      setTypeFilter(value as ReportType | 'all');
                      setPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'All Types' },
                      { value: ReportType.ENERGY_MONITORING, label: 'Energy Monitoring' },
                      { value: ReportType.HISTORICAL_ANALYTICS, label: 'Historical Analytics' },
                      { value: ReportType.SYSTEM_DIAGNOSTICS, label: 'System Diagnostics' },
                      { value: ReportType.SYSTEM_SUMMARY, label: 'System Summary' },
                    ]}
                  />

                  <CustomDropdown
                    value={formatFilter}
                    onChange={(value) => {
                      setFormatFilter(value as ReportFormat | 'all');
                      setPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'All Formats' },
                      { value: ReportFormat.PDF, label: 'PDF' },
                      { value: ReportFormat.EXCEL, label: 'CSV' },
                    ]}
                  />

                  <CustomDropdown
                    value={dateFilter}
                    onChange={(value) => {
                      setDateFilter(value);
                      setPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'All Dates' },
                      { value: 'today', label: 'Today' },
                      { value: 'last7', label: 'Last 7 Days' },
                      { value: 'last30', label: 'Last 30 Days' },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Tablet & Desktop Width: 3 Inline Filter Dropdowns (>= sm) */}
            <div className="hidden sm:flex flex-wrap min-[900px]:flex-nowrap items-center gap-2 sm:gap-2.5">
              {/* Type Filter */}
              <div className="w-[140px] shrink-0">
                <CustomDropdown
                  value={typeFilter}
                  onChange={(value) => {
                    setTypeFilter(value as ReportType | 'all');
                    setPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: ReportType.ENERGY_MONITORING, label: 'Energy Monitoring' },
                    { value: ReportType.HISTORICAL_ANALYTICS, label: 'Historical Analytics' },
                    { value: ReportType.SYSTEM_DIAGNOSTICS, label: 'System Diagnostics' },
                    { value: ReportType.SYSTEM_SUMMARY, label: 'System Summary' },
                  ]}
                />
              </div>

              {/* Format Filter */}
              <div className="w-[120px] shrink-0">
                <CustomDropdown
                  value={formatFilter}
                  onChange={(value) => {
                    setFormatFilter(value as ReportFormat | 'all');
                    setPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Formats' },
                    { value: ReportFormat.PDF, label: 'PDF' },
                    { value: ReportFormat.EXCEL, label: 'CSV' },
                  ]}
                />
              </div>

              {/* Date Filter */}
              <div className="w-[125px] shrink-0">
                <CustomDropdown
                  value={dateFilter}
                  onChange={(value) => {
                    setDateFilter(value);
                    setPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Dates' },
                    { value: 'today', label: 'Today' },
                    { value: 'last7', label: 'Last 7 Days' },
                    { value: 'last30', label: 'Last 30 Days' },
                  ]}
                />
              </div>
            </div>

            {/* Generate Report Button */}
            <button
              type="button"
              onClick={() => setIsGenerateDialogOpen(true)}
              className="min-h-[44px] h-[44px] px-5 sm:px-6 rounded-full inline-flex items-center justify-center gap-2 font-[600] text-[13px] sm:text-[14px] bg-[var(--acc)] text-white dark:text-[#04210f] hover:bg-[var(--bar)] shadow-xs transition-all cursor-pointer whitespace-nowrap w-full min-[900px]:w-auto min-[900px]:ml-5 shrink-0 select-none active:scale-[0.98]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Content: Empty State or Table */}
        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-[var(--soft)] text-[var(--acc)] border border-[var(--line)]">
              <FileText className="w-6 h-6" />
            </div>
            <h3 
              className="text-base font-semibold mb-2 text-[var(--t)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {typeFilter !== 'all' || formatFilter !== 'all' || dateFilter !== 'all'
                ? 'No Reports Match Filters'
                : 'No Reports Yet'}
            </h3>
            <p 
              className="text-sm mb-6 max-w-md mx-auto text-[var(--mu)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {typeFilter !== 'all' || formatFilter !== 'all' || dateFilter !== 'all'
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

              {/* Mobile Card View */}
              <div className="md:hidden divide-y" style={{ borderColor: colors.border }}>
                {reports.map((report) => (
                  <div key={report.id} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)'
                        }}
                      >
                        <FileText 
                          className="w-6 h-6"
                          style={{ color: colors.accent }}
                        />
                      </div>
                      <div className="flex-1">
                        <div 
                          className="text-sm font-medium mb-1"
                          style={{ color: colors.textPrimary }}
                        >
                          {getReportTypeLabel(report.type)}
                        </div>
                        <div 
                          className="text-xs mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          Generated on {formatDate(report.createdAt)}
                        </div>
                        <div 
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          By {report.generatedByName}
                        </div>
                      </div>
                      <span 
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--soft)] text-[var(--t)] border border-[var(--line)]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {report.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleViewDetails(report)}
                        className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:bg-[var(--mint)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        View Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(report.id, report.fileName)}
                        className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--acc)] text-white dark:text-[#0D1B14] hover:bg-[var(--bar)] shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
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
      </div>

      {/* Generate Report Dialog */}
      <GenerateReportDialog
        open={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        onGenerate={handleGenerateReport}
        isGenerating={isGenerating}
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
