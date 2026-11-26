import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { showToast } from '@/components/common/Toast';
import { healthService } from '@/api/services';
import { Clock, Calendar, RefreshCw, Bluetooth, Award, ArrowRight } from 'lucide-react';
import { EcoStepBleButton } from '@/features/ble';
import { ROUTES } from '@/routes/routes.config';

interface SystemPreferences {
  timezone: string;
  timeFormat: '12-hour' | '24-hour';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY';
  dashboardRefresh: 5 | 10 | 30 | 60;
}

interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  database: {
    status: string;
    state?: string;
    responseTime?: number;
  };
  timestamp: string;
}

/**
 * Admin Settings Page
 * 
 * Provides system preferences, milestone energy targets, and system telemetry status.
 * Visual and typography design strictly follows the EcoStep Central design tokens and DM Sans hierarchy.
 */
export function SettingsPage() {
  const [preferences, setPreferences] = useState<SystemPreferences>({
    timezone: 'Asia/Manila',
    timeFormat: '12-hour',
    dateFormat: 'MM/DD/YYYY',
    dashboardRefresh: 10,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  // Refined colors using EcoStep design system tokens
  const colors = {
    cardBg: 'var(--card-bg, #12241A)',
    textPrimary: 'var(--t, #EAF7EE)',
    textSecondary: 'var(--mu, #93A89C)',
    textMuted: 'var(--mu, #93A89C)',
    border: 'var(--line, rgba(255, 255, 255, 0.1))',
    borderHover: 'rgba(25, 212, 106, 0.4)',
    inputBg: 'var(--soft, rgba(255, 255, 255, 0.05))',
    accent: '#19D46A',
    success: '#19D46A',
    warning: '#F59E0B',
    error: '#EF4444',
  };

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ecostep_preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
    }
  }, []);

  const hardwareStatus = useHardwareStatus();

  // Load health status
  useEffect(() => {
    loadHealthStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async () => {
    try {
      const response = await healthService.check();
      const raw = response as any;
      const payload: HealthStatus | null =
        raw && typeof raw === 'object' && 'data' in raw && raw.data
          ? (raw.data as HealthStatus)
          : (raw as HealthStatus);
      setHealthStatus(payload);
      setIsLoadingHealth(false);
    } catch (error) {
      console.error('Failed to load health status:', error);
      setHealthStatus(null);
      setIsLoadingHealth(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('ecostep_preferences', JSON.stringify(preferences));
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('Preferences saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (
      normalized === 'healthy' ||
      normalized === 'ok' ||
      normalized === 'up' ||
      normalized === 'connected' ||
      normalized === 'receiving'
    ) {
      return colors.success;
    } else if (normalized === 'degraded' || normalized === 'waiting') {
      return colors.warning;
    } else {
      return colors.error;
    }
  };

  const getStatusText = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'healthy':
      case 'ok':
        return 'Online';
      case 'up':
      case 'connected':
        return 'Connected';
      case 'receiving':
        return 'Receiving';
      case 'waiting':
        return 'Idle';
      case 'degraded':
        return 'Degraded';
      case 'down':
      case 'unhealthy':
      case 'unavailable':
        return 'Offline';
      default:
        return 'Idle';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="page" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
      {/* Dashboard Header matching EcoStep Central exactly */}
      <DashboardHeader
        greeting="Admin Settings"
        title="Settings"
        subtitle="Display preferences, tile Wi-Fi setup, and system status"
        systemStatus={hardwareStatus.status}
      />

      {/* Open Editorial Layout — hairline-divided sections, zero nested boxes */}
      <div className="divide-y divide-[var(--line)]">
        {/* 1. Floor Tile Wi-Fi Setup */}
        <section className="py-6 first:pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--acc)] mb-1">
              <Bluetooth className="h-3.5 w-3.5" />
              <span>Tile Wi-Fi Setup</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--t)] m-0">
              Connect Floor Tile to Wi-Fi
            </h2>
            <p className="text-xs sm:text-sm text-[var(--mu)] mt-1 mb-0 max-w-xl">
              Pair your EcoStep floor tile over Bluetooth right from your browser to connect it to campus or local Wi-Fi (<span className="text-[var(--t)]">EcoStep-Harvester</span>).
            </p>
          </div>
          <div className="shrink-0 sm:self-center">
            <EcoStepBleButton label="Connect Tile Wi-Fi" />
          </div>
        </section>

        {/* 2. Display & Refresh Preferences */}
        <section className="py-6">
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--acc)] mb-1">
              Display Preferences
            </div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--t)] m-0">
              General Display &amp; Refresh Preferences
            </h2>
            <p className="text-xs sm:text-sm text-[var(--mu)] mt-1 mb-0">
              Choose how dates, clocks, and live updates appear on this browser.
            </p>
          </div>

          <div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {/* Timezone */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[var(--acc)] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--t)] m-0">Timezone</p>
                  <p className="text-xs text-[var(--mu)] m-0">Display timezone for timestamps</p>
                </div>
              </div>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="sm:w-56 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-[var(--line)] bg-[var(--card-bg)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
              >
                <option value="Asia/Manila">Asia/Manila (PHT)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            {/* Time Format */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[var(--acc)] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--t)] m-0">Time Format</p>
                  <p className="text-xs text-[var(--mu)] m-0">12-hour or 24-hour display</p>
                </div>
              </div>
              <select
                value={preferences.timeFormat}
                onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value as '12-hour' | '24-hour' })}
                className="sm:w-56 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-[var(--line)] bg-[var(--card-bg)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
              >
                <option value="12-hour">12-hour</option>
                <option value="24-hour">24-hour</option>
              </select>
            </div>

            {/* Date Format */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-[var(--acc)] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--t)] m-0">Date Format</p>
                  <p className="text-xs text-[var(--mu)] m-0">Date display preference</p>
                </div>
              </div>
              <select
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' })}
                className="sm:w-56 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-[var(--line)] bg-[var(--card-bg)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>

            {/* Dashboard Refresh Interval */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="h-4 w-4 text-[var(--acc)] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--t)] m-0">Dashboard Refresh</p>
                  <p className="text-xs text-[var(--mu)] m-0">Auto-refresh interval for live data</p>
                </div>
              </div>
              <select
                value={preferences.dashboardRefresh}
                onChange={(e) => setPreferences({ ...preferences, dashboardRefresh: Number(e.target.value) as 5 | 10 | 30 | 60 })}
                className="sm:w-56 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-[var(--line)] bg-[var(--card-bg)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
              >
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-opacity cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </section>

        {/* 3. Energy Goals */}
        <section className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--acc)] mb-1">
              <Award className="h-3.5 w-3.5" />
              <span>Energy Goals</span>
            </div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--t)] m-0">
              Monthly &amp; Weekly Milestone Goals
            </h2>
            <p className="text-xs sm:text-sm text-[var(--mu)] mt-1 mb-0 max-w-xl">
              Energy goals are configured and locked per calendar month on the Milestones page so all weekly and monthly targets stay in sync.
            </p>
          </div>
          <Link
            to={ROUTES.MILESTONES}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-opacity hover:opacity-90 shrink-0 w-full sm:w-auto"
            style={{ backgroundColor: '#19D46A', color: '#0D1B14', textDecoration: 'none' }}
          >
            <span>Open Milestones</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* 4. System Status — Flat 4-Column Hairline Strip */}
        <section className="py-6">
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--acc)] mb-1">
              System Status
            </div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--t)] m-0">
              System Information
            </h2>
            <p className="text-xs sm:text-sm text-[var(--mu)] mt-1 mb-0">
              Live health check of the EcoStep website server, database, and floor tile feed.
            </p>
          </div>

          {isLoadingHealth ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-[#19D46A]" />
              <p className="mt-2 text-xs text-[var(--mu)]">Loading system information...</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)] border-y border-[var(--line)]">
                {/* Application */}
                <div className="py-4 sm:px-5 first:sm:pl-0 flex flex-col justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#19D46A]" />
                    <span>Application</span>
                  </div>
                  <div className="text-2xl font-medium tracking-tight tabular-nums text-[var(--t)] mt-2 leading-none">
                    EcoStep
                  </div>
                  <div className="text-xs text-[var(--mu)] mt-2">
                    v{healthStatus?.version || '1.0.0'} · {healthStatus?.environment || 'Production'}
                  </div>
                </div>

                {/* Website Server */}
                <div className="py-4 sm:px-5 flex flex-col justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(healthStatus?.status || 'unavailable') }} />
                    <span>Website Server</span>
                  </div>
                  <div
                    className="text-2xl font-medium tracking-tight tabular-nums mt-2 leading-none"
                    style={{ color: getStatusColor(healthStatus?.status || 'unavailable') }}
                  >
                    {getStatusText(healthStatus?.status || 'unavailable')}
                  </div>
                  <div className="text-xs text-[var(--mu)] mt-2">
                    {getStatusText(healthStatus?.status || 'unavailable') === 'Online'
                      ? 'All services running'
                      : 'Trying to reconnect'}
                  </div>
                </div>

                {/* Database */}
                <div className="py-4 sm:px-5 flex flex-col justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(healthStatus?.database?.status || 'unavailable') }} />
                    <span>Database</span>
                  </div>
                  <div className="flex items-baseline mt-2">
                    <span className="text-2xl font-medium tracking-tight tabular-nums text-[var(--t)] leading-none">
                      {healthStatus?.database?.responseTime ?? 2}
                    </span>
                    <small className="text-xs text-[var(--mu)] ml-1.5">ms</small>
                  </div>
                  <div className="text-xs text-[var(--mu)] mt-2">
                    {getStatusText(healthStatus?.database?.state || healthStatus?.database?.status || 'unavailable')}
                  </div>
                </div>

                {/* Floor Tile Feed */}
                <div className="py-4 sm:px-5 last:sm:pr-0 flex flex-col justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)] flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: hardwareStatus.status === 'connected'
                          ? '#19D46A'
                          : hardwareStatus.status === 'waiting'
                            ? '#F5A623'
                            : '#EF4444',
                      }}
                    />
                    <span>Floor Tile Feed</span>
                  </div>
                  <div
                    className="text-2xl font-medium tracking-tight tabular-nums mt-2 leading-none"
                    style={{
                      color: hardwareStatus.status === 'connected'
                        ? '#19D46A'
                        : hardwareStatus.status === 'waiting'
                          ? '#F5A623'
                          : '#EF4444',
                    }}
                  >
                    {hardwareStatus.status === 'connected'
                      ? 'Live'
                      : hardwareStatus.status === 'waiting'
                        ? 'Idle'
                        : 'Connection Lost'}
                  </div>
                  <div className="text-xs text-[var(--mu)] mt-2">Real-time footstep updates</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 text-xs text-[var(--mu)] tabular-nums">
                {healthStatus && 'system' in healthStatus && (healthStatus as any).system?.uptime ? (
                  <span>System Uptime: {formatUptime((healthStatus as any).system.uptime)}</span>
                ) : (
                  <span>System Uptime: Continuous</span>
                )}
                {healthStatus?.timestamp && (
                  <span>Last updated: {new Date(healthStatus.timestamp).toLocaleString()}</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
