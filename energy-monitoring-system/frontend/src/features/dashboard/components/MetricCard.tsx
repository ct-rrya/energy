import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Metric Color Variants
 * Semantic colors for different metric types
 */
export type MetricColor = 'accent' | 'amber' | 'blue' | 'red';

/**
 * Metric Card Props
 * Props for individual metric display with data-first hierarchy
 */
export interface MetricCardProps {
  /** Metric label/name (e.g., "Voltage", "Current") */
  label: string;
  
  /** Numeric value to display (undefined for empty state) */
  value: number | undefined;
  
  /** Unit of measurement (e.g., "V", "A", "W", "kWh") */
  unit: string;
  
  /** Number of decimal places to display */
  precision: number;
  
  /** Color variant for accent/emphasis */
  color: MetricColor;
  
  /** Optional icon element to display with label */
  icon?: React.ReactNode;
}

/**
 * Metric Card Component
 * 
 * Individual metric display with data-first visual hierarchy.
 * Emphasizes numeric values with large, bold typography and tabular numerals.
 * 
 * Visual Hierarchy:
 * - Label: 13px uppercase, secondary color
 * - Value: Responsive typography (28px mobile → 32px tablet → 36px desktop), bold tabular-nums, accent color
 * - Unit: Responsive (16px mobile → 17px tablet → 18px desktop), inline with value
 * 
 * Features:
 * - Large, prominent numeric display
 * - Tabular numerals for alignment
 * - Color-coded by metric type
 * - Empty state handling (shows 0.0/0.00)
 * - Loading skeleton support
 * - Icon integration with label
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - useMemo for formatted value calculations
 * 
 * @component
 * @example
 * ```tsx
 * <MetricCard
 *   label="Voltage"
 *   value={230.2}
 *   unit="V"
 *   precision={1}
 *   color="accent"
 *   icon={<Zap size={16} />}
 * />
 * ```
 */
export const MetricCard = React.memo(function MetricCard({
  label,
  value,
  unit,
  precision,
  color,
  icon,
}: MetricCardProps) {
  const { theme } = useTheme();
  
  // Color mapping for metric accent colors from design system
  const colorClasses: Record<MetricColor, string> = {
    accent: 'text-[#3DDC97] dark:text-[#3ED98A]', // EcoStep green
    amber: 'text-[#F59E0B]', // Warning/energy color
    blue: 'text-[#3B82F6]', // Info color
    red: 'text-[#EF4444]', // Error/alert color
  };

  // Memoize formatted value calculation to avoid recomputing on every render
  const formattedValue = React.useMemo(() => {
    if (value === undefined) {
      return '0.' + '0'.repeat(precision);
    }
    return value.toFixed(precision);
  }, [value, precision]);

  // Memoize empty state checks
  const isEmptyState = value === undefined;
  const valueOpacity = isEmptyState ? 'opacity-50' : 'opacity-100';

  return (
    <>
      {/* Global styles for responsive padding - Requirement 15.6 */}
      <style>{`
        .metric-card-container {
          padding: 20px; /* Mobile: 20px padding (Requirement 15.6) */
          border-radius: 12px;
          contain: layout style;
        }
        
        /* Tablet: 768px - 1023px */
        @media (min-width: 768px) {
          .metric-card-container {
            padding: 24px; /* Tablet: 24px padding */
          }
        }
        
        /* Desktop: 1024px and above */
        @media (min-width: 1024px) {
          .metric-card-container {
            padding: 24px; /* Desktop: 24px padding */
          }
        }
      `}</style>
      
      <div
        className="metric-card-container eco-card transition-opacity duration-200"
      >
        {/* Label with icon - typography system */}
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
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{label}</span>
        </div>

        {/* Value with unit - Responsive typography scaling with tabular-nums */}
        <div className={`flex items-baseline ${valueOpacity}`}>
          <span
            className={`
              text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem] font-semibold leading-none
              tabular-nums
              ${colorClasses[color]}
            `}
            style={{
              fontVariantNumeric: 'tabular-nums', // Design system: tabular numerals
            }}
          >
            {formattedValue}
          </span>
          <span
            className="text-[1rem] sm:text-[1.0625rem] lg:text-[1.125rem] font-normal"
            style={{
              color: theme === 'dark' ? '#9CA3AF' : '#374151',
              marginLeft: '4px',
            }}
          >
            {unit}
          </span>
        </div>
      </div>
    </>
  );
});
