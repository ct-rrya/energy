import React, { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTimeSeriesData } from '@/features/dashboard/hooks/useTimeSeriesData';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import { transformToChartData, isDatasetEmpty, formatChartTimestamp } from './chartUtils';
import { ChartContainer } from './ChartContainer';
import { CustomChartTooltip } from './CustomChartTooltip';
import type { VoltageCurrentChartProps } from './chartTypes';
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
export const VoltageCurrentChart = React.memo(function VoltageCurrentChart({
  className = '',
  startDate: propStartDate,
  endDate: propEndDate,
  granularity: propGranularity,
  periodLabel: _periodLabel,
}: VoltageCurrentChartProps) {
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

  // Fetch voltage data
  const {
    data: voltageTimeSeries,
    isLoading: voltageLoading,
    error: voltageError,
    refetch: refetchVoltage,
  } = useTimeSeriesData({
    metric: 'voltage',
    granularity,
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
    granularity,
    startDate,
    endDate,
  });

  // Transform API data to chart format
  const voltageData = useMemo(() => transformToChartData(voltageTimeSeries), [voltageTimeSeries]);
  const currentData = useMemo(() => transformToChartData(currentTimeSeries), [currentTimeSeries]);

  // Determine if datasets are empty or sparse (< 2 points)
  const isVoltageEmpty = useMemo(() => isDatasetEmpty(voltageData), [voltageData]);
  const isCurrentEmpty = useMemo(() => isDatasetEmpty(currentData), [currentData]);
  const isVoltageSparse = voltageData.length > 0 && voltageData.length < 2;
  const isCurrentSparse = currentData.length > 0 && currentData.length < 2;
  const chartHeight = isMobile ? 240 : 270;

  // Determine appropriate current unit & scale (µA for sub-mA piezo currents, mA otherwise)
  const maxCurrentA = useMemo(
    () => currentData.reduce((max, pt) => Math.max(max, Math.abs(pt.value || 0)), 0),
    [currentData]
  );
  const useMicroAmps = maxCurrentA < 0.001;
  const currentUnit = useMicroAmps ? 'µA' : 'mA';
  const currentMultiplier = useMicroAmps ? 1_000_000 : 1_000;
  const currentFallbackMaxA = useMicroAmps ? 0.000012 : 0.0012;

  // Theme-aware colors
  const colors = {
    voltage: '#3DDC97', // EcoStep green for primary chart strokes
    current: '#F59E0B', // Amber (same in both themes for contrast)
    gridColor: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : 'rgba(42, 46, 55, 0.3)',
    textColor: theme === 'light' ? '#1A312C' : '#9CA3AF',
  };

  const chartMargin = {
    top: 8,
    right: isMobile ? 8 : 16,
    left: isMobile ? -12 : 0,
    bottom: isMobile ? 8 : 0,
  };

  return (
    <div className={`analytics-charts-grid ${className}`}>
      {/* Voltage Chart */}
      <ChartContainer
        title="Voltage Trend"
        subtitle="Electrical potential (V) produced during compressions"
        tooltip={{
          title: "Voltage Trend (V)",
          description: "Tracks the electrical push created by footsteps over time. Taller crests reflect heavier, more deliberate strides.",
        }}
        isLoading={voltageLoading}
        error={voltageError}
        isEmpty={isVoltageEmpty}
        isSparse={isVoltageSparse}
        onRetry={refetchVoltage}
        height={chartHeight}
      >
        <ResponsiveContainer width="100%" height={chartHeight} debounce={32}>
          {isVoltageSparse ? (
            <BarChart data={voltageData} margin={chartMargin}>
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
                  value: 'Voltage (V)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
                }}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
                tickCount={4}
                domain={[0, (dataMax: number) => (dataMax > 0 ? Number((dataMax * 1.15).toFixed(2)) : 5)]}
              />
              <Tooltip
                content={<CustomChartTooltip unit="V" />}
                position={{ y: 0 }}
                wrapperStyle={{ zIndex: 1000 }}
                allowEscapeViewBox={{ x: false, y: true }}
                cursor={{ fill: 'rgba(61, 220, 151, 0.08)' }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="value"
                fill={colors.voltage}
                name="Voltage"
                maxBarSize={48}
                radius={[8, 8, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <LineChart data={voltageData} margin={chartMargin}>
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
                  value: 'Voltage (V)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
                }}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
                tickCount={4}
                domain={[0, (dataMax: number) => (dataMax > 0 ? Number((dataMax * 1.15).toFixed(2)) : 5)]}
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
                strokeWidth={isMobile ? 2 : 2.5}
                dot={false}
                activeDot={{ r: 4 }}
                name="Voltage"
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>

      {/* Current Chart */}
      <ChartContainer
        title="Current Trend"
        subtitle={`Electrical charge flow rate (${currentUnit})`}
        tooltip={{
          title: `Current Trend (${currentUnit})`,
          description: "Maps how swiftly harvested charge flows into storage capacitors across each hour.",
        }}
        isLoading={currentLoading}
        error={currentError}
        isEmpty={isCurrentEmpty}
        isSparse={isCurrentSparse}
        onRetry={refetchCurrent}
        height={chartHeight}
      >
        <ResponsiveContainer width="100%" height={chartHeight} debounce={32}>
          {isCurrentSparse ? (
            <BarChart data={currentData} margin={chartMargin}>
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
                  value: `Equiv. Current (${currentUnit})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
                }}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
                tickCount={4}
                domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 1.15 : currentFallbackMaxA)]}
                tickFormatter={(value) =>
                  (value * currentMultiplier).toFixed(useMicroAmps ? 1 : 2)
                }
              />
              <Tooltip
                content={<CustomChartTooltip unit={currentUnit} valueMultiplier={currentMultiplier} />}
                position={{ y: 0 }}
                wrapperStyle={{ zIndex: 1000 }}
                allowEscapeViewBox={{ x: false, y: true }}
                cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="value"
                fill={colors.current}
                name="Equiv. Current"
                maxBarSize={48}
                radius={[8, 8, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <LineChart data={currentData} margin={chartMargin}>
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
                  value: `Equiv. Current (${currentUnit})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: colors.textColor, fontSize: isMobile ? '11px' : '12px' },
                }}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
                tickCount={4}
                domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 1.15 : currentFallbackMaxA)]}
                tickFormatter={(value) =>
                  (value * currentMultiplier).toFixed(useMicroAmps ? 1 : 2)
                }
              />
              <Tooltip
                content={<CustomChartTooltip unit={currentUnit} valueMultiplier={currentMultiplier} />}
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
                strokeWidth={isMobile ? 2 : 2.5}
                dot={false}
                activeDot={{ r: 4 }}
                name="Equiv. Current"
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
});
