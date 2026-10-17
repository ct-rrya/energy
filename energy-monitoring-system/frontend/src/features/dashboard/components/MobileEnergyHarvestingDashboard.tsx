import { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
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
 * - Date/Time line + "Energy harvesting" title + Status pill badge (Warning · Idle / Live)
 * - Hero Card: Dark forest green card with circular step progress ring + step motivational text
 * - Secondary Metrics: 2 columns (VOLTAGE and CURRENT) with live/empty readings & subtitles
 * - LAST 12 HOURS: 12-hour activity visual (dashed lines when empty, rounded green bars when active)
 */
export function MobileEnergyHarvestingDashboard({
  displayReading,
  displayMetrics,
  systemStatus = 'connected',
  isWebSocketConnected = true,
}: MobileEnergyHarvestingDashboardProps) {
  const { theme } = useTheme();

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

  // Compute metrics values for active vs empty state
  const stepCount = isActive ? (realSteps > 0 ? realSteps : 620) : 0;
  const stepGoal = 1000;
  const stepProgress = Math.min(stepCount / stepGoal, 1);

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

  // 12-hour bar heights (percentages matching mock rhythm)
  const twelveHourBars = [18, 18, 22, 34, 48, 28, 38, 62, 88, 70, 80, 92];

  // SVG Circular Ring calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeDashoffset = circumference - stepProgress * circumference;

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20">
      {/* 1. Header Section: Date & Title & Status Pill */}
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
          {currentFormattedDate}
        </p>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
            Energy harvesting
          </h1>

          {/* Interactive status pill: toggles between Active & Empty state on tap */}
          <button
            type="button"
            onClick={() => setManualState((prev) => (prev === 'active' ? 'empty' : 'active'))}
            title="Tap to preview Empty vs Active state"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-all ${
              isActive
                ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100/90 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isActive ? 'Live' : 'Warning · Idle'}</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Card: Dark Forest Green Card */}
      <div
        className="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(145deg, #0d291d 0%, #081d14 100%)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          boxShadow: '0 12px 32px rgba(5, 41, 24, 0.3)',
        }}
      >
        <div className="flex items-center gap-4.5">
          {/* Circular Step Progress Ring */}
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 96 96">
              {/* Background Ring */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Active Progress Arc */}
              {isActive && (
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="#22c55e"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))',
                    transition: 'stroke-dashoffset 0.8s ease-in-out',
                  }}
                />
              )}
            </svg>

            {/* Centered Steps Numbers */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black tracking-tight leading-none text-white tabular-nums">
                {stepCount}
              </span>
              <span className="text-[10px] text-emerald-200/80 font-medium mt-0.5 leading-none">
                steps today
              </span>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-extrabold text-white leading-tight">
              {isActive ? 'Nice, tiles are charging' : 'Be the first to step on today'}
            </h2>
            <p className="text-[12.5px] text-emerald-100/75 mt-1 leading-snug">
              {isActive
                ? 'Your steps are being converted into usable energy.'
                : 'Walk across a piezoelectric tile to start generating power.'}
            </p>
            <span className="inline-block mt-2 text-xs font-bold text-[#39FF88] tracking-tight">
              Goal 1,000 steps
            </span>
          </div>
        </div>
      </div>

      {/* 3. Secondary Metrics: 2 Columns (Voltage & Current) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Voltage Card */}
        <div
          className="rounded-2xl p-4 transition-colors"
          style={{
            backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          <span className="block text-[10.5px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-400 uppercase">
            VOLTAGE
          </span>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span
              className="text-2xl font-extrabold tabular-nums tracking-tight"
              style={{
                color: isActive
                  ? theme === 'dark'
                    ? '#39FF88'
                    : '#16a34a'
                  : theme === 'dark'
                  ? '#94a3b8'
                  : '#64748b',
              }}
            >
              {voltageValue}
            </span>
            <span
              className="text-xs font-semibold"
              style={{
                color: isActive
                  ? theme === 'dark'
                    ? '#39FF88'
                    : '#16a34a'
                  : theme === 'dark'
                  ? '#94a3b8'
                  : '#64748b',
              }}
            >
              V
            </span>
          </div>
          <p className="text-[11.5px] text-neutral-400 dark:text-neutral-400 mt-1">
            {isActive ? `Peak ${peakVoltage} V` : 'Waiting for data'}
          </p>
        </div>

        {/* Current Card */}
        <div
          className="rounded-2xl p-4 transition-colors"
          style={{
            backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          <span className="block text-[10.5px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-400 uppercase">
            CURRENT
          </span>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span
              className="text-2xl font-extrabold tabular-nums tracking-tight"
              style={{
                color: isActive
                  ? theme === 'dark'
                    ? '#39FF88'
                    : '#16a34a'
                  : theme === 'dark'
                  ? '#94a3b8'
                  : '#64748b',
              }}
            >
              {currentValueMA}
            </span>
            <span
              className="text-xs font-semibold"
              style={{
                color: isActive
                  ? theme === 'dark'
                    ? '#39FF88'
                    : '#16a34a'
                  : theme === 'dark'
                  ? '#94a3b8'
                  : '#64748b',
              }}
            >
              mA
            </span>
          </div>
          <p className="text-[11.5px] text-neutral-400 dark:text-neutral-400 mt-1">
            {isActive ? `Avg ${avgCurrentMA} mA` : 'Start generating'}
          </p>
        </div>
      </div>

      {/* 4. Chart Card: LAST 12 HOURS */}
      <div
        className="rounded-2xl p-4 sm:p-5 transition-colors"
        style={{
          backgroundColor: theme === 'dark' ? '#111B30' : '#FFFFFF',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
            LAST 12 HOURS
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-400 font-medium">
            {isActive ? 'Sample data' : 'No activity yet'}
          </span>
        </div>

        {/* Bar Chart Visualization */}
        <div className="h-16 w-full flex items-end justify-between gap-1.5 pt-1">
          {twelveHourBars.map((heightPercent, idx) => {
            if (!isActive) {
              // Empty State: 12 dashed line markers
              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center"
                >
                  <div
                    className="w-full h-1 rounded-full transition-colors"
                    style={{
                      backgroundColor: theme === 'dark' ? '#334155' : '#D1D5DB',
                    }}
                  />
                </div>
              );
            }

            // Active State: 12 vertical rounded green bars
            return (
              <div
                key={idx}
                className="flex-1 h-full flex items-end justify-center"
              >
                <div
                  className="w-full rounded-md transition-all duration-500"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: theme === 'dark' ? '#22c55e' : '#16a34a',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
