import { useState, useEffect } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomDropdown } from '@/components/common';
import {
  HourRangeSelector,
  type HourRange,
} from '@/components/common/HourRangeSelector';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';
import {
  ReportType,
  ReportFormat,
  type GenerateReportDto,
} from '@/types/report.types';
import type { ReportQuota } from '@/api/services/reports.service';

interface GenerateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (dto: GenerateReportDto) => void;
  isGenerating?: boolean;
  quota?: ReportQuota;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function GenerateReportDialog({
  open,
  onClose,
  onGenerate,
  isGenerating,
  quota,
}: GenerateReportDialogProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const isLimitReached = Boolean(
    quota && !quota.isUnlimited && quota.remainingToday !== null && quota.remainingToday <= 0
  );

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<ReportFormat>(ReportFormat.PDF);
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [hourRange, setHourRange] = useState<HourRange | null>(null);
  const [includeAI, setIncludeAI] = useState(true);

  useEffect(() => {
    if (open && !startDate && !endDate) {
      const today = toYmd(new Date());
      setStartDate(today);
      setEndDate(today);
    }
    if (!open) {
      setTimeout(() => {
        setStartDate('');
        setEndDate('');
        setFormat(ReportFormat.PDF);
        setAggregation('hourly');
        setHourRange(null);
        setIncludeAI(true);
      }, 300);
    }
  }, [open, startDate, endDate]);

  const applyDatePreset = (preset: 'hourly' | 'last7' | 'last30' | 'thisMonth') => {
    const today = new Date();
    const end = toYmd(today);
    if (preset === 'hourly') {
      setStartDate(end);
      setEndDate(end);
      setAggregation('hourly');
    } else if (preset === 'last7') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      setStartDate(toYmd(start));
      setEndDate(end);
      setAggregation('daily');
    } else if (preset === 'last30') {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      setStartDate(toYmd(start));
      setEndDate(end);
      setAggregation('daily');
    } else {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toYmd(start));
      setEndDate(end);
      setAggregation('daily');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    const dto: GenerateReportDto = {
      type: ReportType.SYSTEM_SUMMARY,
      format,
      startDate,
      endDate,
      aggregation,
      includeAIAnalysis: includeAI,
      ...(hourRange
        ? { startHour: hourRange.startHour, endHour: hourRange.endHour }
        : {}),
    };

    onGenerate(dto);
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  const dateInputColorScheme: React.CSSProperties = {
    colorScheme: theme === 'dark' ? 'dark' : 'light',
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Generate EcoStep Report"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="space-y-4 pb-4">
          <div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              Generates the complete <strong>EcoStep Energy &amp; Tile Health Report</strong> — including energy collected, busiest hours, power safety, hardware health check, and plain-English next steps.
            </p>
          </div>

          {/* Date Range with Quick Presets */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span
                className="text-sm font-medium"
                style={{ color: colors.textSecondary }}
              >
                Date Range
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'hourly' as const, label: 'Today (Hourly)' },
                  { id: 'last7' as const, label: 'Last 7 Days' },
                  { id: 'last30' as const, label: 'Last 30 Days' },
                  { id: 'thisMonth' as const, label: 'This Month' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyDatePreset(preset.id)}
                    disabled={isGenerating}
                    className="text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer hover:opacity-85"
                    style={{
                      borderColor: colors.border,
                      backgroundColor:
                        theme === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)',
                      color: colors.textPrimary,
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="report-start-date"
                  className="block text-xs font-medium mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Start Date
                </label>
                <Input
                  id="report-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={isGenerating}
                  style={dateInputColorScheme}
                />
              </div>
              <div>
                <label
                  htmlFor="report-end-date"
                  className="block text-xs font-medium mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  End Date
                </label>
                <Input
                  id="report-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  disabled={isGenerating}
                  style={dateInputColorScheme}
                />
              </div>
            </div>
          </div>

          {/* Time Grouping & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Time Grouping
              </label>
              <CustomDropdown
                value={aggregation}
                onChange={(value) => setAggregation(value as 'hourly' | 'daily' | 'weekly')}
                options={[
                  { value: 'hourly', label: 'Hourly' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Export Format
              </label>
              <CustomDropdown
                value={format}
                onChange={(value) => setFormat(value as ReportFormat)}
                options={[
                  { value: ReportFormat.PDF, label: 'PDF Report' },
                  { value: ReportFormat.EXCEL, label: 'Excel (.xlsx) Raw Data' },
                ]}
              />
            </div>
          </div>

          {/* Optional Custom Hour Range */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div>
              <span
                className="block text-sm font-medium"
                style={{ color: colors.textSecondary }}
              >
                Hour Window (Optional)
              </span>
              <span
                className="block text-xs"
                style={{ color: colors.textSecondary }}
              >
                Filter report data to specific hours of the day (PHT)
              </span>
            </div>
            <HourRangeSelector
              value={hourRange}
              onChange={setHourRange}
              compact={false}
            />
          </div>

          {/* AI Summary Option (Flat hairline row) */}
          <div className="pt-3 border-t border-[var(--line)]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="w-4 h-4 rounded accent-[#428475] mt-0.5"
                disabled={isGenerating}
              />
              <div className="flex-1">
                <div
                  className="font-medium text-sm mb-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  Include EcoGuide plain-English summary
                </div>
                <div
                  className="text-xs leading-relaxed"
                  style={{ color: colors.textSecondary }}
                >
                  Adds a short, easy-to-read summary of what happened and what to do next.
                </div>
              </div>
            </label>
          </div>

          {/* Public Daily Quota Notice (Flat inline caption) */}
          {quota && !quota.isUnlimited && quota.limit !== null && quota.remainingToday !== null && (
            <p
              className="text-xs font-medium m-0 pt-2 border-t border-[var(--line)]"
              style={{ color: isLimitReached ? '#ef4444' : colors.textSecondary }}
            >
              {isLimitReached
                ? `Daily limit reached (${quota.usedToday}/${quota.limit} reports used today). Resets tomorrow.`
                : `Public daily quota: ${quota.remainingToday} of ${quota.limit} reports remaining today`}
            </p>
          )}
        </div>

        <DialogFooter
          className="pt-4 mt-1 border-t border-[var(--line)]"
        >
          <Button
            type="button"
            onClick={handleClose}
            variant="ghost"
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isGenerating || isLimitReached || !startDate || !endDate}
          >
            {isGenerating
              ? 'Generating...'
              : isLimitReached
                ? 'Daily Limit Reached'
                : 'Generate Report'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
