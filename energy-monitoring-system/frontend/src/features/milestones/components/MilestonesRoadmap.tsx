import { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { useMilestones } from '../hooks/useMilestones';
import { MilestoneCelebrationModal } from './MilestoneCelebrationModal';
import { Sparkles } from 'lucide-react';
import type { MilestoneItem } from '../types/milestone.types';
import { formatMWh } from '../utils/milestone.utils';
import { getCompanionCommentary } from '../utils/companionCommentary';

interface MilestonesRoadmapProps {
  className?: string;
  selectedMonth?: string;
  milestoneData?: ReturnType<typeof useMilestones>;
  isAdmin?: boolean;
  compact?: boolean;
}

function shouldUseAnimatedEmoji(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) return false;
  if (
    nav.connection?.effectiveType === 'slow-2g' ||
    nav.connection?.effectiveType === '2g'
  ) {
    return false;
  }
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) {
    return false;
  }
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) {
    return false;
  }
  return true;
}

function getMilestoneEmojiMeta(milestone: MilestoneItem): {
  code: '1f973' | '1f614' | '26a1' | '23f3';
  statusText: string;
} {
  if (milestone.state === 'UPCOMING') {
    return { code: '23f3', statusText: 'Upcoming' };
  }
  if (milestone.isAchieved) {
    return { code: '1f973', statusText: 'Goal reached' };
  }
  if (milestone.state === 'CURRENT') {
    return { code: '26a1', statusText: 'In progress' };
  }
  return { code: '1f614', statusText: 'Goal not reached' };
}

function getWeekDisplayLabel(milestone: MilestoneItem): string {
  try {
    if (milestone.startDate && milestone.endDate) {
      const s = new Date(milestone.startDate);
      const e = new Date(milestone.endDate);
      const sMonth = s.toLocaleString('en-US', { month: 'short', timeZone: 'Asia/Manila' });
      const sDay = s.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'Asia/Manila' });
      const eDay = e.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'Asia/Manila' });
      return `${sMonth} ${sDay}–${eDay}`;
    }
  } catch {
    // fallback
  }
  return milestone.dayRangeLabel;
}

