import { useState, useMemo, lazy, Suspense, useTransition } from 'react';
import { BarChart3, Table } from 'lucide-react';
import { subDays, subHours, startOfDay, endOfDay, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { getUserRole } from '@/lib/permissions';
import { HistoricalDataView } from '../components/HistoricalDataView';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { ChartCardSkeleton } from '@/components/dashboard/ChartCardSkeleton';
import {
  HourRangeSelector,
  formatHourRangeLabel,
  type HourRange,
} from '@/components/common/HourRangeSelector';
import type { Granularity } from '../types';

// Lazy-loaded chart components to avoid blocking initial paint and hydration
const PowerGenerationChart = lazy(() => import('@/components/dashboard/PowerGenerationChart').then(m => ({ default: m.PowerGenerationChart })));
const EnergyPeriodChart = lazy(() => import('@/components/dashboard/EnergyPeriodChart').then(m => ({ default: m.EnergyPeriodChart })));
const CumulativeEnergyChart = lazy(() => import('@/components/dashboard/CumulativeEnergyChart').then(m => ({ default: m.CumulativeEnergyChart })));
const StepsChart = lazy(() => import('@/components/dashboard/StepsChart').then(m => ({ default: m.StepsChart })));
const VoltageCurrentChart = lazy(() => import('@/components/dashboard/VoltageCurrentChart').then(m => ({ default: m.VoltageCurrentChart })));

/**
 * View Type
 */
type ViewType = 'charts' | 'historical';

/**
 * Period Type for date filtering
 */
type Period = 'hourly' | 'today' | 'last7days' | 'last30days' | 'last90days' | 'all';

type TrackingInterval = 'hour' | 'day';

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: 'all', label: 'All Time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: '3 Months' },
];

const INTERVAL_OPTIONS: Array<{ value: TrackingInterval; label: string }> = [
  { value: 'hour', label: 'By Hour' },
  { value: 'day', label: 'By Day' },
];

/**
 * Analytics Page Component
 * 
 * Comprehensive analytics dashboard with:
 * - Chart View: Real-time and historical analytics with all desktop charts
 * - Historical View: Tabular & mobile card data display with MongoDB raw data
 * - Fully responsive across mobile, tablet, and desktop viewports (using the exact same charts)
 * - Date range filtering including Hourly (24h) and All Time, plus By Hour / By Day grouping
 */
