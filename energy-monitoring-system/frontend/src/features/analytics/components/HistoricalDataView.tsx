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
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';

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
  startDate?: string;
  /** Date range end */
  endDate?: string;
  /** Granularity for data aggregation */
  granularity: Granularity;
  /** Whether the current user is a public user (read-only) */
  isPublicUser?: boolean;
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
  isPublicUser: propIsPublicUser,
}: HistoricalDataViewProps) {
  // Theme for styling
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  // Determine if user is public (cannot export CSV)
  const userRole = getUserRole(isAuthenticated, user);
  const isPublic = propIsPublicUser !== undefined ? propIsPublicUser : (userRole === 'public');
  
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

  // Export to CSV (Unavailable for public users)
  const handleExport = () => {
    if (isPublic || !historicalRecords.length) return;

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
    <EcoCard
      style={{
        backgroundColor: theme === 'dark' ? '#080E22' : '#FFFFFF',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
      }}
    >
      <div
        className="eco-card-header pb-4 mb-4 border-b"
        style={{
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(57, 255, 136, 0.12)' : 'rgba(34, 197, 94, 0.1)',
                color: theme === 'dark' ? '#39FF88' : '#16A34A',
              }}
            >
              <Calendar className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h3
                className="text-lg font-bold"
                style={{ color: theme === 'dark' ? '#FFFFFF' : '#0B132B' }}
              >
                Historical Records
              </h3>
              <p
                className="text-sm mt-0.5"
                style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
              >
                {totalRecords} {viewMode === 'raw' ? 'raw readings' : 'data points'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* View Mode Toggle - EcoStep Design System */}
            <div 
              className="flex items-center gap-1 rounded-xl p-1 w-full sm:w-auto"
              style={{
                backgroundColor: theme === 'dark' ? '#111B30' : '#F3F4F6',
                border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB'}`,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setViewMode('aggregated');
                  setCurrentPage(1);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200"
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
                type="button"
                onClick={() => {
                  setViewMode('raw');
                  setCurrentPage(1);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200"
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

            {/* Export Button (Disabled for public users) */}
            <button
              type="button"
              onClick={isPublic ? undefined : handleExport}
              disabled={isPublic}
              title={isPublic ? 'Exporting CSV is unavailable to public users' : 'Export CSV'}
              aria-disabled={isPublic}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm rounded-lg font-medium transition-all w-full sm:w-auto ${
                isPublic
                  ? 'opacity-40 cursor-not-allowed bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 border border-neutral-300 dark:border-neutral-700 pointer-events-auto'
                  : 'cursor-pointer hover:opacity-90'
              }`}
              style={{
                backgroundColor: isPublic
                  ? undefined
                  : theme === 'dark'
                  ? '#111B30'
                  : '#FFFFFF',
                borderColor: isPublic
                  ? undefined
                  : theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : '#D1D5DB',
                color: isPublic
                  ? undefined
                  : theme === 'dark'
                  ? '#FFFFFF'
                  : '#0B132B',
                border: isPublic ? undefined : '1px solid',
              }}
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pagination Controls (Raw Mode Only) */}
      {viewMode === 'raw' && rawReadingsData && totalPages > 1 && (
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-6 py-3 border-b mb-4"
          style={{
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
          }}
        >
          <p
            className="text-xs sm:text-sm text-center sm:text-left font-medium"
            style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
          >
            Page {currentPage} of {totalPages} • Showing {(currentPage - 1) * recordsPerPage + 1} to{' '}
            {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : '#D1D5DB',
                color: theme === 'dark' ? '#FFFFFF' : '#1F2937',
              }}
              className="p-2 rounded-lg border flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <span
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg font-bold border"
              style={{
                backgroundColor: theme === 'dark' ? '#111B30' : '#F3F4F6',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB',
                color: theme === 'dark' ? '#39FF88' : '#0F172A',
              }}
            >
              {currentPage}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : '#D1D5DB',
                color: theme === 'dark' ? '#FFFFFF' : '#1F2937',
              }}
              className="p-2 rounded-lg border flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto -mx-6 px-6">
        <table className="w-full text-left border-collapse" style={{ minWidth: '680px' }}>
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
              }}
            >
              <th
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
              >
                Date
              </th>
              <th
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
              >
                Time
              </th>
              <th
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-right"
                style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
              >
                Energy
              </th>
              <th
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-right"
                style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
              >
                Voltage
              </th>
              <th 
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-right"
                style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
                title="Equivalent current if capacitor discharges in 1 second"
              >
                Equiv. Current
              </th>
              <th
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-right"
                style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
              >
                Power
              </th>
              <th
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-right"
                style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
              >
                Steps
              </th>
            </tr>
          </thead>
          <tbody>
            {displayRecords.map((record, index) => (
              <tr
                key={viewMode === 'raw' ? record.id : `${record.date}-${record.time}-${index}`}
                className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#F3F4F6',
                }}
              >
                <td
                  className="py-3 px-4 text-sm font-semibold"
                  style={{ color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}
                >
                  {record.date}
                </td>
                <td
                  className="py-3 px-4 text-sm tabular-nums"
                  style={{ color: theme === 'dark' ? '#94A3B8' : '#475569' }}
                >
                  {record.time}
                </td>
                <td
                  className="py-3 px-4 text-sm text-right tabular-nums font-bold"
                  style={{ color: theme === 'dark' ? '#39FF88' : '#059669' }}
                >
                  {record.energy !== undefined ? `${record.energy.toFixed(2)} mWh` : '—'}
                </td>
                <td
                  className="py-3 px-4 text-sm text-right tabular-nums font-medium"
                  style={{ color: theme === 'dark' ? '#39FF88' : '#10B981' }}
                >
                  {record.voltage !== undefined ? `${record.voltage.toFixed(1)} V` : '—'}
                </td>
                <td 
                  className="py-3 px-4 text-sm text-right tabular-nums font-medium"
                  style={{ color: theme === 'dark' ? '#60A5FA' : '#2563EB' }}
                  title="Equivalent current if capacitor discharges in 1 second"
                >
                  {record.current !== undefined ? `${(record.current * 1000).toFixed(1)} mA` : '—'}
                </td>
                <td
                  className="py-3 px-4 text-sm text-right tabular-nums font-medium"
                  style={{ color: theme === 'dark' ? '#FBBF24' : '#D97706' }}
                >
                  {record.power !== undefined ? `${(record.power * 1000).toFixed(3)} mW` : '—'}
                </td>
                <td
                  className="py-3 px-4 text-sm text-right tabular-nums font-semibold"
                  style={{ color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}
                >
                  {record.steps !== undefined ? record.steps.toFixed(0) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {displayRecords.map((record, index) => (
          <div
            key={viewMode === 'raw' ? record.id : `${record.date}-${record.time}-${index}`}
            className="p-4 rounded-2xl border transition-all duration-200"
            style={{
              backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
              boxShadow: theme === 'dark' ? '0 4px 16px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Card Header: Timestamp & Energy Badge */}
            <div
              className="flex items-center justify-between pb-3 mb-3 border-b"
              style={{
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}
                >
                  {record.date}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
                >
                  • {record.time}
                </span>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(5, 150, 105, 0.25)' : '#ECFDF5',
                  color: theme === 'dark' ? '#39FF88' : '#059669',
                  border: theme === 'dark' ? '1px solid rgba(57, 255, 136, 0.25)' : '1px solid #A7F3D0',
                }}
              >
                {record.energy !== undefined ? `${record.energy.toFixed(2)} mWh` : '—'}
              </span>
            </div>

            {/* 4-Metric Grid */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              {/* VOLTAGE */}
              <div>
                <span
                  className="block text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
                >
                  Voltage
                </span>
                <span
                  className="text-base font-extrabold tabular-nums mt-0.5 block"
                  style={{ color: theme === 'dark' ? '#39FF88' : '#10B981' }}
                >
                  {record.voltage !== undefined ? `${record.voltage.toFixed(1)} V` : '—'}
                </span>
              </div>

              {/* CURRENT */}
              <div>
                <span
                  className="block text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
                >
                  Current
                </span>
                <span
                  className="text-base font-extrabold tabular-nums mt-0.5 block"
                  style={{ color: theme === 'dark' ? '#60A5FA' : '#2563EB' }}
                >
                  {record.current !== undefined ? `${(record.current * 1000).toFixed(1)} mA` : '—'}
                </span>
              </div>

              {/* POWER */}
              <div>
                <span
                  className="block text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
                >
                  Power
                </span>
                <span
                  className="text-base font-extrabold tabular-nums mt-0.5 block"
                  style={{ color: theme === 'dark' ? '#FBBF24' : '#D97706' }}
                >
                  {record.power !== undefined ? `${(record.power * 1000).toFixed(3)} mW` : '—'}
                </span>
              </div>

              {/* STEPS */}
              <div>
                <span
                  className="block text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
                >
                  Steps
                </span>
                <span
                  className="text-base font-extrabold tabular-nums mt-0.5 block"
                  style={{ color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}
                >
                  {record.steps !== undefined ? record.steps.toFixed(0) : '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary footer */}
      <div
        className="mt-4 pt-4 border-t"
        style={{
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
        }}
      >
        <p
          className="text-xs font-medium"
          style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
        >
          {viewMode === 'aggregated' ? (
            <>
              Showing {displayRecords.length} aggregated records
              {startDate && endDate ? ` from ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}` : ''}
            </>
          ) : (
            <>
              Showing raw sensor readings
              {startDate && endDate ? ` from ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}` : ' across all time'} • {totalRecords} total records
            </>
          )}
        </p>
      </div>
    </EcoCard>
  );
}
