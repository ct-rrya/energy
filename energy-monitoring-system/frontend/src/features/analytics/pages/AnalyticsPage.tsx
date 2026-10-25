import { useState, useMemo } from 'react';
import { BarChart3, Table } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { HistoricalDataView } from '../components/HistoricalDataView';
import { PowerGenerationChart } from '@/components/dashboard/PowerGenerationChart';
import { EnergyPeriodChart } from '@/components/dashboard/EnergyPeriodChart';
import { CumulativeEnergyChart } from '@/components/dashboard/CumulativeEnergyChart';
import { StepsChart } from '@/components/dashboard/StepsChart';
import { VoltageCurrentChart } from '@/components/dashboard/VoltageCurrentChart';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useSystemHealth } from '@/features/dashboard/hooks/useSystemHealth';
import { useLiveSensorData } from '@/features/dashboard/hooks/useLiveSensorData';
import type { Granularity } from '../types';

/**
 * View Type
 */
type ViewType = 'charts' | 'historical';

/**
 * Period Type for date filtering
 */
type Period = 'today' | 'last7days' | 'last30days' | 'last90days' | 'all';

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

  // Determine user role
  const userRole = getUserRole(isAuthenticated, user);
  const isPublicUser = userRole === 'public';

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    if (selectedPeriod === 'all') {
      return {
        startDate: undefined,
        endDate: undefined,
      };
    }

    const end = new Date();
    const start = new Date();

    switch (selectedPeriod) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        start.setDate(end.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(end.getDate() - 30);
        break;
      case 'last90days':
        start.setDate(end.getDate() - 90);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [selectedPeriod]);

  // Map period to granularity for optimal data display
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
      <div className="analytics-toolbar mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* View Toggle - Segmented Control */}
          <div className="sgc grid grid-cols-2 sm:inline-flex flex-shrink-0" role="tablist">
            <button
              type="button"
              onClick={() => setActiveView('charts')}
              className={activeView === 'charts' ? 'on' : ''}
              aria-pressed={activeView === 'charts'}
              aria-label="Switch to chart view"
            >
              <BarChart3 className="inline-block mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
              <span>Chart View</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('historical')}
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
              {[
                { value: 'all' as Period, label: 'All Time' },
                { value: 'today' as Period, label: 'Today' },
                { value: 'last7days' as Period, label: 'Last 7 Days' },
                { value: 'last30days' as Period, label: 'Last 30 Days' },
                { value: 'last90days' as Period, label: '3 Months' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedPeriod(option.value)}
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
        <div className="space-y-3.5 sm:space-y-6">
          {/* 1. Power Generation (wider) | Steps (narrower) - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 lg:gap-6">
            <div className="lg:col-span-2 min-w-0">
              <PowerGenerationChart defaultTimeFilter="7days" />
            </div>
            <div className="lg:col-span-1 min-w-0">
              <StepsChart />
            </div>
          </div>

          {/* 2. Voltage Trend | Current Trend - 2 Column Row */}
          <div className="w-full min-w-0">
            <VoltageCurrentChart />
          </div>

          {/* 3. Energy Generated by Period | Cumulative Energy Generated - 2 Column Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 lg:gap-6">
            <div className="min-w-0">
              <EnergyPeriodChart />
            </div>
            <div className="min-w-0">
              <CumulativeEnergyChart />
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
