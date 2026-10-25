/**
 * CumulativeEnergyChart Component
 * 
 * Displays cumulative energy harvested over time as an area chart.
 * Shows the total accumulated energy from piezoelectric floor tiles over the last 30 days.
 * Features a gradient fill from Fresh Mint to transparent, following EcoStep Design System.
 * 
 * Requirements:
 * - 5.1: Render as AreaChart using Recharts AreaChart component
 * - 5.2: Fetch data from Time_Series_API with metric parameter set to "energy"
 * - 5.3: Calculate cumulative values by summing energy from all previous data points
 * - 5.4: Display cumulative energy in milliwatt-hours (mWh) on Y-axis
 * - 5.5: Display timestamps on X-axis
 * - 5.6: Use default time range of last 30 days with daily granularity
 * - 5.7: Fill area under curve with gradient from EcoStep_Design_System colors
 * - 5.8: Display total cumulative value at latest data point
 * - 5.9: Use TanStack_Query for data fetching with appropriate caching
 * - 5.10: Recalculate cumulative totals when new data arrives
 * - 11.3: Apply theme-appropriate colors for line/area from EcoStep_Design_System
 * 
 * @component
 * @example
 * ```tsx
 * <CumulativeEnergyChart />
 * <CumulativeEnergyChart daysToShow={14} />
 * ```
 */

import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTimeSeriesData } from '@/features/dashboard/hooks/useTimeSeriesData';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import {
  transformToChartData,
  calculateCumulative,
  isDatasetEmpty,
  formatChartTimestamp,
  formatValueWithUnit,
} from './chartUtils';
import { ChartContainer } from './ChartContainer';
import { CustomChartTooltip } from './CustomChartTooltip';
import type { CumulativeEnergyChartProps } from './chartTypes';
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  Tooltip,
} from 'recharts';
import { subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * CumulativeEnergyChart Component
 * 
 * Visualizes cumulative energy generation over time with gradient area fill.
 * 
 * Features:
 * - Real-time updates via WebSocket integration
 * - Automatic cumulative calculation from time-series data
 * - Theme-aware colors (light/dark mode)
 * - Gradient area fill following EcoStep Design System
 * - Total cumulative value display in subtitle
 * - Responsive layout with glassmorphic card styling
 */
export function CumulativeEnergyChart({
  className = '',
  daysToShow = 30,
}: CumulativeEnergyChartProps) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Subscribe to real-time WebSocket updates for chart data
  // This hook invalidates TanStack Query cache when new sensor readings arrive,
  // triggering automatic refetch of chart data for live updates
  useChartRealTimeUpdates();

  // Calculate date range for data fetching (last N days)
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    return {
      startDate: subDays(startOfDay(now), daysToShow).toISOString(),
      endDate: endOfDay(now).toISOString(),
    };
  }, [daysToShow]);

  // Fetch energy time-series data with daily granularity
  const { data: timeSeries, isLoading, error, refetch } = useTimeSeriesData({
    metric: 'energy',
    granularity: 'day',
    startDate,
    endDate,
  });

  // Transform API data to chart format
  const rawChartData = useMemo(() => transformToChartData(timeSeries), [timeSeries]);

  // Calculate cumulative values from raw data
  // Each point represents the sum of all previous energy values
  const cumulativeData = useMemo(() => {
    return calculateCumulative(rawChartData);
  }, [rawChartData]);

  // Calculate total cumulative energy (latest data point value)
  const totalCumulativeEnergy = useMemo(() => {
    if (cumulativeData.length === 0) return 0;
    return cumulativeData[cumulativeData.length - 1].value;
  }, [cumulativeData]);

  // Determine if dataset is empty
  const isEmpty = useMemo(() => isDatasetEmpty(cumulativeData), [cumulativeData]);

  // Subtitle with total cumulative value
  const subtitle = useMemo(() => {
    if (isEmpty || isLoading) {
      return `Total energy harvested over the last ${daysToShow} days`;
    }
    return `Total: ${formatValueWithUnit(totalCumulativeEnergy, 'mWh')} over the last ${daysToShow} days`;
  }, [totalCumulativeEnergy, isEmpty, isLoading, daysToShow]);

  // Color system based on theme
  const colors = {
    line: theme === 'dark' ? '#19D46A' : '#13B95C',
    gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(13, 27, 20, 0.12)',
    textColor: theme === 'dark' ? '#93A89C' : '#5B6B62',
  };

  return (
    <ChartContainer
      title="Cumulative Energy Generated"
      subtitle={subtitle}
      tooltip={{
        title: "Cumulative Energy (mWh)",
        description: "Shows the continuous accumulation of harvested energy over time. Unlike power (which fluctuates with every step), this line only goes upwards as footsteps add more electricity to the system.",
        analogy: "Like a savings piggy bank: each footstep deposits a few milliwatt-hours into the total balance.",
        technicalNote: "Calculated by running a running cumulative sum of daily energy yields."
      }}
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      onRetry={refetch}
      height={isMobile ? 250 : 350}
      className={className}
    >
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 350} debounce={250}>
        <AreaChart 
          data={cumulativeData}
          margin={{ 
            top: 5, 
            right: isMobile ? 8 : 20, 
            left: isMobile ? -18 : 0, 
            bottom: isMobile ? 15 : 5 
          }}
        >
          {/* Define linear gradient for area fill */}
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#19D46A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#19D46A" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <CartesianGrid strokeDasharray="4 4" stroke={colors.gridColor} />

          {/* X-axis: Dates */}
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => formatChartTimestamp(timestamp, 'day')}
            stroke={colors.textColor}
            tick={{ fontSize: isMobile ? 11 : 12 }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            style={{ fontSize: isMobile ? '11px' : '12px' }}
          />

          {/* Y-axis: Cumulative Energy in mWh */}
          <YAxis
            label={{
              value: 'Cumulative Energy (mWh)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
            }}
            stroke={colors.textColor}
            tick={{ fontSize: isMobile ? 11 : 12 }}
            style={{ fontSize: isMobile ? '11px' : '12px' }}
          />

          {/* Tooltip with custom formatting and viewport-aware positioning */}
          <Tooltip 
            content={<CustomChartTooltip unit="mWh" />}
            position={{ y: 0 }}
            wrapperStyle={{ zIndex: 1000 }}
            allowEscapeViewBox={{ x: false, y: true }}
            cursor={{ strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />

          {/* Area with gradient fill and smooth curve */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors.line}
            strokeWidth={2.5}
            fill="url(#energyGradient)"
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 4, stroke: colors.line, fill: '#FFFFFF' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
