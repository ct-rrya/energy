import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Clock,
  PauseCircle,
  Play,
  Loader2,
  Eye,
  Minus,
  Plus,
} from 'lucide-react';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { showToast } from '@/components/common/Toast';
import { ROUTES } from '@/routes/routes.config';

type EtaUnit = 'none' | 'hours' | 'days';

function deriveInitialEta(iso: string | null): { unit: EtaUnit; amount: number } {
  if (!iso) return { unit: 'none', amount: 1 };
  const diffMs = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return { unit: 'none', amount: 1 };
  const hours = Math.max(1, Math.round(diffMs / 3_600_000));
  if (hours >= 24 && hours % 24 === 0) {
    return { unit: 'days', amount: Math.min(30, hours / 24) };
  }
  if (hours > 48) {
    return { unit: 'days', amount: Math.min(30, Math.round(hours / 24)) };
  }
  return { unit: 'hours', amount: Math.min(72, hours) };
}

function formatReadableDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function MaintenancePage() {
  const hardwareStatus = useHardwareStatus();
  const { state, isUpdating, updateMaintenance, resumeNormalOperation } =
    useMaintenance();

  const [messageInput, setMessageInput] = useState(state.message);
  const [etaUnit, setEtaUnit] = useState<EtaUnit>(() => deriveInitialEta(state.estimatedResumeAt).unit);
  const [etaAmount, setEtaAmount] = useState<number>(() => deriveInitialEta(state.estimatedResumeAt).amount);

  useEffect(() => {
    setMessageInput(state.message);
    const derived = deriveInitialEta(state.estimatedResumeAt);
    setEtaUnit(derived.unit);
    setEtaAmount(derived.amount);
  }, [state.message, state.estimatedResumeAt]);

  const computedResumeIso = useMemo<string | null>(() => {
    if (etaUnit === 'none') return null;
    const clamped = Math.max(1, Math.round(etaAmount || 1));
    const ms = etaUnit === 'days' ? clamped * 24 * 3_600_000 : clamped * 3_600_000;
    return new Date(Date.now() + ms).toISOString();
  }, [etaUnit, etaAmount]);

  const previewResumeLabel = useMemo(() => {
    if (etaUnit === 'none') return 'Will resume shortly';
    const formatted = formatReadableDate(computedResumeIso);
    const unitLabel = etaUnit === 'days' ? (etaAmount === 1 ? 'day' : 'days') : (etaAmount === 1 ? 'hour' : 'hours');
    return formatted ? `${formatted} (in ${etaAmount} ${unitLabel})` : `In ${etaAmount} ${unitLabel}`;
  }, [etaUnit, etaAmount, computedResumeIso]);

  const handleToggle = async () => {
    if (isUpdating) return;
    if (state.enabled) {
      await handleResume();
    } else {
      await handleSaveAndEnable();
    }
  };

  const handleSaveAndEnable = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = messageInput.trim();
    try {
      await updateMaintenance({
        enabled: true,
        message:
          trimmed ||
          'Scheduled floor mat wiring inspection and calibration in progress.',
        estimatedResumeAt: computedResumeIso,
      });
      showToast(
        state.enabled
          ? 'Maintenance notice updated'
          : 'Maintenance Mode enabled — hardware ingestion paused',
        'success',
      );
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || 'Failed to update Maintenance Mode',
        'error',
      );
    }
  };

  const handleResume = async () => {
    try {
      await resumeNormalOperation();
      setEtaUnit('none');
      setEtaAmount(1);
      showToast('Normal operation resumed — floor mat recording is active', 'success');
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || 'Failed to resume normal operation',
        'error',
      );
    }
  };

  const maxAmount = etaUnit === 'days' ? 30 : 72;

  return (
    <div className="page" style={{ fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" }}>
      <div className="mb-3">
        <Link
          to={ROUTES.SETTINGS}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--mu)] hover:text-[var(--t)] transition-colors no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Settings</span>
        </Link>
      </div>

      <DashboardHeader
        greeting="System Control"
        title="Maintenance Mode"
        subtitle="Pause physical floor mat uploads and show a clear notice to public visitors"
        systemStatus={hardwareStatus.status}
      />

      <div className="divide-y divide-[var(--line)]">
        {/* 1. Master Status & Toggle */}
        <section className="py-5 first:pt-2 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  state.enabled
                    ? 'bg-amber-500/12 text-amber-500 border-amber-500/30'
                    : 'bg-[#19D46A]/10 text-[#19D46A] border-[#19D46A]/25'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    state.enabled ? 'bg-amber-500' : 'bg-[#19D46A]'
                  }`}
                />
                {state.enabled ? 'Active · Hardware Paused' : 'Normal Operation'}
              </span>
              {state.updatedBy && (
                <span className="text-xs text-[var(--mu)]">
                  Last updated by {state.updatedBy}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[var(--mu)] mt-1.5 mb-0">
              {state.enabled
                ? 'Floor mat uploads are paused and public visitors currently see the maintenance screen.'
                : 'Floor mat is recording normally and public dashboards are live.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {state.enabled && (
              <button
                type="button"
                onClick={handleResume}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold bg-[#19D46A] text-[#062012] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Resume</span>
              </button>
            )}

            <button
              type="button"
              role="switch"
              aria-checked={state.enabled}
              aria-label="Toggle Maintenance Mode"
              disabled={isUpdating}
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
                state.enabled
                  ? 'bg-amber-500 border-amber-500'
                  : 'bg-[var(--soft)] border-[var(--line)]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  state.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* 2. Notice Message & Simple Hours/Days ETA */}
        <section className="py-6">
          <form onSubmit={handleSaveAndEnable} className="space-y-5 max-w-2xl">
            <div>
              <label
                htmlFor="maintenance-public-message"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--mu)] mb-2"
              >
                Public Notice Message
              </label>
              <textarea
                id="maintenance-public-message"
                rows={3}
                maxLength={400}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Scheduled floor mat wiring inspection and calibration in progress."
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--soft)] border border-[var(--line)] text-[var(--t)] placeholder:text-[var(--mu)]/60 focus:outline-none focus:border-[var(--acc)] resize-none"
              />
            </div>

            {/* Simple Duration Picker: None / Hours / Days */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--mu)] mb-2">
                Estimated Duration (Optional)
              </span>

              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--soft)] p-0.5"
                  role="radiogroup"
                  aria-label="Estimated duration unit"
                >
                  {(
                    [
                      { id: 'none', label: 'No ETA' },
                      { id: 'hours', label: 'Hours' },
                      { id: 'days', label: 'Days' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setEtaUnit(opt.id);
                        if (opt.id !== 'none' && etaAmount < 1) setEtaAmount(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        etaUnit === opt.id
                          ? 'bg-[var(--card-bg)] text-[var(--t)] border border-[var(--line)]'
                          : 'text-[var(--mu)] hover:text-[var(--t)] border border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {etaUnit !== 'none' && (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Decrease duration"
                      onClick={() => setEtaAmount((v) => Math.max(1, v - 1))}
                      className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] inline-flex items-center justify-center hover:border-[var(--acc)] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Duration amount"
                      value={etaAmount}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        if (!digits) {
                          setEtaAmount(1);
                          return;
                        }
                        const parsed = parseInt(digits, 10);
                        if (!Number.isNaN(parsed)) {
                          setEtaAmount(Math.max(1, Math.min(maxAmount, parsed)));
                        }
                      }}
                      className="w-14 h-8 text-center text-sm font-semibold tabular-nums rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)]"
                    />
                    <button
                      type="button"
                      aria-label="Increase duration"
                      onClick={() => setEtaAmount((v) => Math.min(maxAmount, v + 1))}
                      className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] inline-flex items-center justify-center hover:border-[var(--acc)] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium text-[var(--mu)] ml-1">
                      {etaUnit === 'days'
                        ? etaAmount === 1
                          ? 'day'
                          : 'days'
                        : etaAmount === 1
                        ? 'hour'
                        : 'hours'}
                    </span>
                  </div>
                )}
              </div>

              {etaUnit !== 'none' && computedResumeIso && (
                <p className="mt-2 mb-0 text-xs text-[var(--mu)] inline-flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-[#19D46A]" />
                  <span>Estimated resume: {formatReadableDate(computedResumeIso)}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs sm:text-sm font-semibold bg-amber-500 text-[#1a1103] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PauseCircle className="w-4 h-4" />
                )}
                <span>{state.enabled ? 'Save Notice' : 'Pause Hardware & Enable'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* 3. Public Visitor Preview */}
        <section className="py-6">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)] mb-3">
            <Eye className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>Public Visitor Preview</span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--card-bg)] p-5 sm:p-6 text-center flex flex-col items-center max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/12 text-amber-500 border border-amber-500/30 mb-3">
              <Wrench className="w-3 h-3" />
              <span>Maintenance in Progress</span>
            </span>

            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--t)] m-0">
              EcoStep is Temporarily Paused for Maintenance
            </h3>

            <p className="mt-2 mb-0 text-xs sm:text-sm text-[var(--t)]/85 max-w-md leading-relaxed">
              {messageInput.trim() ||
                'Scheduled floor mat wiring inspection and calibration in progress.'}
            </p>

            <div className="mt-4 pt-3 w-full border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-[var(--mu)]">
              <span className="inline-flex items-center gap-1.5">
                <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Live floor mat recording paused</span>
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#19D46A]" />
                <span>{previewResumeLabel}</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
