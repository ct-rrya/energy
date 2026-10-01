import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

/**
 * Trend direction types
 */
export type TrendDirection = 'up' | 'down' | 'neutral' | 'no-data';

/**
 * Trend calculation result
 */
export interface TrendCalculation {
  direction: TrendDirection;
  percentage: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

/**
 * Calculates trend comparison between current and previous values
 * 
 * Handles undefined values (returns 'no-data' direction), equal values 
 * (returns 'neutral' direction), and calculates percentage change with 
 * correct positive/negative logic.
 * 
 * @param currentValue - The current value to compare
 * @param previousValue - The previous value for comparison
 * @returns TrendCalculation object with direction, percentage, color, icon, and label
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7
 * 
 * @example
 * const trend = calculateTrend(24.7, 22.0);
 * // Returns: { direction: 'up', percentage: 12.3, color: '#3ED98A', icon: TrendingUp, label: '↑ 12.3% vs yesterday' }
 */
export function calculateTrend(
  currentValue: number | undefined,
  previousValue: number | undefined
): TrendCalculation {
  // Requirement 4.7: Handle undefined values - return 'no-data' direction
  if (currentValue === undefined || previousValue === undefined) {
    return {
      direction: 'no-data',
      percentage: 0,
      color: '#9CA3AF', // Gray for no data
      icon: HelpCircle,
      label: 'No comparison data',
    };
  }

  // Requirement 4.4: Handle equal values - return 'neutral' direction
  if (currentValue === previousValue) {
    return {
      direction: 'neutral',
      percentage: 0,
      color: '#9CA3AF', // Gray for neutral
      icon: Minus,
      label: 'No change',
    };
  }

  // Requirement 4.5: Calculate percentage change with correct positive/negative logic
  const percentChange = ((currentValue - previousValue) / previousValue) * 100;
  const isPositive = percentChange > 0;
  const absolutePercent = Math.abs(percentChange);

  // Requirement 4.2: Positive change - green color with upward arrow
  if (isPositive) {
    return {
      direction: 'up',
      percentage: absolutePercent,
      color: '#3ED98A', // Green for positive
      icon: TrendingUp,
      label: `↑ ${absolutePercent.toFixed(1)}% vs yesterday`,
    };
  }

  // Requirement 4.3: Negative change - amber color with downward arrow
  return {
    direction: 'down',
    percentage: absolutePercent,
    color: '#F59E0B', // Amber for negative
    icon: TrendingDown,
    label: `↓ ${absolutePercent.toFixed(1)}% vs yesterday`,
  };
}
