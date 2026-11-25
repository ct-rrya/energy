import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Footprints,
  Radio,
  Gauge,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import type { FatigueRadar } from '@/types/diagnostic.types';

interface FatigueDriftRadarCardProps {
  radar?: FatigueRadar;
  isLoading?: boolean;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * FatigueDriftRadarCard
 *
 * Passive continuous tile health & mechanical wear radar:
 * - 7-day vs 30-day per-step efficiency drift percentage
 * - 14-day mWh/step curve plotted against dashed 30-day baseline reference
 * - Cumulative lifetime wear counter, 24h upload count, latency, and last heartbeat
 */
export function FatigueDriftRadarCard({ radar, isLoading }: FatigueDriftRadarCardProps) {
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    if (!radar?.dailyTrend?.length) return [];
    return radar.dailyTrend.map((pt) => {
      const parsed = new Date(`${pt.date}T00:00:00`);
      return {
        ...pt,
        label: isNaN(parsed.getTime()) ? pt.date : format(parsed, 'MMM d'),
      };
    });
  }, [radar]);

  if (isLoading && !radar) {
    return (
      <div className="cd p-5 sm:p-6 animate-pulse space-y-4">
        <div className="h-5 w-52 rounded bg-[var(--soft)]" />
        <div className="h-44 rounded-2xl bg-[var(--soft)]" />
      </div>
    );
  }

  const drift = radar?.driftPercent ?? 0;
  const driftStatus = radar?.driftStatus ?? 'insufficient_data';
  const baseline = radar?.baseline30dMWhPerStep ?? 0;
  const recent7d = radar?.recent7dMWhPerStep ?? 0;

  const driftBadge =
    driftStatus === 'degrading'
      ? {
          icon: TrendingDown,
          text: `${drift}% Wear Alert`,
          cls: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/25',
        }
      : driftStatus === 'watch'
        ? {
            icon: TrendingDown,
            text: `${drift}% Mild Drift`,
            cls: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25',
          }
        : driftStatus === 'improving'
          ? {
              icon: TrendingUp,
              text: `+${drift}% Above Baseline`,
              cls: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
            }
          : driftStatus === 'stable'
            ? {
                icon: Minus,
                text: `${drift >= 0 ? '+' : ''}${drift}% Stable`,
                cls: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
              }
            : {
                icon: Minus,
                text: 'Collecting 7-day data',
                cls: 'bg-[var(--soft)] text-[var(--mu)] border-[var(--line)]',
              };

  const DriftIcon = driftBadge.icon;
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(13,27,20,0.09)';
  const axisColor = theme === 'dark' ? '#93A89C' : '#5B6B62';
  const strokeColor =
    driftStatus === 'degrading'
      ? '#F43F5E'
      : driftStatus === 'watch'
        ? '#F59E0B'
        : '#10B981';

  return (
    <section
      className="cd !p-5 sm:!p-6 flex flex-col gap-5"
      aria-label="Passive Tile Fatigue and Drift Radar"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] sm:text-[18px] font-bold tracking-tight text-[var(--t)] m-0">
              Passive Fatigue & Drift Radar
            </h2>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${driftBadge.cls}`}
            >
              <DriftIcon className="w-3 h-3" />
              {driftBadge.text}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[var(--mu)] mt-1 m-0">
            Continuously compares your 7-day average yield (
            <strong className="text-[var(--t)] tabular-nums">{recent7d.toFixed(4)} mWh/step</strong>) against your 30-day baseline (
            <strong className="text-[var(--t)] tabular-nums">{baseline.toFixed(4)} mWh/step</strong>) — zero manual testing required.
          </p>
        </div>
      </div>

      {/* 14-Day Efficiency Trend Chart */}
      <div className="w-full h-[210px] rounded-2xl border border-[var(--line)] bg-[var(--soft)]/40 p-3">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="fatigueDriftGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="label"
                stroke={axisColor}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={58}
                tickFormatter={(v) => Number(v).toFixed(4)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#102218' : '#FFFFFF',
                  borderColor: 'var(--line)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any) => {
                  if (name === 'mWhPerStep') return [`${Number(val).toFixed(5)} mWh/step`, 'Yield'];
                  return [val, name];
                }}
                labelFormatter={(label, payload) => {
                  const pt = payload?.[0]?.payload;
                  return pt
                    ? `${label} • ${pt.steps} steps • ${pt.avgVoltageV}V / ${pt.avgCurrentMA}mA`
                    : String(label);
                }}
              />
              {baseline > 0 && (
                <ReferenceLine
                  y={baseline}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  label={{
                    value: '30d Baseline',
                    position: 'insideTopRight',
                    fill: axisColor,
                    fontSize: 10,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="mWhPerStep"
                stroke={strokeColor}
                strokeWidth={2.2}
                fill="url(#fatigueDriftGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-sm font-semibold text-[var(--t)] m-0">
              No 14-day efficiency trend points yet
            </p>
            <p className="text-xs text-[var(--mu)] mt-1 m-0">
              As footsteps upload from the ESP32, this radar automatically tracks mechanical fatigue and drift.
            </p>
          </div>
        )}
      </div>

      {/* Compact Telemetry & Mechanical Wear Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-[var(--soft)]/70 border border-[var(--line)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
            <Footprints className="w-3.5 h-3.5 text-[var(--acc)]" />
            Lifetime Wear
          </div>
          <div className="text-base font-bold tabular-nums text-[var(--t)] mt-1">
            {(radar?.totalLifetimeSteps ?? 0).toLocaleString()} steps
          </div>
          <div className="text-[11px] text-[var(--mu)]">
            {(radar?.stepsLast7d ?? 0).toLocaleString()} in last 7d
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--soft)]/70 border border-[var(--line)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
            <Radio className="w-3.5 h-3.5 text-[var(--acc)]" />
            24h Telemetry
          </div>
          <div className="text-base font-bold tabular-nums text-[var(--t)] mt-1">
            {radar?.readingsLast24h ?? 0} uploads
          </div>
          <div className="text-[11px] text-[var(--mu)]">
            {100 - (radar?.poorSignalRatioPercent ?? 0)}% strong signal
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--soft)]/70 border border-[var(--line)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
            <Gauge className="w-3.5 h-3.5 text-[var(--acc)]" />
            Cloud Latency
          </div>
          <div className="text-base font-bold tabular-nums text-[var(--t)] mt-1">
            {radar?.avgLatencyMs ? `${radar.avgLatencyMs} ms` : 'Nominal'}
          </div>
          <div className="text-[11px] text-[var(--mu)]">
            ESP32 → Server delta
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--soft)]/70 border border-[var(--line)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
            <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
            Last Heartbeat
          </div>
          <div className="text-base font-bold tabular-nums text-[var(--t)] mt-1">
            {formatRelativeTime(radar?.lastReadingAt ?? null)}
          </div>
          <div className="text-[11px] text-[var(--mu)]">
            {radar?.electricalSnapshot?.latestVoltageV
              ? `${radar.electricalSnapshot.latestVoltageV}V • ${radar.electricalSnapshot.latestCurrentMA}mA`
              : 'Waiting for upload'}
          </div>
        </div>
      </div>
    </section>
  );
}
