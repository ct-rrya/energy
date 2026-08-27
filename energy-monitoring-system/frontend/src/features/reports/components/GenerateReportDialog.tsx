import { useState } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomDropdown, CustomRadio, MonthDropdown } from '@/components/common';
import { ReportType, ReportFormat, type GenerateReportDto } from '@/types/report.types';

/**
 * Generate Report Dialog Props
 */
interface GenerateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (dto: GenerateReportDto) => void;
  isGenerating?: boolean;
}

/**
 * Generate Report Dialog Component
 * 
 * Form dialog for generating new reports.
 * 
 * Features:
 * - Report type selection
 * - Format selection (PDF/Excel)
 * - Date inputs based on report type
 * - Form validation
 * - Generate button
 */
export function GenerateReportDialog({
  open,
  onClose,
  onGenerate,
  isGenerating,
}: GenerateReportDialogProps) {
  const [type, setType] = useState<ReportType>(ReportType.MONTHLY);
  const [format, setFormat] = useState<ReportFormat>(ReportFormat.PDF);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dto: GenerateReportDto = {
      type,
      format,
    };

    if (type === ReportType.CUSTOM) {
      dto.startDate = startDate;
      dto.endDate = endDate;
    } else {
      dto.year = year;
      if (type === ReportType.DAILY || type === ReportType.MONTHLY || type === ReportType.WEEKLY) {
        dto.month = month;
      }
      if (type === ReportType.DAILY || type === ReportType.WEEKLY) {
        dto.day = day;
      }
    }

    onGenerate(dto);
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Generate New Report" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] dark:text-[#9CA3AF] mb-2">
              Report Type
            </label>
            <CustomDropdown
              value={type}
              onChange={(value) => setType(value as ReportType)}
              options={[
                { value: ReportType.DAILY, label: 'Daily Report' },
                { value: ReportType.WEEKLY, label: 'Weekly Report' },
                { value: ReportType.MONTHLY, label: 'Monthly Report' },
                { value: ReportType.CUSTOM, label: 'Custom Date Range' },
              ]}
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] dark:text-[#9CA3AF] mb-2">
              Format
            </label>
            <CustomRadio
              value={format}
              onChange={(value) => setFormat(value as ReportFormat)}
              options={[
                { value: ReportFormat.PDF, label: 'PDF' },
                { value: ReportFormat.EXCEL, label: 'Excel' },
              ]}
              disabled={isGenerating}
            />
          </div>

          {/* Date Inputs - Custom Range */}
          {type === ReportType.CUSTOM && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] dark:text-[#9CA3AF] mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={isGenerating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] dark:text-[#9CA3AF] mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  disabled={isGenerating}
                />
              </div>
            </>
          )}

          {/* Date Inputs - Year/Month/Day */}
          {type !== ReportType.CUSTOM && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] dark:text-[#9CA3AF] mb-2">
                  Year
                </label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={2000}
                  max={2100}
                  required
                  disabled={isGenerating}
                />
              </div>
              {(type === ReportType.DAILY ||
                type === ReportType.MONTHLY ||
                type === ReportType.WEEKLY) && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#9CA3AF] dark:text-[#9CA3AF] mb-2">
                    Month
                  </label>
                  <MonthDropdown
                    value={month}
                    onChange={setMonth}
                  />
                </div>
              )}
              {(type === ReportType.DAILY || type === ReportType.WEEKLY) && (
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] dark:text-[#9CA3AF] mb-2">
                    Day
                  </label>
                  <Input
                    type="number"
                    value={day}
                    onChange={(e) => setDay(parseInt(e.target.value))}
                    min={1}
                    max={31}
                    required
                    disabled={isGenerating}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleClose}
            variant="ghost"
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