export function MilestonesRoadmap({
  className = '',
  selectedMonth: controlledMonth,
  milestoneData: externalHook,
  isAdmin = false,
  compact = false,
}: MilestonesRoadmapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { status: hardwareStatus } = useHardwareStatus();
  const isDisconnected = hardwareStatus === 'disconnected';

  const fallbackHook = useMilestones(controlledMonth);
  const milestoneHook = externalHook ?? fallbackHook;

  const selectedMonth = controlledMonth ?? milestoneHook.selectedMonth;
  const {
    monthLabel,
    monthlyMilestone,
    weeklyMilestones,
    allTimeEnergyMWh,
    allTimeSteps,
    isLoading,
  } = milestoneHook;

  // Selected week item ID ('week_1'..'week_6')
  const [selectedItemId, setSelectedItemId] = useState<string>('week_1');
  const [celebratingMilestone, setCelebratingMilestone] = useState<MilestoneItem | null>(null);
  const [useAnimatedEmoji, setUseAnimatedEmoji] = useState<boolean>(() => shouldUseAnimatedEmoji());
  const lastSyncedMonthRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setUseAnimatedEmoji(shouldUseAnimatedEmoji());
    mq.addEventListener?.('change', handleChange);
    return () => mq.removeEventListener?.('change', handleChange);
  }, []);

  // Only reset selected week when switching months (or if the selected ID doesn't exist yet),
  // never overriding a user's clicked week during background refetches.
  useEffect(() => {
    if (weeklyMilestones.length === 0) return;

    const monthChanged = lastSyncedMonthRef.current !== selectedMonth;
    const selectionStillValid = weeklyMilestones.some((w) => w.id === selectedItemId);

    if (monthChanged || !selectionStillValid) {
      lastSyncedMonthRef.current = selectedMonth;
      const currentWeek = weeklyMilestones.find((w) => w.state === 'CURRENT');
      setSelectedItemId(currentWeek ? currentWeek.id : weeklyMilestones[0].id);
    }
  }, [selectedMonth, weeklyMilestones, selectedItemId]);

  // Active milestone for week inspection
  const activeMilestone = useMemo<MilestoneItem | null>(() => {
    const found = weeklyMilestones.find((w) => w.id === selectedItemId);
    return found || weeklyMilestones[0] || null;
  }, [selectedItemId, weeklyMilestones]);

  const monthEnergy = monthlyMilestone?.currentMWh ?? 0;
  const monthTarget = monthlyMilestone?.targetMWh ?? 0;
  const isMonthGoalConfigured = Boolean(
    milestoneHook.configurationPolicy?.isConfigured ?? (monthTarget > 0),
  );
  const monthSteps = monthlyMilestone?.stepCount ?? 0;
  const monthProgressPct = isMonthGoalConfigured && monthTarget > 0 ? Math.min(100, (monthEnergy / monthTarget) * 100) : 0;
  const achievedCount = isMonthGoalConfigured ? weeklyMilestones.filter((m) => m.isAchieved).length : 0;

  // Compact station coordinates (viewBox 0 0 920 205) eliminating dead vertical space
  const stationCoords = useMemo(() => {
    const count = weeklyMilestones.length || 5;
    if (count === 4) {
      return [
        { x: 140, y: 120 },
        { x: 350, y: 85 },
        { x: 560, y: 125 },
        { x: 770, y: 95 },
      ];
    }
    if (count === 6) {
      return [
        { x: 110, y: 120 },
        { x: 240, y: 85 },
        { x: 370, y: 125 },
        { x: 500, y: 80 },
        { x: 630, y: 125 },
        { x: 770, y: 110 },
      ];
    }
    // Default 5 weeks
    return [
      { x: 130, y: 115 },
      { x: 290, y: 85 },
      { x: 450, y: 125 },
      { x: 610, y: 80 },
      { x: 770, y: 115 },
    ];
  }, [weeklyMilestones.length]);

  // Smooth serpentine road path connecting all station coordinates
  const roadPathD = useMemo(() => {
    if (!stationCoords.length) return '';
    const first = stationCoords[0];
    const last = stationCoords[stationCoords.length - 1];
    let d = `M ${first.x - 65} ${first.y + 10} C ${first.x - 30} ${first.y + 10}, ${first.x - 20} ${first.y}, ${first.x} ${first.y}`;
    for (let i = 0; i < stationCoords.length - 1; i++) {
      const p1 = stationCoords[i];
      const p2 = stationCoords[i + 1];
      const dx = (p2.x - p1.x) * 0.5;
      d += ` C ${p1.x + dx * 0.7} ${p1.y}, ${p2.x - dx * 0.7} ${p2.y}, ${p2.x} ${p2.y}`;
    }
    d += ` L ${last.x + 55} ${last.y}`;
    return d;
  }, [stationCoords]);

  // Active week progress calculation
  const weekEnergy = activeMilestone?.currentMWh ?? 0;
  const weekTarget = isMonthGoalConfigured ? (activeMilestone?.targetMWh ?? 0) : 0;
  const weekProgressPct = weekTarget > 0 ? Math.min(100, (weekEnergy / weekTarget) * 100) : 0;
  const weekSteps = activeMilestone?.stepCount ?? 0;

  // Dynamic witty campus companion observation
  const observation = useMemo(() => {
    if (!activeMilestone) {
      return isDisconnected
        ? {
            headline: 'Connection lost — trying to reconnect to live feed.',
            subtext: 'Connection lost · Reconnecting automatically',
          }
        : {
            headline: 'No footsteps recorded yet. The tile is in standby, waiting for footsteps.',
            subtext: 'Tile in standby · Waiting for footsteps',
          };
    }
    return getCompanionCommentary({
      id: activeMilestone.id,
      label: activeMilestone.label,
      weekNumber: activeMilestone.weekNumber,
      state: activeMilestone.state,
      isAchieved: activeMilestone.isAchieved,
      progressPercentage: weekProgressPct,
      currentMWh: weekEnergy,
      targetMWh: weekTarget,
      stepCount: weekSteps,
      aiComment: activeMilestone.aiComment,
      comparison: activeMilestone.comparison,
      isDisconnected,
    });
  }, [activeMilestone, weekProgressPct, weekEnergy, weekTarget, weekSteps, isDisconnected]);

  return (
    <div className={`flex flex-col gap-3.5 sm:gap-4 ${className}`}>
      {/* ─────────────────────────────────────────────────────────────────────────────
          HERO CARD (Unified Month Goal + 2x2 Metrics + Edge-to-Edge Roadmap Trail)
          Tightly proportioned so entire page fits in viewport without cut-off
          ───────────────────────────────────────────────────────────────────────────── */}
      <section
        className="rounded-[22px] overflow-hidden flex flex-col border shadow-sm transition-colors"
        style={{
          background: isDark ? '#0d2419' : '#e3f2e6',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(13, 27, 20, 0.08)',
        }}
      >
        {/* Top Header Section inside Hero Card (Month Goal + Floating Week Pill + 2x2 Metrics) */}
        <div
          className={`${
            compact
              ? 'px-4 pt-3.5 pb-0 sm:px-5 sm:pt-4 sm:pb-0 gap-3 lg:gap-5'
              : 'px-5 pt-4 pb-0 sm:px-6 sm:pt-5 sm:pb-0 gap-4 lg:gap-8'
          } flex flex-col lg:flex-row items-stretch lg:items-center justify-between`}
        >
          {/* Left Column: Month Goal */}
          <div className="flex flex-col gap-1 max-w-[320px]">
            <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#50665a] dark:text-[#93A89C]">
              {monthLabel} Goal
            </div>

            <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
              <span
                className={`${
                  compact ? 'text-[28px] sm:text-[34px]' : 'text-[36px] sm:text-[46px]'
                } font-[500] tracking-[-0.03em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : formatMWh(monthEnergy, 5)}
              </span>
              <span className="text-[14px] sm:text-[16px] font-medium text-[#087A3A] dark:text-[#19D46A]">
                mWh
              </span>
              <span className="text-[12px] sm:text-[13px] text-[#50665a] dark:text-[#93A89C] font-normal">
                {isMonthGoalConfigured && monthTarget > 0
                  ? `of ${formatMWh(monthTarget, 5)} mWh`
                  : '· No goal set yet'}
              </span>
            </div>

            {/* Sleek Progress Track */}
            <div
              role="progressbar"
              aria-valuenow={monthProgressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${monthLabel} progress`}
              className="h-1.5 w-full max-w-[260px] rounded-full overflow-hidden bg-white/80 dark:bg-white/20 shadow-inner"
            >
              <div
                style={{ width: `${monthProgressPct}%` }}
                className="h-full bg-[#16a34a] rounded-full transition-all duration-700"
              />
            </div>

            {/* Everyday real-world LED light comparison (~20 mW indicator LED = 180 sec per mWh) */}
            <p className="m-0 text-[11px] text-[#50665a] dark:text-[#93A89C]">
              {monthEnergy > 0
                ? (() => {
                    const ledSeconds = Math.max(1, Math.round(monthEnergy * 180));
                    return ledSeconds >= 60
                      ? `Enough to light a small LED for ~${(ledSeconds / 60).toFixed(1)} min`
                      : `Enough to light a small LED for ~${ledSeconds} sec`;
                  })()
                : '~50 footsteps lights a small LED for ~1 sec'}
            </p>
          </div>

          {/* Right Column: 2x2 Key Metrics Grid */}
          <div className={`grid grid-cols-2 ${compact ? 'gap-x-5 gap-y-1.5' : 'gap-x-6 sm:gap-x-10 gap-y-2'}`}>
            <div className="flex flex-col">
              <span
                className={`${compact ? 'text-[16px] sm:text-[18px]' : 'text-[18px] sm:text-[22px]'} font-[500] tracking-[-0.02em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : monthSteps.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#50665a] dark:text-[#93A89C] mt-0.5">
                steps this month
              </span>
            </div>

            <div className="flex flex-col">
              <span
                className={`${compact ? 'text-[16px] sm:text-[18px]' : 'text-[18px] sm:text-[22px]'} font-[500] tracking-[-0.02em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {achievedCount}{' '}
                <span className="text-xs font-normal text-[#50665a] dark:text-[#93A89C]">
                  / {weeklyMilestones.length}
                </span>
              </span>
              <span className="text-[11px] text-[#50665a] dark:text-[#93A89C] mt-0.5">
                weeks reached
              </span>
            </div>

            <div className="flex flex-col">
              <span
                className={`${compact ? 'text-[16px] sm:text-[18px]' : 'text-[18px] sm:text-[22px]'} font-[500] tracking-[-0.02em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : formatMWh(allTimeEnergyMWh, 5)}
              </span>
              <span className="text-[11px] text-[#50665a] dark:text-[#93A89C] mt-0.5">
                lifetime mWh
              </span>
            </div>

            <div className="flex flex-col">
              <span
                className={`${compact ? 'text-[16px] sm:text-[18px]' : 'text-[18px] sm:text-[22px]'} font-[500] tracking-[-0.02em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : allTimeSteps.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#50665a] dark:text-[#93A89C] mt-0.5">
                lifetime steps
              </span>
            </div>
          </div>
        </div>

        {/* Edge-to-edge Winding Trail Landscape SVG */}
        <div
          className="w-full overflow-x-auto select-none mt-0.5 scrollbar-none touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="min-w-[560px] sm:min-w-0 w-full">
            <svg
              role="group"
              aria-label={`${selectedMonth} milestone trail`}
              viewBox="0 0 920 205"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto block select-none outline-none"
              style={{ fontFamily: 'var(--font-dm), sans-serif', outline: 'none' }}
            >
              <g aria-hidden="true">
                {/* Cute White Clouds Floating in Sky */}
                <g transform="translate(260, 20)" opacity={isDark ? '0.2' : '0.75'}>
                  <ellipse cx="16" cy="14" rx="16" ry="9" fill="#ffffff" />
                  <ellipse cx="36" cy="11" rx="20" ry="11" fill="#ffffff" />
                  <ellipse cx="56" cy="14" rx="15" ry="9" fill="#ffffff" />
                </g>

                <g transform="translate(680, 16)" opacity={isDark ? '0.2' : '0.75'}>
                  <ellipse cx="14" cy="12" rx="15" ry="8" fill="#ffffff" />
                  <ellipse cx="32" cy="9" rx="18" ry="10" fill="#ffffff" />
                  <ellipse cx="50" cy="12" rx="13" ry="8" fill="#ffffff" />
                </g>

                {/* Layer 1: Back Rolling Hill */}
                <path
                  d="M 0 90 C 180 60, 360 95, 540 75 C 720 55, 850 90, 920 90 L 920 205 L 0 205 Z"
                  fill={isDark ? '#113022' : '#d7ede0'}
                />

                {/* Layer 2: Front Rolling Hill */}
                <path
                  d="M 0 120 C 160 95, 320 135, 480 115 C 640 95, 780 135, 920 120 L 920 205 L 0 205 Z"
                  fill={isDark ? '#163d2b' : '#c6e4d2'}
                />

                {/* Winding Road White Ribbon */}
                <path
                  d={roadPathD}
                  fill="none"
                  stroke={isDark ? '#1c4530' : '#ffffff'}
                  strokeOpacity={isDark ? 0.95 : 0.9}
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dotted Centerline (Conduit) */}
                <path
                  d={roadPathD}
                  fill="none"
                  stroke={isDark ? '#22c55e' : '#8fc4a5'}
                  strokeWidth="3"
                  strokeDasharray="1 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Green Start Flag */}
                {stationCoords.length > 0 && (
                  <g>
                    <line
                      x1={stationCoords[0].x - 55}
                      y1={stationCoords[0].y - 10}
                      x2={stationCoords[0].x - 55}
                      y2={stationCoords[0].y + 16}
                      stroke={isDark ? '#19D46A' : '#087A3A'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M ${stationCoords[0].x - 55} ${stationCoords[0].y - 10} L ${stationCoords[0].x - 38} ${stationCoords[0].y - 4} L ${stationCoords[0].x - 55} ${stationCoords[0].y + 2} Z`}
                      fill={isDark ? '#19D46A' : '#087A3A'}
                    />
                  </g>
                )}
              </g>

              {/* Dynamic Milestone Stations (Weeks 1 to 5) */}
              {weeklyMilestones.map((milestone, idx) => {
                const coords = stationCoords[idx] || { x: 130 + idx * 160, y: 115 };
                const { x, y } = coords;
                const isSelected = activeMilestone?.id === milestone.id;
                const isCurrent = milestone.state === 'CURRENT';
                const isAchieved = milestone.isAchieved;
                const isPastMissed = milestone.state === 'COMPLETED' && !isAchieved;
                const emojiMeta = getMilestoneEmojiMeta(milestone);
                const emojiSrc = `/emojis/${emojiMeta.code}.${useAnimatedEmoji ? 'webp' : 'svg'}`;
                const nodeRadius = isSelected || isCurrent ? 20 : 18;
                const emojiSize = isSelected || isCurrent ? 25 : 22;

                const circleFill = isAchieved
                  ? isDark
                    ? '#14532d'
                    : '#dcfce7'
                  : isCurrent
                  ? isDark
                    ? '#14532d'
                    : '#dcfce7'
                  : isPastMissed
                  ? isDark
                    ? '#2a1f12'
                    : '#fef3c7'
                  : isDark
                  ? '#12241a'
                  : '#ffffff';

                const circleStroke = isAchieved || isCurrent
                  ? isDark
                    ? '#22c55e'
                    : '#16a34a'
                  : isPastMissed
                  ? isDark
                    ? '#d97706'
                    : '#f59e0b'
                  : isSelected
                  ? isDark
                    ? '#22c55e'
                    : '#087A3A'
                  : isDark
                  ? '#2a543d'
                  : '#9ccdb0';

                const cardY = y + 26;

                return (
                  <g
                    key={milestone.id}
                    onClick={() => setSelectedItemId(milestone.id)}
                    style={{
                      cursor: 'pointer',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    className="group outline-none focus:outline-none focus-visible:outline-none select-none transition-opacity hover:opacity-90"
                    role="button"
                    aria-label={`Select ${milestone.label} (${emojiMeta.statusText})`}
                    aria-pressed={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedItemId(milestone.id);
                      }
                    }}
                  >
                    <title>{`${milestone.label} · ${emojiMeta.statusText}`}</title>
                    {/* Generous transparent hit target covering both node circle and Week label card */}
                    <rect
                      x={x - 42}
                      y={y - 30}
                      width="84"
                      height="90"
                      rx="12"
                      fill="transparent"
                    />
                    {/* Outer Dashed Halo for Active / Selected Station */}
                    {(isSelected || isCurrent) && (
                      <circle
                        cx={x}
                        cy={y}
                        r="26"
                        fill="none"
                        stroke={
                          isPastMissed && !isCurrent
                            ? isDark
                              ? '#f59e0b'
                              : '#d97706'
                            : isDark
                            ? '#22c55e'
                            : '#087A3A'
                        }
                        strokeOpacity="0.5"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Station Node Circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={nodeRadius}
                      fill={circleFill}
                      stroke={circleStroke}
                      strokeWidth="2.5"
                      className="transition-all duration-300"
                    />

                    {/* Google Noto Emoji (Animated WebP on high-end devices, static SVG on low-end / reduced-motion) */}
                    <image
                      href={emojiSrc}
                      x={x - emojiSize / 2}
                      y={y - emojiSize / 2}
                      width={emojiSize}
                      height={emojiSize}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ pointerEvents: 'none' }}
                    />

                    {/* Tooltip Badge: 'You are here' or 'Selected' */}
                    {(isCurrent || isSelected) && (
                      <g className="transition-all duration-300">
                        <rect
                          x={x - 40}
                          y={y - 54}
                          width="80"
                          height="22"
                          rx="11"
                          fill={isDark ? '#16a34a' : '#087A3A'}
                        />
                        <path
                          d={`M${x - 4} ${y - 33} L${x} ${y - 27} L${x + 4} ${y - 33} Z`}
                          fill={isDark ? '#16a34a' : '#087A3A'}
                        />
                        <text
                          x={x}
                          y={y - 39}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="500"
                          letterSpacing="-0.01em"
                          fill="#ffffff"
                          fontFamily="'DM Sans', sans-serif"
                        >
                          {isCurrent ? 'You are here' : 'Selected'}
                        </text>
                      </g>
                    )}

                    {/* Station Card Below Node */}
                    <rect
                      x={x - 36}
                      y={cardY}
                      width="72"
                      height="28"
                      rx="7"
                      fill={isDark ? '#12241a' : '#ffffff'}
                      fillOpacity="0.95"
                      stroke={
                        isSelected
                          ? isDark
                            ? '#22c55e'
                            : '#087A3A'
                          : isDark
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(13,27,20,0.06)'
                      }
                      strokeWidth={isSelected ? '2' : '1'}
                      className="transition-all duration-300"
                    />
                    <text
                      x={x}
                      y={cardY + 18}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="500"
                      letterSpacing="-0.02em"
                      fill={isDark ? '#f0fdf4' : '#0D1B14'}
                      fontFamily="'DM Sans', sans-serif"
                    >
                      Week {milestone.weekNumber}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Option A: Slim Inline Footer Strip Inside the Journey Card (Compact / Central Mode) */}
        {compact && activeMilestone && (
          <div
            className="px-4 py-2.5 sm:px-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t text-xs"
            style={{
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(13, 27, 20, 0.08)',
              background: isDark ? 'rgba(7, 20, 14, 0.45)' : 'rgba(255, 255, 255, 0.45)',
            }}
          >
            {/* Left: Week label + status pill */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-[#0D1B14] dark:text-[#E4F7EA]">
                {activeMilestone.label} · {getWeekDisplayLabel(activeMilestone)}
              </span>
              {activeMilestone.isAchieved ? (
                <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full px-2 py-0.5 border border-emerald-500/30">
                  Completed
                </span>
              ) : activeMilestone.state === 'CURRENT' ? (
                <span
                  className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-[#fff4d6] text-[#8a5a00]'
                  }`}
                >
                  In progress
                </span>
              ) : activeMilestone.state === 'COMPLETED' ? (
                <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 text-[#50665a] dark:text-[#93A89C]">
                  Not reached
                </span>
              ) : (
                <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 text-[#50665a] dark:text-[#93A89C]">
                  Upcoming
                </span>
              )}
            </div>

            {/* Middle: Energy + inline progress bar */}
            <div className="flex items-center gap-2.5 flex-1 min-w-[190px] max-w-[380px]">
              <span className="tabular-nums whitespace-nowrap">
                <strong className="font-semibold text-[#0D1B14] dark:text-[#E4F7EA]">
                  {isLoading ? '...' : formatMWh(weekEnergy, 5)}
                </strong>
                <span className="text-[#50665a] dark:text-[#93A89C]">
                  {isMonthGoalConfigured && weekTarget > 0
                    ? ` / ${formatMWh(weekTarget, 5)} mWh`
                    : ' mWh · No goal set yet'}
                </span>
              </span>

              <div
                role="progressbar"
                aria-valuenow={weekProgressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${activeMilestone.label} progress`}
                className="h-1.5 flex-1 min-w-[60px] rounded-full overflow-hidden bg-black/10 dark:bg-white/15"
              >
                <div
                  style={{ width: `${weekProgressPct}%` }}
                  className="h-full bg-[#16a34a] rounded-full transition-all duration-700"
                />
              </div>
            </div>

            {/* Right: Footsteps + optional Admin Replay */}
            <div className="flex items-center gap-2.5 shrink-0 text-[#50665a] dark:text-[#93A89C] tabular-nums">
              <span>{weekSteps.toLocaleString()} footsteps</span>
              {isAdmin && activeMilestone.isAchieved && (
                <button
                  type="button"
                  onClick={() => setCelebratingMilestone(activeMilestone)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--acc)] hover:opacity-80 cursor-pointer"
                  title="Replay celebration"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SELECTED WEEK INSPECTION CARD (Hidden in compact Central mode since it floats on the hero)
          ───────────────────────────────────────────────────────────────────────────── */}
      {!compact && activeMilestone && (
        <section className="cd !py-3.5 !px-5 sm:!py-4 sm:!px-6 flex flex-col gap-3 font-sans">
          {/* Header Row: Title + Status + Celebration button (Admins only) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="m-0 text-base sm:text-lg font-semibold tracking-tight text-[var(--t)] font-sans">
                {activeMilestone.label} · {getWeekDisplayLabel(activeMilestone)}
              </h2>
              {activeMilestone.isAchieved ? (
                <span className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                  Completed
                </span>
              ) : activeMilestone.state === 'CURRENT' ? (
                <span
                  className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-[#fff4d6] text-[#8a5a00]'
                  }`}
                >
                  In progress
                </span>
              ) : activeMilestone.state === 'COMPLETED' ? (
                <span className="text-[11px] font-medium rounded-full px-2.5 py-0.5 bg-[var(--soft)] text-[var(--mu)] border border-[var(--line)]">
                  Not reached
                </span>
              ) : (
                <span className="text-[11px] font-medium rounded-full px-2.5 py-0.5 bg-[var(--soft)] text-[var(--mu)] border border-[var(--line)]">
                  Upcoming
                </span>
              )}
            </div>

            {/* Replay Celebration Button - only shown to Admins when the week has actually reached its goal */}
            {isAdmin && activeMilestone.isAchieved && (
              <button
                type="button"
                onClick={() => setCelebratingMilestone(activeMilestone)}
                className="min-h-[30px] px-3 rounded-full border border-[var(--acc)] text-xs font-semibold text-[var(--acc)] hover:bg-[var(--mint)] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Replay celebration</span>
              </button>
            )}
          </div>

          {/* Week Progress Bar and Readings - DM Sans tabular-nums */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
              <span
                className="text-xl sm:text-2xl font-[500] tracking-[-0.03em] leading-none text-[var(--t)] tabular-nums font-sans"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : formatMWh(weekEnergy, 3)}
              </span>
              <span className="text-sm font-medium text-[var(--acc)] font-sans">
                mWh
              </span>
              <span className="text-xs text-[var(--mu)] font-sans">
                {isMonthGoalConfigured && weekTarget > 0
                  ? `of ${formatMWh(weekTarget, 3)} mWh`
                  : '· No goal set yet'}
              </span>

              {/* Comparative week-over-week telemetry badge */}
              {activeMilestone.comparison && activeMilestone.comparison.energyChangePct !== null && (
                <span
                  className={`ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border tabular-nums ${
                    activeMilestone.comparison.energyChangePct > 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : activeMilestone.comparison.energyChangePct < 0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-[var(--soft)] text-[var(--mu)] border-[var(--line)]'
                  }`}
                >
                  {activeMilestone.comparison.energyChangePct > 0 ? '+' : ''}
                  {activeMilestone.comparison.energyChangePct}% vs last week
                </span>
              )}
              {activeMilestone.comparison?.category === 'RECORD_HIGH' && (
                <span className="ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  New weekly record
                </span>
              )}
            </div>

            <div
              role="progressbar"
              aria-valuenow={weekProgressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${activeMilestone.label} progress`}
              className="h-1.5 sm:h-2 rounded-full overflow-hidden border border-[var(--line)] bg-[var(--progress-track)]"
            >
              <div
                style={{ width: `${weekProgressPct}%` }}
                className="h-full bg-[var(--bar)] rounded-full transition-all duration-700"
              />
            </div>
          </div>

          {/* Intelligent Campus Companion Observation Card */}
          <div className="bg-[var(--soft)] rounded-xl py-2 px-3 sm:py-2.5 sm:px-3.5 flex items-start gap-2.5 border border-[var(--line)]">
            <Sparkles className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="m-0 text-xs sm:text-[13px] font-medium leading-snug text-[var(--t)] font-sans">
                {observation.headline}
              </p>
              <p className="m-0 text-[11px] text-[var(--mu)] leading-relaxed font-sans tabular-nums">
                {observation.subtext}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Celebration Modal */}
      {celebratingMilestone && (
        <MilestoneCelebrationModal
          isOpen={!!celebratingMilestone}
          onClose={() => setCelebratingMilestone(null)}
          milestone={celebratingMilestone}
        />
      )}
    </div>
  );
}
