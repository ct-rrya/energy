import { Footprints } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Step Activity Card Props
 * Props for the primary section displaying today's footstep activity
 */
export interface StepActivityCardProps {
  /** Current step count for today (undefined when no data available) */
  stepCount: number | undefined;
  
  /** Whether any sensor data has been received */
  hasData: boolean;
}

/**
 * Step Activity Card Component
 * 
 * Displays today's footstep count in the primary tier of the visual hierarchy.
 * Follows data-first design principles with prominent numeric display.
 * 
 * Visual Hierarchy (Primary Tier):
 * - Label: 13px uppercase, secondary color, with inline icon (16px)
 * - Value: 32px bold tabular-nums, primary/accent color
 * - Max-width: 400px constraint for optimal readability
 * 
 * Features:
 * - Large, prominent step count display (32px)
 * - Tabular numerals for alignment
 * - Inline icon with label
 * - Empty state: "Waiting for footstep data"
 * - Real-time updates when new data received
 * - Theme-aware styling (Light/Dark mode)
 * 
 * @component
 * @example
 * ```tsx
 * <StepActivityCard
 *   stepCount={8247}
 *   hasData={true}
 * />
 * ```
 */
export function StepActivityCard({ stepCount, hasData }: StepActivityCardProps) {
  const { theme } = useTheme();
  
  // Distinguish between valid zero and missing data
  const isEmptyState = !hasData || stepCount === undefined;
  
  // Format step count with comma separator for large numbers
  const formattedSteps = !isEmptyState
    ? stepCount.toLocaleString('en-US')
    : '0';

  // Empty state opacity
  const valueOpacity = isEmptyState ? 'opacity-50' : 'opacity-100';

  return (
    <div
      className="eco-card transition-opacity duration-200"
      style={{
        padding: '24px', // Card padding: 24px
        borderRadius: '12px', // Border-radius: 12px
        maxWidth: '400px',
        contain: 'layout style', // CSS containment for performance
      }}
    >
      {/* Label with inline icon - typography system */}
      <div
        className="flex items-center gap-2"
        style={{
          color: theme === 'dark' ? '#9CA3AF' : '#374151',
          fontSize: '13px', // Typography: 13px
          fontWeight: 700, // Bolder for better visibility
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '12px',
        }}
      >
        <Footprints size={16} className="flex-shrink-0" />
        <span>Step Activity</span>
      </div>

      {/* Value with unit - tabular-nums for alignment */}
      <div className={`flex items-baseline ${valueOpacity}`}>
        <span
          className="
            text-[2rem] font-semibold leading-none
            text-[#3DDC97] dark:text-[#3ED98A]
          "
          style={{
            fontVariantNumeric: 'tabular-nums', // Design system: tabular numerals
          }}
        >
          {formattedSteps}
        </span>
        <span
          className="text-[1.125rem] font-normal"
          style={{
            color: theme === 'dark' ? '#9CA3AF' : '#374151',
            marginLeft: '4px',
          }}
        >
          steps
        </span>
      </div>

      {/* Empty state message */}
      {isEmptyState && (
        <p
          className="text-sm"
          style={{
            color: theme === 'dark' ? '#9CA3AF' : '#374151',
            marginTop: '12px',
          }}
        >
          Waiting for footstep data
        </p>
      )}
    </div>
  );
}
