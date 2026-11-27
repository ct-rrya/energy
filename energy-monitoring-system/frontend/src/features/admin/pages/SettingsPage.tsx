import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { healthService } from '@/api/services';
import { alertsService } from '@/api/services/alerts.service';
import type { HealthMonitorStatus } from '@/types/alert.types';
import { showToast } from '@/components/common/Toast';
import { Bluetooth, Award, ArrowRight, BellRing, RefreshCw } from 'lucide-react';
import { EcoStepBleButton } from '@/features/ble';
import { MaintenanceControlPanel } from '../components/MaintenanceControlPanel';
import { ROUTES } from '@/routes/routes.config';

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
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [monitorStatus, setMonitorStatus] = useState<HealthMonitorStatus | null>(null);
  const [isRunningCheck, setIsRunningCheck] = useState(false);

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

  const hardwareStatus = useHardwareStatus();

  // Load health status & automated alert monitor status
  useEffect(() => {
    loadHealthStatus();
    loadMonitorStatus();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadMonitorStatus = async () => {
    try {
      const status = await alertsService.getMonitorStatus();
      setMonitorStatus(status);
    } catch {
      // Non-fatal if endpoint unavailable
    }
  };

  const handleRunHealthCheck = async () => {
    setIsRunningCheck(true);
    try {
      const summary = await alertsService.runHealthCheck();
      await loadMonitorStatus();
      if (summary.skippedReason) {
        showToast(summary.skippedReason, 'info');
      } else if (summary.triggered.length > 0) {
        showToast(
          `${summary.triggered.length} health ${summary.triggered.length === 1 ? 'alert' : 'alerts'} created`,
          'error',
        );
      } else if (summary.suppressedByCooldown.length > 0) {
        showToast('Issue already alerted within the last 12h cooldown window.', 'info');
      } else {
        showToast('Tile health check passed — no anomalies detected.', 'success');
      }
    } catch {
      showToast('Could not run health check right now.', 'error');
    } finally {
      setIsRunningCheck(false);
    }
  };

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
        subtitle="Maintenance controls, tile Wi-Fi setup, energy goals, and system status"
        systemStatus={hardwareStatus.status}
      />

      {/* Open Editorial Layout — hairline-divided sections, zero nested boxes */}
      <div className="divide-y divide-[var(--line)]">
        {/* 0. Maintenance Mode & Hardware Pause */}
        <MaintenanceControlPanel />

        {/* 1. Automated Tile Health Alerts */}
        <section className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--acc)] mb-1">
              <BellRing className="h-3.5 w-3.5" />
              <span>Automated Health Alerts</span>
              {monitorStatus && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold normal-case tracking-normal ${monitorStatus.pausedByMaintenance
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-emerald-500/15 text-[#19D46A]'
                    }`}
                >
                  {monitorStatus.pausedByMaintenance ? 'Paused (Maintenance)' : 'Active · Every 30m'}
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-[var(--t)] m-0">
              Tile Offline, Output Drop &amp; Wear Monitoring
            </h2>
            <p className="text-xs sm:text-sm text-[var(--mu)] mt-1 mb-0 max-w-xl">
              Alerts all active admin emails ({monitorStatus?.activeAdminEmailCount ?? '—'}) and in-app if the tile is silent &gt;24h on weekdays, output drops &gt;40%, or health falls below 70/100 (12h cooldown).
              {monitorStatus && !monitorStatus.emailConfigured && (
                <span className="text-amber-400"> In-app active; configure Resend in .env to enable email delivery.</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            <button
              type="button"
              onClick={handleRunHealthCheck}
              disabled={isRunningCheck}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:border-[var(--acc)] hover:text-[var(--acc)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningCheck ? 'animate-spin' : ''}`} />
              <span>{isRunningCheck ? 'Checking...' : 'Run Check Now'}</span>
            </button>
            <Link
              to={ROUTES.ALERTS}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#19D46A', color: '#0D1B14', textDecoration: 'none' }}
            >
              <span>Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* 2. Floor Tile Wi-Fi Setup */}
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
