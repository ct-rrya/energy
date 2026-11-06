import React, { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTimeSeriesData } from '@/features/dashboard/hooks/useTimeSeriesData';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import { transformToChartData, isDatasetEmpty, formatChartTimestamp } from './chartUtils';
import { ChartContainer } from './ChartContainer';
import { CustomChartTooltip } from './CustomChartTooltip';
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

export interface StepsChartProps {
  className?: string;
  startDate?: string;
  endDate?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  periodLabel?: string;
}

/**
 * StepsChart Component
 * 
 * Displays step count over time as a line chart.
 * Shows detected footsteps on the piezoelectric tile.
 * 
 * Features:
 * - Real-time updates via WebSocket
 * - Unified page period or default last 7 days
 * - Line chart for trend visualization (changed from bar chart)
 * - Steps are summed per time period
 * - Proper empty state when no data available
 * - Responsive design
 * - Theme-aware colors
 * 
 * Note: Steps use sum aggregation, not average
 */
export const StepsChart = React.memo(function StepsChart({
  className = '',
  startDate: propStartDate,
  endDate: propEndDate,
  granularity: propGranularity,
  periodLabel,
}: StepsChartProps) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  // Subscribe to real-time WebSocket updates
  useChartRealTimeUpdates();

  // Calculate date range (use unified page period if provided, else last 7 days)
  const { startDate, endDate } = useMemo(() => {
    if (propStartDate && propEndDate) {
      return {
        startDate: propStartDate,
        endDate: propEndDate,
      };
    }
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }, [propStartDate, propEndDate]);

  const granularity = propGranularity ?? 'hour';

  // Fetch steps data
  const {
    data: stepsTimeSeries,
    isLoading,
    error,
    refetch,
  } = useTimeSeriesData({
    metric: 'steps',
    granularity,
    startDate,
    endDate,
  });

  // Transform API data to chart format
  const chartData = useMemo(() => transformToChartData(stepsTimeSeries), [stepsTimeSeries]);

  // Determine if dataset is empty or sparse (< 2 points)
  const isEmpty = useMemo(() => isDatasetEmpty(chartData), [chartData]);
  const isSparse = chartData.length > 0 && chartData.length < 2;
  const chartHeight = isMobile ? 240 : 270;

  // Theme-aware colors
  const colors = {
    bar: theme === 'light' ? '#2FBF71' : '#3ED98A', // EcoStep green
    gridColor: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : 'rgba(42, 46, 55, 0.3)',
    textColor: theme === 'light' ? '#1A312C' : '#9CA3AF',
  };

  const chartMargin = {
    top: 8,
    right: isMobile ? 8 : 16,
    left: isMobile ? -12 : 0,
    bottom: isMobile ? 8 : 0,
  };

  const subtitle = periodLabel
    ? `Detected footsteps on the piezoelectric tile (${periodLabel})`
    : 'Detected footsteps on the piezoelectric tile';

  return (
    <ChartContainer
      title="Steps Over Time"
      subtitle={subtitle}
      tooltip={{
        title: "Steps Over Time",
        description: "Counts physical footsteps over time. Directly reveals when the hallway turned into a bustling thoroughfare.",
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
              tickFormatter={(timestamp) => formatChartTimestamp(timestamp, propGranularity ?? 'day')}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
            <YAxis
              label={{
                value: 'Steps',
                angle: -90,
                position: 'insideLeft',
                style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
              }}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
              tickCount={4}
              domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomChartTooltip unit="steps" />}
              position={{ y: 0 }}
              wrapperStyle={{ zIndex: 1000 }}
              cursor={{ fill: 'rgba(47, 191, 113, 0.08)' }}
              isAnimationActive={false}
            />
            <Bar
              dataKey="value"
              fill={colors.bar}
              name="Steps"
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
              tickFormatter={(timestamp) => formatChartTimestamp(timestamp, propGranularity ?? 'day')}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
            <YAxis
              label={{
                value: 'Steps',
                angle: -90,
                position: 'insideLeft',
                style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
              }}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
              tickCount={4}
              domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomChartTooltip unit="steps" />}
              position={{ y: 0 }}
              wrapperStyle={{ zIndex: 1000 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.bar}
              strokeWidth={isMobile ? 2 : 2.5}
              name="Steps"
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
