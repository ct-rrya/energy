import React, { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTimeSeriesData } from '@/features/dashboard/hooks/useTimeSeriesData';
import { useChartRealTimeUpdates } from '@/features/dashboard/hooks/useChartRealTimeUpdates';
import {
  transformToChartData,
  isDatasetEmpty,
  hasDuplicateFormattedDates,
  formatSmartChartTimestamp,
  computeNiceYAxis,
} from './chartUtils';
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
  periodLabel,
  startHour,
  endHour,
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
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
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
    startHour,
    endHour,
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
    startHour,
    endHour,
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

  // Standardize Current to mA everywhere (matching Central Dashboard and Historical Records)
  const maxCurrentA = useMemo(
    () => currentData.reduce((max, pt) => Math.max(max, Math.abs(pt.value || 0)), 0),
    [currentData]
  );
  const currentUnit = 'mA';
  const currentMultiplier = 1_000;

  const showVoltageTimeOnXAxis = useMemo(
    () => hasDuplicateFormattedDates(voltageData, granularity),
    [voltageData, granularity]
  );
  const showCurrentTimeOnXAxis = useMemo(
    () => hasDuplicateFormattedDates(currentData, granularity),
    [currentData, granularity]
  );

  const voltageYAxisScale = useMemo(() => {
    const maxVal = voltageData.reduce((m, pt) => Math.max(m, pt.value || 0), 0);
    return computeNiceYAxis(maxVal, { minMax: 5, targetSteps: 4 });
  }, [voltageData]);

  const currentYAxisScale = useMemo(() => {
    return computeNiceYAxis(maxCurrentA, {
      minMax: 0.01,
      multiplier: currentMultiplier,
      targetSteps: 4,
    });
  }, [maxCurrentA, currentMultiplier]);

  // Theme-aware colors
  const colors = {
    voltage: '#3DDC97', // EcoStep green for primary chart strokes
    current: '#F59E0B', // Amber (same in both themes for contrast)
    gridColor: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : 'rgba(42, 46, 55, 0.3)',
    textColor: theme === 'light' ? '#1A312C' : '#9CA3AF',
  };

  const chartMargin = {
    top: 12,
    right: isMobile ? 12 : 20,
    left: isMobile ? 4 : 12,
    bottom: isMobile ? 12 : 4,
  };

  const voltageYAxisWidth = isMobile ? 52 : 62;
  const currentYAxisWidth = isMobile ? 58 : 70;

  const voltageYAxisLabel = {
    value: 'Voltage (V)',
    angle: -90,
    position: 'insideLeft' as const,
    offset: isMobile ? 2 : 0,
    style: {
      fill: colors.textColor,
      fontSize: isMobile ? '11px' : '12px',
      textAnchor: 'middle' as const,
    },
  };

  const currentYAxisLabel = {
    value: `Current (${currentUnit})`,
    angle: -90,
    position: 'insideLeft' as const,
    offset: isMobile ? 2 : 0,
    style: {
      fill: colors.textColor,
      fontSize: isMobile ? '11px' : '12px',
      textAnchor: 'middle' as const,
    },
  };

  const voltageSubtitle = periodLabel
    ? `Electrical push (V) produced by footsteps (${periodLabel})`
    : 'Electrical push (V) produced by footsteps';

  const currentSubtitle = periodLabel
    ? `Electrical charge flow (${currentUnit}) (${periodLabel})`
    : `Electrical charge flow (${currentUnit})`;

  return (
    <div className={`analytics-charts-grid ${className}`}>
      {/* Voltage Chart */}
      <ChartContainer
        title="Voltage Trend"
        subtitle={voltageSubtitle}
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
                tickFormatter={(timestamp) => formatSmartChartTimestamp(timestamp, granularity, showVoltageTimeOnXAxis)}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              />
              <YAxis
                width={voltageYAxisWidth}
                label={voltageYAxisLabel}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
                domain={voltageYAxisScale.domain}
                ticks={voltageYAxisScale.ticks}
                tickFormatter={(v) => Number(v).toFixed(voltageYAxisScale.decimals)}
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
                tickFormatter={(timestamp) => formatSmartChartTimestamp(timestamp, granularity, showVoltageTimeOnXAxis)}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              />
              <YAxis
                width={voltageYAxisWidth}
                label={voltageYAxisLabel}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
                domain={voltageYAxisScale.domain}
                ticks={voltageYAxisScale.ticks}
                tickFormatter={(v) => Number(v).toFixed(voltageYAxisScale.decimals)}
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
        subtitle={currentSubtitle}
        tooltip={{
          title: `Current Trend (${currentUnit})`,
          description: "Shows how quickly harvested electrical charge flows into onboard storage over time.",
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
                tickFormatter={(timestamp) => formatSmartChartTimestamp(timestamp, granularity, showCurrentTimeOnXAxis)}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              />
              <YAxis
                width={currentYAxisWidth}
                label={currentYAxisLabel}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
                domain={currentYAxisScale.domain}
                ticks={currentYAxisScale.ticks}
                tickFormatter={(value) =>
                  (value * currentMultiplier).toFixed(currentYAxisScale.decimals)
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
                name="Current"
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
                tickFormatter={(timestamp) => formatSmartChartTimestamp(timestamp, granularity, showCurrentTimeOnXAxis)}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              />
              <YAxis
                width={currentYAxisWidth}
                label={currentYAxisLabel}
                stroke={colors.textColor}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
                domain={currentYAxisScale.domain}
                ticks={currentYAxisScale.ticks}
                tickFormatter={(value) =>
                  (value * currentMultiplier).toFixed(currentYAxisScale.decimals)
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
                name="Current"
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
});
