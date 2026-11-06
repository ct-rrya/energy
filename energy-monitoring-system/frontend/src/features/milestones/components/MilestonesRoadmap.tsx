import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
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
}: MilestonesRoadmapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  // When selectedMonth changes, default to current week or week_1
  useEffect(() => {
    if (weeklyMilestones.length > 0) {
      const currentWeek = weeklyMilestones.find((w) => w.state === 'CURRENT');
      setSelectedItemId(currentWeek ? currentWeek.id : weeklyMilestones[0].id);
    } else {
      setSelectedItemId('week_1');
    }
  }, [selectedMonth, weeklyMilestones]);

  // Active milestone for week inspection
  const activeMilestone = useMemo<MilestoneItem | null>(() => {
    const found = weeklyMilestones.find((w) => w.id === selectedItemId);
    return found || weeklyMilestones[0] || null;
  }, [selectedItemId, weeklyMilestones]);

  const monthEnergy = monthlyMilestone?.currentMWh ?? 0;
  const monthTarget = monthlyMilestone?.targetMWh ?? 0.1;
  const monthSteps = monthlyMilestone?.stepCount ?? 0;
  const monthProgressPct = monthTarget > 0 ? Math.min(100, (monthEnergy / monthTarget) * 100) : 0;
  const achievedCount = weeklyMilestones.filter((m) => m.isAchieved).length;

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
  const weekTarget = activeMilestone?.targetMWh ?? 0.025;
  const weekProgressPct = weekTarget > 0 ? Math.min(100, (weekEnergy / weekTarget) * 100) : 0;
  const weekSteps = activeMilestone?.stepCount ?? 0;

  // Dynamic witty campus companion observation
  const observation = useMemo(() => {
    if (!activeMilestone) {
      return {
        headline: 'Tile is awake and ready, but the hallway seems suspiciously quiet.',
        subtext: 'Tile in standby · Waiting for pedestrian steps',
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
    });
  }, [activeMilestone, weekProgressPct, weekEnergy, weekTarget, weekSteps]);

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
        {/* Top Header Section inside Hero Card (Month Goal + 2x2 Metrics) */}
        <div className="px-5 pt-4 pb-0 sm:px-6 sm:pt-5 sm:pb-0 flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch lg:items-center justify-between">
          {/* Left Column: Month Goal */}
          <div className="flex flex-col gap-1.5 max-w-[340px]">
            <div className="text-[11px] sm:text-[12px] font-semibold tracking-[0.08em] uppercase text-[#50665a] dark:text-[#93A89C]">
              {monthLabel} Goal
            </div>

            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
              <span
                className="text-[36px] sm:text-[46px] font-[500] tracking-[-0.03em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : formatMWh(monthEnergy)}
              </span>
              <span className="text-[16px] sm:text-[18px] font-medium text-[#087A3A] dark:text-[#19D46A]">
                mWh
              </span>
              <span className="text-[13px] sm:text-[14px] text-[#50665a] dark:text-[#93A89C] font-normal">
                of {formatMWh(monthTarget)} mWh
              </span>
            </div>

            {/* Sleek Progress Track */}
            <div
              role="progressbar"
              aria-valuenow={monthProgressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${monthLabel} progress`}
              className="h-1.5 w-full max-w-[280px] rounded-full overflow-hidden bg-white/80 dark:bg-white/20 shadow-inner"
            >
              <div
                style={{ width: `${monthProgressPct}%` }}
                className="h-full bg-[#16a34a] rounded-full transition-all duration-700"
              />
            </div>
          </div>

          {/* Right Column: 2x2 Key Metrics Grid - matching main dashboard typography (DM Sans, 500, tabular-nums, -0.02em) */}
          <div className="grid grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-2">
            <div className="flex flex-col">
              <span
                className="text-[18px] sm:text-[22px] font-[500] tracking-[-0.02em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : monthSteps.toLocaleString()}
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#50665a] dark:text-[#93A89C] mt-0.5">
                steps this month
              </span>
            </div>

            <div className="flex flex-col">
              <span
                className="text-[18px] sm:text-[22px] font-[500] tracking-[-0.02em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {achievedCount}{' '}
                <span className="text-xs font-normal text-[#50665a] dark:text-[#93A89C]">
                  / {weeklyMilestones.length}
                </span>
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#50665a] dark:text-[#93A89C] mt-0.5">
                weeks reached
              </span>
            </div>

            <div className="flex flex-col">
              <span
                className="text-[18px] sm:text-[22px] font-[500] tracking-[-0.02em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : formatMWh(allTimeEnergyMWh, 3)}
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#50665a] dark:text-[#93A89C] mt-0.5">
                lifetime mWh
              </span>
            </div>

            <div className="flex flex-col">
              <span
                className="text-[18px] sm:text-[22px] font-[500] tracking-[-0.02em] leading-none text-[#0D1B14] dark:text-[#E4F7EA] tabular-nums"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isLoading ? '...' : allTimeSteps.toLocaleString()}
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#50665a] dark:text-[#93A89C] mt-0.5">
                lifetime steps
              </span>
            </div>
          </div>
        </div>

        {/* Edge-to-edge Winding Trail Landscape SVG (Touch-friendly horizontal scroll on narrow mobile, edge-to-edge on tablet/desktop) */}
        <div
          className="w-full overflow-x-auto select-none mt-1 scrollbar-none touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="min-w-[560px] sm:min-w-0 w-full">
            <svg
              role="img"
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

                const circleFill = isAchieved
                  ? '#16a34a'
                  : isSelected || isCurrent
                  ? isDark
                    ? '#16a34a'
                    : '#087A3A'
                  : isDark
                  ? '#12241a'
                  : '#ffffff';

                const circleStroke = isAchieved
                  ? '#16a34a'
                  : isSelected || isCurrent
                  ? isDark
                    ? '#22c55e'
                    : '#087A3A'
                  : isDark
                  ? '#2a543d'
                  : '#9ccdb0';

                const textFill = isAchieved || isSelected || isCurrent
                  ? '#ffffff'
                  : isDark
                  ? '#94a3b8'
                  : '#50665a';

                const cardY = y + 24;

                return (
                  <g
                    key={milestone.id}
                    onClick={() => setSelectedItemId(milestone.id)}
                    style={{ cursor: 'pointer', outline: 'none' }}
                    className="outline-none focus:outline-none focus-visible:outline-none focus:ring-0 select-none"
                    role="button"
                    aria-label={`Select ${milestone.label}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedItemId(milestone.id);
                      }
                    }}
                  >
                    {/* Outer Dashed Halo for Active / Selected Station */}
                    {(isSelected || isCurrent) && (
                      <circle
                        cx={x}
                        cy={y}
                        r="25"
                        fill="none"
                        stroke={isDark ? '#22c55e' : '#087A3A'}
                        strokeOpacity="0.45"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Station Node Circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected || isCurrent ? '18' : '16'}
                      fill={circleFill}
                      stroke={circleStroke}
                      strokeWidth={isSelected || isCurrent ? '2.5' : '2.5'}
                      className="transition-all duration-300"
                    />

                    {/* Week Number inside Node Circle */}
                    <text
                      x={x}
                      y={y + 5}
                      textAnchor="middle"
                      fontSize={isSelected || isCurrent ? '15' : '13'}
                      fontWeight="500"
                      letterSpacing="-0.02em"
                      fill={textFill}
                      fontFamily="'DM Sans', sans-serif"
                    >
                      {milestone.weekNumber}
                    </text>

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
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SELECTED WEEK INSPECTION CARD (Compact, fitting comfortably in viewport)
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeMilestone && (
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
              ) : (
                <span className="text-[11px] font-medium rounded-full px-2.5 py-0.5 bg-[var(--soft)] text-[var(--mu)] border border-[var(--line)]">
                  Upcoming
                </span>
              )}
            </div>

            {/* Preview Celebration Action Button - ONLY rendered for Admin users, hidden on Public UI */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setCelebratingMilestone(activeMilestone)}
                className="min-h-[30px] px-3 rounded-full border border-[var(--acc)] text-xs font-semibold text-[var(--acc)] hover:bg-[var(--mint)] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeMilestone.isAchieved ? 'Replay celebration' : 'Preview celebration'}</span>
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
                {isLoading ? '...' : formatMWh(weekEnergy)}
              </span>
              <span className="text-sm font-medium text-[var(--acc)] font-sans">
                mWh
              </span>
              <span className="text-xs text-[var(--mu)] font-sans">
                of {formatMWh(weekTarget)} mWh
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
