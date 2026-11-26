import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, ChevronLeft, ChevronRight, Footprints } from 'lucide-react';
import { EcoEmptyState } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getTimeSeries } from '@/api/services/analytics.service';
import { energyService, type EnergyReading } from '@/api/services/energy.service';
import { hasMeaningfulActivity } from '@/components/dashboard/chartUtils';
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
  /** Optional hour-of-day filter start (0-23, PHT) */
  startHour?: number;
  /** Optional hour-of-day filter end (0-23, PHT) */
  endHour?: number;
  /** Whether the current user is a public user (read-only) */
  isPublicUser?: boolean;
  /** Callback to reset period to All Time */
  onResetToAllTime?: () => void;
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
  startHour,
  endHour,
  isPublicUser: propIsPublicUser,
  onResetToAllTime: _onResetToAllTime,
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
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const recordsPerPage = 50;

  const hourFilterParams =
    startHour !== undefined && endHour !== undefined ? { startHour, endHour } : {};

  // Fetch raw readings with pagination (only when in raw mode)
  // When includeInactive is false (default), backend filters out completely inactive records
  const { data: rawReadingsData, isLoading: rawReadingsLoading } = useQuery({
    queryKey: ['rawReadings', startDate, endDate, currentPage, recordsPerPage, includeInactive, startHour ?? 'all', endHour ?? 'all'],
    queryFn: async () => {
      try {
        const result = await energyService.getRawReadings(
          startDate,
          endDate,
          currentPage,
          recordsPerPage,
          includeInactive,
          startHour,
          endHour,
        );
        return result;
      } catch (error) {
        console.error('[HistoricalDataView] Raw readings error:', error);
        throw error;
      }
    },
    enabled: viewMode === 'raw',
  });

  // When startDate is undefined ("All Time"), pass an early epoch date to getTimeSeries
  // because the backend /analytics/time-series endpoint defaults omitted startDate to last 24h
  const timeSeriesStartDate = startDate ?? '2020-01-01T00:00:00.000Z';

  // Fetch all metrics in parallel
  const { data: energyData, isLoading: energyLoading } = useQuery({
    queryKey: ['timeSeries', 'energy', granularity, timeSeriesStartDate, endDate, startHour ?? 'all', endHour ?? 'all'],
    queryFn: () =>
      getTimeSeries({
        metric: 'energy' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
        ...hourFilterParams,
      }),
  });

  const { data: voltageData, isLoading: voltageLoading } = useQuery({
    queryKey: ['timeSeries', 'voltage', granularity, timeSeriesStartDate, endDate, startHour ?? 'all', endHour ?? 'all'],
    queryFn: () =>
      getTimeSeries({
        metric: 'voltage' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
        ...hourFilterParams,
      }),
  });

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['timeSeries', 'current', granularity, timeSeriesStartDate, endDate, startHour ?? 'all', endHour ?? 'all'],
    queryFn: () =>
      getTimeSeries({
        metric: 'current' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
        ...hourFilterParams,
      }),
  });

  const { data: powerData, isLoading: powerLoading } = useQuery({
    queryKey: ['timeSeries', 'power', granularity, timeSeriesStartDate, endDate, startHour ?? 'all', endHour ?? 'all'],
    queryFn: () =>
      getTimeSeries({
        metric: 'power' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
        ...hourFilterParams,
      }),
  });

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ['timeSeries', 'steps', granularity, timeSeriesStartDate, endDate, startHour ?? 'all', endHour ?? 'all'],
    queryFn: () =>
      getTimeSeries({
        metric: 'steps' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
        ...hourFilterParams,
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
    return energyData.dataPoints
      .map((point, index) => {
        const timestamp = new Date(point.timestamp);
        
        return {
          rawTimestamp: timestamp.getTime(),
          date: format(timestamp, 'MMM dd, yyyy'),
          time: format(timestamp, 'h:mm a'),
          energy: point.value,
          voltage: voltageData?.dataPoints[index]?.value,
          current: currentData?.dataPoints[index]?.value,
          power: powerData?.dataPoints[index]?.value,
          steps: stepsData?.dataPoints[index]?.value,
        };
      })
      .sort((a, b) => a.rawTimestamp - b.rawTimestamp);
  }, [energyData, voltageData, currentData, powerData, stepsData]);

  // Format raw readings for display
  const rawRecords = useMemo((): HistoricalDataRecord[] => {
    if (!rawReadingsData?.data) return [];
    return rawReadingsData.data.map((reading: EnergyReading) => {
      const timestamp = new Date(reading.timestamp);
      return {
        date: format(timestamp, 'MMM dd, yyyy'),
        time: format(timestamp, 'h:mm:ss a'),
        energy: reading.energy,
        voltage: reading.voltage,
        current: reading.current,
        power: reading.power,
        steps: reading.stepCount,
        id: reading.id,
      };
    });
  }, [rawReadingsData]);

  // Filter records to hide completely zero-valued records by default
  // Preserves records containing at least one nonzero measurement (meaningful activity)
  // When includeInactive is true (e.g. for troubleshooting), all records are shown
  const filteredHistoricalRecords = useMemo(() => {
    if (includeInactive) return historicalRecords;
    return historicalRecords.filter(hasMeaningfulActivity);
  }, [historicalRecords, includeInactive]);

  const filteredRawRecords = useMemo(() => {
    if (includeInactive) return rawRecords;
    return rawRecords.filter(hasMeaningfulActivity);
  }, [rawRecords, includeInactive]);

  const displayRecords = useMemo(() => {
    return viewMode === 'aggregated' ? filteredHistoricalRecords : filteredRawRecords;
  }, [viewMode, filteredHistoricalRecords, filteredRawRecords]);

  // Export to CSV (Unavailable for public users)
  const handleExport = () => {
    if (isPublic || !displayRecords.length) return;

    const headers = ['Date', 'Time', 'Energy (mWh)', 'Voltage (V)', 'Current (mA)', 'Power (mW)', 'Steps'];
    const csvContent = [
      headers.join(','),
      ...displayRecords.map(record =>
        [
          record.date,
          record.time,
          record.energy !== undefined && record.energy !== null ? record.energy.toFixed(5) : '',
          record.voltage !== undefined && record.voltage !== null ? record.voltage.toFixed(5) : '',
          record.current !== undefined && record.current !== null ? (record.current * 1000).toFixed(5) : '',
          record.power !== undefined && record.power !== null ? (record.power * 1000).toFixed(5) : '',
          record.steps !== undefined && record.steps !== null ? record.steps.toFixed(0) : '',
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
      <div className="flex items-center justify-center py-14">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-sm text-[rgb(var(--color-neutral-600))]">
          Loading historical data...
        </span>
      </div>
    );
  }

  const totalRecords = viewMode === 'raw' && rawReadingsData ? rawReadingsData.total : displayRecords.length;
  const totalPages = viewMode === 'raw' && rawReadingsData ? rawReadingsData.totalPages : 1;

  return (
    <div className="w-full">
      <div
        className="px-5 sm:px-6 py-4 border-b"
        style={{
          borderColor: 'var(--line)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar
              className="h-4 w-4 shrink-0"
              strokeWidth={2}
              style={{ color: theme === 'dark' ? '#39FF88' : '#16A34A' }}
            />
            <div>
              <h3
                className="text-sm sm:text-base font-semibold m-0"
                style={{ color: 'var(--t)' }}
              >
                Historical Records
              </h3>
              <p
                className="text-xs m-0"
                style={{ color: 'var(--mu)' }}
              >
                {totalRecords}{' '}
                {viewMode === 'raw'
                  ? 'individual readings'
                  : `${granularity === 'hour' ? 'hourly' : granularity === 'day' ? 'daily' : granularity === 'week' ? 'weekly' : 'monthly'} summary records`}
                {!includeInactive && ' • Active only'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quiet-Period Filter Toggle */}
            <button
              type="button"
              onClick={() => {
                setIncludeInactive((prev) => !prev);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer"
              style={{
                backgroundColor: includeInactive
                  ? (theme === 'dark' ? 'rgba(234, 179, 8, 0.15)' : '#FEF9C3')
                  : 'transparent',
                borderColor: includeInactive
                  ? (theme === 'dark' ? '#EAB308' : '#CA8A04')
                  : 'var(--line)',
                color: includeInactive
                  ? (theme === 'dark' ? '#FACC15' : '#854D0E')
                  : 'var(--mu)',
              }}
              title={includeInactive ? 'Showing all periods, including quiet rows with zero activity' : 'Showing only rows with recorded footsteps or energy'}
              aria-pressed={includeInactive}
            >
              {includeInactive ? 'Include Quiet' : 'Active Only'}
            </button>

            {/* Compact View Mode Dropdown (replaces nested pill bar) */}
            <select
              aria-label="Select historical view mode"
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value as 'aggregated' | 'raw');
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
            >
              <option value="aggregated">Summary</option>
              <option value="raw">All Readings</option>
            </select>

            {/* Export Button (Admins only) */}
            {!isPublic && (
              <button
                type="button"
                onClick={handleExport}
                title="Export CSV"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: 'var(--soft)',
                  color: 'var(--t)',
                  border: '1px solid var(--line)',
                }}
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2} />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body: Empty State OR Table & Mobile Cards */}
      {displayRecords.length === 0 ? (
        <EcoEmptyState
          icon={Footprints}
          title="Tiptoeing around? The tile hasn't felt a single stomp today :<"
        />
      ) : (
        <>
          {/* Pagination Controls (Raw Mode Only) */}
          {viewMode === 'raw' && rawReadingsData && totalPages > 1 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-6 py-3 border-b mb-4"
              style={{
                borderColor: 'var(--line)',
              }}
            >
              <p
                className="text-xs sm:text-sm text-center sm:text-left font-medium"
                style={{ color: 'var(--mu)' }}
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
                    backgroundColor: 'var(--panel)',
                    borderColor: 'var(--line)',
                    color: 'var(--t)',
                  }}
                  className="p-2 rounded-lg border flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                </button>
                <span
                  className="text-xs sm:text-sm px-3 py-1.5 rounded-lg font-bold border"
                  style={{
                    backgroundColor: 'var(--soft)',
                    borderColor: 'var(--line)',
                    color: 'var(--t)',
                  }}
                >
                  {currentPage}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    backgroundColor: 'var(--panel)',
                    borderColor: 'var(--line)',
                    color: 'var(--t)',
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
                    title="Estimated electrical current generated"
                  >
                    Current
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
                      {record.energy !== undefined ? `${record.energy.toFixed(5)} mWh` : '—'}
                    </td>
                    <td
                      className="py-3 px-4 text-sm text-right tabular-nums font-medium"
                      style={{ color: theme === 'dark' ? '#39FF88' : '#10B981' }}
                    >
                      {record.voltage !== undefined ? `${record.voltage.toFixed(5)} V` : '—'}
                    </td>
                    <td 
                      className="py-3 px-4 text-sm text-right tabular-nums font-medium"
                      style={{ color: theme === 'dark' ? '#60A5FA' : '#2563EB' }}
                      title="Estimated electrical current generated"
                    >
                      {record.current !== undefined ? `${(record.current * 1000).toFixed(5)} mA` : '—'}
                    </td>
                    <td
                      className="py-3 px-4 text-sm text-right tabular-nums font-medium"
                      style={{ color: theme === 'dark' ? '#FBBF24' : '#D97706' }}
                    >
                      {record.power !== undefined ? `${(record.power * 1000).toFixed(5)} mW` : '—'}
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

          {/* Compact Flat List View (< md, directly on main sheet) */}
          <div className="md:hidden divide-y divide-[var(--line)]">
            {displayRecords.map((record, index) => (
              <div
                key={viewMode === 'raw' ? record.id : `${record.date}-${record.time}-${index}`}
                className="px-4 py-3.5"
              >
                {/* Row Header: Timestamp & Energy */}
                <div className="flex items-center justify-between gap-2 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold tracking-tight"
                      style={{ color: 'var(--t)' }}
                    >
                      {record.date}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--mu)' }}
                    >
                      · {record.time}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{
                      color: theme === 'dark' ? '#39FF88' : '#059669',
                    }}
                  >
                    {record.energy !== undefined ? `${record.energy.toFixed(5)} mWh` : '—'}
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
                      {record.voltage !== undefined ? `${record.voltage.toFixed(5)} V` : '—'}
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
                      {record.current !== undefined ? `${(record.current * 1000).toFixed(5)} mA` : '—'}
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
                      {record.power !== undefined ? `${(record.power * 1000).toFixed(5)} mW` : '—'}
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
            className="px-5 sm:px-6 py-3.5 border-t"
            style={{
              borderColor: 'var(--line)',
            }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }}
            >
              {viewMode === 'aggregated' ? (
                <>
                  Showing {displayRecords.length} summary records
                  {startDate && endDate ? ` from ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}` : ''}
                </>
              ) : (
                <>
                  Showing individual readings
                  {startDate && endDate ? ` from ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}` : ' across all time'} • {totalRecords} total records
                </>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
