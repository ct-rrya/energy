import React, { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePowerGeneration } from '@/features/dashboard/hooks/usePowerGeneration';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import { transformToChartData, isDatasetEmpty, formatChartTimestamp, limitDataPoints } from './chartUtils';
import { ChartContainer } from './ChartContainer';
import { CustomChartTooltip } from './CustomChartTooltip';
import type { TimeFilter, PowerGenerationChartProps } from './chartTypes';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Bar,
  Tooltip,
} from 'recharts';

/**
 * PowerGenerationChart Component
 * 
 * Visualizes real-time power output over time with selectable time ranges.
 * Users can switch between Today, 7 Days, and 30 Days to view different time periods.
 * 
 * Requirements:
 * - 2.2: Fetch data from Time_Series_API with metric parameter set to "power"
 * - 2.10: Use TanStack_Query for data fetching with appropriate caching and refetch interval
 * - 2.11: Update cache when new sensor readings arrive via SocketContext real-time updates
 * - 9.7: Append new data points to existing chart data
 * - 9.8: Limit data points for real-time charts
 * - 12.8: Transition smoothly between loading, error, empty, and data-loaded states
 * 
 * @component
 * @example
 * ```tsx
 * <PowerGenerationChart />
 * ```
 */
export const PowerGenerationChart = React.memo(function PowerGenerationChart({
  className = '',
  defaultTimeFilter = '7days',
  startDate,
  endDate,
  granularity: propGranularity,
}: PowerGenerationChartProps) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Use defaultTimeFilter unless overridden by unified Analytics page period
  const timeFilter: TimeFilter = defaultTimeFilter;
  
  // Subscribe to real-time WebSocket updates for chart data
  // This hook invalidates TanStack Query cache when new sensor readings arrive,
  // triggering automatic refetch of chart data for live updates
  useChartRealTimeUpdates();
  
  // Fetch power generation data based on current time filter or unified page period
  const { data: timeSeries, isLoading, error, refetch } = usePowerGeneration(
    timeFilter,
    startDate && endDate ? { startDate, endDate, granularity: propGranularity } : undefined
  );
  
  // Transform API data to chart format and apply data point limiting for performance
  // Limit to max 100 points for 7-day view to prevent performance degradation (Requirement 9.8)
  const chartData = useMemo(() => {
    const transformed = transformToChartData(timeSeries);
    // Always limit since we're using 7-day view
    return limitDataPoints(transformed, 100);
  }, [timeSeries]);
  
  // Determine if dataset is empty or sparse (< 2 points)
  const isEmpty = useMemo(() => isDatasetEmpty(chartData), [chartData]);
  const isSparse = chartData.length > 0 && chartData.length < 2;
  const chartHeight = isMobile ? 240 : 270;

  // Determine granularity from prop or timeFilter
  const granularity = propGranularity ?? (timeFilter === 'today' ? 'hour' : 'day');

  // Color system based on theme
  const colors = {
    line: theme === 'dark' ? '#19D46A' : '#13B95C',
    gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(13, 27, 20, 0.12)',
    textColor: theme === 'dark' ? '#93A89C' : '#5B6B62',
  };

  /**
   * Filter button configuration - REMOVED
   * Charts now controlled by unified Analytics page period selector
   */

  const chartMargin = {
    top: 8,
    right: isMobile ? 8 : 16,
    left: isMobile ? -12 : 0,
    bottom: isMobile ? 8 : 0,
  };

  return (
    <ChartContainer
      title="Power Generation Over Time"
      subtitle="Instantaneous power output (mW) showing peaks of footstep activity"
      tooltip={{
        title: "Power Generation (mW)",
        description: "Visualizes the speed of energy generation. Peaks represent periods of active walking across the tiles, while flat areas represent quiet times.",
        analogy: "Like watching traffic surges on a highway: spikes represent busy rushes of footsteps.",
        technicalNote: "Measured in milliwatts (mW). Calculated from voltage and equivalent load current."
      }}
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      isSparse={isSparse}
      onRetry={refetch}
      height={chartHeight}
      className={className}
    >
      <ResponsiveContainer width="100%" height={chartHeight} debounce={32}>
        {isSparse ? (
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={colors.gridColor} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => formatChartTimestamp(timestamp, granularity)}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
            <YAxis
              label={{
                value: 'Power (mW)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
              }}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
              tickCount={4}
              domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 1.15 : 0.0001)]}
              tickFormatter={(value) => (value * 1000).toFixed(3)}
            />
            <Tooltip
              content={<CustomChartTooltip unit="mW" valueMultiplier={1000} />}
              position={isMobile ? undefined : { y: 0 }}
              wrapperStyle={{ zIndex: 1000 }}
              allowEscapeViewBox={{ x: false, y: !isMobile }}
              cursor={{ fill: 'rgba(19, 185, 92, 0.08)' }}
              isAnimationActive={false}
            />
            <Bar
              dataKey="value"
              fill={colors.line}
              maxBarSize={48}
              radius={[8, 8, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={colors.gridColor} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => formatChartTimestamp(timestamp, granularity)}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
            <YAxis
              label={{
                value: 'Power (mW)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
              }}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
              tickCount={4}
              domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 1.15 : 0.0001)]}
              tickFormatter={(value) => (value * 1000).toFixed(3)}
            />
            <Tooltip
              content={<CustomChartTooltip unit="mW" valueMultiplier={1000} />}
              position={isMobile ? undefined : { y: 0 }}
              wrapperStyle={{ zIndex: 1000 }}
              allowEscapeViewBox={{ x: false, y: !isMobile }}
              cursor={{ strokeDasharray: '3 3' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.line}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </ChartContainer>
  );
});
