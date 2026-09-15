import { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePowerGeneration } from '@/features/dashboard/hooks/usePowerGeneration';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import { transformToChartData, isDatasetEmpty, formatChartTimestamp, limitDataPoints } from './chartUtils';
import { ChartContainer } from './ChartContainer';
import { CustomChartTooltip } from './CustomChartTooltip';
import type { TimeFilter, PowerGenerationChartProps } from './chartTypes';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
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
export function PowerGenerationChart({ className = '', defaultTimeFilter = 'today' }: PowerGenerationChartProps) {
  const { theme } = useTheme();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(defaultTimeFilter);
  
  // Subscribe to real-time WebSocket updates for chart data
  // This hook invalidates TanStack Query cache when new sensor readings arrive,
  // triggering automatic refetch of chart data for live updates
  useChartRealTimeUpdates();
  
  // Fetch power generation data based on current time filter
  const { data: timeSeries, isLoading, error, refetch } = usePowerGeneration(timeFilter);
  
  // Transform API data to chart format and apply data point limiting for performance
  // Limit to max 100 points for "Today" view to prevent performance degradation
  // during real-time updates (Requirement 9.8)
  const chartData = useMemo(() => {
    const transformed = transformToChartData(timeSeries);
    
    // Apply limiting only for "Today" view which has real-time updates
    if (timeFilter === 'today') {
      return limitDataPoints(transformed, 100);
    }
    
    return transformed;
  }, [timeSeries, timeFilter]);
  
  // Determine if dataset is empty
  const isEmpty = useMemo(() => isDatasetEmpty(chartData), [chartData]);

  // Determine granularity based on time filter for X-axis formatting
  const granularity = useMemo(() => {
    switch (timeFilter) {
      case 'today':
        return 'hour' as const;
      case '7days':
      case '30days':
        return 'day' as const;
    }
  }, [timeFilter]);

  // Color system based on theme
  const colors = {
    accent: theme === 'light' ? '#428475' : '#3ED98A',
    gridColor: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : 'rgba(42, 46, 55, 0.3)',
    textColor: theme === 'light' ? '#1A312C' : '#9CA3AF',
    filterBg: theme === 'light' ? '#F5F6F8' : '#12141A',
    filterActiveBg: theme === 'light' ? '#E8F8EF' : '#1E2B24',
    filterText: theme === 'light' ? 'rgba(26, 49, 44, 0.7)' : '#9CA3AF',
    border: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : '#2A2E37',
  };

  /**
   * Filter button configuration
   */
  const filterButtons: Array<{ value: TimeFilter; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
  ];

  /**
   * Handle time filter change
   */
  const handleFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
  };

  /**
   * Render time filter controls
   */
  const filterControls = (
    <div
      className="flex gap-1 rounded-xl p-1"
      role="group"
      aria-label="Time range filter options"
      style={{
        backgroundColor: colors.filterBg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {filterButtons.map((button) => (
        <button
          key={button.value}
          onClick={() => handleFilterChange(button.value)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor:
              timeFilter === button.value
                ? colors.filterActiveBg
                : 'transparent',
            color:
              timeFilter === button.value
                ? colors.accent
                : colors.filterText,
          }}
          aria-pressed={timeFilter === button.value}
          aria-label={`Show data for ${button.label}`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartContainer
      title="Power Generation Over Time"
      subtitle="Real-time power output from piezoelectric floor tiles"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      onRetry={refetch}
      actions={filterControls}
      height={400}
      className={className}
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => formatChartTimestamp(timestamp, granularity)}
            stroke={colors.textColor}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            label={{
              value: 'Power (W)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: colors.textColor, fontSize: '12px' },
            }}
            stroke={colors.textColor}
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            content={<CustomChartTooltip unit="W" />}
            position={{ y: 0 }}
            wrapperStyle={{ zIndex: 1000 }}
            allowEscapeViewBox={{ x: false, y: true }}
            cursor={{ strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#428475"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
