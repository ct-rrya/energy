import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
          Configure the reference values used to evaluate EcoStep's energy output.
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
        {/* Horizontal Layout for Form Fields - All inputs perfectly aligned */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ alignItems: 'start' }}>
          {/* Applied Weight */}
          <div className="w-full">
            <label
              htmlFor="appliedWeightKg"
              className="mb-2 block text-sm font-medium"
              style={{ 
                color: colors.textPrimary,
                minHeight: '40px', // Fixed height for label area to keep all inputs aligned
                display: 'flex',
                alignItems: 'flex-start'
              }}
            >
              Applied Weight (kg)
              <span className="ml-1" style={{ color: colors.error }}>*</span>
            </label>
            <input
              id="appliedWeightKg"
              type="number"
              step="0.1"
              placeholder="70"
              disabled={createMutation.isPending}
              className="w-full rounded-lg border-2 px-4 py-2.5 transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderColor: errors.appliedWeightKg ? colors.error : colors.border,
                height: '44px' // Fixed input height
              }}
              {...register('appliedWeightKg', { 
                valueAsNumber: true,
                onBlur: (e) => {
                  e.target.style.borderColor = errors.appliedWeightKg ? colors.error : colors.border;
                  e.target.style.boxShadow = 'none';
                }
              })}
              onFocus={(e) => {
                e.target.style.borderColor = errors.appliedWeightKg ? colors.error : colors.accent;
                e.target.style.boxShadow = `0 0 0 3px ${errors.appliedWeightKg ? colors.error : colors.accent}20`;
              }}
            />
            {errors.appliedWeightKg && (
              <p className="mt-2 text-sm font-medium" style={{ color: colors.error }} role="alert">
                {errors.appliedWeightKg.message}
              </p>
            )}
          </div>

          {/* Expected Energy */}
          <div className="w-full">
            <label
              htmlFor="expectedEnergyWh"
              className="mb-2 block text-sm font-medium"
              style={{ 
                color: colors.textPrimary,
                minHeight: '40px', // Fixed height for label area to keep all inputs aligned
                display: 'flex',
                alignItems: 'flex-start'
              }}
            >
              Expected Energy (Wh)
              <span className="ml-1" style={{ color: colors.error }}>*</span>
            </label>
            <input
              id="expectedEnergyWh"
              type="number"
              step="0.001"
              placeholder="2.5"
              disabled={createMutation.isPending}
              className="w-full rounded-lg border-2 px-4 py-2.5 transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderColor: errors.expectedEnergyWh ? colors.error : colors.border,
                height: '44px' // Fixed input height
              }}
              {...register('expectedEnergyWh', { 
                valueAsNumber: true,
                onBlur: (e) => {
                  e.target.style.borderColor = errors.expectedEnergyWh ? colors.error : colors.border;
                  e.target.style.boxShadow = 'none';
                }
              })}
              onFocus={(e) => {
                e.target.style.borderColor = errors.expectedEnergyWh ? colors.error : colors.accent;
                e.target.style.boxShadow = `0 0 0 3px ${errors.expectedEnergyWh ? colors.error : colors.accent}20`;
              }}
            />
            {errors.expectedEnergyWh && (
              <p className="mt-2 text-sm font-medium" style={{ color: colors.error }} role="alert">
                {errors.expectedEnergyWh.message}
              </p>
            )}
          </div>

          {/* Tolerance */}
          <div className="w-full">
            <label
              htmlFor="tolerancePercent"
              className="mb-2 block text-sm font-medium"
              style={{ 
                color: colors.textPrimary,
                minHeight: '40px', // Fixed height for label area to keep all inputs aligned
                display: 'flex',
                alignItems: 'flex-start'
              }}
            >
              Tolerance (%)
              <span className="ml-1" style={{ color: colors.error }}>*</span>
            </label>
            <input
              id="tolerancePercent"
              type="number"
              step="0.1"
              placeholder="10"
              disabled={createMutation.isPending}
              className="w-full rounded-lg border-2 px-4 py-2.5 transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderColor: errors.tolerancePercent ? colors.error : colors.border,
                height: '44px' // Fixed input height
              }}
              {...register('tolerancePercent', { 
                valueAsNumber: true,
                onBlur: (e) => {
                  e.target.style.borderColor = errors.tolerancePercent ? colors.error : colors.border;
                  e.target.style.boxShadow = 'none';
                }
              })}
              onFocus={(e) => {
                e.target.style.borderColor = errors.tolerancePercent ? colors.error : colors.accent;
                e.target.style.boxShadow = `0 0 0 3px ${errors.tolerancePercent ? colors.error : colors.accent}20`;
              }}
            />
            {errors.tolerancePercent && (
              <p className="mt-2 text-sm font-medium" style={{ color: colors.error }} role="alert">
                {errors.tolerancePercent.message}
              </p>
            )}
          </div>
        </div>

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
