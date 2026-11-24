import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { EcoCard } from '@/components/common';
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
        return 'Standby';
      case 'degraded':
        return 'Degraded';
      case 'down':
      case 'unhealthy':
      case 'unavailable':
        return 'Offline';
      default:
        return 'Standby';
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
    <div className="page space-y-6" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
      {/* Dashboard Header matching EcoStep Central exactly */}
      <DashboardHeader
        greeting="Admin Settings"
        title="Settings"
        subtitle="Display preferences, tile Wi-Fi setup, and system status"
        systemStatus={hardwareStatus.status}
      />

      {/* Floor Tile Wi-Fi Setup */}
      <EcoCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div 
              className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0 mt-0.5 border border-emerald-500/25 bg-emerald-500/10 text-[#19D46A]"
            >
              <Bluetooth className="h-5 w-5" />
            </div>
            <div>
              <div className="lb flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
                <span>TILE WI-FI SETUP</span>
              </div>
              <h3 
                className="text-base font-semibold text-[var(--t)]"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              >
                Connect Floor Tile to Wi-Fi
              </h3>
              <p 
                className="text-xs sm:text-sm text-[var(--mu)] mt-0.5"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              >
                Pair your EcoStep floor tile over Bluetooth right from your browser to connect it to campus or local Wi-Fi.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--mu)] tabular-nums" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                <span className="inline-block w-2 h-2 rounded-full bg-[#19D46A]"></span>
                <span>Bluetooth Device: EcoStep-Harvester</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 sm:self-center">
            <EcoStepBleButton label="Connect Tile Wi-Fi" />
          </div>
        </div>
      </EcoCard>

      {/* System Preferences */}
      <EcoCard>
        <div className="mb-6">
          <div className="lb flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
            <span>DISPLAY PREFERENCES</span>
          </div>
          <h2 
            className="text-base sm:text-lg font-semibold tracking-tight text-[var(--t)]"
            style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
          >
            General Display &amp; Refresh Preferences
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mu)] mt-0.5" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
            Choose how dates, clocks, and live updates appear on your screen.
          </p>
          <p className="text-[11px] text-[var(--mu)] mt-1.5 italic" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
            Note: These preferences apply only to this browser on your device and do not change the view for other visitors.
          </p>
        </div>

        <div className="space-y-4">
          {/* Timezone */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl bg-[var(--soft)] border border-[var(--line)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[#19D46A]">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--t)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                  Timezone
                </p>
                <p className="text-xs text-[var(--mu)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                  Display timezone for timestamps
                </p>
              </div>
            </div>
            <div className="sm:w-60">
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#19D46A] cursor-pointer"
                style={{
                  backgroundColor: 'var(--panel)',
                  color: 'var(--t)',
                  border: '1px solid var(--line)',
                  fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
                }}
              >
                <option value="Asia/Manila">Asia/Manila (PHT)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          {/* Time Format */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl bg-[var(--soft)] border border-[var(--line)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[#19D46A]">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--t)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                  Time Format
                </p>
                <p className="text-xs text-[var(--mu)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                  12-hour or 24-hour display
                </p>
              </div>
            </div>
            <div className="sm:w-60">
              <select
                value={preferences.timeFormat}
                onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value as '12-hour' | '24-hour' })}
                className="w-full px-3.5 py-2 text-sm font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#19D46A] cursor-pointer"
                style={{
                  backgroundColor: 'var(--panel)',
                  color: 'var(--t)',
                  border: '1px solid var(--line)',
                  fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
                }}
              >
                <option value="12-hour">12-hour</option>
                <option value="24-hour">24-hour</option>
              </select>
            </div>
          </div>

          {/* Date Format */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl bg-[var(--soft)] border border-[var(--line)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[#19D46A]">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--t)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                  Date Format
                </p>
                <p className="text-xs text-[var(--mu)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                  Date display preference
                </p>
              </div>
            </div>
            <div className="sm:w-60">
              <select
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' })}
                className="w-full px-3.5 py-2 text-sm font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#19D46A] cursor-pointer"
                style={{
                  backgroundColor: 'var(--panel)',
                  color: 'var(--t)',
                  border: '1px solid var(--line)',
                  fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
                }}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>
          </div>

          {/* Dashboard Refresh Interval */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl bg-[var(--soft)] border border-[var(--line)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[#19D46A]">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--t)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                  Dashboard Refresh
                </p>
                <p className="text-xs text-[var(--mu)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                  Auto-refresh interval for live data
                </p>
              </div>
            </div>
            <div className="sm:w-60">
              <select
                value={preferences.dashboardRefresh}
                onChange={(e) => setPreferences({ ...preferences, dashboardRefresh: Number(e.target.value) as 5 | 10 | 30 | 60 })}
                className="w-full px-3.5 py-2 text-sm font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#19D46A] cursor-pointer"
                style={{
                  backgroundColor: 'var(--panel)',
                  color: 'var(--t)',
                  border: '1px solid var(--line)',
                  fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
                }}
              >
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-[var(--line)] flex justify-end">
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              style={{
                backgroundColor: '#19D46A',
                color: '#0D1B14',
                fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
              }}
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </EcoCard>

      {/* EcoStep Milestones Energy Targets with Central KPI Typography */}
      <EcoCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#19D46A]/15 border border-[#19D46A]/30 flex items-center justify-center shrink-0 text-[#19D46A]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="lb flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
                <span>ENERGY GOALS</span>
              </div>
              <h2
                className="text-base sm:text-lg font-semibold tracking-tight text-[var(--t)]"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              >
                Monthly &amp; Weekly Milestone Goals
              </h2>
              <p className="text-xs sm:text-sm text-[var(--mu)] mt-0.5 max-w-xl" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                Energy goals are configured and locked per calendar month on the Milestones page so all weekly and monthly targets stay in sync.
              </p>
            </div>
          </div>
          <Link
            to={ROUTES.MILESTONES}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-xs hover:opacity-90 active:scale-95 shrink-0 w-full sm:w-auto"
            style={{
              backgroundColor: '#19D46A',
              color: '#0D1B14',
              fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
              textDecoration: 'none',
            }}
          >
            <span>Open Milestones</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </EcoCard>

      {/* System Information - Formatted as Central 4-KPI Grid */}
      <EcoCard>
        <div className="mb-6">
          <div className="lb flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
            <span>SYSTEM STATUS</span>
          </div>
          <h2 
            className="text-base sm:text-lg font-semibold tracking-tight text-[var(--t)]" 
            style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
          >
            System Information
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mu)] mt-0.5" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
            Live health check of the EcoStep website server, database, and floor tile feed
          </p>
        </div>

        {isLoadingHealth ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#19D46A]" />
            <p className="mt-2 text-sm text-[var(--mu)]" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
              Loading system information...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Application Core */}
              <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
                <div className="lb flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
                  <span>APPLICATION</span>
                </div>
                <div className="v val flex items-baseline mt-3">
                  <span 
                    className="text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--t)] leading-none"
                    style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
                  >
                    EcoStep
                  </span>
                </div>
                <div className="name sub text-[13px] text-[var(--t)] mt-2">
                  v{healthStatus?.version || '1.0.0'}
                </div>
                <div className="hint text-[12px] italic text-[var(--mu)] mt-0.5">
                  {healthStatus?.environment || 'Production'}
                </div>
              </div>

              {/* Card 2: Website Server Status */}
              <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
                <div className="lb flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(healthStatus?.status || 'unavailable') }}></span>
                  <span>WEBSITE SERVER</span>
                </div>
                <div className="v val flex items-baseline mt-3">
                  <span 
                    className="text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums leading-none"
                    style={{ 
                      color: getStatusColor(healthStatus?.status || 'unavailable'),
                      fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" 
                    }}
                  >
                    {getStatusText(healthStatus?.status || 'unavailable')}
                  </span>
                </div>
                <div className="name sub text-[13px] text-[var(--t)] mt-2">
                  EcoStep Server
                </div>
                <div className="hint text-[12px] italic text-[var(--mu)] mt-0.5">
                  {getStatusText(healthStatus?.status || 'unavailable') === 'Online'
                    ? 'All services running normally'
                    : 'Trying to reconnect'}
                </div>
              </div>

              {/* Card 3: Database Speed */}
              <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
                <div className="lb flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(healthStatus?.database?.status || 'unavailable') }}></span>
                  <span>DATABASE</span>
                </div>
                <div className="v val flex items-baseline mt-3">
                  <span 
                    className="text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--t)] leading-none"
                    style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
                  >
                    {healthStatus?.database?.responseTime ?? 2}
                  </span>
                  <small className="text-[15px] font-normal text-[var(--mu)] ml-2">ms</small>
                </div>
                <div className="name sub text-[13px] text-[var(--t)] mt-2">
                  {getStatusText(healthStatus?.database?.state || healthStatus?.database?.status || 'unavailable')}
                </div>
                <div className="hint text-[12px] italic text-[var(--mu)] mt-0.5">
                  Database response speed
                </div>
              </div>

              {/* Card 4: Floor Tile Live Feed */}
              <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
                <div className="lb flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ 
                      backgroundColor: hardwareStatus.status === 'connected' 
                        ? '#19D46A' 
                        : hardwareStatus.status === 'waiting' 
                          ? '#F5A623' 
                          : '#EF4444' 
                    }}
                  />
                  <span>FLOOR TILE FEED</span>
                </div>
                <div className="v val flex items-baseline mt-3">
                  <span 
                    className="text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums leading-none"
                    style={{ 
                      color: hardwareStatus.status === 'connected' 
                        ? '#19D46A' 
                        : hardwareStatus.status === 'waiting' 
                          ? '#F5A623' 
                          : '#EF4444',
                      fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" 
                    }}
                  >
                    {hardwareStatus.status === 'connected'
                      ? 'Live'
                      : hardwareStatus.status === 'waiting'
                        ? 'Standby'
                        : 'Connection Lost'}
                  </span>
                </div>
                <div className="name sub text-[13px] text-[var(--t)] mt-2">
                  Smart Tile Stream
                </div>
                <div className="hint text-[12px] italic text-[var(--mu)] mt-0.5">
                  Real-time footstep updates
                </div>
              </div>
            </div>

            {/* Extra telemetry info footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[var(--line)] text-xs text-[var(--mu)] tabular-nums" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
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
      </EcoCard>
    </div>
  );
}
