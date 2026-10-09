import { X, FileText, Calendar, User, Clock, Download, Eye } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';
import type { Report, ReportType } from '@/types/report.types';

interface ReportDetailsModalProps {
  report: Report;
  onClose: () => void;
  onDownload: (id: string, fileName: string) => void;
  onView: (report: Report) => void;
  getReportTypeLabel: (type: ReportType) => string;
  formatDate: (dateString: string) => string;
  formatFileSize: (bytes: number) => string;
}

/**
 * Report Details Modal Component
 * 
 * Displays comprehensive report information in an expandable modal
 */
export function ReportDetailsModal({
  report,
  onClose,
  onDownload,
  onView,
  getReportTypeLabel,
  formatDate,
  formatFileSize,
}: ReportDetailsModalProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.cardBackground }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
          style={{ 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)'
              }}
            >
              <FileText 
                className="w-5 h-5"
                style={{ color: colors.accent }}
              />
            </div>
            <h2 
              className="text-xl font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Report Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hoverBackground;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* File Information */}
          <div>
            <h3 
              className="text-sm font-semibold mb-3 uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              File Information
            </h3>
            <div className="space-y-3">
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  File Name
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {report.fileName}
                </div>
              </div>
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  File Size
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {formatFileSize(report.fileSize)}
                </div>
              </div>
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Format
                </div>
                <span 
                  className="text-xs font-medium px-2.5 py-1 rounded-md inline-block"
                  style={{
                    backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                    color: colors.textPrimary,
                    border: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
                  }}
                >
                  {report.format.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Report Information */}
          <div>
            <h3 
              className="text-sm font-semibold mb-3 uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Report Information
            </h3>
            <div className="space-y-3">
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Report Type
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {getReportTypeLabel(report.type)}
                </div>
              </div>
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Report Period
                </div>
                <div 
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: colors.textPrimary }}
                >
                  <Calendar className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  {formatDate(report.startDate)} – {formatDate(report.endDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Generation Information */}
          <div>
            <h3 
              className="text-sm font-semibold mb-3 uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Generation Information
            </h3>
            <div className="space-y-3">
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Generated On
                </div>
                <div 
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: colors.textPrimary }}
                >
                  <Clock className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  {formatDate(report.createdAt)}
                </div>
              </div>
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Generated By
                </div>
                <div 
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: colors.textPrimary }}
                >
                  <User className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  {report.generatedByName}
                </div>
              </div>
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Expires On
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {formatDate(report.expiresAt)}
                </div>
              </div>
              <div>
                <div 
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Download Count
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {report.downloadCount} {report.downloadCount === 1 ? 'time' : 'times'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          {report.summary && (
            <div>
              <h3 
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                Summary Metrics
              </h3>
              <div 
                className="grid grid-cols-2 gap-4 p-4 rounded-lg"
                style={{
                  backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div>
                  <div 
                    className="text-xs mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Total Energy
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {report.summary.totalEnergyKWh.toFixed(2)} kWh
                  </div>
                </div>
                <div>
                  <div 
                    className="text-xs mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Avg Power
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {report.summary.avgPowerW.toFixed(2)} W
                  </div>
                </div>
                <div>
                  <div 
                    className="text-xs mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Peak Power
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {report.summary.peakPowerW.toFixed(2)} W
                  </div>
                </div>
                <div>
                  <div 
                    className="text-xs mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    CO₂ Avoided
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {report.summary.co2AvoidedKg.toFixed(2)} kg
                  </div>
                </div>
                <div>
                  <div 
                    className="text-xs mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Cost Savings
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    ${report.summary.costSavingsUSD.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div 
                    className="text-xs mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Readings
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {report.summary.readingCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div 
          className="sticky bottom-0 flex gap-3 p-6 border-t"
          style={{ 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border 
          }}
        >
          <button
            onClick={() => onView(report)}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: colors.hoverBackground,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.hoverBackground;
            }}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => onDownload(report.id, report.fileName)}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
