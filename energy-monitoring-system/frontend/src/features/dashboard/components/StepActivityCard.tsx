import { Footprints } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors, TYPOGRAPHY } from '@/lib/theme';

interface StepActivityCardProps {
  stepCount: number | undefined;
  hasData: boolean;
}

/**
 * Step Activity Card Component
 * 
 * Displays footstep activity data in a compact, visually balanced card.
 * Communicates the human activity → footsteps → energy harvesting relationship.
 * 
 * Features:
 * - Footprint icon in green-tinted container
 * - "STEP ACTIVITY" label with "TODAY" context badge
 * - Large, prominent step count display
 * - Clear distinction between no data vs. zero steps
 * - Theme-aware styling (Light/Dark mode)
 * - Responsive layout
 */
export function StepActivityCard({ stepCount, hasData }: StepActivityCardProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  // Distinguish between valid zero and missing data
  const displayValue = hasData && stepCount !== undefined ? stepCount : null;
  const showEmptyState = displayValue === null;
  
  // Format step count with comma separator for large numbers
  const formattedSteps = displayValue !== null 
    ? displayValue.toLocaleString('en-US') 
    : '—';

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: colors.cardBackground,
        border: `1px solid ${colors.border}`,
        boxShadow: theme === 'light' 
          ? '0 2px 8px rgba(0,0,0,0.04)' 
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header: Icon + Label + Badge */}
      <div className="flex items-center justify-between mb-4">
        {/* Left: Icon + Label */}
        <div className="flex items-center gap-3">
          {/* Footprint Icon Container */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200"
            style={{
              backgroundColor: theme === 'light' 
                ? 'rgba(66, 132, 117, 0.12)'  // Light mint green
                : 'rgba(137, 215, 183, 0.15)', // Subtle mint in dark
            }}
          >
            <Footprints
              className="w-5 h-5"
              strokeWidth={2.5}
              style={{
                color: theme === 'light' 
                  ? '#428475'  // Medium green
                  : '#89D7B7', // Mint green
              }}
            />
          </div>

          {/* Label */}
          <span
            className="text-xs font-semibold tracking-wide uppercase"
            style={{
              color: colors.textSecondary,
              letterSpacing: '0.05em',
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
            }}
          >
            Step Activity
          </span>
        </div>

        {/* Right: Context Badge */}
        <div
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: theme === 'light'
              ? 'rgba(26, 49, 44, 0.06)'
              : 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <span
            className="text-xs font-medium uppercase"
            style={{
              color: colors.textSecondary,
              fontSize: '0.625rem',
              letterSpacing: '0.05em',
              fontWeight: TYPOGRAPHY.fontWeight.medium,
            }}
          >
            Today
          </span>
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{
              color: showEmptyState ? colors.textMuted : colors.textPrimary,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
            }}
          >
            {formattedSteps}
          </span>
          <span
            className="text-lg font-medium"
            style={{
              color: colors.textSecondary,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
            }}
          >
            steps
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        className="h-px mb-3"
        style={{
          backgroundColor: theme === 'light'
            ? 'rgba(0, 0, 0, 0.06)'
            : 'rgba(255, 255, 255, 0.06)',
        }}
      />

      {/* Status Message */}
      <div>
        <p
          className="text-sm"
          style={{
            color: colors.textSecondary,
            fontSize: TYPOGRAPHY.fontSize.sm,
          }}
        >
          {showEmptyState 
            ? 'Waiting for footstep data' 
            : displayValue === 0
            ? 'No footsteps recorded today'
            : 'Footsteps recorded today'}
        </p>
      </div>
    </div>
  );
}
