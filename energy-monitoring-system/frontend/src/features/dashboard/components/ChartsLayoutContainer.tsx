/*  */import { PowerGenerationChart } from '@/components/dashboard/PowerGenerationChart';
import { EnergyPeriodChart } from '@/components/dashboard/EnergyPeriodChart';
import { CumulativeEnergyChart } from '@/components/dashboard/CumulativeEnergyChart';
import { StepsChart } from '@/components/dashboard/StepsChart';
import { useChartRealTimeUpdates } from '../hooks/useChartRealTimeUpdates';
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTimeSeriesData } from '@/features/dashboard/hooks/useTimeSeriesData';
import { transformToChartData, isDatasetEmpty, formatChartTimestamp } from '@/components/dashboard/chartUtils';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { CustomChartTooltip } from '@/components/dashboard/CustomChartTooltip';
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
 * ChartsLayoutContainer Component
 * 
 * Responsive layout container for all dashboard analytics charts.
 * 
 * Charts displayed in 2×2 grid:
 * - Top Row: Voltage Trend | Current Trend
 * - Bottom Row: Energy Period | Cumulative Energy
 * 
 * Plus additional charts:
 * - Power Generation (full width, displayed first)
 * - Steps (full width, displayed last)
 * 
 * Layout:
 * - Desktop (≥1024px): 2-column grid for the four main charts
 * - Tablet (768px-1023px): Adaptive layout
 * - Mobile (<768px): All charts stacked single column (100% width)
 * 
 * Requirements: 7.4, 7.5, 7.6, 7.7, 7.1, 7.2, 7.8
 */
export function ChartsLayoutContainer() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  // Subscribe to real-time updates for all charts
  useChartRealTimeUpdates();

  // Calculate last 24 hours date range for electrical measurements
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
    voltage: theme === 'light' ? '#428475' : '#3ED98A',
    current: '#F59E0B',
    gridColor: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : 'rgba(42, 46, 55, 0.3)',
    textColor: theme === 'light' ? '#1A312C' : '#9CA3AF',
  };

  // Consistent chart height
  const chartHeight = isMobile ? 250 : 320;

  return (
    <div className="space-y-6 mt-6">
      {/* Featured Power Generation Chart - Full Width */}
      <div className="w-full">
        <PowerGenerationChart />
      </div>

      {/* Voltage and Current - 2 Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Voltage Trend */}
        <ChartContainer
          title="Voltage Trend"
          subtitle="Electrical potential over the last 24 hours"
          isLoading={voltageLoading}
          error={voltageError}
          isEmpty={isVoltageEmpty}
          onRetry={refetchVoltage}
          height={chartHeight}
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
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

        {/* Current Trend */}
        <ChartContainer
          title="Current Trend"
          subtitle="Current flow over the last 24 hours"
          isLoading={currentLoading}
          error={currentError}
          isEmpty={isCurrentEmpty}
          onRetry={refetchCurrent}
          height={chartHeight}
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
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

      {/* Energy Generated by Period - Full Width */}
      <div className="w-full">
        <EnergyPeriodChart />
      </div>

      {/* Cumulative Energy Generated - Full Width */}
      <div className="w-full">
        <CumulativeEnergyChart />
      </div>

      {/* Steps Chart - Full Width */}
      <div className="w-full">
        <StepsChart />
      </div>
    </div>
  );
}
