import { useState } from 'react';
import { FileText, Plus, Filter } from 'lucide-react';
import { EcoPageHeader, EcoCard, EcoEmptyState, CustomDropdown } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ReportCard } from '../components/ReportCard';
import { GenerateReportDialog } from '../components/GenerateReportDialog';
import { useReports, useReportActions } from '../hooks';
import { ReportType, ReportFormat, type GenerateReportDto } from '@/types/report.types';

/**
 * Reports Page Component
 * Redesigned with EcoStep design system
 */
export function ReportsPage() {
  // State
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<ReportFormat | 'all'>('all');
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

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
  const handleRefresh = () => {
    refetchReports();
  };

  const handleGenerateReport = (dto: GenerateReportDto) => {
    generateReport(dto, {
      onSuccess: () => {
        setIsGenerateDialogOpen(false);
      },
    });
  };

  const handleDownload = (id: string, fileName: string) => {
    downloadReport({ id, fileName });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReport(id);
    }
  };

  // Loading state
  if (reportsLoading && !reportsData) {
    return (
      <div className="eco-page-container">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (reportsError && !reportsData) {
    return (
      <div className="eco-page-container">
        <EcoEmptyState
          icon={FileText}
          title="Unable to Load Reports"
          description="Could not connect to the backend server. Please ensure the server is running and try again."
          action={
            <button onClick={handleRefresh} className="eco-btn-primary">
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  const reports = reportsData?.data || [];
  const meta = reportsData?.meta;

  return (
    <div className="eco-page-container">
      {/* Page Header */}
      <EcoPageHeader
        title="Energy Reports"
        subtitle="Generate, download, and manage your energy consumption reports."
        status="connected"
        statusLabel="Live"
        onRefresh={handleRefresh}
        isRefreshing={reportsLoading}
        actions={
          <button
            onClick={() => setIsGenerateDialogOpen(true)}
            className="eco-btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Generate Report
          </button>
        }
      />

      <div className="space-y-6">
        {/* Filters */}
        <EcoCard compact>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#428475]" strokeWidth={2} />
            <span className="text-sm font-semibold text-[#1A312C] dark:text-[#89D7B7]">Filters</span>
            {meta && (
              <span className="eco-badge eco-badge-neutral ml-auto">
                {meta.total} report{meta.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[rgb(var(--color-neutral-600))]">Type:</span>
              <CustomDropdown
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value as ReportType | 'all');
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: ReportType.DAILY, label: 'Daily' },
                  { value: ReportType.WEEKLY, label: 'Weekly' },
                  { value: ReportType.MONTHLY, label: 'Monthly' },
                  { value: ReportType.CUSTOM, label: 'Custom' },
                ]}
              />
            </div>

            {/* Format Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[rgb(var(--color-neutral-600))]">Format:</span>
              <CustomDropdown
                value={formatFilter}
                onChange={(value) => {
                  setFormatFilter(value as ReportFormat | 'all');
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Formats' },
                  { value: ReportFormat.PDF, label: 'PDF' },
                  { value: ReportFormat.EXCEL, label: 'Excel' },
                ]}
              />
            </div>
          </div>
        </EcoCard>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <EcoEmptyState
            icon={FileText}
            title="No Reports Found"
            description={
              typeFilter !== 'all' || formatFilter !== 'all'
                ? 'No reports match the current filters. Try adjusting your filter criteria.'
                : 'You haven\'t generated any reports yet. Click the "Generate Report" button to create your first report.'
            }
            action={
              <button
                onClick={() => setIsGenerateDialogOpen(true)}
                className="eco-btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Generate Your First Report
              </button>
            }
          />
        ) : (
          <>
            <div className="eco-grid-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  isDownloading={isDownloading}
                  isDeleting={isDeleting}
                />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <EcoCard compact>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[rgb(var(--color-neutral-600))]">
                    Page {meta.page} of {meta.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1 || reportsLoading}
                      className="eco-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.totalPages || reportsLoading}
                      className="eco-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </EcoCard>
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
    </div>
  );
}
