import { useState, useEffect } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomDropdown } from '@/components/common';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';
import {
  ReportType,
  ReportFormat,
  type GenerateReportDto,
} from '@/types/report.types';
import {
  FileText,
  TrendingUp,
  Activity,
  FileBarChart,
} from 'lucide-react';

interface GenerateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (dto: GenerateReportDto) => void;
  isGenerating?: boolean;
}

interface ReportTypeOption {
  value: ReportType;
  label: string;
  description: string;
  icon: typeof FileText;
}

const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    value: ReportType.ENERGY_MONITORING,
    label: 'Energy Generation Report',
    description: 'Summarize energy generation and electrical measurements.',
    icon: FileText,
  },
  {
    value: ReportType.HISTORICAL_ANALYTICS,
    label: 'Energy Trends Report',
    description: 'Analyze historical energy and electrical trends.',
    icon: TrendingUp,
  },
  {
    value: ReportType.SYSTEM_DIAGNOSTICS,
    label: 'System Performance Report',
    description: 'Review standardized system diagnostic tests.',
    icon: Activity,
  },
  {
    value: ReportType.SYSTEM_SUMMARY,
    label: 'System Overview Report',
    description: 'Generate a combined overview of available EcoStep data.',
    icon: FileBarChart,
  },
];

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
}: GenerateReportDialogProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<ReportFormat>(ReportFormat.PDF);
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [includeAI, setIncludeAI] = useState(false);

  const [energySections, setEnergySections] = useState({
    energySummary: true,
    voltage: true,
    current: true,
    stepActivity: true,
    energyChart: true,
  });

  const [analyticsSections, setAnalyticsSections] = useState({
    voltage: true,
    current: true,
    energy: true,
  });

  const [diagnosticSections, setDiagnosticSections] = useState({
    diagnosticHistory: true,
    expectedVsActual: true,
    performanceResults: true,
  });

  const [summarySections, setSummarySections] = useState({
    energySummary: true,
    electricalMeasurements: true,
    historicalAnalytics: true,
    diagnosticSummary: true,
    stepActivity: true,
  });

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setSelectedType(null);
        setStartDate('');
        setEndDate('');
        setFormat(ReportFormat.PDF);
        setAggregation('daily');
        setIncludeAI(false);
      }, 300);
    }
  }, [open]);

  const applyDatePreset = (preset: 'last7' | 'last30' | 'thisMonth') => {
    const today = new Date();
    const end = toYmd(today);
    if (preset === 'last7') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      setStartDate(toYmd(start));
      setEndDate(end);
    } else if (preset === 'last30') {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      setStartDate(toYmd(start));
      setEndDate(end);
    } else {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toYmd(start));
      setEndDate(end);
    }
  };

  const handleContinue = () => {
    if (step === 1 && selectedType) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType || !startDate || !endDate) {
      return;
    }

    let includeSections: string[] = [];

    if (selectedType === ReportType.ENERGY_MONITORING) {
      includeSections = Object.entries(energySections)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key);
    } else if (selectedType === ReportType.HISTORICAL_ANALYTICS) {
      includeSections = Object.entries(analyticsSections)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key);
    } else if (selectedType === ReportType.SYSTEM_DIAGNOSTICS) {
      includeSections = Object.entries(diagnosticSections)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key);
    } else if (selectedType === ReportType.SYSTEM_SUMMARY) {
      includeSections = Object.entries(summarySections)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key);
    }

    const dto: GenerateReportDto = {
      type: selectedType,
      format,
      startDate,
      endDate,
      includeAIAnalysis: includeAI,
    };

    if (includeSections.length > 0) {
      dto.includeSections = includeSections;
    }

    if (selectedType === ReportType.HISTORICAL_ANALYTICS) {
      dto.aggregation = aggregation;
    }

    onGenerate(dto);
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  const canContinue = selectedType !== null;
  const dateInputColorScheme: React.CSSProperties = {
    colorScheme: theme === 'dark' ? 'dark' : 'light',
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Generate Report"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="space-y-5 pb-4">
          {/* STEP 1: SELECT REPORT TYPE */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3
                  className="text-base font-semibold mb-1"
                  style={{ color: colors.textPrimary }}
                >
                  Choose a report type
                </h3>
                <p
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Select the type of report you want to generate.
                </p>
              </div>

              <div className="space-y-3">
                {REPORT_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedType(option.value)}
                      className="w-full p-4 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer"
                      style={{
                        borderColor: isSelected ? colors.accent : colors.border,
                        backgroundColor: isSelected
                          ? theme === 'light'
                            ? 'rgba(66, 132, 117, 0.05)'
                            : 'rgba(137, 215, 183, 0.05)'
                          : colors.cardBackground,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: isSelected
                              ? theme === 'light'
                                ? 'rgba(66, 132, 117, 0.1)'
                                : 'rgba(137, 215, 183, 0.1)'
                              : theme === 'light'
                              ? 'rgba(0, 0, 0, 0.03)'
                              : 'rgba(255, 255, 255, 0.03)',
                          }}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ color: isSelected ? colors.accent : colors.textSecondary }}
                          />
                        </div>
                        <div className="flex-1">
                          <div
                            className="font-semibold text-sm mb-1"
                            style={{ color: colors.textPrimary }}
                          >
                            {option.label}
                          </div>
                          <div
                            className="text-xs leading-relaxed"
                            style={{ color: colors.textSecondary }}
                          >
                            {option.description}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1"
                          style={{
                            borderColor: isSelected ? colors.accent : colors.border,
                            backgroundColor: isSelected ? colors.accent : 'transparent',
                          }}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE REPORT */}
          {step === 2 && selectedType && (
            <div className="space-y-4">
              <div>
                <h3
                  className="text-base font-semibold mb-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  Configure Report
                </h3>
                <p
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {REPORT_TYPE_OPTIONS.find((opt) => opt.value === selectedType)?.label}
                </p>
              </div>

              {/* Date Range with Quick Presets & Explicit Labels */}
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
                          backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)',
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

              {/* Energy Monitoring Sections */}
              {selectedType === ReportType.ENERGY_MONITORING && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Include
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(energySections).map(([key, checked]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setEnergySections((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded accent-[#428475]"
                          disabled={isGenerating}
                        />
                        <span className="text-sm" style={{ color: colors.textPrimary }}>
                          {key === 'energySummary'
                            ? 'Energy Summary'
                            : key === 'voltage'
                            ? 'Voltage'
                            : key === 'current'
                            ? 'Current'
                            : key === 'stepActivity'
                            ? 'Step Activity'
                            : 'Energy Chart'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Analytics Configuration */}
              {selectedType === ReportType.HISTORICAL_ANALYTICS && (
                <>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: colors.textSecondary }}
                    >
                      Metrics
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {Object.entries(analyticsSections).map(([key, checked]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setAnalyticsSections((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                            className="w-4 h-4 rounded accent-[#428475]"
                            disabled={isGenerating}
                          />
                          <span className="text-sm" style={{ color: colors.textPrimary }}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: colors.textSecondary }}
                    >
                      Summary Grouping
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
                </>
              )}

              {/* System Diagnostics Sections */}
              {selectedType === ReportType.SYSTEM_DIAGNOSTICS && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Include
                  </label>
                  <div className="space-y-2">
                    {Object.entries(diagnosticSections).map(([key, checked]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setDiagnosticSections((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded accent-[#428475]"
                          disabled={isGenerating}
                        />
                        <span className="text-sm" style={{ color: colors.textPrimary }}>
                          {key === 'diagnosticHistory'
                            ? 'Diagnostic History'
                            : key === 'expectedVsActual'
                            ? 'Expected vs Actual Energy'
                            : 'Performance Results'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* System Summary Sections */}
              {selectedType === ReportType.SYSTEM_SUMMARY && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Sections
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(summarySections).map(([key, checked]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setSummarySections((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded accent-[#428475]"
                          disabled={isGenerating}
                        />
                        <span className="text-sm" style={{ color: colors.textPrimary }}>
                          {key === 'energySummary'
                            ? 'Energy Summary'
                            : key === 'electricalMeasurements'
                            ? 'Electrical Measurements'
                            : key === 'historicalAnalytics'
                            ? 'Historical Analytics'
                            : key === 'diagnosticSummary'
                            ? 'Diagnostic Summary'
                            : 'Step Activity'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Format */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.textSecondary }}
                >
                  Format
                </label>
                <CustomDropdown
                  value={format}
                  onChange={(value) => setFormat(value as ReportFormat)}
                  options={[
                    { value: ReportFormat.PDF, label: 'PDF' },
                    { value: ReportFormat.EXCEL, label: 'Excel' },
                  ]}
                />
              </div>

              {/* AI Analysis Option */}
              <div
                className="p-3.5 rounded-lg"
                style={{
                  backgroundColor:
                    theme === 'light' ? 'rgba(66, 132, 117, 0.05)' : 'rgba(137, 215, 183, 0.05)',
                  border: `1px solid ${
                    theme === 'light' ? 'rgba(66, 132, 117, 0.2)' : 'rgba(137, 215, 183, 0.2)'
                  }`,
                }}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAI}
                    onChange={(e) => setIncludeAI(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#428475] mt-1"
                    disabled={isGenerating}
                  />
                  <div className="flex-1">
                    <div
                      className="font-medium text-sm mb-0.5"
                      style={{ color: colors.textPrimary }}
                    >
                      Include AI-generated analysis
                    </div>
                    <div
                      className="text-xs leading-relaxed"
                      style={{ color: colors.textSecondary }}
                    >
                      Generate an AI-assisted interpretation of the report data and include it in the generated file.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer so Back & Generate Report are always visible and never clipped */}
        <DialogFooter
          className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-4 px-5 sm:px-6"
          style={{ backgroundColor: colors.cardBackground }}
        >
          {step === 1 ? (
            <>
              <Button
                type="button"
                onClick={handleClose}
                variant="ghost"
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                variant="primary"
                disabled={!canContinue || isGenerating}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={handleBack}
                variant="ghost"
                disabled={isGenerating}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isGenerating || !startDate || !endDate}
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </>
          )}
        </DialogFooter>
      </form>
    </Dialog>
  );
}
