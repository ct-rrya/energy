/**
 * Mini Trend Graph Component
 * 
 * Compact 24-hour sparkline visualization for quick pattern recognition.
 * Displays energy output trends in a minimal, clean design.
 * 
 * Visual Design:
 * - Height: Max 100px (25% of 400px card height)
 * - Line Color: #3ED98A (accent green)
 * - Line Width: 2px
 * - Style: Monotone line chart
 * - Axes: Hidden for minimal design
 * - Dots: Hidden for clean look
 * - Animation: 300ms ease on data update
 * 
 * Data Processing:
 * - Filters to last 24 hours only
 * - Requires minimum 2 data points
 * - Uses useMemo for performance
 * 
 * Empty State:
 * - Shows "Insufficient data" when < 2 points
 * - Gray text, centered
 * 
 * Performance:
 * - Lazy loaded with React.lazy()
 * - Wrapped in Suspense boundary
 * - Memoized data filtering
 * 
 * Requirements: 5.1-5.8, 20.7
 * 
 * @component
 * @example
 * ```tsx
 * <MiniTrendGraph
 *   data={last24HoursData}
 *   height={100}
 *   showAxes={false}
 *   accentColor="#3ED98A"
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { MiniTrendGraphProps } from '../types/hero-dashboard.types';

/**
 * MiniTrendGraph Component
 * 
 * Compact 24-hour energy trend sparkline.
 */
export const MiniTrendGraph = React.memo(function MiniTrendGraph({
  data,
  height = 100,
  showAxes: _showAxes = false, // Intentionally unused - axes always hidden for minimal design
  accentColor = '#3ED98A'
}: MiniTrendGraphProps) {
  // Filter to last 24 hours using useMemo for performance
  const filteredData = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return data.filter(d => new Date(d.timestamp) >= oneDayAgo);
  }, [data]);

  // Empty state: show message when < 2 data points
  if (filteredData.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400"
        style={{ height }}
      >
        Insufficient data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={filteredData}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
      >
        <Line
          type="monotone"
          dataKey="value"
          stroke={accentColor}
          strokeWidth={2}
          dot={false}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
