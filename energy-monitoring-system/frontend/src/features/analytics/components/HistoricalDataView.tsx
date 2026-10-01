import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download } from 'lucide-react';
import { EcoCard, EcoEmptyState } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getTimeSeries } from '@/api/services/analytics.service';
import type { MetricType, Granularity } from '@/features/analytics/types';
import { format } from 'date-fns';

/**
 * Historical Data Record
 * Represents a single row in the historical data table
 */
interface HistoricalDataRecord {
  date: string;
  time: string;
  energy?: number;
  voltage?: number;
  current?: number;
  power?: number;
  steps?: number;
}

/**
 * Historical Data View Props
 */
interface HistoricalDataViewProps {
  /** Date range start */
  startDate: string;
  /** Date range end */
  endDate: string;
  /** Granularity for data aggregation */
  granularity: Granularity;
}

/**
 * Historical Data View Component
 * 
 * Displays historical sensor data in tabular format.
 * Shows date, time, energy, voltage, current, power, and steps.
 * 
 * Purpose: Provides record-oriented view of the same data shown in charts.
 * Answers: "What has been happening over time?" in tabular format.
 */
export function HistoricalDataView({
  startDate,
  endDate,
  granularity,
}: HistoricalDataViewProps) {
  // Fetch all metrics in parallel
  const { data: energyData, isLoading: energyLoading } = useQuery({
    queryKey: ['timeSeries', 'energy', granularity, startDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'energy' as MetricType,
        granularity,
        startDate,
        endDate,
        source: 'hardware',
      }),
  });

  const { data: voltageData, isLoading: voltageLoading } = useQuery({
    queryKey: ['timeSeries', 'voltage', granularity, startDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'voltage' as MetricType,
        granularity,
        startDate,
        endDate,
        source: 'hardware',
      }),
  });

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['timeSeries', 'current', granularity, startDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'current' as MetricType,
        granularity,
        startDate,
        endDate,
        source: 'hardware',
      }),
  });

  const { data: powerData, isLoading: powerLoading } = useQuery({
    queryKey: ['timeSeries', 'power', granularity, startDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'power' as MetricType,
        granularity,
        startDate,
        endDate,
        source: 'hardware',
      }),
  });

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ['timeSeries', 'steps', granularity, startDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'steps' as MetricType,
        granularity,
        startDate,
        endDate,
        source: 'hardware',
      }),
  });

  const isLoading = energyLoading || voltageLoading || currentLoading || powerLoading || stepsLoading;

  // Combine all data into historical records
  const historicalRecords = useMemo((): HistoricalDataRecord[] => {
    if (!energyData?.dataPoints.length) return [];

    // Use energy data as the base timeline since it's the primary metric
    return energyData.dataPoints.map((point, index) => {
      const timestamp = new Date(point.timestamp);
      
      return {
        date: format(timestamp, 'MMM dd, yyyy'),
        time: format(timestamp, 'HH:mm'),
        energy: point.value,
        voltage: voltageData?.dataPoints[index]?.value,
        current: currentData?.dataPoints[index]?.value,
        power: powerData?.dataPoints[index]?.value,
        steps: stepsData?.dataPoints[index]?.value,
      };
    });
  }, [energyData, voltageData, currentData, powerData, stepsData]);

  // Export to CSV
  const handleExport = () => {
    if (!historicalRecords.length) return;

    const headers = ['Date', 'Time', 'Energy (kWh)', 'Voltage (V)', 'Current (A)', 'Power (W)', 'Steps'];
    const csvContent = [
      headers.join(','),
      ...historicalRecords.map(record =>
        [
          record.date,
          record.time,
          record.energy?.toFixed(2) || '',
          record.voltage?.toFixed(1) || '',
          record.current?.toFixed(2) || '',
          record.power?.toFixed(1) || '',
          record.steps?.toFixed(0) || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ecostep-historical-data-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (isLoading) {
    return (
      <EcoCard>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-sm text-[rgb(var(--color-neutral-600))]">
            Loading historical data...
          </span>
        </div>
      </EcoCard>
    );
  }

  // Empty state
  if (!historicalRecords.length) {
    return (
      <EcoCard>
        <EcoEmptyState
          icon={Calendar}
          title="No historical data available"
          description="Historical monitoring records will appear here once EcoStep begins receiving telemetry."
        />
      </EcoCard>
    );
  }

  return (
    <EcoCard>
      <div className="eco-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="eco-icon-container-lg">
              <Calendar className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="eco-card-title">Historical Records</h3>
              <p className="text-sm text-[rgb(var(--color-neutral-600))] mt-1">
                {historicalRecords.length} data points
              </p>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="eco-btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Container with horizontal scroll */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgb(var(--color-neutral-200))] dark:border-[rgb(var(--color-neutral-700))]">
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-neutral-600))]">
                Date
              </th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-neutral-600))]">
                Time
              </th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-neutral-600))] text-right">
                Energy
              </th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-neutral-600))] text-right">
                Voltage
              </th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-neutral-600))] text-right">
                Current
              </th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-neutral-600))] text-right">
                Power
              </th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-neutral-600))] text-right">
                Steps
              </th>
            </tr>
          </thead>
          <tbody>
            {historicalRecords.map((record, index) => (
              <tr
                key={`${record.date}-${record.time}-${index}`}
                className="border-b border-[rgb(var(--color-neutral-100))] dark:border-[rgb(var(--color-neutral-800))] hover:bg-[rgb(var(--color-neutral-50))] dark:hover:bg-[rgb(var(--color-neutral-900))] transition-colors"
              >
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-900))] dark:text-[rgb(var(--color-neutral-100))] font-medium">
                  {record.date}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] tabular-nums">
                  {record.time}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-900))] dark:text-[rgb(var(--color-neutral-100))] text-right tabular-nums font-medium">
                  {record.energy !== undefined ? `${record.energy.toFixed(2)} kWh` : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] text-right tabular-nums">
                  {record.voltage !== undefined ? `${record.voltage.toFixed(1)} V` : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] text-right tabular-nums">
                  {record.current !== undefined ? `${record.current.toFixed(2)} A` : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] text-right tabular-nums">
                  {record.power !== undefined ? `${record.power.toFixed(1)} W` : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] text-right tabular-nums">
                  {record.steps !== undefined ? record.steps.toFixed(0) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="mt-4 pt-4 border-t border-[rgb(var(--color-neutral-200))] dark:border-[rgb(var(--color-neutral-700))]">
        <p className="text-xs text-[rgb(var(--color-neutral-600))]">
          Showing {historicalRecords.length} records from {format(new Date(startDate), 'MMM dd, yyyy')} to{' '}
          {format(new Date(endDate), 'MMM dd, yyyy')}
        </p>
      </div>
    </EcoCard>
  );
}
