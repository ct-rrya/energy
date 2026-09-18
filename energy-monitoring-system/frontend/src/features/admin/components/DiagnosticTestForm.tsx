import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/common/Toast';
import { useRecordDiagnosticTest, useReferenceConfig } from '../hooks/useDiagnostics';
import { DiagnosticResultStatus } from '@/types/diagnostic.types';
import type { RecordDiagnosticTestRequest, DiagnosticTest } from '@/types/diagnostic.types';

/**
 * Diagnostic Test Validation Schema
 */
const diagnosticTestSchema = z.object({
  actualEnergy: z
    .number()
    .min(0, 'Actual energy must be a positive number'),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
});

/**
 * Diagnostic Test Form Component
 * 
 * Modal form for recording a diagnostic test with actual measured energy.
 * Displays calculated results with color-coded status indicators.
 */
export function DiagnosticTestForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<DiagnosticTest | null>(null);
  
  const { data: referenceConfig } = useReferenceConfig();
  const recordMutation = useRecordDiagnosticTest();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RecordDiagnosticTestRequest>({
    resolver: zodResolver(diagnosticTestSchema),
    mode: 'onChange',
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setTestResult(null);
    reset();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTestResult(null);
    reset();
  };

  const onSubmit = async (data: RecordDiagnosticTestRequest) => {
    try {
      const result = await recordMutation.mutateAsync(data);
      setTestResult(result);
      showToast('Diagnostic test recorded successfully', 'success');
    } catch (error) {
      console.error('Failed to record diagnostic test:', error);
      showToast('Failed to record diagnostic test', 'error');
    }
  };

  const getResultBadgeVariant = (result: string) => {
    switch (result) {
      case DiagnosticResultStatus.WITHIN_RANGE:
        return 'success';
      case DiagnosticResultStatus.ABOVE_EXPECTED:
        return 'warning';
      case DiagnosticResultStatus.BELOW_EXPECTED:
        return 'danger';
      default:
        return 'default';
    }
  };

  const getResultIcon = (result: string) => {
    if (result === DiagnosticResultStatus.BELOW_EXPECTED) {
      return <TrendingDown className="h-5 w-5" />;
    }
    return <TrendingUp className="h-5 w-5" />;
  };

  return (
    <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2A2E37] bg-white dark:bg-[#1C1F26] p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#1A1D23] dark:text-[#EDEEF0] mb-2">
          Diagnostic Test
        </h3>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
          Record actual measured energy from a diagnostic test to compare against expected values.
        </p>
      </div>

      {/* Run Test Button */}
      {!referenceConfig && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Reference configuration must be set before running diagnostic tests.
          </p>
        </div>
      )}

      <Button
        onClick={handleOpenModal}
        disabled={!referenceConfig}
        variant="primary"
        fullWidth
        className="flex items-center justify-center gap-2"
      >
        <ClipboardCheck className="h-5 w-5" />
        Run Diagnostic Test
      </Button>

      {/* Test Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Record Diagnostic Test"
        size="md"
      >
        {!testResult ? (
          /* Test Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Expected Energy Info */}
            {referenceConfig && (
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                  Expected Energy
                </p>
                <p className="text-2xl font-bold text-[#2FBF71] dark:text-[#3ED98A]">
                  {referenceConfig.expectedEnergyWh} Wh
                </p>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                  Tolerance: ±{referenceConfig.tolerancePercent}%
                </p>
              </div>
            )}

            {/* Actual Energy Input */}
            <Input
              id="actualEnergy"
              type="number"
              step="0.001"
              label="Actual Measured Energy (Wh)"
              placeholder="2.5"
              error={errors.actualEnergy?.message}
              disabled={recordMutation.isPending}
              required
              {...register('actualEnergy', { valueAsNumber: true })}
            />

            {/* Notes Input */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-[#1A1D23] dark:text-[#EDEEF0] mb-2"
              >
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Test conditions, observations, etc."
                disabled={recordMutation.isPending}
                maxLength={500}
                className="w-full px-4 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#2A2E37] bg-white dark:bg-[#1C1F26] text-[#1A1D23] dark:text-[#EDEEF0] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2FBF71] dark:focus:ring-[#3ED98A] disabled:opacity-60 disabled:cursor-not-allowed"
                {...register('notes')}
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                disabled={recordMutation.isPending}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={recordMutation.isPending}
                disabled={recordMutation.isPending}
                fullWidth
              >
                Submit Test
              </Button>
            </div>
          </form>
        ) : (
          /* Test Result Display */
          <div className="space-y-6">
            {/* Result Badge */}
            <div className="flex items-center justify-center gap-3 p-6 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
              {getResultIcon(testResult.result)}
              <Badge variant={getResultBadgeVariant(testResult.result)} className="text-base px-4 py-1">
                {testResult.result}
              </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Expected Energy */}
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Expected Energy
                </p>
                <p className="text-xl font-bold text-[#1A1D23] dark:text-[#EDEEF0]">
                  {testResult.expectedEnergy.toFixed(3)} Wh
                </p>
              </div>

              {/* Actual Energy */}
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Actual Energy
                </p>
                <p className="text-xl font-bold text-[#1A1D23] dark:text-[#EDEEF0]">
                  {testResult.actualEnergy.toFixed(3)} Wh
                </p>
              </div>

              {/* Difference */}
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Difference
                </p>
                <p className={`text-xl font-bold ${
                  testResult.difference >= 0
                    ? 'text-[#2FBF71] dark:text-[#3ED98A]'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {testResult.difference >= 0 ? '+' : ''}{testResult.difference.toFixed(4)} Wh
                </p>
              </div>

              {/* Performance */}
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Performance
                </p>
                <p className="text-xl font-bold text-[#1A1D23] dark:text-[#EDEEF0]">
                  {testResult.performancePercentage.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Notes Display */}
            {testResult.notes && (
              <div className="p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                  Notes
                </p>
                <p className="text-sm text-[#1A1D23] dark:text-[#EDEEF0]">
                  {testResult.notes}
                </p>
              </div>
            )}

            {/* Close Button */}
            <Button
              onClick={handleCloseModal}
              variant="primary"
              fullWidth
            >
              Close
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
