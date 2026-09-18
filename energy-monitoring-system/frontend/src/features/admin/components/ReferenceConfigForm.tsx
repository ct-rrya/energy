import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/common/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors, TYPOGRAPHY } from '@/lib/theme';
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
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

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
      <div 
        className="rounded-lg p-6"
        style={{
          backgroundColor: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow
        }}
      >
        <div className="animate-pulse space-y-4">
          <div 
            className="h-4 rounded w-1/4"
            style={{ backgroundColor: colors.hoverBackground }}
          ></div>
          <div 
            className="h-10 rounded"
            style={{ backgroundColor: colors.hoverBackground }}
          ></div>
          <div 
            className="h-10 rounded"
            style={{ backgroundColor: colors.hoverBackground }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-6"
      style={{
        backgroundColor: colors.cardBackground,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ 
            color: colors.textPrimary,
            fontWeight: TYPOGRAPHY.fontWeight.semibold
          }}
        >
          Reference Configuration
        </h3>
        <p 
          className="text-sm"
          style={{ color: colors.textSecondary }}
        >
          Set baseline values for diagnostic tests. Contact hardware team for expected values.
        </p>
      </div>

      {/* Current Configuration Display */}
      {currentConfig && (
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{ backgroundColor: colors.surfaceMuted }}
        >
          <p 
            className="text-xs font-medium mb-2"
            style={{ 
              color: colors.textSecondary,
              fontWeight: TYPOGRAPHY.fontWeight.medium
            }}
          >
            Current Configuration
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p 
                className="text-sm font-semibold"
                style={{ 
                  color: colors.textPrimary,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold
                }}
              >
                {currentConfig.appliedWeightKg} kg
              </p>
              <p 
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Applied Weight
              </p>
            </div>
            <div>
              <p 
                className="text-sm font-semibold"
                style={{ 
                  color: colors.textPrimary,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold
                }}
              >
                {currentConfig.expectedEnergyWh} Wh
              </p>
              <p 
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Expected Energy
              </p>
            </div>
            <div>
              <p 
                className="text-sm font-semibold"
                style={{ 
                  color: colors.textPrimary,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold
                }}
              >
                ±{currentConfig.tolerancePercent}%
              </p>
              <p 
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Tolerance
              </p>
            </div>
          </div>
          <p 
            className="text-xs mt-3"
            style={{ color: colors.textSecondary }}
          >
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
