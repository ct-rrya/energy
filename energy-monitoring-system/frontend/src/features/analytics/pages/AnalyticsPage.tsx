import { useState, useMemo, lazy, Suspense, useTransition } from 'react';
import { BarChart3, Table } from 'lucide-react';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { HistoricalDataView } from '../components/HistoricalDataView';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useSystemHealth } from '@/features/dashboard/hooks/useSystemHealth';
import { useLiveSensorData } from '@/features/dashboard/hooks/useLiveSensorData';
import { ChartCardSkeleton } from '@/components/dashboard/ChartCardSkeleton';
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
type Period = 'today' | 'last7days' | 'last30days' | 'last90days' | 'all';

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: '3 Months' },
];

/**
 * Analytics Page Component
 * 
 * Comprehensive analytics dashboard with:
 * - Chart View: Real-time and historical analytics with all desktop charts
 * - Historical View: Tabular & mobile card data display with MongoDB raw data
 * - Fully responsive across mobile, tablet, and desktop viewports (using the exact same charts)
 * - Date range filtering including All Time
 */
export function AnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('charts');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');
  const [, startTransition] = useTransition();

  const handleViewChange = (view: ViewType) => {
    startTransition(() => {
      setActiveView(view);
    });
  };

  const handlePeriodChange = (period: Period) => {
    startTransition(() => {
      setSelectedPeriod(period);
    });
  };

  // Determine user role
  const userRole = getUserRole(isAuthenticated, user);
  const isPublicUser = userRole === 'public';

  // Calculate date range for Historical View (YYYY-MM-DD in local time, undefined for All Time)
  const dateRange = useMemo(() => {
    if (selectedPeriod === 'all') {
      return {
        startDate: undefined,
        endDate: undefined,
      };
    }

    const now = new Date();
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

  // Map period to granularity for Historical View
  const granularity: Granularity = useMemo(() => {
    switch (selectedPeriod) {
      case 'today':
        return 'hour';
      case 'last7days':
        return 'hour';
      case 'last30days':
        return 'day';
      case 'last90days':
        return 'week';
      case 'all':
      default:
        return 'day';
    }
  }, [selectedPeriod]);

  // Map period to chart aggregation granularity
  const chartGranularity: Granularity = useMemo(() => {
    switch (selectedPeriod) {
      case 'today':
        return 'hour';
      case 'last7days':
      case 'last30days':
      case 'last90days':
      case 'all':
      default:
        return 'day';
    }
  }, [selectedPeriod]);

  const periodLabel = useMemo(() => {
    return PERIOD_OPTIONS.find((opt) => opt.value === selectedPeriod)?.label ?? 'All Time';
  }, [selectedPeriod]);

  const { data: systemStatusData } = useSystemHealth();
  const { isConnected: isWebSocketConnected } = useLiveSensorData();

  const systemStatus = (() => {
    if (systemStatusData?.database === 'connected') return 'connected' as const;
    if (systemStatusData?.database === 'disconnected') return 'disconnected' as const;
    return 'unknown' as const;
  })();

  return (
    <div className="page">
      {/* Page Header */}
      <DashboardHeader
        greeting="System Insights"
        title="Analytics"
        subtitle="Energy trends and historical data."
        systemStatus={systemStatus}
        isPublicUser={isPublicUser}
        isWebSocketConnected={isWebSocketConnected}
      />

      {/* View Toggle and Period Filter */}
      <div className="analytics-toolbar mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* View Toggle - Segmented Control */}
        <div className="sgc grid grid-cols-2 sm:inline-flex flex-shrink-0" role="tablist">
          <button
            type="button"
            onClick={() => handleViewChange('charts')}
            className={activeView === 'charts' ? 'on' : ''}
            aria-pressed={activeView === 'charts'}
            aria-label="Switch to chart view"
          >
            <BarChart3 className="inline-block mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            <span>Chart View</span>
          </button>

          <button
            type="button"
            onClick={() => handleViewChange('historical')}
            className={activeView === 'historical' ? 'on' : ''}
            aria-pressed={activeView === 'historical'}
            aria-label="Switch to historical data view"
          >
            <Table className="inline-block mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            <span>Historical View</span>
          </button>
        </div>

        {/* Period Filter */}
        <div className="analytics-period-bar flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span
            style={{
              color: 'var(--mu)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
            className="shrink-0 mr-1 period-label"
          >
            Period:
          </span>
          <div className="sgc flex period-sgc">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePeriodChange(option.value)}
                className={`shrink-0 whitespace-nowrap ${selectedPeriod === option.value ? 'on' : ''}`}
                aria-pressed={selectedPeriod === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'charts' ? (
        /* Chart View - Optimized Responsive Layout */
        <div className="flex flex-col" style={{ gap: 'var(--page-gap)' }}>
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
                />
              </Suspense>
            </div>
          </div>

          {/* 2. Voltage Trend | Current Trend - Equal 2-Column Row */}
          <div className="w-full min-w-0">
            <Suspense fallback={<ChartCardSkeleton title="Voltage & Current Trend" height={280} />}>
              <VoltageCurrentChart
                startDate={chartDateRange.startDate}
                endDate={chartDateRange.endDate}
                granularity={selectedPeriod === 'today' || selectedPeriod === 'last7days' ? 'hour' : chartGranularity}
                periodLabel={periodLabel}
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
                />
              </Suspense>
            </div>
          </div>
        </div>
      ) : (
        /* Historical View - Tabular Data Display */
        <div className="space-y-4 sm:space-y-6">
          <HistoricalDataView
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            granularity={granularity}
            isPublicUser={isPublicUser}
          />
        </div>
      )}
    </div>
  );
}
