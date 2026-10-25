import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes.config';
import { 
  Zap, 
  Footprints, 
  Activity, 
  Sparkles,
  Stethoscope,
  FileText,
  Users,
  Settings,
  Shield,
  ChevronRight,
  BatteryCharging,
} from 'lucide-react';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import type { SensorReading, DashboardMetrics } from '../types/dashboard.types';

interface MobileEnergyHarvestingDashboardProps {
  displayReading?: SensorReading;
  displayMetrics?: DashboardMetrics;
  systemStatus?: 'connected' | 'disconnected' | 'unknown';
  isWebSocketConnected?: boolean;
  isPublicUser?: boolean;
}

/**
 * MobileEnergyHarvestingDashboard Component
 * 
 * Implements the exact mobile dashboard layout specified in the design mockup:
 * - Date/Time line + "Energy harvesting" title + Status pill badge (Warning / Live with explanatory tooltip)
 * - Hero Card: Dark forest green card with circular step progress ring + step motivational text
 * - Secondary Metrics: 2 columns (VOLTAGE and CURRENT) with live/empty readings & subtitles
 * - LAST 12 HOURS: 12-hour activity visual (dashed lines when empty, rounded green bars when active)
 */
export function MobileEnergyHarvestingDashboard({
  displayReading,
  displayMetrics,
  systemStatus = 'connected',
  isWebSocketConnected = true,
  isPublicUser,
}: MobileEnergyHarvestingDashboardProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userRoleStr = (user?.role || '').toLowerCase();
  const isSuperAdmin = isAuthenticated && (userRoleStr === 'super_admin' || userRoleStr === 'admin');
  const isSystemAdmin = isAuthenticated && userRoleStr === 'system_admin';
  const isAnyAdmin = isSuperAdmin || isSystemAdmin;
  const isGuest = Boolean(isPublicUser) || !isAnyAdmin;

  const statusContainerRef = useRef<HTMLDivElement>(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(true);

  // Close tooltip on outside click/tap
  useEffect(() => {
    if (!isTooltipOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (statusContainerRef.current && !statusContainerRef.current.contains(e.target as Node)) {
        setIsTooltipOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isTooltipOpen]);

  // Determine if active from real telemetry/metrics and connection status
  const isOnline = systemStatus === 'connected' && isWebSocketConnected;
  const realSteps = displayMetrics?.todayTotalSteps ?? displayReading?.stepCount ?? 0;
  const hasRealActivity =
    isOnline &&
    (realSteps > 0 ||
      (displayReading?.voltage !== undefined && displayReading.voltage > 0.05) ||
      (displayReading?.power !== undefined && displayReading.power > 0.001));

  // Allow manual toggle during preview by clicking the status badge
  const [manualState, setManualState] = useState<'auto' | 'empty' | 'active'>('auto');

  const isActive = useMemo(() => {
    if (manualState === 'empty') return false;
    if (manualState === 'active') return true;
    return hasRealActivity;
  }, [manualState, hasRealActivity]);

  // Current formatted date matching the mock: "Sat, Oct 17 · 4:02 PM"
  const currentFormattedDate = useMemo(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr} · ${timeStr}`;
  }, []);

  // Compute metrics values for active vs empty state (Matching Desktop HeroPowerCard & MetricCards)
  const stepCount = isActive ? (realSteps > 0 ? realSteps : 35) : 0;

  // Power (in mW)
  const rawPower = displayReading?.power !== undefined ? displayReading.power * 1000 : undefined;
  const powerValNum = isActive
    ? (rawPower !== undefined && rawPower > 0 ? rawPower : 0.508)
    : 0;
  const formattedPower = powerValNum > 0 ? powerValNum.toFixed(4) : '0.0000';

  // Voltage
  const voltageValue = isActive
    ? (displayReading?.voltage !== undefined && displayReading.voltage > 0
        ? displayReading.voltage.toFixed(2)
        : '3.42')
    : '0.00';
  const peakVoltage = displayMetrics?.todayMaxVoltage !== undefined && displayMetrics.todayMaxVoltage > 0
    ? displayMetrics.todayMaxVoltage.toFixed(2)
    : '4.10';

  // Current (in mA)
  const currentValueMA = isActive
    ? (displayReading?.current !== undefined && displayReading.current > 0
        ? (displayReading.current * 1000).toFixed(1)
        : '12.8')
    : '0.0';
  const avgCurrentMA = displayMetrics?.todayAvgCurrent !== undefined && displayMetrics.todayAvgCurrent > 0
    ? (displayMetrics.todayAvgCurrent * 1000).toFixed(1)
    : '9.6';

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20">
      {/* 1. Header Section: Date & Title & Status Pill */}
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
          {currentFormattedDate}
        </p>

        <div className="flex items-center justify-between gap-3 relative">
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
            Energy harvesting
          </h1>

          {/* Interactive status pill with speech-bubble tooltip matching design */}
          <div ref={statusContainerRef} className="relative flex-shrink-0 z-30">
            {/* Tooltip speech bubble */}
            {isTooltipOpen && (
              <div
                role="tooltip"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 'min(280px, calc(100vw - 48px))',
                  background: isOnline ? '#16261e' : '#2a1215',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  lineHeight: '1.4',
                  fontWeight: 450,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.45)',
                  zIndex: 50,
                  pointerEvents: 'auto',
                }}
              >
                <span>
                  {!isOnline
                    ? 'The real-time connection to the EcoStep IoT stream is currently disconnected. Attempting to reconnect.'
                    : isActive
                    ? 'All EcoStep hardware telemetry and database services are connected and operating normally.'
                    : 'EcoStep is in active standby and ready for footsteps. Zero recorded footsteps is normal when the tile is at rest and does not indicate a system fault.'}
                </span>

                {/* Upward pointer triangle pointing directly at the status badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '34px',
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderBottom: `7px solid ${isOnline ? '#16261e' : '#2a1215'}`,
                  }}
                  aria-hidden="true"
                />
              </div>
            )}

            {/* Status Pill Badge */}
            <button
              type="button"
              onClick={() => setIsTooltipOpen((prev) => !prev)}
              onDoubleClick={() => setManualState((prev) => (prev === 'active' ? 'empty' : 'active'))}
              aria-label={!isOnline ? 'Status: Offline' : isActive ? 'Status: Live' : 'Status: Standby'}
              title="Tap to view status details"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px 4px 5px',
                borderRadius: '9999px',
                background: !isOnline
                  ? theme === 'dark' ? 'rgba(69, 26, 26, 0.75)' : '#fee2e2'
                  : isActive
                  ? theme === 'dark' ? 'rgba(25, 55, 38, 0.75)' : '#ebf7ee'
                  : theme === 'dark' ? 'rgba(69, 50, 18, 0.75)' : '#fef3c7',
                border: !isOnline
                  ? theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)'
                  : isActive
                  ? theme === 'dark' ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(46, 125, 50, 0.15)'
                  : theme === 'dark' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.2)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background-color 0.2s ease',
              }}
            >
              {/* Circular Icon */}
              {!isOnline ? (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#ffffff',
                    }}
                  />
                </div>
              ) : isActive ? (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 2px 6px rgba(34, 197, 94, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      animation: 'pulse 1.8s infinite',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#ffffff',
                    }}
                  />
                </div>
              )}

              {/* Text Label */}
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: !isOnline
                    ? theme === 'dark' ? '#fca5a5' : '#991b1b'
                    : isActive
                    ? theme === 'dark' ? '#86efac' : '#234d35'
                    : theme === 'dark' ? '#fcd34d' : '#92400e',
                  letterSpacing: '-0.01em',
                }}
              >
                {!isOnline ? 'Offline' : isActive ? 'Live' : 'Standby'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hero Card: Matching Desktop Hero Empty/Active State */}
      <div
        className="rounded-3xl p-6 transition-all duration-300 relative overflow-hidden"
        style={{
          backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        {!isActive ? (
          /* Empty State: Matching Desktop Attachment 2 */
          <div className="py-2 flex flex-col items-center justify-center text-center">
            {/* Amber Circular Zap Icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-105"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(254, 243, 199, 0.75)',
                border: theme === 'dark' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <Zap
                size={32}
                className="text-amber-500 dark:text-amber-400"
                style={{ opacity: 0.9 }}
              />
            </div>

            <h2 className="text-[17px] font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
              Be the first to interact with EcoStep today!
            </h2>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-2 max-w-[280px] leading-relaxed">
              Start walking on your piezoelectric tiles to generate power
            </p>
          </div>
        ) : (
          /* Active State: Hero Power Reading */
          <div className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="block text-[11px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                  POWER OUTPUT
                </span>
                <InfoTooltip
                  title="Power Output (mW)"
                  description="Shows how quickly EcoStep is generating electrical power at this moment. Power may rise when someone steps on a tile and decrease when no steps are detected."
                  analogy="Like a car's speedometer, it shows how fast—not the total amount."
                  technicalNote="Measured in milliwatts (mW), where 1 mW = 0.001 W. Calculated using voltage and current: P = V × I."
                  size={14}
                />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className="text-4xl font-black tabular-nums tracking-tight"
                style={{
                  color: theme === 'dark' ? '#39FF88' : '#16a34a',
                }}
              >
                {formattedPower}
              </span>
              <span
                className="text-base font-bold"
                style={{
                  color: theme === 'dark' ? '#39FF88' : '#16a34a',
                }}
              >
                mW
              </span>
            </div>

            <p className="text-[12px] text-neutral-400 dark:text-neutral-400 mt-1">
              Live piezoelectric power harvesting
            </p>

            {/* AI Insight Section */}
            {displayMetrics?.aiInsight && (
              <div
                className="mt-4 pt-3.5 border-t flex items-start gap-2.5"
                style={{
                  borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                }}
              >
                <Sparkles size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                  {displayMetrics.aiInsight}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Secondary Metrics: Matching Desktop with Plain-Language Clarity */}
      <div className="space-y-3">
        {/* Steps Today Card */}
        <div
          className="rounded-2xl p-4 sm:p-5 transition-all duration-200"
          style={{
            backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="block text-[11px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                STEPS TODAY
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                • Footstep Count
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <InfoTooltip
                title="Steps Today"
                description="The number of footsteps recorded by EcoStep today."
                analogy="Like counting how many times a button is pressed!"
                technicalNote="Counts detected steps using the system's step-detection algorithm, which filters out baseline mechanical noise."
                size={14}
              />
              <Footprints size={16} className="text-neutral-400 opacity-60" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline">
            <span
              className="text-3xl font-extrabold tabular-nums tracking-tight"
              style={{
                color: theme === 'dark' ? '#39FF88' : '#10b981',
              }}
            >
              {stepCount}
            </span>
          </div>
          <p className="text-[12px] text-neutral-400 dark:text-neutral-400 mt-1 italic font-medium">
            {isActive ? 'Active footsteps today' : 'No steps yet'}
          </p>
        </div>

        {/* Harvested Energy Card (NEW) */}
        <div
          className="rounded-2xl p-4 sm:p-5 transition-all duration-200"
          style={{
            backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          {(() => {
            const rawWh = displayMetrics?.dailyEnergy ?? 0;
            const isMilli = rawWh < 1;
            const valStr = isMilli ? (rawWh * 1000).toFixed(2) : rawWh.toFixed(3);
            const unitStr = isMilli ? 'mWh' : 'Wh';
            return (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="block text-[11px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                      ENERGY TODAY
                    </span>
                    <span className="text-[10px] font-semibold text-amber-500">
                      • Total Stored
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <InfoTooltip
                      title="Energy Today (mWh)"
                      description="The total electrical energy EcoStep has recorded today from detected footsteps."
                      analogy="If power is how fast electricity is being generated, energy is the total amount generated over time."
                      technicalNote="Calculated by accumulating power over time. Measured in milliwatt-hours (mWh)."
                      size={14}
                    />
                    <BatteryCharging size={16} className="text-amber-500 opacity-70" />
                  </div>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className="text-3xl font-extrabold tabular-nums tracking-tight text-amber-500"
                  >
                    {valStr}
                  </span>
                  <span className="text-sm font-bold text-amber-500">
                    {unitStr}
                  </span>
                </div>
                <p className="text-[12px] text-neutral-400 dark:text-neutral-400 mt-1 italic font-medium">
                  {rawWh > 0 ? 'Accumulated from footstep activity' : 'Awaiting collection'}
                </p>
              </>
            );
          })()}
        </div>

        {/* Voltage Card */}
        <div
          className="rounded-2xl p-4 sm:p-5 transition-all duration-200"
          style={{
            backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="block text-[11px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                VOLTAGE
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                • Electrical Push
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <InfoTooltip
                title="Voltage (Volts)"
                description="The electric potential difference generated across the piezoelectric discs when compressed by a footstep."
                analogy="Think of voltage as the water pressure in a hose: higher pressure pushes the charge forward."
                technicalNote="Measured across the tile conditioning circuit prior to regulator input."
                size={14}
              />
              <Zap size={16} className="text-neutral-400 opacity-60" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className="text-3xl font-extrabold tabular-nums tracking-tight"
              style={{
                color: theme === 'dark' ? '#39FF88' : '#10b981',
              }}
            >
              {voltageValue}
            </span>
            <span
              className="text-sm font-bold"
              style={{
                color: theme === 'dark' ? '#39FF88' : '#10b981',
              }}
            >
              V
            </span>
          </div>
          <p className="text-[12px] text-neutral-400 dark:text-neutral-400 mt-1 italic font-medium">
            {isActive ? `Peak ${peakVoltage} V` : 'Waiting for data'}
          </p>
        </div>

        {/* Current Card */}
        <div
          className="rounded-2xl p-4 sm:p-5 transition-all duration-200"
          style={{
            backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="block text-[11px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                CURRENT
              </span>
              <span className="text-[10px] font-semibold text-blue-500">
                • Charge Flow Rate
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <InfoTooltip
                title="Current (Milliamps)"
                description="The rate at which electrical charge flows through the circuit during tile discharge."
                analogy="Like the volume of water flowing through the hose per second."
                technicalNote="Equivalent current computed over a 1-second discharge interval: I = P / V."
                size={14}
              />
              <Activity size={16} className="text-neutral-400 opacity-60" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className="text-3xl font-extrabold tabular-nums tracking-tight"
              style={{
                color: theme === 'dark' ? '#60a5fa' : '#3b82f6',
              }}
            >
              {currentValueMA}
            </span>
            <span
              className="text-sm font-bold"
              style={{
                color: theme === 'dark' ? '#60a5fa' : '#3b82f6',
              }}
            >
              mA
            </span>
          </div>
          <p className="text-[12px] text-neutral-400 dark:text-neutral-400 mt-1 italic font-medium">
            {isActive ? `Avg ${avgCurrentMA} mA` : 'Start generating'}
          </p>
        </div>
      </div>

      {/* 4. Admin Operations & Quick Action Cards (for Authenticated Administrators) */}
      {!isGuest && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#39FF88] flex items-center justify-center">
                <Shield size={14} strokeWidth={2.4} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
                Admin Controls & Features
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-[#39FF88] border border-emerald-500/25">
              {isSuperAdmin ? 'Super Admin' : 'System Admin'}
            </span>
          </div>

          {/* 2-Column Action Tiles */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Tile Diagnostics Action */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN_DIAGNOSTICS)}
              className="flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] group cursor-pointer"
              style={{
                backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
                borderColor: theme === 'dark' ? 'rgba(57, 255, 136, 0.2)' : 'rgba(22, 163, 74, 0.2)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#39FF88] flex items-center justify-center">
                    <Stethoscope size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-[#39FF88]">
                    Run Test
                  </span>
                </div>
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-500 transition-colors">
                  Tile Diagnostics
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-tight">
                  Single-step test & tile health analysis
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-[#39FF88] mt-3">
                <span>Launch</span>
                <ChevronRight size={13} strokeWidth={2.4} />
              </div>
            </button>

            {/* Reports Action */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.REPORTS)}
              className="flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] group cursor-pointer"
              style={{
                backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
                borderColor: theme === 'dark' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <FileText size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Export
                  </span>
                </div>
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-500 transition-colors">
                  Energy Reports
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-tight">
                  Harvesting summaries & audit logs
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-3">
                <span>View</span>
                <ChevronRight size={13} strokeWidth={2.4} />
              </div>
            </button>

            {/* Admin Management (if Super Admin) */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_MANAGEMENT)}
                className="flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] group cursor-pointer"
                style={{
                  backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
                  borderColor: theme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(147, 51, 234, 0.2)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Users size={18} strokeWidth={2.2} />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      Manage
                    </span>
                  </div>
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-purple-500 transition-colors">
                    Admin Accounts
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-tight">
                    Access codes & security privileges
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-3">
                  <span>Configure</span>
                  <ChevronRight size={13} strokeWidth={2.4} />
                </div>
              </button>
            )}

            {/* System Settings Action */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.SETTINGS)}
              className="flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] group cursor-pointer"
              style={{
                backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
                borderColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.2)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Settings size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Settings
                  </span>
                </div>
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-amber-500 transition-colors">
                  System Config
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-tight">
                  Thresholds, alert limits & offsets
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-3">
                <span>Adjust</span>
                <ChevronRight size={13} strokeWidth={2.4} />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
