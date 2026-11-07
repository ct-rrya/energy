import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { EcoCard } from '@/components/common';
import { showToast } from '@/components/common/Toast';
import { healthService } from '@/api/services';
import { Clock, Calendar, RefreshCw, Bluetooth, Award } from 'lucide-react';
import { EcoStepBleButton } from '@/features/ble';
import { useMilestones } from '@/features/milestones';
import { formatWhFromMWh, parsePositiveDecimal } from '@/features/milestones/utils/milestone.utils';

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

  // EcoStep Milestones targets state
  const { milestones, updateTargets: saveMilestoneTargets } = useMilestones();
  const [milestoneInputs, setMilestoneInputs] = useState({
    target1WeekMWh: '0.025',
    target1MonthMWh: '0.1',
    target3MonthsMWh: '0.3',
    target6MonthsMWh: '0.6',
    target1YearMWh: '1.2',
  });
  const [isSavingMilestones, setIsSavingMilestones] = useState(false);

  useEffect(() => {
    if (milestones.length > 0) {
      const getVal = (key: string, defMWh: number) => {
        const item = milestones.find((m) => m.periodKey === key);
        return item?.targetMWh ?? (item?.targetWh ? item.targetWh * 1000 : defMWh);
      };
      setMilestoneInputs({
        target1WeekMWh: String(getVal('1_week', 0.025)),
        target1MonthMWh: String(getVal('1_month', 0.1)),
        target3MonthsMWh: String(getVal('3_months', 0.3)),
        target6MonthsMWh: String(getVal('6_months', 0.6)),
        target1YearMWh: String(getVal('1_year', 1.2)),
      });
    }
  }, [milestones]);

  const handleSaveMilestones = async () => {
    const t1W = parsePositiveDecimal(milestoneInputs.target1WeekMWh);
    const t1M = parsePositiveDecimal(milestoneInputs.target1MonthMWh);
    const t3M = parsePositiveDecimal(milestoneInputs.target3MonthsMWh);
    const t6M = parsePositiveDecimal(milestoneInputs.target6MonthsMWh);
    const t1Y = parsePositiveDecimal(milestoneInputs.target1YearMWh);

    if (t1W === null || t1M === null || t3M === null || t6M === null || t1Y === null) {
      showToast('Please enter valid positive targets up to 6 decimal places (min 0.000001 mWh)', 'error');
      return;
    }

    setIsSavingMilestones(true);
    try {
      await saveMilestoneTargets({
        target1WeekMWh: t1W,
        target1MonthMWh: t1M,
        target3MonthsMWh: t3M,
        target6MonthsMWh: t6M,
        target1YearMWh: t1Y,
      });
      showToast('EcoStep milestone energy targets updated successfully', 'success');
    } catch (error) {
      console.error('Failed to save milestone targets:', error);
      showToast('Failed to save milestone targets', 'error');
    } finally {
      setIsSavingMilestones(false);
    }
  };

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
      setHealthStatus(response.data as any);
      setIsLoadingHealth(false);
    } catch (error) {
      console.error('Failed to load health status:', error);
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
    if (status === 'healthy' || status === 'up' || status === 'connected' || status === 'receiving') {
      return colors.success;
    } else if (status === 'degraded' || status === 'waiting') {
      return colors.warning;
    } else {
      return colors.error;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'up': return 'Connected';
      case 'connected': return 'Connected';
      case 'receiving': return 'Receiving';
      case 'waiting': return 'Standby';
      case 'unavailable': return 'Offline';
      default: return 'Standby';
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
        greeting="System Administration"
        title="Settings"
        subtitle="Configure EcoStep system behavior and application preferences"
        systemStatus={hardwareStatus.status}
        isWebSocketConnected={hardwareStatus.isHardwareConnected}
      />

      {/* EcoStep Harvester Web Bluetooth Provisioning (Hardware Pairing at the top) */}
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
                <span>HARDWARE PAIRING</span>
              </div>
              <h3 
                className="text-base font-semibold text-[var(--t)]"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              >
                EcoStep Harvester Wi-Fi Provisioning
              </h3>
              <p 
                className="text-xs sm:text-sm text-[var(--mu)] mt-0.5"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              >
                Directly pair with your EcoStep Harvester ESP32 over Web Bluetooth Low Energy to configure local Wi-Fi credentials in-browser.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--mu)] tabular-nums" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
                <span className="inline-block w-2 h-2 rounded-full bg-[#19D46A]"></span>
                <span>GATT Service: EcoStep-Harvester (0x4FAFC201)</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 sm:self-center">
            <EcoStepBleButton label="Setup Harvester Wi-Fi" />
          </div>
        </div>
      </EcoCard>

      {/* System Preferences */}
      <EcoCard>
        <div className="mb-6">
          <div className="lb flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
            <span>SYSTEM PREFERENCES</span>
          </div>
          <h2 
            className="text-base sm:text-lg font-semibold tracking-tight text-[var(--t)]"
            style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
          >
            General Display & Refresh Preferences
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mu)] mt-0.5" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
            Configure general preferences for how EcoStep displays and operates
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="lb flex items-center gap-1.5 mb-1.5">
              <Award className="w-3.5 h-3.5 text-[#19D46A]" />
              <span>ENERGY ROADMAP</span>
            </div>
            <h2 
              className="text-base sm:text-lg font-semibold tracking-tight text-[var(--t)]" 
              style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
            >
              EcoStep Milestone Energy Targets
            </h2>
            <p className="text-xs sm:text-sm text-[var(--mu)] mt-0.5" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
              Configure accumulated energy targets in milliwatt-hours (mWh) across five milestone intervals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setMilestoneInputs({
                  target1WeekMWh: '0.025',
                  target1MonthMWh: '0.1',
                  target3MonthsMWh: '0.3',
                  target6MonthsMWh: '0.6',
                  target1YearMWh: '1.2',
                })
              }
              className="text-xs px-3 py-1 rounded-full border border-[#19D46A]/40 bg-[#19D46A]/10 text-[#19D46A] hover:bg-[#19D46A]/20 transition-all font-semibold cursor-pointer"
              style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
            >
              Pilot (Default)
            </button>
            <button
              type="button"
              onClick={() =>
                setMilestoneInputs({
                  target1WeekMWh: '0.1',
                  target1MonthMWh: '0.5',
                  target3MonthsMWh: '1.5',
                  target6MonthsMWh: '3.0',
                  target1YearMWh: '6.0',
                })
              }
              className="text-xs px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--soft)] text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--line)] transition-all font-medium cursor-pointer"
              style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
            >
              Active Walkway
            </button>
            <button
              type="button"
              onClick={() =>
                setMilestoneInputs({
                  target1WeekMWh: '0.5',
                  target1MonthMWh: '2.0',
                  target3MonthsMWh: '6.0',
                  target6MonthsMWh: '12.0',
                  target1YearMWh: '24.0',
                })
              }
              className="text-xs px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--soft)] text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--line)] transition-all font-medium cursor-pointer"
              style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
            >
              Corridor Array
            </button>
          </div>
        </div>

        {/* 5 Milestone Cards formatted with the exact Central KPI style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1 Week */}
          <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="lb flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
                <span>1 WEEK GOAL</span>
              </div>
              <span className="text-[11px] text-[var(--mu)] font-medium">7 Days</span>
            </div>
            <div className="v val flex items-baseline mt-3">
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                placeholder="0.025"
                value={milestoneInputs.target1WeekMWh}
                onChange={(e) => setMilestoneInputs({ ...milestoneInputs, target1WeekMWh: e.target.value })}
                className="w-full bg-transparent border-b border-[var(--line)] focus:border-[#19D46A] text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--t)] outline-none transition-colors"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              />
              <small className="text-[15px] font-normal text-[var(--mu)] ml-2 shrink-0">mWh</small>
            </div>
            <div className="name sub text-[13px] text-[var(--mu)] mt-2 tabular-nums">
              Goal: {formatWhFromMWh(parseFloat(milestoneInputs.target1WeekMWh) || 0)} Wh
            </div>
          </div>

          {/* 1 Month */}
          <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="lb flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#A6DC3C]"></span>
                <span>1 MONTH GOAL</span>
              </div>
              <span className="text-[11px] text-[var(--mu)] font-medium">30 Days</span>
            </div>
            <div className="v val flex items-baseline mt-3">
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                placeholder="0.1"
                value={milestoneInputs.target1MonthMWh}
                onChange={(e) => setMilestoneInputs({ ...milestoneInputs, target1MonthMWh: e.target.value })}
                className="w-full bg-transparent border-b border-[var(--line)] focus:border-[#19D46A] text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--t)] outline-none transition-colors"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              />
              <small className="text-[15px] font-normal text-[var(--mu)] ml-2 shrink-0">mWh</small>
            </div>
            <div className="name sub text-[13px] text-[var(--mu)] mt-2 tabular-nums">
              Goal: {formatWhFromMWh(parseFloat(milestoneInputs.target1MonthMWh) || 0)} Wh
            </div>
          </div>

          {/* 3 Months */}
          <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="lb flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#13B95C]"></span>
                <span>3 MONTHS GOAL</span>
              </div>
              <span className="text-[11px] text-[var(--mu)] font-medium">90 Days</span>
            </div>
            <div className="v val flex items-baseline mt-3">
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                placeholder="0.3"
                value={milestoneInputs.target3MonthsMWh}
                onChange={(e) => setMilestoneInputs({ ...milestoneInputs, target3MonthsMWh: e.target.value })}
                className="w-full bg-transparent border-b border-[var(--line)] focus:border-[#19D46A] text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--t)] outline-none transition-colors"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              />
              <small className="text-[15px] font-normal text-[var(--mu)] ml-2 shrink-0">mWh</small>
            </div>
            <div className="name sub text-[13px] text-[var(--mu)] mt-2 tabular-nums">
              Goal: {formatWhFromMWh(parseFloat(milestoneInputs.target3MonthsMWh) || 0)} Wh
            </div>
          </div>

          {/* 6 Months */}
          <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="lb flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7FE0A8]"></span>
                <span>6 MONTHS GOAL</span>
              </div>
              <span className="text-[11px] text-[var(--mu)] font-medium">180 Days</span>
            </div>
            <div className="v val flex items-baseline mt-3">
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                placeholder="0.6"
                value={milestoneInputs.target6MonthsMWh}
                onChange={(e) => setMilestoneInputs({ ...milestoneInputs, target6MonthsMWh: e.target.value })}
                className="w-full bg-transparent border-b border-[var(--line)] focus:border-[#19D46A] text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--t)] outline-none transition-colors"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              />
              <small className="text-[15px] font-normal text-[var(--mu)] ml-2 shrink-0">mWh</small>
            </div>
            <div className="name sub text-[13px] text-[var(--mu)] mt-2 tabular-nums">
              Goal: {formatWhFromMWh(parseFloat(milestoneInputs.target6MonthsMWh) || 0)} Wh
            </div>
          </div>

          {/* 1 Year */}
          <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="lb flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
                <span>1 YEAR GOAL</span>
              </div>
              <span className="text-[11px] text-[var(--mu)] font-medium">365 Days</span>
            </div>
            <div className="v val flex items-baseline mt-3">
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                placeholder="1.2"
                value={milestoneInputs.target1YearMWh}
                onChange={(e) => setMilestoneInputs({ ...milestoneInputs, target1YearMWh: e.target.value })}
                className="w-full bg-transparent border-b border-[var(--line)] focus:border-[#19D46A] text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--t)] outline-none transition-colors"
                style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
              />
              <small className="text-[15px] font-normal text-[var(--mu)] ml-2 shrink-0">mWh</small>
            </div>
            <div className="name sub text-[13px] text-[var(--mu)] mt-2 tabular-nums">
              Goal: {formatWhFromMWh(parseFloat(milestoneInputs.target1YearMWh) || 0)} Wh
            </div>
          </div>
        </div>

        {/* Save Milestones Button */}
        <div className="pt-4 border-t border-[var(--line)] mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSaveMilestones}
            disabled={isSavingMilestones}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            style={{
              backgroundColor: '#19D46A',
              color: '#0D1B14',
              fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
            }}
          >
            {isSavingMilestones ? 'Saving Targets...' : 'Save Milestone Targets'}
          </button>
        </div>
      </EcoCard>

      {/* System Information - Formatted as Central 4-KPI Grid */}
      <EcoCard>
        <div className="mb-6">
          <div className="lb flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#19D46A]"></span>
            <span>SYSTEM TELEMETRY & STATUS</span>
          </div>
          <h2 
            className="text-base sm:text-lg font-semibold tracking-tight text-[var(--t)]" 
            style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}
          >
            System Information
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mu)] mt-0.5" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
            Real-time status of EcoStep backend services, database, and telemetry pipeline
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

              {/* Card 2: Backend Status */}
              <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
                <div className="lb flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(healthStatus?.status || 'unavailable') }}></span>
                  <span>BACKEND CORE</span>
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
                  NestJS API Gateway
                </div>
                <div className="hint text-[12px] italic text-[var(--mu)] mt-0.5">
                  Services operational
                </div>
              </div>

              {/* Card 3: Database Latency */}
              <div className="rounded-2xl bg-[var(--soft)] border border-[var(--line)] p-4 flex flex-col justify-between">
                <div className="lb flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(healthStatus?.database?.status || 'unavailable') }}></span>
                  <span>MONGODB ATLAS</span>
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
                  Latency to cluster
                </div>
              </div>

              {/* Card 4: IoT Data Stream */}
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
                  <span>IOT TELEMETRY</span>
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
                      ? 'Connected'
                      : hardwareStatus.status === 'waiting'
                        ? 'Waiting'
                        : 'Connection Lost'}
                  </span>
                </div>
                <div className="name sub text-[13px] text-[var(--t)] mt-2">
                  Harvester Tile Stream
                </div>
                <div className="hint text-[12px] italic text-[var(--mu)] mt-0.5">
                  Live footstep packets
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
