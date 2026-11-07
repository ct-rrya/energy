import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Table as TableIcon, BarChart3, ChevronLeft, ChevronRight, Footprints } from 'lucide-react';
import { EcoCard, EcoEmptyState } from '@/components/common';
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

  // Fetch raw readings with pagination (only when in raw mode)
  // When includeInactive is false (default), backend filters out completely inactive records
  const { data: rawReadingsData, isLoading: rawReadingsLoading } = useQuery({
    queryKey: ['rawReadings', startDate, endDate, currentPage, recordsPerPage, includeInactive],
    queryFn: async () => {
      console.log('[HistoricalDataView] Fetching raw readings:', { startDate, endDate, currentPage, recordsPerPage, includeInactive });
      try {
        const result = await energyService.getRawReadings(startDate, endDate, currentPage, recordsPerPage, includeInactive);
        console.log('[HistoricalDataView] Raw readings result:', result);
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
    queryKey: ['timeSeries', 'energy', granularity, timeSeriesStartDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'energy' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
      }),
  });

  const { data: voltageData, isLoading: voltageLoading } = useQuery({
    queryKey: ['timeSeries', 'voltage', granularity, timeSeriesStartDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'voltage' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
      }),
  });

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['timeSeries', 'current', granularity, timeSeriesStartDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'current' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
      }),
  });

  const { data: powerData, isLoading: powerLoading } = useQuery({
    queryKey: ['timeSeries', 'power', granularity, timeSeriesStartDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'power' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
        endDate,
        source: 'hardware',
      }),
  });

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ['timeSeries', 'steps', granularity, timeSeriesStartDate, endDate],
    queryFn: () =>
      getTimeSeries({
        metric: 'steps' as MetricType,
        granularity,
        startDate: timeSeriesStartDate,
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
    return energyData.dataPoints
      .map((point, index) => {
        const timestamp = new Date(point.timestamp);
        
        return {
          rawTimestamp: timestamp.getTime(),
          date: format(timestamp, 'MMM dd, yyyy'),
          time: format(timestamp, 'HH:mm'),
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
        time: format(timestamp, 'HH:mm:ss'),
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

    const headers = ['Date', 'Time', 'Energy (mWh)', 'Voltage (V)', 'Equiv. Current (mA)', 'Power (mW)', 'Steps'];
    const csvContent = [
      headers.join(','),
      ...displayRecords.map(record =>
        [
          record.date,
          record.time,
          record.energy !== undefined && record.energy !== null ? record.energy.toFixed(2) : '',
          record.voltage !== undefined && record.voltage !== null ? record.voltage.toFixed(1) : '',
          record.current !== undefined && record.current !== null ? (record.current * 1000).toFixed(1) : '',
          record.power !== undefined && record.power !== null ? (record.power * 1000).toFixed(3) : '',
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

  const totalRecords = viewMode === 'raw' && rawReadingsData ? rawReadingsData.total : displayRecords.length;
  const totalPages = viewMode === 'raw' && rawReadingsData ? rawReadingsData.totalPages : 1;

  return (
    <EcoCard>
      <div
        className="eco-card-header pb-4 mb-4 border-b"
        style={{
          borderColor: 'var(--line)',
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
                style={{ color: 'var(--t)' }}
              >
                Historical Records
              </h3>
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--mu)' }}
              >
                {totalRecords} {viewMode === 'raw' ? 'raw readings' : 'data points'}
                {!includeInactive && ' • Active only'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Zero-Activity Filter Toggle (Admin troubleshooting access) */}
            <button
              type="button"
              onClick={() => {
                setIncludeInactive((prev) => !prev);
                setCurrentPage(1);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border"
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
              title={includeInactive ? 'Showing all records including inactive zeros' : 'Hiding completely zero-valued records'}
              aria-pressed={includeInactive}
            >
              <span>{includeInactive ? 'All Records (Inc. 0s)' : 'Active Records Only'}</span>
            </button>

            {/* View Mode Toggle - EcoStep Design System Segmented Control */}
            <div className="sgc sgc-sm grid grid-cols-2 sm:inline-flex flex-shrink-0" role="tablist">
              <button
                type="button"
                onClick={() => {
                  setViewMode('aggregated');
                  setCurrentPage(1);
                }}
                className={`flex items-center justify-center gap-1.5 ${viewMode === 'aggregated' ? 'on' : ''}`}
                aria-pressed={viewMode === 'aggregated'}
                aria-label="Switch to aggregated view"
              >
                <BarChart3 className="inline-block h-3.5 w-3.5" strokeWidth={2} />
                <span>Aggregated</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('raw');
                  setCurrentPage(1);
                }}
                className={`flex items-center justify-center gap-1.5 ${viewMode === 'raw' ? 'on' : ''}`}
                aria-pressed={viewMode === 'raw'}
                aria-label="Switch to raw data view"
              >
                <TableIcon className="inline-block h-3.5 w-3.5" strokeWidth={2} />
                <span>Raw Data</span>
              </button>
            </div>

            {/* Export Button (Disabled for public users) */}
            <button
              type="button"
              onClick={isPublic ? undefined : handleExport}
              disabled={isPublic}
              title={isPublic ? 'Exporting CSV is unavailable to public users' : 'Export CSV'}
              aria-disabled={isPublic}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs rounded-full font-medium transition-all w-full sm:w-auto ${
                isPublic
                  ? 'opacity-40 cursor-not-allowed bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 border border-neutral-300 dark:border-neutral-700 pointer-events-auto'
                  : 'cursor-pointer hover:opacity-90'
              }`}
              style={{
                backgroundColor: isPublic
                  ? undefined
                  : 'var(--panel)',
                borderColor: isPublic
                  ? undefined
                  : 'var(--line)',
                color: isPublic
                  ? undefined
                  : 'var(--t)',
                border: isPublic ? undefined : '1px solid var(--line)',
              }}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Export CSV</span>
            </button>
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
                  backgroundColor: 'var(--panel)',
                  borderColor: 'var(--line)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                {/* Card Header: Timestamp & Energy Badge */}
                <div
                  className="flex items-center justify-between pb-3 mb-3 border-b"
                  style={{
                    borderColor: 'var(--line)',
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
        </>
      )}
    </EcoCard>
  );
}
