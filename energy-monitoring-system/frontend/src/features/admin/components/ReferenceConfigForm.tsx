import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/common/Toast';
import { useCreateReferenceConfig, useReferenceConfig } from '../hooks/useDiagnostics';
import type { CreateReferenceConfigRequest } from '@/types/diagnostic.types';

/**
 * Reference Configuration Validation Schema
 */
const referenceConfigSchema = z.object({
  appliedWeightKg: z
    .number()
    .min(0.1, 'Applied weight must be at least 0.1 kg')
    .max(500, 'Applied weight must not exceed 500 kg'),
  expectedEnergyWh: z
    .number()
    .min(0.001, 'Expected energy must be at least 0.001 Wh')
    .max(100, 'Expected energy must not exceed 100 Wh'),
  tolerancePercent: z
    .number()
    .min(0, 'Tolerance must be at least 0%')
    .max(50, 'Tolerance must not exceed 50%'),
});

/**
 * Reference Config Form Component
 * 
 * Form for creating or updating the reference configuration for diagnostic tests.
 * Uses React Hook Form with Zod validation for real-time error feedback.
 */
export function ReferenceConfigForm() {
  const { data: currentConfig, isLoading: isLoadingConfig } = useReferenceConfig();
  const createMutation = useCreateReferenceConfig();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateReferenceConfigRequest>({
    resolver: zodResolver(referenceConfigSchema),
    mode: 'onChange',
    defaultValues: currentConfig
      ? {
          appliedWeightKg: currentConfig.appliedWeightKg,
          expectedEnergyWh: currentConfig.expectedEnergyWh,
          tolerancePercent: currentConfig.tolerancePercent,
        }
      : {
          appliedWeightKg: 70,
          expectedEnergyWh: 2.5,
          tolerancePercent: 10,
        },
  });

  const onSubmit = async (data: CreateReferenceConfigRequest) => {
    try {
      await createMutation.mutateAsync(data);
      showToast(
        currentConfig
          ? 'Reference configuration updated successfully'
          : 'Reference configuration created successfully',
        'success'
      );
    } catch (error) {
      console.error('Failed to save reference configuration:', error);
      showToast('Failed to save reference configuration', 'error');
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2A2E37] bg-white dark:bg-[#1C1F26] p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#E5E7EB] dark:bg-[#2A2E37] rounded w-1/4"></div>
          <div className="h-10 bg-[#E5E7EB] dark:bg-[#2A2E37] rounded"></div>
          <div className="h-10 bg-[#E5E7EB] dark:bg-[#2A2E37] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2A2E37] bg-white dark:bg-[#1C1F26] p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#1A1D23] dark:text-[#EDEEF0] mb-2">
          Reference Configuration
        </h3>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
          Set baseline values for diagnostic tests. Contact hardware team for expected values.
        </p>
      </div>

      {/* Current Configuration Display */}
      {currentConfig && (
        <div className="mb-6 p-4 rounded-lg bg-[#F5F6F8] dark:bg-[#2A2E37]">
          <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-2">
            Current Configuration
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1A1D23] dark:text-[#EDEEF0]">
                {currentConfig.appliedWeightKg} kg
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Applied Weight</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1D23] dark:text-[#EDEEF0]">
                {currentConfig.expectedEnergyWh} Wh
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Expected Energy</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1D23] dark:text-[#EDEEF0]">
                ±{currentConfig.tolerancePercent}%
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Tolerance</p>
            </div>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-3">
            Last updated by {currentConfig.createdBy} on{' '}
            {new Date(currentConfig.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Applied Weight */}
        <Input
          id="appliedWeightKg"
          type="number"
          step="0.1"
          label="Applied Weight (kg)"
          placeholder="70"
          error={errors.appliedWeightKg?.message}
          disabled={createMutation.isPending}
          required
          {...register('appliedWeightKg', { valueAsNumber: true })}
        />

        {/* Expected Energy */}
        <Input
          id="expectedEnergyWh"
          type="number"
          step="0.001"
          label="Expected Energy (Wh)"
          placeholder="2.5"
          error={errors.expectedEnergyWh?.message}
          disabled={createMutation.isPending}
          required
          {...register('expectedEnergyWh', { valueAsNumber: true })}
        />

        {/* Tolerance */}
        <Input
          id="tolerancePercent"
          type="number"
          step="0.1"
          label="Tolerance (%)"
          placeholder="10"
          error={errors.tolerancePercent?.message}
          disabled={createMutation.isPending}
          required
          {...register('tolerancePercent', { valueAsNumber: true })}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={createMutation.isPending}
          disabled={!isValid || createMutation.isPending}
        >
          {currentConfig ? 'Update Configuration' : 'Save Configuration'}
        </Button>
      </form>
    </div>
  );
}
