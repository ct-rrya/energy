import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { getThemeColors } from '@/lib/theme';
import { 
  Plus, 
  FileText, 
  Download, 
  Eye, 
  Trash2,
  MoreVertical,
  Filter
} from 'lucide-react';
import { GenerateReportDialog } from '../components/GenerateReportDialog';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { useReports, useReportActions } from '../hooks';
import { ReportType, ReportFormat, type GenerateReportDto, type Report } from '@/types/report.types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CustomDropdown } from '@/components/common';

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
  const { isAuthenticated, user } = useAuth();
  const colors = getThemeColors(theme);
  
  // Determine user role
  const userRole = getUserRole(isAuthenticated, user);
  const isPublicUser = userRole === 'public';

  // State
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<ReportFormat | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

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
    isDownloading,
    deleteReport,
    isDeleting,
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
    setActiveDropdown(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      deleteReport(id, {
        onSuccess: () => {
          refetchReports();
          setActiveDropdown(null);
        },
      });
    }
  };

  const handleView = (report: Report) => {
    setPreviewReport(report);
    setActiveDropdown(null);
  };

  const getReportTypeLabel = (type: ReportType): string => {
    switch (type) {
      case ReportType.ENERGY_MONITORING:
        return 'Energy Monitoring';
      case ReportType.HISTORICAL_ANALYTICS:
        return 'Historical Analytics';
      case ReportType.SYSTEM_DIAGNOSTICS:
        return 'System Diagnostics';
      case ReportType.SYSTEM_SUMMARY:
        return 'System Summary';
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
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
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
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div 
            className="rounded-3xl p-8 text-center"
            style={{
              backgroundColor: colors.cardBackground,
              boxShadow: theme === 'light' 
                ? '0 4px 20px rgba(0,0,0,0.05)' 
                : 'none'
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)'
              }}
            >
              <FileText className="w-8 h-8 text-red-500" />
            </div>
            <h3 
              className="text-lg font-semibold mb-2"
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
              className="px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              style={{
                backgroundColor: colors.accent,
                color: 'white',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Reports
            </h1>
            <p 
              className="text-sm sm:text-base max-w-2xl"
              style={{ color: colors.textSecondary }}
            >
              Generate, view, and export reports from EcoStep monitoring, analytics, and diagnostic data.
            </p>
          </div>

          {/* Primary Action */}
          {!isPublicUser && (
            <button
              onClick={() => setIsGenerateDialogOpen(true)}
              className="px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: colors.accent,
                color: 'white',
              }}
            >
              <Plus className="w-5 h-5" strokeWidth={2} />
              <span>Generate Report</span>
            </button>
          )}
        </div>

        {/* Filters Section */}
        <div 
          className="rounded-3xl p-6 transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBackground,
            boxShadow: theme === 'light' 
              ? '0 4px 20px rgba(0,0,0,0.05)' 
              : 'none'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter 
              className="w-4 h-4"
              style={{ color: colors.accent }}
              strokeWidth={2}
            />
            <span 
              className="text-sm font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Filters
            </span>
            <div className="ml-auto">
              <span 
                className="text-sm font-medium px-3 py-1 rounded-full"
                style={{
                  backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)',
                  color: colors.accent,
                }}
              >
                {reportCount} {reportCount === 1 ? 'report' : 'reports'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label 
                className="block text-xs font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Type
              </label>
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
            <div>
              <label 
                className="block text-xs font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Format
              </label>
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
            <div>
              <label 
                className="block text-xs font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Date
              </label>
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
        </div>

        {/* Reports Section */}
        {reports.length === 0 ? (
          /* Empty State */
          <div 
            className="rounded-3xl p-12 text-center transition-colors duration-300"
            style={{
              backgroundColor: colors.cardBackground,
              boxShadow: theme === 'light' 
                ? '0 4px 20px rgba(0,0,0,0.05)' 
                : 'none'
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)'
              }}
            >
              <FileText 
                className="w-8 h-8"
                style={{ color: colors.accent }}
              />
            </div>
            <h3 
              className="text-lg font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              {typeFilter !== 'all' || formatFilter !== 'all' || dateFilter !== 'all'
                ? 'No Reports Match Filters'
                : 'No Reports Yet'}
            </h3>
            <p 
              className="text-sm mb-6 max-w-md mx-auto"
              style={{ color: colors.textSecondary }}
            >
              {typeFilter !== 'all' || formatFilter !== 'all' || dateFilter !== 'all'
                ? 'No reports match the current filter criteria. Try adjusting your filters or generate a new report.'
                : 'Generate your first EcoStep report from monitoring, analytics, or diagnostic data.'}
            </p>
            {!isPublicUser && (
              <button
                onClick={() => setIsGenerateDialogOpen(true)}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg inline-flex items-center gap-2"
                style={{
                  backgroundColor: colors.accent,
                  color: 'white',
                }}
              >
                <Plus className="w-5 h-5" strokeWidth={2} />
                <span>Generate Report</span>
              </button>
            )}
          </div>
        ) : (
          /* Reports Table/List */
          <>
            <div 
              className="rounded-3xl overflow-hidden transition-colors duration-300"
              style={{
                backgroundColor: colors.cardBackground,
                boxShadow: theme === 'light' 
                  ? '0 4px 20px rgba(0,0,0,0.05)' 
                  : 'none'
              }}
            >
              <div className="p-6 border-b" style={{ borderColor: colors.border }}>
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Generated Reports
                </h2>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th 
                        className="text-left text-xs font-medium px-6 py-4"
                        style={{ color: colors.textSecondary }}
                      >
                        Report
                      </th>
                      <th 
                        className="text-left text-xs font-medium px-6 py-4"
                        style={{ color: colors.textSecondary }}
                      >
                        Type
                      </th>
                      <th 
                        className="text-left text-xs font-medium px-6 py-4"
                        style={{ color: colors.textSecondary }}
                      >
                        Period
                      </th>
                      <th 
                        className="text-left text-xs font-medium px-6 py-4"
                        style={{ color: colors.textSecondary }}
                      >
                        Generated
                      </th>
                      <th 
                        className="text-left text-xs font-medium px-6 py-4"
                        style={{ color: colors.textSecondary }}
                      >
                        Format
                      </th>
                      <th 
                        className="text-right text-xs font-medium px-6 py-4"
                        style={{ color: colors.textSecondary }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr 
                        key={report.id}
                        style={{ 
                          borderBottom: index < reports.length - 1 ? `1px solid ${colors.border}` : 'none'
                        }}
                        className="hover:bg-opacity-50 transition-colors duration-150"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.hoverBackground;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)'
                              }}
                            >
                              <FileText 
                                className="w-5 h-5"
                                style={{ color: colors.accent }}
                              />
                            </div>
                            <div>
                              <div 
                                className="text-sm font-medium"
                                style={{ color: colors.textPrimary }}
                              >
                                {report.fileName.split('-').slice(0, -1).join(' ').replace(/_/g, ' ')}
                              </div>
                              <div 
                                className="text-xs"
                                style={{ color: colors.textSecondary }}
                              >
                                {formatFileSize(report.fileSize)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="text-sm"
                            style={{ color: colors.textPrimary }}
                          >
                            {getReportTypeLabel(report.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="text-sm"
                            style={{ color: colors.textPrimary }}
                          >
                            {formatDate(report.startDate)} – {formatDate(report.endDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            {formatDate(report.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="text-xs font-medium px-2 py-1 rounded"
                            style={{
                              backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                              color: colors.textPrimary,
                            }}
                          >
                            {report.format.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(report)}
                              className="p-2 rounded-lg transition-colors duration-200"
                              style={{
                                color: colors.textSecondary,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.hoverBackground;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(report.id, report.fileName)}
                              className="p-2 rounded-lg transition-colors duration-200"
                              style={{
                                color: colors.textSecondary,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.hoverBackground;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {!isPublicUser && (
                              <button
                                onClick={() => handleDelete(report.id)}
                                className="p-2 rounded-lg transition-colors duration-200"
                                style={{
                                  color: colors.textSecondary,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = colors.hoverBackground;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
                          {report.fileName.split('-').slice(0, -1).join(' ').replace(/_/g, ' ')}
                        </div>
                        <div 
                          className="text-xs mb-2"
                          style={{ color: colors.textSecondary }}
                        >
                          {getReportTypeLabel(report.type)}
                        </div>
                        <div 
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          {formatDate(report.startDate)} – {formatDate(report.endDate)}
                        </div>
                      </div>
                      <span 
                        className="text-xs font-medium px-2 py-1 rounded"
                        style={{
                          backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                          color: colors.textPrimary,
                        }}
                      >
                        {report.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(report)}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        style={{
                          backgroundColor: colors.accent,
                          color: 'white',
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(report.id, report.fileName)}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        style={{
                          backgroundColor: colors.hoverBackground,
                          color: colors.textPrimary,
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div 
                className="rounded-3xl p-6 transition-colors duration-300"
                style={{
                  backgroundColor: colors.cardBackground,
                  boxShadow: theme === 'light' 
                    ? '0 4px 20px rgba(0,0,0,0.05)' 
                    : 'none'
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Page {meta.page} of {meta.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1 || reportsLoading}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: colors.hoverBackground,
                        color: colors.textPrimary,
                      }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.totalPages || reportsLoading}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: colors.hoverBackground,
                        color: colors.textPrimary,
                      }}
                    >
                      Next
                    </button>
                  </div>
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
      <ReportPreviewModal
        report={previewReport}
        onClose={() => setPreviewReport(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}
