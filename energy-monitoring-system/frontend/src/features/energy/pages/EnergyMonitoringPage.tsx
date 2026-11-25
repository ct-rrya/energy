import { useState, useMemo } from 'react';
import { subDays, subHours, startOfDay, endOfDay } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { useLiveSensorData } from '@/features/dashboard/hooks/useLiveSensorData';
import { PublicUserBanner } from '@/components/common/PublicUserBanner';
import { Activity, Zap } from 'lucide-react';
import { HistoricalAnalyticsGrid } from '../components/HistoricalAnalyticsGrid';
import type { Granularity } from '@/features/analytics/types';

/**
 * Energy Monitoring Page
 * 
 * Detailed measurements and real-time monitoring for all energy metrics.
 * 
 * Features:
 * - Current measurements display (energy, voltage, capacitor, power, steps)
 * - Time-series monitoring charts for all metrics
 * - Time-range controls (Today, Last 7 Days, Last 30 Days, Custom)
 * - Real-time data updates
 * - Proper empty states when no data available
 * - Role-based access (Public users can view, but limited functionality)
 * 
 * Requirements: Prompt Section 7
 */
export function EnergyMonitoringPage() {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  
  // Determine user role
  const userRole = getUserRole(isAuthenticated, user);
  const isPublicUser = userRole === 'public';

  // Get live sensor data
  const { lastReading } = useLiveSensorData();

  // Time range state
  const [timeRange, setTimeRange] = useState<'hourly' | 'today' | 'last7days' | 'last30days'>('hourly');

  const chartRange = useMemo(() => {
    const now = new Date();
    const endIso = endOfDay(now).toISOString();
    switch (timeRange) {
      case 'hourly':
        return {
          startDate: subHours(now, 24).toISOString(),
          endDate: endIso,
          granularity: 'hour' as Granularity,
          periodLabel: 'Last 24 Hours • Hourly',
        };
      case 'today':
        return {
          startDate: startOfDay(now).toISOString(),
          endDate: endIso,
          granularity: 'hour' as Granularity,
          periodLabel: 'Today • Hourly',
        };
      case 'last7days':
        return {
          startDate: subDays(startOfDay(now), 7).toISOString(),
          endDate: endIso,
          granularity: 'day' as Granularity,
          periodLabel: 'Last 7 Days',
        };
      case 'last30days':
        return {
          startDate: subDays(startOfDay(now), 30).toISOString(),
          endDate: endIso,
          granularity: 'day' as Granularity,
          periodLabel: 'Last 30 Days',
        };
    }
  }, [timeRange]);

  // Color system based on theme
  const colors = {
    cardBg: theme === 'light' ? '#FFFFFF' : '#1C1F26',
    text: theme === 'light' ? '#1A1D23' : '#EDEEF0',
    subtext: theme === 'light' ? '#6B7280' : '#9CA3AF',
    accent: theme === 'light' ? '#2FBF71' : '#3ED98A',
    border: theme === 'light' ? '#E5E7EB' : '#2A2E37',
    metricBg: theme === 'light' ? '#F9FAFB' : '#12141A',
  };

  return (
    <div className="page">
        
        {/* Public User Banner */}
        {isPublicUser && (
          <PublicUserBanner />
        )}
        
        {/* Page Header */}
        <div>
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Energy Monitoring
          </h1>
          <p 
            className="text-sm sm:text-base"
            style={{ color: colors.subtext }}
          >
            Detailed measurements and real-time monitoring
          </p>
        </div>

        {/* Current Measurements Section */}
        <div 
          className="rounded-3xl p-6 transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBg,
            boxShadow: theme === 'light' 
              ? '0 4px 20px rgba(0,0,0,0.05)' 
              : 'none'
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text }}
          >
            Current Measurements
          </h2>

          {lastReading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Generated Energy */}
              <div 
                className="p-4 rounded-2xl"
                style={{ backgroundColor: colors.metricBg }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" style={{ color: colors.accent }} />
                  <p 
                    className="text-xs font-medium"
                    style={{ color: colors.subtext }}
                  >
                    Generated Energy
                  </p>
                </div>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  {lastReading.energy?.toFixed(3) || '0.000'}
                  <span 
                    className="text-sm font-normal ml-1"
                    style={{ color: colors.subtext }}
                  >
                    kWh
                  </span>
                </p>
              </div>

              {/* Voltage */}
              <div 
                className="p-4 rounded-2xl"
                style={{ backgroundColor: colors.metricBg }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" style={{ color: colors.accent }} />
                  <p 
                    className="text-xs font-medium"
                    style={{ color: colors.subtext }}
                  >
                    Voltage
                  </p>
                </div>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  {lastReading.voltage?.toFixed(1) || '0.0'}
                  <span 
                    className="text-sm font-normal ml-1"
                    style={{ color: colors.subtext }}
                  >
                    V
                  </span>
                </p>
              </div>

              {/* Power */}
              <div 
                className="p-4 rounded-2xl"
                style={{ backgroundColor: colors.metricBg }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  <p 
                    className="text-xs font-medium"
                    style={{ color: colors.subtext }}
                  >
                    Power
                  </p>
                </div>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  {lastReading.power?.toFixed(1) || '0.0'}
                  <span 
                    className="text-sm font-normal ml-1"
                    style={{ color: colors.subtext }}
                  >
                    W
                  </span>
                </p>
              </div>

              {/* Capacitor Voltage */}
              <div 
                className="p-4 rounded-2xl"
                style={{ backgroundColor: colors.metricBg }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  <p 
                    className="text-xs font-medium"
                    style={{ color: colors.subtext }}
                  >
                    Capacitor
                  </p>
                </div>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  {lastReading.capacitorVoltage !== undefined 
                    ? lastReading.capacitorVoltage.toFixed(1) 
                    : '—'}
                  <span 
                    className="text-sm font-normal ml-1"
                    style={{ color: colors.subtext }}
                  >
                    V
                  </span>
                </p>
              </div>

              {/* Step Count */}
              <div 
                className="p-4 rounded-2xl"
                style={{ backgroundColor: colors.metricBg }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" style={{ color: colors.accent }} />
                  <p 
                    className="text-xs font-medium"
                    style={{ color: colors.subtext }}
                  >
                    Steps
                  </p>
                </div>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  {lastReading.stepCount !== undefined 
                    ? lastReading.stepCount 
                    : '—'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity 
                className="w-12 h-12 mb-4"
                style={{ color: colors.subtext, opacity: 0.5 }}
              />
              <p 
                className="text-sm font-medium"
                style={{ color: colors.text }}
              >
                No real-time data available
              </p>
              <p 
                className="text-xs mt-1"
                style={{ color: colors.subtext }}
              >
                Waiting for data from EcoStep device
              </p>
            </div>
          )}
        </div>

        {/* Time Range Controls */}
        <div 
          className="rounded-3xl p-4 transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBg,
            boxShadow: theme === 'light' 
              ? '0 4px 20px rgba(0,0,0,0.05)' 
              : 'none'
          }}
        >
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'hourly', label: 'Hourly' },
                { value: 'today', label: 'Today' },
                { value: 'last7days', label: 'Last 7 Days' },
                { value: 'last30days', label: 'Last 30 Days' },
              ] as const
            ).map((range) => (
              <button
                key={range.value}
                type="button"
                onClick={() => setTimeRange(range.value)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
                style={{
                  backgroundColor: timeRange === range.value 
                    ? colors.accent
                    : 'transparent',
                  color: timeRange === range.value 
                    ? '#FFFFFF'
                    : colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Historical Analytics - Clean 2×2 Grid */}
        <div className="space-y-6">
          <h2 
            className="text-xl font-semibold"
            style={{ color: colors.text }}
          >
            Historical Analytics
          </h2>

          {/* 2×2 Grid Layout: Voltage Trend, Current Trend, Energy Period, Cumulative Energy */}
          <HistoricalAnalyticsGrid
            startDate={chartRange.startDate}
            endDate={chartRange.endDate}
            granularity={chartRange.granularity}
            periodLabel={chartRange.periodLabel}
          />
        </div>
      </div>
  );
}
