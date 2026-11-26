import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Cpu,
  Footprints,
  Info,
  ShieldAlert,
  Wrench,
  Zap,
  BatteryCharging,
  ChevronRight,
} from 'lucide-react';
import type {
  DiagnosticInsights,
  FaultSignatureCode,
  PipelineStage,
  PipelineStageStatus,
} from '@/types/diagnostic.types';

const FAULT_BADGE_LABELS: Record<FaultSignatureCode, string> = {
  NOMINAL: 'All Clear',
  NO_RECENT_TELEMETRY: 'Tile Idle',
  WEAK_PIEZO_OUTPUT: 'Check Tile Wiring',
  OPEN_LOAD_LOW_CURRENT: 'Loose Terminal / Open Circuit',
  STEP_COUNTER_MISMATCH: 'Step Counter Issue',
  EFFICIENCY_DRIFT: 'Tile Wear Notice',
  UNSTABLE_TELEMETRY: 'Weak Wi-Fi',
  ELEVATED_SPIKE: 'High Spike',
};

interface HardwarePipelineCardProps {
  insights?: DiagnosticInsights;
  isLoading?: boolean;
  onJumpToBench?: () => void;
}

const STAGE_ICONS: Record<PipelineStage['id'], typeof Footprints> = {
  piezo: Footprints,
  electrical: Zap,
  energy: BatteryCharging,
  esp32: Cpu,
  cloud: Cloud,
};

function getStageStyles(status: PipelineStageStatus) {
  switch (status) {
    case 'ok':
      return {
        dot: 'bg-emerald-500',
        ring: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500',
        pill: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
        label: 'Healthy',
      };
    case 'warn':
      return {
        dot: 'bg-amber-500',
        ring: 'border-amber-500/40 bg-amber-500/12 text-amber-500',
        pill: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
        label: 'Warning',
      };
    case 'fail':
      return {
        dot: 'bg-rose-500',
        ring: 'border-rose-500/40 bg-rose-500/12 text-rose-500',
        pill: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
        label: 'Fault',
      };
    default:
      return {
        dot: 'bg-slate-400',
        ring: 'border-[var(--line)] bg-[var(--soft)] text-[var(--mu)]',
        pill: 'bg-[var(--soft)] text-[var(--mu)]',
        label: 'Standby',
      };
  }
}

/**
 * HardwarePipelineCard
 *
 * Displays:
 * 1. Composite 0-100 Tile Health Score & 3-pillar breakdown (Harvesting / Consistency / Telemetry)
 * 2. Interactive 5-stage Hardware Pipeline Schematic (Piezo -> V/I Sensor -> Energy -> ESP32 -> Cloud)
 * 3. Electrical Fault-Signature Diagnosis & Technician Inspection Checklist
 */
