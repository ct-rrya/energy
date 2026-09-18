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
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Tooltip,
} from 'recharts';

export interface CapacitorVoltageChartProps {
  className?: string;
}

/**
 * CapacitorVoltageChart Component
 * 
 * Displays capacitor voltage measurements over time.
 * Shows energy storage level in the capacitor system.
 * 
 * Features:
 * - Real-time updates via WebSocket
 * - Last 24 hours with hourly granularity
 * - Proper empty state when no data available
 * - Responsive design
 * - Theme-aware colors
 * 
 * Note: Uses actual hardware measurement (voltage), NOT fabricated percentage
 */
export function CapacitorVoltageChart({ className = '' }: CapacitorVoltageChartProps) {
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

  // Fetch capacitor voltage data
  const {
    data: capacitorTimeSeries,
    isLoading,
    error,
    refetch,
  } = useTimeSeriesData({
    metric: 'capacitorVoltage',
    granularity: 'hour',
    startDate,
    endDate,
  });

  // Transform API data to chart format
  const chartData = useMemo(() => transformToChartData(capacitorTimeSeries), [capacitorTimeSeries]);

  // Determine if dataset is empty
  const isEmpty = useMemo(() => isDatasetEmpty(chartData), [chartData]);

  // Theme-aware colors
  const colors = {
    line: theme === 'light' ? '#3B82F6' : '#60A5FA', // Blue
    gridColor: theme === 'light' ? 'rgba(26, 49, 44, 0.1)' : 'rgba(42, 46, 55, 0.3)',
    textColor: theme === 'light' ? '#1A312C' : '#9CA3AF',
  };

  return (
    <ChartContainer
      title="Capacitor Voltage Over Time"
      subtitle="Energy storage level in the capacitor"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      onRetry={refetch}
      height={isMobile ? 250 : 350}
      className={className}
    >
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
        <LineChart 
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
              value: 'Capacitor Voltage (V)',
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
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors.line}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            name="Capacitor Voltage"
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
