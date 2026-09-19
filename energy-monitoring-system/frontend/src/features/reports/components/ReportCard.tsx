import type { Report } from '@/types/report.types';
import { ReportFormat, ReportType } from '@/types/report.types';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatNumber } from '@/lib/utils';
import { FileText, Download, Trash2, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Report Card Props
 */
interface ReportCardProps {
  report: Report;
  onDownload: (id: string, fileName: string) => void;
  onDelete: (id: string) => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get report type label
 */
function getReportTypeLabel(type: ReportType): string {
  const labels: Record<ReportType, string> = {
    [ReportType.DAILY]: 'Daily',
    [ReportType.WEEKLY]: 'Weekly',
    [ReportType.MONTHLY]: 'Monthly',
    [ReportType.CUSTOM]: 'Custom',
    [ReportType.ENERGY_MONITORING]: 'Energy Monitoring',
    [ReportType.HISTORICAL_ANALYTICS]: 'Historical Analytics',
    [ReportType.SYSTEM_DIAGNOSTICS]: 'System Diagnostics',
    [ReportType.SYSTEM_SUMMARY]: 'System Summary',
  };
  return labels[type];
}

/**
 * Report Card Component
 * 
 * Displays an individual report in a card format.
 * 
 * Features:
 * - Report metadata
 * - File format badge
 * - Download button
 * - Delete button
 * - Summary metrics
 */
export function ReportCard({
  report,
  onDownload,
  onDelete,
  isDownloading,
  isDeleting,
}: ReportCardProps) {
  const isPDF = report.format === ReportFormat.PDF;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              isPDF ? 'bg-red-100' : 'bg-green-100'
            }`}
          >
            <FileText
              className={`h-5 w-5 ${isPDF ? 'text-red-600' : 'text-green-600'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">
              {getReportTypeLabel(report.type)} Report
            </h3>
            <p className="text-sm text-neutral-600">
              {report.startDate} to {report.endDate}
            </p>
          </div>
        </div>
        <Badge variant={isPDF ? 'danger' : 'success'}>
          {report.format.toUpperCase()}
        </Badge>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-neutral-50 p-3">
          <div className="text-xs text-neutral-600">Total Energy</div>
          <div className="text-lg font-bold text-neutral-900">
            {formatNumber(report.summary.totalEnergyKWh, 2)} kWh
          </div>
        </div>
        <div className="rounded-lg bg-neutral-50 p-3">
          <div className="text-xs text-neutral-600">Cost Savings</div>
          <div className="text-lg font-bold text-green-600">
            ${formatNumber(report.summary.costSavingsUSD, 2)}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(new Date(report.createdAt))}</span>
        </div>
        <div className="flex items-center gap-1">
          <HardDrive className="h-3 w-3" />
          <span>{formatFileSize(report.fileSize)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          <span>{report.downloadCount} download{report.downloadCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => onDownload(report.id, report.fileName)}
          disabled={isDownloading || isDeleting}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
        <Button
          onClick={() => onDelete(report.id)}
          disabled={isDownloading || isDeleting}
          variant="secondary"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
