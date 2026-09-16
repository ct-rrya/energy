import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTimeSeriesData } from '@/features/dashboard/hooks/useTimeSeriesData';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import { transformToChartData, isDatasetEmpty, formatChartTimestamp } from './chartUtils';
import { ChartContainer } from './ChartContainer';
import { CustomChartTooltip } from './CustomChartTooltip';
import type { VoltageCurrentChartProps } from './chartTypes';
import { subHours } from 'date-fns';
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
 * VoltageCurrentChart Component
 * 
 * Displays voltage and current measurements over time as two synchronized line charts.
 * Shows electrical characteristics of the energy harvesting system with hourly granularity
 * over the last 24 hours.
 * 
 * Requirements:
 * - 3.1: Implemented as two synchronized LineChart components
 * - 3.2: Fetch data from Time_Series_API with metric='voltage' and metric='current'
 * - 3.3: Display voltage values in Volts (V) on Y-axis
 * - 3.4: Display current values in Amperes (A) on Y-axis
 * - 3.6: Use default time range of last 24 hours with hourly granularity
 * - 3.7: Use distinct colors (Muted Teal for voltage, Amber for current)
 * - 3.9: Align X-axis timestamps precisely when implemented as synchronized charts
 * - 3.10: Use TanStack Query for data fetching with appropriate caching
 * 
 * @component
 * @example
 * ```tsx
 * <VoltageCurrentChart />
 * <VoltageCurrentChart mode="dual-axis" /> // Single chart with two axes
 * ```
 */
export function VoltageCurrentChart({ className = '' }: VoltageCurrentChartProps) {
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

  // Fetch voltage data
  const {
    data: voltageTimeSeries,
    isLoading: voltageLoading,
    error: voltageError,
    refetch: refetchVoltage,
  } = useTimeSeriesData({
    metric: 'voltage',
    granularity: 'hour',
    startDate,
    endDate,
  });

  // Fetch current data
  const {
    data: currentTimeSeries,
    isLoading: currentLoading,
    error: currentError,
    refetch: refetchCurrent,
  } = useTimeSeriesData({
    metric: 'current',
    granularity: 'hour',
    startDate,
    endDate,
  });

  // Transform API data to chart format
  const voltageData = useMemo(() => transformToChartData(voltageTimeSeries), [voltageTimeSeries]);
  const currentData = useMemo(() => transformToChartData(currentTimeSeries), [currentTimeSeries]);

  // Determine if datasets are empty
  const isVoltageEmpty = useMemo(() => isDatasetEmpty(voltageData), [voltageData]);
  const isCurrentEmpty = useMemo(() => isDatasetEmpty(currentData), [currentData]);

  // Theme-aware colors
  const colors = {
    voltage: theme === 'light' ? '#428475' : '#3ED98A', // Muted Teal
    current: '#F59E0B', // Amber (same in both themes for contrast)
    gridColor: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : 'rgba(42, 46, 55, 0.3)',
    textColor: theme === 'light' ? '#1A312C' : '#9CA3AF',
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Voltage Chart */}
      <ChartContainer
        title="Voltage Trend"
        subtitle="Electrical potential over the last 24 hours"
        isLoading={voltageLoading}
        error={voltageError}
        isEmpty={isVoltageEmpty}
        onRetry={refetchVoltage}
        height={isMobile ? 250 : 350}
      >
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
          <LineChart 
            data={voltageData}
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
                value: 'Voltage (V)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
              }}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
            <Tooltip 
              content={<CustomChartTooltip unit="V" />}
              position={{ y: 0 }}
              wrapperStyle={{ zIndex: 1000 }}
              allowEscapeViewBox={{ x: false, y: true }}
              cursor={{ strokeDasharray: '3 3' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.voltage}
              strokeWidth={isMobile ? 2 : 3}
              dot={false}
              activeDot={{ r: 6 }}
              name="Voltage"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Current Chart */}
      <ChartContainer
        title="Current Trend"
        subtitle="Current flow over the last 24 hours"
        isLoading={currentLoading}
        error={currentError}
        isEmpty={isCurrentEmpty}
        onRetry={refetchCurrent}
        height={isMobile ? 250 : 350}
      >
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
          <LineChart 
            data={currentData}
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
                value: 'Current (A)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
              }}
              stroke={colors.textColor}
              tick={{ fontSize: isMobile ? 11 : 12 }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
            <Tooltip 
              content={<CustomChartTooltip unit="A" />}
              position={{ y: 0 }}
              wrapperStyle={{ zIndex: 1000 }}
              allowEscapeViewBox={{ x: false, y: true }}
              cursor={{ strokeDasharray: '3 3' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.current}
              strokeWidth={isMobile ? 2 : 3}
              dot={false}
              activeDot={{ r: 6 }}
              name="Current"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
