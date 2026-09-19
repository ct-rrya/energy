import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';
import { type Report, ReportType } from '@/types/report.types';
import { 
  FileText, 
  Calendar, 
  Download, 
  Zap, 
  TrendingUp,
  Activity
} from 'lucide-react';

/**
 * Report Preview Modal Props
 */
interface ReportPreviewModalProps {
  report: Report | null;
  onClose: () => void;
  onDownload: (id: string, fileName: string) => void;
}

/**
 * Report Preview Modal Component
 * 
 * Displays a scrollable preview of report metadata and summary before download.
 * 
 * Features:
 * - Report type and period
 * - Summary metrics (energy, power, etc.)
 * - File information
 * - Download action
 * - Light/Dark mode support
 */
export function ReportPreviewModal({
  report,
  onClose,
  onDownload,
}: ReportPreviewModalProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  if (!report) return null;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getReportTypeLabel = (type: ReportType): string => {
    switch (type) {
      case ReportType.ENERGY_MONITORING:
        return 'Energy Monitoring Report';
      case ReportType.HISTORICAL_ANALYTICS:
        return 'Historical Analytics Report';
      case ReportType.SYSTEM_DIAGNOSTICS:
        return 'System Diagnostics Report';
      case ReportType.SYSTEM_SUMMARY:
        return 'System Summary Report';
      case ReportType.DAILY:
        return 'Daily Report';
      case ReportType.WEEKLY:
        return 'Weekly Report';
      case ReportType.MONTHLY:
        return 'Monthly Report';
      case ReportType.CUSTOM:
        return 'Custom Report';
      default:
        return 'Report';
    }
  };

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case ReportType.ENERGY_MONITORING:
        return Zap;
      case ReportType.HISTORICAL_ANALYTICS:
        return TrendingUp;
      case ReportType.SYSTEM_DIAGNOSTICS:
        return Activity;
      case ReportType.SYSTEM_SUMMARY:
        return FileText;
      default:
        return FileText;
    }
  };

  const Icon = getReportIcon(report.type);

  return (
    <Dialog 
      open={!!report} 
      onClose={onClose} 
      title="Report Preview" 
      size="lg"
    >
      <div className="space-y-6 max-h-[60vh] overflow-y-auto">
        
        {/* Report Header */}
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              backgroundColor: theme === 'light' 
                ? 'rgba(66, 132, 117, 0.1)' 
                : 'rgba(137, 215, 183, 0.1)'
            }}
          >
            <Icon 
              className="w-8 h-8"
              style={{ color: colors.accent }}
            />
          </div>
          <h2 
            className="text-xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            {getReportTypeLabel(report.type)}
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Calendar 
              className="w-4 h-4"
              style={{ color: colors.textSecondary }}
            />
            <span style={{ color: colors.textSecondary }}>
              {formatDate(report.startDate)} – {formatDate(report.endDate)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div 
          className="border-t"
          style={{ borderColor: colors.border }}
        />

        {/* Summary Section */}
        {report.summary && (
          <div>
            <h3 
              className="text-base font-semibold mb-4"
              style={{ color: colors.textPrimary }}
            >
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {report.summary.totalEnergyKWh !== undefined && (
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: theme === 'light' 
                      ? 'rgba(0, 0, 0, 0.02)' 
                      : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div 
                    className="text-xs font-medium mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Total Energy
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: colors.accent }}
                  >
                    {report.summary.totalEnergyKWh.toFixed(2)}
                    <span 
                      className="text-sm font-normal ml-1"
                      style={{ color: colors.textSecondary }}
                    >
                      kWh
                    </span>
                  </div>
                </div>
              )}

              {report.summary.avgPowerW !== undefined && (
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: theme === 'light' 
                      ? 'rgba(0, 0, 0, 0.02)' 
                      : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div 
                    className="text-xs font-medium mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Average Power
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: colors.accent }}
                  >
                    {report.summary.avgPowerW.toFixed(1)}
                    <span 
                      className="text-sm font-normal ml-1"
                      style={{ color: colors.textSecondary }}
                    >
                      W
                    </span>
                  </div>
                </div>
              )}

              {report.summary.peakPowerW !== undefined && (
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: theme === 'light' 
                      ? 'rgba(0, 0, 0, 0.02)' 
                      : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div 
                    className="text-xs font-medium mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Peak Power
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: colors.accent }}
                  >
                    {report.summary.peakPowerW.toFixed(1)}
                    <span 
                      className="text-sm font-normal ml-1"
                      style={{ color: colors.textSecondary }}
                    >
                      W
                    </span>
                  </div>
                </div>
              )}

              {report.summary.readingCount !== undefined && (
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: theme === 'light' 
                      ? 'rgba(0, 0, 0, 0.02)' 
                      : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div 
                    className="text-xs font-medium mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Data Points
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: colors.accent }}
                  >
                    {report.summary.readingCount.toLocaleString()}
                  </div>
                </div>
              )}

              {report.summary.co2AvoidedKg !== undefined && report.summary.co2AvoidedKg > 0 && (
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: theme === 'light' 
                      ? 'rgba(0, 0, 0, 0.02)' 
                      : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div 
                    className="text-xs font-medium mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    CO₂ Avoided
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: colors.accent }}
                  >
                    {report.summary.co2AvoidedKg.toFixed(2)}
                    <span 
                      className="text-sm font-normal ml-1"
                      style={{ color: colors.textSecondary }}
                    >
                      kg
                    </span>
                  </div>
                </div>
              )}

              {report.summary.costSavingsUSD !== undefined && report.summary.costSavingsUSD > 0 && (
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: theme === 'light' 
                      ? 'rgba(0, 0, 0, 0.02)' 
                      : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div 
                    className="text-xs font-medium mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Cost Savings
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: colors.accent }}
                  >
                    ${report.summary.costSavingsUSD.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div 
          className="border-t"
          style={{ borderColor: colors.border }}
        />

        {/* File Information */}
        <div>
          <h3 
            className="text-base font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            File Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                File Name
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                {report.fileName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                Format
              </span>
              <span 
                className="text-xs font-medium px-2 py-1 rounded"
                style={{
                  backgroundColor: theme === 'light' 
                    ? 'rgba(0, 0, 0, 0.05)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  color: colors.textPrimary,
                }}
              >
                {report.format.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                File Size
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                {formatFileSize(report.fileSize)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                Generated
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                {formatDate(report.createdAt)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                Downloads
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                {report.downloadCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                Expires
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                {formatDate(report.expiresAt)}
              </span>
            </div>
          </div>
        </div>

        {/* No Data Message if applicable */}
        {report.summary?.readingCount === 0 && (
          <>
            <div 
              className="border-t"
              style={{ borderColor: colors.border }}
            />
            <div 
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: theme === 'light' 
                  ? 'rgba(239, 68, 68, 0.05)' 
                  : 'rgba(239, 68, 68, 0.1)'
              }}
            >
              <p 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                No Data Available
              </p>
              <p 
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
              >
                This report contains no monitoring data for the selected period.
              </p>
            </div>
          </>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          onClick={onClose}
          variant="ghost"
        >
          Close
        </Button>
        <Button 
          type="button"
          onClick={() => {
            onDownload(report.id, report.fileName);
            onClose();
          }}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Download {report.format.toUpperCase()}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
