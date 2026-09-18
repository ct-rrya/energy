import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTimeSeriesData } from '@/features/dashboard/hooks/useTimeSeriesData';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import { transformToChartData, isDatasetEmpty, formatChartTimestamp } from './chartUtils';
import { ChartContainer } from './ChartContainer';
import { CustomChartTooltip } from './CustomChartTooltip';
import { subHours } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
} from 'recharts';

export interface StepsChartProps {
  className?: string;
}

/**
 * StepsChart Component
 * 
 * Displays step count over time as a bar chart.
 * Shows detected footsteps on the piezoelectric tile.
 * 
 * Features:
 * - Real-time updates via WebSocket
 * - Last 24 hours with hourly granularity
 * - Bar chart (not line) for discrete step counts
 * - Steps are summed per time period
 * - Proper empty state when no data available
 * - Responsive design
 * - Theme-aware colors
 * 
 * Note: Steps use sum aggregation, not average
 */
export function StepsChart({ className = '' }: StepsChartProps) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  // Subscribe to real-time WebSocket updates
  useChartRealTimeUpdates();

  // Calculate last 24 hours date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const start = subHours(now, 24);
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }, []);

  // Fetch steps data
  const {
    data: stepsTimeSeries,
    isLoading,
    error,
    refetch,
  } = useTimeSeriesData({
    metric: 'steps',
    granularity: 'hour',
    startDate,
    endDate,
  });

  // Transform API data to chart format
  const chartData = useMemo(() => transformToChartData(stepsTimeSeries), [stepsTimeSeries]);

  // Determine if dataset is empty
  const isEmpty = useMemo(() => isDatasetEmpty(chartData), [chartData]);

  // Theme-aware colors
  const colors = {
    bar: theme === 'light' ? '#2FBF71' : '#3ED98A', // EcoStep green
    gridColor: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : 'rgba(42, 46, 55, 0.3)',
    textColor: theme === 'light' ? '#1A312C' : '#9CA3AF',
  };

  return (
    <ChartContainer
      title="Steps Over Time"
      subtitle="Detected footsteps on the piezoelectric tile"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      onRetry={refetch}
      height={isMobile ? 250 : 350}
      className={className}
    >
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
        <BarChart 
          data={chartData}
          margin={{ 
            top: 5, 
            right: isMobile ? 5 : 20, 
            left: isMobile ? -20 : 0, 
            bottom: 5 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => formatChartTimestamp(timestamp, 'hour')}
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
            allowDecimals={false}
          />
          <Tooltip 
            content={<CustomChartTooltip unit="steps" />}
            position={{ y: 0 }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Bar
            dataKey="value"
            fill={colors.bar}
            name="Steps"
            animationDuration={300}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
