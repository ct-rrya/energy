import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Table as TableIcon, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { EcoCard, EcoEmptyState } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getTimeSeries } from '@/api/services/analytics.service';
import { energyService, type EnergyReading } from '@/api/services/energy.service';
import type { MetricType, Granularity } from '@/features/analytics/types';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * View Mode Type
 */
type ViewMode = 'aggregated' | 'raw';

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
  id?: string; // Optional ID for raw data mode
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
  // Theme for styling
  const { theme } = useTheme();
  
  // State for view mode and pagination
  const [viewMode, setViewMode] = useState<ViewMode>('aggregated');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  // Fetch raw readings with pagination (only when in raw mode)
  const { data: rawReadingsData, isLoading: rawReadingsLoading, error: rawReadingsError } = useQuery({
    queryKey: ['rawReadings', startDate, endDate, currentPage, recordsPerPage],
    queryFn: async () => {
      console.log('[HistoricalDataView] Fetching raw readings:', { startDate, endDate, currentPage, recordsPerPage });
      try {
        const result = await energyService.getRawReadings(startDate, endDate, currentPage, recordsPerPage);
        console.log('[HistoricalDataView] Raw readings result:', result);
        return result;
      } catch (error) {
        console.error('[HistoricalDataView] Raw readings error:', error);
        throw error;
      }
    },
    enabled: viewMode === 'raw',
  });
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

  const isLoading = 
    viewMode === 'aggregated'
      ? (energyLoading || voltageLoading || currentLoading || powerLoading || stepsLoading)
      : rawReadingsLoading;

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

    const headers = ['Date', 'Time', 'Energy (mWh)', 'Voltage (V)', 'Equiv. Current (mA)', 'Power (mW)', 'Steps'];
    const csvContent = [
      headers.join(','),
      ...historicalRecords.map(record =>
        [
          record.date,
          record.time,
          record.energy?.toFixed(2) || '',
          record.voltage?.toFixed(1) || '',
          record.current !== undefined ? (record.current * 1000).toFixed(1) : '',
          record.power !== undefined ? (record.power * 1000).toFixed(3) : '',
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

  // Empty state for aggregated view
  if (!isLoading && viewMode === 'aggregated' && !historicalRecords.length) {
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

  // Empty state for raw view
  if (!isLoading && viewMode === 'raw' && !rawReadingsLoading && (!rawReadingsData || rawReadingsData.data.length === 0)) {
    return (
      <EcoCard>
        <EcoEmptyState
          icon={Calendar}
          title="No raw data available"
          description={rawReadingsError ? `Error: ${rawReadingsError.message}` : "Raw sensor readings will appear here once EcoStep begins receiving telemetry."}
        />
      </EcoCard>
    );
  }

  // Format raw readings for display
  const rawRecords = rawReadingsData?.data.map((reading: EnergyReading) => {
    const timestamp = new Date(reading.timestamp);
    return {
      date: format(timestamp, 'MMM dd, yyyy'),
      time: format(timestamp, 'HH:mm:ss'),
      energy: reading.energy,
      voltage: reading.voltage,
      current: reading.current,
      power: reading.power,
      steps: reading.stepCount,
      id: reading.id,
    };
  }) || [];

  const displayRecords = viewMode === 'aggregated' ? historicalRecords : rawRecords;
  const totalRecords = viewMode === 'raw' && rawReadingsData ? rawReadingsData.total : historicalRecords.length;
  const totalPages = viewMode === 'raw' && rawReadingsData ? rawReadingsData.totalPages : 1;

  return (
    <EcoCard>
      <div className="eco-card-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="eco-icon-container-lg">
              <Calendar className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="eco-card-title">Historical Records</h3>
              <p className="text-sm text-[rgb(var(--color-neutral-600))] mt-1">
                {totalRecords} {viewMode === 'raw' ? 'raw readings' : 'data points'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle - EcoStep Design System */}
            <div 
              className="flex items-center gap-1 rounded-xl p-1"
              style={{
                backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              }}
            >
              <button
                onClick={() => {
                  setViewMode('aggregated');
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: viewMode === 'aggregated'
                    ? (theme === 'dark' ? '#1E2B24' : '#E8F8EF')
                    : 'transparent',
                  color: viewMode === 'aggregated'
                    ? (theme === 'dark' ? '#3DDC97' : '#428475')
                    : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                  boxShadow: viewMode === 'aggregated' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                }}
                aria-pressed={viewMode === 'aggregated'}
              >
                <BarChart3 className="h-4 w-4" strokeWidth={2} />
                Aggregated
              </button>
              <button
                onClick={() => {
                  setViewMode('raw');
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: viewMode === 'raw'
                    ? (theme === 'dark' ? '#1E2B24' : '#E8F8EF')
                    : 'transparent',
                  color: viewMode === 'raw'
                    ? (theme === 'dark' ? '#3DDC97' : '#428475')
                    : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                  boxShadow: viewMode === 'raw' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                }}
                aria-pressed={viewMode === 'raw'}
              >
                <TableIcon className="h-4 w-4" strokeWidth={2} />
                Raw Data
              </button>
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
      </div>

      {/* Pagination Controls (Raw Mode Only) */}
      {viewMode === 'raw' && rawReadingsData && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-[rgb(var(--color-neutral-200))] dark:border-[rgb(var(--color-neutral-700))]">
          <p className="text-sm text-[rgb(var(--color-neutral-600))]">
            Page {currentPage} of {totalPages} • Showing {(currentPage - 1) * recordsPerPage + 1} to{' '}
            {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="eco-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] px-2">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="eco-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

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
              <th 
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-neutral-600))] text-right"
                title="Equivalent current if capacitor discharges in 1 second"
              >
                Equiv. Current
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
            {displayRecords.map((record, index) => (
              <tr
                key={viewMode === 'raw' ? record.id : `${record.date}-${record.time}-${index}`}
                className="border-b border-[rgb(var(--color-neutral-100))] dark:border-[rgb(var(--color-neutral-800))] hover:bg-[rgb(var(--color-neutral-50))] dark:hover:bg-[rgb(var(--color-neutral-900))] transition-colors"
              >
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-900))] dark:text-[rgb(var(--color-neutral-100))] font-medium">
                  {record.date}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] tabular-nums">
                  {record.time}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-900))] dark:text-[rgb(var(--color-neutral-100))] text-right tabular-nums font-medium">
                  {record.energy !== undefined ? `${record.energy.toFixed(2)} mWh` : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] text-right tabular-nums">
                  {record.voltage !== undefined ? `${record.voltage.toFixed(1)} V` : '—'}
                </td>
                <td 
                  className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] text-right tabular-nums"
                  title="Equivalent current if capacitor discharges in 1 second"
                >
                  {record.current !== undefined ? `${(record.current * 1000).toFixed(1)} mA` : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-[rgb(var(--color-neutral-700))] dark:text-[rgb(var(--color-neutral-300))] text-right tabular-nums">
                  {record.power !== undefined ? `${(record.power * 1000).toFixed(3)} mW` : '—'}
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
          {viewMode === 'aggregated' ? (
            <>
              Showing {displayRecords.length} aggregated records from {format(new Date(startDate), 'MMM dd, yyyy')} to{' '}
              {format(new Date(endDate), 'MMM dd, yyyy')}
            </>
          ) : (
            <>
              Showing raw sensor readings from {format(new Date(startDate), 'MMM dd, yyyy')} to{' '}
              {format(new Date(endDate), 'MMM dd, yyyy')} • {totalRecords} total records
            </>
          )}
        </p>
      </div>
    </EcoCard>
  );
}
