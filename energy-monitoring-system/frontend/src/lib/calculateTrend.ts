import React from 'react';

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
  icon: React.ReactNode;
  label: string;
}

/**
 * Calculate trend between current and previous values
 * 
 * @param current - Current value
 * @param previous - Previous value to compare against
 * @returns TrendCalculation object with direction, percentage, color, icon, and label
 * 
 * @example
 * ```ts
 * // Positive trend
 * calculateTrend(100, 80) // { direction: 'up', percentage: 25.0, color: '#3ED98A', ... }
 * 
 * // Negative trend
 * calculateTrend(80, 100) // { direction: 'down', percentage: 20.0, color: '#F59E0B', ... }
 * 
 * // No change
 * calculateTrend(100, 100) // { direction: 'neutral', percentage: 0, color: '#9CA3AF', ... }
 * 
 * // No comparison data
 * calculateTrend(100, undefined) // { direction: 'no-data', percentage: 0, color: '#9CA3AF', ... }
 * ```
 */
export function calculateTrend(
  current: number | undefined,
  previous: number | undefined
): TrendCalculation {
  // No comparison data - when either value is undefined
  if (current === undefined || previous === undefined) {
    return {
      direction: 'no-data',
      percentage: 0,
      color: '#9CA3AF', // Gray
      icon: React.createElement('span', { 
        className: 'inline-block w-4 h-4',
        'aria-hidden': 'true'
      }, '?'),
      label: 'No comparison data',
    };
  }

  // Neutral case - values are equal
  if (current === previous) {
    return {
      direction: 'neutral',
      percentage: 0,
      color: '#9CA3AF', // Gray
      icon: React.createElement('span', { 
        className: 'inline-block w-4 h-4',
        'aria-hidden': 'true'
      }, '─'),
      label: 'No change',
    };
  }

  // Calculate percentage change
  // Formula: ((current - previous) / previous) * 100
  const percentChange = ((current - previous) / previous) * 100;
  const isPositive = percentChange > 0;

  // Determine trend direction
  const direction: TrendDirection = isPositive ? 'up' : 'down';
  
  // Assign colors based on direction
  // Green (#3ED98A) for positive change (energy increase)
  // Amber (#F59E0B) for negative change (energy decrease)
  const color = isPositive ? '#3ED98A' : '#F59E0B';
  
  // Create arrow icon based on direction
  const arrow = isPositive ? '↑' : '↓';
  const icon = React.createElement('span', { 
    className: 'inline-block w-4 h-4',
    'aria-hidden': 'true'
  }, arrow);
  
  // Format label with arrow, percentage, and comparison text
  const label = `${arrow} ${Math.abs(percentChange).toFixed(1)}% vs yesterday`;

  return {
    direction,
    percentage: Math.abs(percentChange),
    color,
    icon,
    label,
  };
}
