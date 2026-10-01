/**
 * Trend Indicator Component
 * 
 * Color-coded percentage change display with directional arrow icon.
 * Shows comparison between current and previous period values.
 * 
 * Visual Design:
 * - Green (#3ED98A): Positive change (up arrow ↑)
 * - Amber (#F59E0B): Negative change (down arrow ↓)
 * - Gray (#9CA3AF): No change or no data (horizontal line ─)
 * - Typography: 15px medium weight
 * - Spacing: 12px margin-top from energy value
 * 
 * Calculation Logic:
 * - Undefined values → "No comparison data" (gray)
 * - Equal values → "No change" (gray, horizontal icon)
 * - Positive change → Green with up arrow
 * - Negative change → Amber with down arrow
 * - Percentage formatted to 1 decimal place
 * 
 * Features:
 * - Automatic trend direction detection
 * - Color-coded visual feedback
 * - Icon integration
 * - Empty state handling
 * - Percentage or absolute value display
 * 
 * Requirements: 4.1-4.7
 * 
 * @component
 * @example
 * ```tsx
 * <TrendIndicator
 *   currentValue={24.7}
 *   previousValue={22.0}
 *   format="percentage"
 *   showIcon={true}
 * />
 * // Displays: ↑ 12.3% vs yesterday (green)
 * ```
 */

import React, { useMemo } from 'react';
import type { TrendIndicatorProps } from '../types/hero-dashboard.types';
import { calculateTrend } from '../utils/calculateTrend';

/**
 * TrendIndicator Component
 * 
 * Displays trend percentage with color-coded arrow.
 * 
 * Requirements:
 * - 4.1: Accept currentValue, previousValue, format, showIcon props
 * - 4.2: Render arrow icon based on trend direction
 * - 4.3: Apply color based on trend (green for up, amber for down, gray for neutral/no-data)
 * - 4.4: Display formatted percentage with "vs yesterday" label
 * - 4.5: Implement calculateTrend logic
 * - 4.6: Handle undefined values with "No comparison data"
 * - 4.7: Show appropriate icon for each trend direction
 */
export const TrendIndicator = React.memo(function TrendIndicator({
  currentValue,
  previousValue,
  format = 'percentage',
  showIcon = true,
}: TrendIndicatorProps) {
  // Requirement 4.5: Calculate trend using utility function
  const trend = useMemo(
    () => calculateTrend(currentValue, previousValue),
    [currentValue, previousValue]
  );

  // Requirement 4.7: Get icon component from trend calculation
  const IconComponent = trend.icon;

  // Requirement 4.3: Apply color based on trend direction
  const textColor = trend.color;

  // Requirement 4.4: Format display based on format prop
  const displayText = useMemo(() => {
    if (format === 'absolute' && currentValue !== undefined && previousValue !== undefined) {
      const difference = currentValue - previousValue;
      const sign = difference > 0 ? '+' : '';
      return `${sign}${difference.toFixed(1)} vs yesterday`;
    }
    return trend.label;
  }, [format, currentValue, previousValue, trend.label]);

  return (
    <div
      className="flex items-center gap-1.5 mt-3"
      style={{ color: textColor }}
    >
      {/* Requirement 4.2 & 4.7: Render arrow icon based on trend direction */}
      {showIcon && (
        <IconComponent
          className="w-4 h-4"
          aria-hidden="true"
        />
      )}
      
      {/* Requirement 4.4: Display formatted text with trend percentage */}
      <span
        className="text-[15px] font-medium"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {displayText}
      </span>
    </div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';