export function HardwarePipelineCard({
  insights,
  isLoading,
  onJumpToBench,
}: HardwarePipelineCardProps) {
  const [selectedStageId, setSelectedStageId] = useState<PipelineStage['id'] | null>(null);

  if (isLoading && !insights) {
    return (
      <div className="cd p-5 sm:p-6 animate-pulse space-y-4">
        <div className="h-6 w-56 rounded bg-[var(--soft)]" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-[var(--soft)]" />
          ))}
        </div>
        <div className="h-20 rounded-2xl bg-[var(--soft)]" />
      </div>
    );
  }

  const score = insights?.healthScore ?? 0;
  const status = insights?.status ?? 'offline';
  const breakdown = insights?.scoreBreakdown ?? { harvesting: 0, consistency: 0, telemetry: 0 };
  const stages = insights?.pipelineStages ?? [];
  const diagnosis = insights?.faultDiagnosis;

  const activeStage = stages.find((s) => s.id === selectedStageId) ?? null;

  // Circular score gauge geometry
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  const scoreStroke =
    status === 'healthy'
      ? '#10B981'
      : status === 'degraded'
        ? '#F59E0B'
        : status === 'attention'
          ? '#F43F5E'
          : '#94A3B8';

  const statusBadge =
    status === 'healthy'
      ? { label: 'Working Normally', cls: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' }
      : status === 'degraded'
        ? { label: 'Needs Checkup', cls: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25' }
        : status === 'attention'
          ? { label: 'Check Hardware', cls: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/25' }
          : { label: 'Idle / Standby', cls: 'bg-[var(--soft)] text-[var(--mu)] border-[var(--line)]' };

  const diagStyles =
    diagnosis?.severity === 'critical'
      ? {
          wrap: 'border-rose-500/30 bg-rose-500/8',
          icon: ShieldAlert,
          iconColor: 'text-rose-500',
          badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
        }
      : diagnosis?.severity === 'warning'
        ? {
            wrap: 'border-amber-500/30 bg-amber-500/8',
            icon: AlertTriangle,
            iconColor: 'text-amber-500',
            badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
          }
        : diagnosis?.severity === 'healthy'
          ? {
              wrap: 'border-emerald-500/25 bg-emerald-500/6',
              icon: CheckCircle2,
              iconColor: 'text-emerald-500',
              badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
            }
          : {
              wrap: 'border-[var(--line)] bg-[var(--soft)]/60',
              icon: Info,
              iconColor: 'text-[var(--mu)]',
              badge: 'bg-[var(--soft)] text-[var(--mu)]',
            };

  const DiagIcon = diagStyles.icon;

  return (
    <section
      className="cd !p-5 sm:!p-6 flex flex-col gap-5"
      aria-label="Live Hardware Pipeline and Fault Diagnosis"
    >
      {/* Top Row: Composite Health Score + Sub-score Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-4">
          {/* Circular Health Score Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="var(--line)"
                strokeWidth="5"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={scoreStroke}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[17px] font-extrabold tabular-nums text-[var(--t)] leading-none">
                {score}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--mu)] mt-0.5">
                / 100
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] sm:text-[18px] font-bold tracking-tight text-[var(--t)] m-0">
                Tile Health Overview
              </h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.cls}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[var(--mu)] mt-1 m-0">
              Follow power step-by-step from the floor tile to the online dashboard to spot loose wires or weak output.
            </p>
          </div>
        </div>

        {/* 3 Sub-score Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Power Output', val: breakdown.harvesting },
            { label: 'Steadiness', val: breakdown.consistency },
            { label: 'Connection', val: breakdown.telemetry },
          ].map((item) => (
            <div
              key={item.label}
              className="px-3 py-1.5 rounded-xl bg-[var(--soft)] border border-[var(--line)] flex items-center gap-2"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
                {item.label}
              </span>
              <span className="text-[13px] font-bold tabular-nums text-[var(--t)]">
                {item.val}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive 5-Stage Power Path */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--mu)] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[var(--acc)]" />
            Power Path (Click any step for details)
          </span>
          {onJumpToBench && (
            <button
              type="button"
              onClick={onJumpToBench}
              className="text-xs font-semibold text-[var(--acc)] hover:underline cursor-pointer"
            >
              Run step test →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 relative">
          {stages.map((stage, idx) => {
            const Icon = STAGE_ICONS[stage.id] || Activity;
            const st = getStageStyles(stage.status);
            const isSelected = selectedStageId === stage.id;
            return (
              <div key={stage.id} className="relative flex items-stretch">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStageId((prev) => (prev === stage.id ? null : stage.id))
                  }
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-[var(--acc)] bg-[var(--soft)] shadow-sm ring-1 ring-[var(--acc)]/30'
                      : 'border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--soft)]/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${st.ring}`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.pill}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${st.dot} ${
                          stage.status === 'ok' ? 'animate-pulse' : ''
                        }`}
                      />
                      {st.label}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mu)]">
                      {stage.shortLabel}
                    </div>
                    <div className="text-[14px] font-bold text-[var(--t)] tabular-nums truncate mt-0.5">
                      {stage.primaryValue}
                    </div>
                  </div>
                </button>

                {idx < stages.length - 1 && (
                  <div
                    className="hidden lg:flex items-center justify-center w-3 -mr-2.5 z-10 text-[var(--mu)] opacity-60 pointer-events-none"
                    aria-hidden="true"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Stage Inspector Bar */}
        {activeStage && (
          <div className="px-4 py-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[var(--t)]">
              <span className="font-bold">{activeStage.label}:</span>
              <span className="text-[var(--mu)]">{activeStage.detail}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStageId(null)}
              className="text-[11px] font-semibold text-[var(--mu)] hover:text-[var(--t)] cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Fault-Signature Diagnosis & Technician Checklist */}
      {diagnosis && (
        <div className={`rounded-2xl border p-4 sm:p-4.5 ${diagStyles.wrap}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`mt-0.5 shrink-0 ${diagStyles.iconColor}`}>
                <DiagIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[var(--t)]">
                    {diagnosis.title}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${diagStyles.badge}`}>
                    {FAULT_BADGE_LABELS[diagnosis.code] ?? 'Status'}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-[var(--t)]/90 mt-1 mb-1.5 leading-relaxed">
                  {diagnosis.summary}
                </p>
                <p className="text-xs text-[var(--mu)] m-0">
                  <strong className="text-[var(--t)]">Likely reason:</strong> {diagnosis.probableCause}
                </p>
              </div>
            </div>

            {diagnosis.recommendedChecks.length > 0 && (
              <div className="md:w-[42%] shrink-0 rounded-xl bg-[var(--panel)]/80 border border-[var(--line)] p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mu)] flex items-center gap-1.5 mb-2">
                  <Wrench className="w-3.5 h-3.5 text-[var(--acc)]" />
                  What to Check
                </div>
                <ul className="m-0 pl-4 space-y-1 text-xs text-[var(--t)]">
                  {diagnosis.recommendedChecks.map((check, i) => (
                    <li key={i} className="leading-snug">
                      {check}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