export function AnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('charts');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');
  const [trackingInterval, setTrackingInterval] = useState<TrackingInterval>('day');
  const [hourRange, setHourRange] = useState<HourRange | null>(null);
  const [, startTransition] = useTransition();

  const handleViewChange = (view: ViewType) => {
    startTransition(() => {
      setActiveView(view);
    });
  };

  const handlePeriodChange = (period: Period) => {
    startTransition(() => {
      setSelectedPeriod(period);
      setTrackingInterval(period === 'hourly' || period === 'today' ? 'hour' : 'day');
    });
  };

  const handleIntervalChange = (interval: TrackingInterval) => {
    startTransition(() => {
      setTrackingInterval(interval);
    });
  };

  // Determine user role
  const userRole = getUserRole(isAuthenticated, user);
  const isPublicUser = userRole === 'public';

  // Calculate date range for Historical View (ISO for hourly, YYYY-MM-DD in local time for day ranges, undefined for All Time)
  const dateRange = useMemo(() => {
    if (selectedPeriod === 'all') {
      return {
        startDate: undefined,
        endDate: undefined,
      };
    }

    const now = new Date();
    if (selectedPeriod === 'hourly') {
      return {
        startDate: subHours(now, 24).toISOString(),
        endDate: now.toISOString(),
      };
    }

    let start = startOfDay(now);

    switch (selectedPeriod) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'last7days':
        start = subDays(startOfDay(now), 7);
        break;
      case 'last30days':
        start = subDays(startOfDay(now), 30);
        break;
      case 'last90days':
        start = subDays(startOfDay(now), 90);
        break;
    }

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    };
  }, [selectedPeriod]);

  // Calculate ISO date range for Chart View (passes explicit epoch start for 'all' so backend doesn't default to 24h)
  const chartDateRange = useMemo(() => {
    const now = new Date();
    const endIso = endOfDay(now).toISOString();

    switch (selectedPeriod) {
      case 'hourly':
        return {
          startDate: subHours(now, 24).toISOString(),
          endDate: endIso,
        };
      case 'today':
        return {
          startDate: startOfDay(now).toISOString(),
          endDate: endIso,
        };
      case 'last7days':
        return {
          startDate: subDays(startOfDay(now), 7).toISOString(),
          endDate: endIso,
        };
      case 'last30days':
        return {
          startDate: subDays(startOfDay(now), 30).toISOString(),
          endDate: endIso,
        };
      case 'last90days':
        return {
          startDate: subDays(startOfDay(now), 90).toISOString(),
          endDate: endIso,
        };
      case 'all':
      default:
        return {
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: endIso,
        };
    }
  }, [selectedPeriod]);

  // Granularity for Historical View respects user's By Hour / By Day choice
  const granularity: Granularity = useMemo(() => {
    if (trackingInterval === 'hour') {
      return 'hour';
    }
    if (selectedPeriod === 'last90days') {
      return 'week';
    }
    return 'day';
  }, [selectedPeriod, trackingInterval]);

  // Granularity for Chart View respects user's By Hour / By Day choice
  const chartGranularity: Granularity = trackingInterval;

  const periodLabel = useMemo(() => {
    const base =
      selectedPeriod === 'hourly'
        ? 'Last 24 Hours'
        : PERIOD_OPTIONS.find((opt) => opt.value === selectedPeriod)?.label ?? 'All Time';
    const hourSuffix =
      hourRange && !(hourRange.startHour === 0 && hourRange.endHour === 23)
        ? ` • ${formatHourRangeLabel(hourRange)}`
        : '';
    return `${base} • ${trackingInterval === 'hour' ? 'Hourly' : 'Daily'}${hourSuffix}`;
  }, [selectedPeriod, trackingInterval, hourRange]);

  const { status: hardwareConnectionStatus } = useHardwareStatus();

  return (
    <div className="page">
      {/* Page Header with standardized hardware status */}
      <DashboardHeader
        greeting="System Insights"
        title="Analytics"
        subtitle="Energy trends and historical data."
        systemStatus={hardwareConnectionStatus}
        isPublicUser={isPublicUser}
      />

      {/* Record-Folder Tabs + Compact Dropdown Controls */}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
        {/* Record-Folder Tabs (reused from ECommunity) */}
        <div
          className="flex flex-wrap items-end gap-1 max-w-full"
          role="tablist"
          aria-label="Analytics view tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'charts'}
            onClick={() => handleViewChange('charts')}
            className={`relative inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'charts'
                ? 'bg-[var(--card-bg)] text-[var(--t)] border-[var(--line)] -mb-px z-10 pb-2.5'
                : 'bg-transparent text-[var(--mu)] border-transparent hover:text-[var(--t)] hover:bg-[var(--card-bg)]/50'
            }`}
          >
            {activeView === 'charts' && (
              <span
                className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full bg-[var(--acc)]"
                aria-hidden="true"
              />
            )}
            <BarChart3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span>Chart View</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'historical'}
            onClick={() => handleViewChange('historical')}
            className={`relative inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'historical'
                ? 'bg-[var(--card-bg)] text-[var(--t)] border-[var(--line)] -mb-px z-10 pb-2.5'
                : 'bg-transparent text-[var(--mu)] border-transparent hover:text-[var(--t)] hover:bg-[var(--card-bg)]/50'
            }`}
          >
            {activeView === 'historical' && (
              <span
                className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full bg-[var(--acc)]"
                aria-hidden="true"
              />
            )}
            <Table className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span>Historical View</span>
          </button>
        </div>

        {/* Compact Dropdown Filters (replaces pill bars) */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <select
            aria-label="Select time period"
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value as Period)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Select grouping interval"
            value={trackingInterval}
            onChange={(e) => handleIntervalChange(e.target.value as TrackingInterval)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
          >
            {INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <HourRangeSelector
            value={hourRange}
            onChange={setHourRange}
            label="Hours"
          />
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'charts' ? (
        /* Chart View — Standalone clean chart cards with gap (no outer sheet box) */
        <div className="pt-3 flex flex-col" style={{ gap: 'var(--page-gap)' }}>
          {/* 1. Power Generation | Steps - Equal 2-Column Row */}
          <div className="analytics-charts-grid">
            <div className="min-w-0 h-full flex flex-col">
              <Suspense fallback={<ChartCardSkeleton title="Power Generation" height={280} />}>
                <PowerGenerationChart
                  defaultTimeFilter="7days"
                  startDate={chartDateRange.startDate}
                  endDate={chartDateRange.endDate}
                  granularity={chartGranularity}
                  periodLabel={periodLabel}
                  startHour={hourRange?.startHour}
                  endHour={hourRange?.endHour}
                />
              </Suspense>
            </div>
            <div className="min-w-0 h-full flex flex-col">
              <Suspense fallback={<ChartCardSkeleton title="Steps Count" height={280} />}>
                <StepsChart
                  startDate={chartDateRange.startDate}
                  endDate={chartDateRange.endDate}
                  granularity={chartGranularity}
                  periodLabel={periodLabel}
                  startHour={hourRange?.startHour}
                  endHour={hourRange?.endHour}
                />
              </Suspense>
            </div>
          </div>

          {/* 2. Voltage Trend | Current Trend - Full-Width Row */}
          <div className="w-full min-w-0">
            <Suspense fallback={<ChartCardSkeleton title="Voltage & Current Trend" height={280} />}>
              <VoltageCurrentChart
                startDate={chartDateRange.startDate}
                endDate={chartDateRange.endDate}
                granularity={chartGranularity}
                periodLabel={periodLabel}
                startHour={hourRange?.startHour}
                endHour={hourRange?.endHour}
              />
            </Suspense>
          </div>

          {/* 3. Energy Generated by Period | Cumulative Energy Generated - Equal 2-Column Row */}
          <div className="analytics-charts-grid">
            <div className="min-w-0 h-full flex flex-col">
              <Suspense fallback={<ChartCardSkeleton title="Energy Generation by Period" height={280} />}>
                <EnergyPeriodChart
                  startDate={chartDateRange.startDate}
                  endDate={chartDateRange.endDate}
                  granularity={chartGranularity}
                  periodLabel={periodLabel}
                  startHour={hourRange?.startHour}
                  endHour={hourRange?.endHour}
                />
              </Suspense>
            </div>
            <div className="min-w-0 h-full flex flex-col">
              <Suspense fallback={<ChartCardSkeleton title="Cumulative Energy Generated" height={280} />}>
                <CumulativeEnergyChart
                  startDate={chartDateRange.startDate}
                  endDate={chartDateRange.endDate}
                  granularity={chartGranularity}
                  periodLabel={periodLabel}
                  startHour={hourRange?.startHour}
                  endHour={hourRange?.endHour}
                />
              </Suspense>
            </div>
          </div>
        </div>
      ) : (
        /* Historical View — Connected Folder Sheet with table directly on container */
        <section className="rounded-b-2xl rounded-tr-2xl border border-[var(--line)] bg-[var(--card-bg)] overflow-hidden">
          <HistoricalDataView
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            granularity={granularity}
            startHour={hourRange?.startHour}
            endHour={hourRange?.endHour}
            isPublicUser={isPublicUser}
            onResetToAllTime={() => handlePeriodChange('all')}
          />
        </section>
      )}
    </div>
  );
}
