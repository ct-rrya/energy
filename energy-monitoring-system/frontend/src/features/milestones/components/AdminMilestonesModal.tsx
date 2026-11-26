import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Settings2, X, Check, Save, AlertCircle, Lock } from 'lucide-react';
import { eachWeekOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import type { UpdateMonthTargetsPayload, WeeklyTargetsMWh, MonthlyConfigurationPolicy } from '../types/milestone.types';
import { formatMWh, formatWhFromMWh, parsePositiveDecimal, formatMonthLabel } from '../utils/milestone.utils';

function getCalendarWeekCount(yearMonth: string): number {
  const [yStr, mStr] = yearMonth.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  if (isNaN(year) || isNaN(month)) return 4;
  const base = new Date(year, month - 1, 1);
  return eachWeekOfInterval(
    { start: startOfMonth(base), end: endOfMonth(base) },
    { weekStartsOn: 0 },
  ).length;
}

const round6 = (v: number) => Math.round(v * 1000000) / 1000000;

interface AdminMilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMonth?: string;
  availableMonths?: string[];
  currentMonthTargetMWh?: number;
  currentWeeklyTargetMWh?: number;
  currentWeeklyTargetsMWh?: WeeklyTargetsMWh;
  configurationPolicy?: MonthlyConfigurationPolicy;
  onSave: (payload: UpdateMonthTargetsPayload) => Promise<any>;
}

export function AdminMilestonesModal({
  isOpen,
  onClose,
  activeMonth = '2026-11',
  availableMonths = ['2026-10', '2026-11'],
  currentMonthTargetMWh = 0,
  configurationPolicy,
  onSave,
}: AdminMilestonesModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedMonth, setSelectedMonth] = useState(activeMonth);
  const [monthlyTarget, setMonthlyTarget] = useState(
    currentMonthTargetMWh > 0 ? String(currentMonthTargetMWh) : '',
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  const weekCount = useMemo(() => getCalendarWeekCount(selectedMonth), [selectedMonth]);
  const parsedMonthlyTarget = parsePositiveDecimal(monthlyTarget);
  const autoWeeklyTargetMWh = parsedMonthlyTarget !== null ? round6(parsedMonthlyTarget / weekCount) : 0;

  // Strict lock: once a goal is set for a month, it cannot be changed anymore
  const isMonthSelectedActive = selectedMonth === activeMonth;
  const isLocked = Boolean(isMonthSelectedActive && configurationPolicy?.isLocked);

  const prevMonthMWh = configurationPolicy?.previousMonthMWh ?? 0;
  const prevMonthLabel = configurationPolicy?.autoCalculatedFromLabel ?? null;
  const hasPrevSuggestion = Boolean(!isLocked && isMonthSelectedActive && prevMonthMWh > 0 && prevMonthLabel);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(activeMonth);
      setMonthlyTarget(currentMonthTargetMWh > 0 ? String(currentMonthTargetMWh) : '');
      setErrorMessage(null);
      setSuccessMessage(false);
    }
  }, [isOpen, activeMonth, currentMonthTargetMWh]);

  if (!isOpen) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setErrorMessage(null);
    setSuccessMessage(false);

    const parsedMonth = parsePositiveDecimal(monthlyTarget);
    if (parsedMonth === null || parsedMonth <= 0) {
      setErrorMessage('Please enter a valid positive number for the monthly energy target.');
      return;
    }

    const perWeek = round6(parsedMonth / weekCount);

    setIsSaving(true);
    try {
      await onSave({
        month: selectedMonth,
        monthlyTargetMWh: parsedMonth,
        weeklyTargetsMWh: {
          week1MWh: perWeek,
          week2MWh: perWeek,
          week3MWh: perWeek,
          week4MWh: perWeek,
          week5MWh: perWeek,
          week6MWh: perWeek,
        },
        target1MonthMWh: parsedMonth,
        target1WeekMWh: perWeek,
      });

      setSuccessMessage(true);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save milestone target. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const configuredByLabel =
    configurationPolicy?.configuredBy && !/^[a-f\d]{24}$/i.test(configurationPolicy.configuredBy.trim())
      ? configurationPolicy.configuredBy
      : 'an administrator';

  const modalElement = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.45)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-milestones-title"
    >
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-lg rounded-xl border p-6 relative overflow-hidden max-h-[92vh] flex flex-col my-auto bg-white dark:bg-[#131916] border-[var(--line)] text-[var(--t)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] shrink-0">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-4 h-4 text-[var(--acc)] shrink-0" />
            <h3 id="admin-milestones-title" className="text-base font-bold text-[var(--t)] tracking-tight">
              Configure Milestone Target
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flat Form Body (Zero Nested Boxes) */}
        <form onSubmit={handleSave} className="overflow-y-auto divide-y divide-[var(--line)]">
          {/* Month Selection Row */}
          <div className="py-4 flex items-center justify-between gap-3">
            <label htmlFor="milestone-month-select" className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider">
              Target Month
            </label>
            <select
              id="milestone-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border border-[var(--line)] text-[var(--t)] text-xs rounded-lg px-3 py-1.5 font-semibold focus:outline-none focus:border-[var(--acc)] cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-[#131916] text-[var(--t)]">
                  {formatMonthLabel(m)} ({m})
                </option>
              ))}
            </select>
          </div>

          {isLocked ? (
            /* Locked Read-Only Summary */
            <div className="py-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--mu)]">
                <Lock className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                <span>Target Locked for {formatMonthLabel(selectedMonth)}</span>
              </div>
              <div className="text-2xl font-bold text-[var(--t)] tabular-nums">
                {formatMWh(currentMonthTargetMWh)} <span className="text-sm font-medium text-[var(--acc)]">mWh</span>
              </div>
              <p className="text-xs text-[var(--mu)] m-0">
                ≈ {formatMWh(round6(currentMonthTargetMWh / weekCount))} mWh / week across {weekCount} calendar weeks
              </p>
              <p className="text-xs text-[var(--mu)] pt-2 m-0">
                Set by <strong className="text-[var(--t)]">{configuredByLabel}</strong>
                {configurationPolicy?.configuredAt
                  ? ` on ${new Date(configurationPolicy.configuredAt).toLocaleDateString()}`
                  : ''}
                . Once a monthly goal is set, it cannot be changed.
              </p>
            </div>
          ) : (
            /* Unlocked Target Input */
            <div className="py-4 space-y-4">
              {/* Previous Month Suggestion (flat left-accent line, no box) */}
              {hasPrevSuggestion && (
                <div className="border-l-2 border-[var(--acc)] pl-3 py-0.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[var(--mu)] m-0 leading-relaxed">
                    Previous month ({prevMonthLabel}) generated{' '}
                    <strong className="text-[var(--t)] tabular-nums">{formatMWh(prevMonthMWh)} mWh</strong>. Use this as your {formatMonthLabel(selectedMonth)} goal?
                  </p>
                  <button
                    type="button"
                    onClick={() => setMonthlyTarget(String(prevMonthMWh))}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--acc)]/50 text-[var(--acc)] hover:bg-[var(--acc)]/10 transition-colors cursor-pointer shrink-0"
                  >
                    Use {formatMWh(prevMonthMWh)} mWh
                  </button>
                </div>
              )}

              {/* Monthly Target Input + Inline Weekly Split */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="monthly-energy-target-input"
                    className="text-xs font-semibold text-[var(--t)] uppercase tracking-wider"
                  >
                    Monthly Energy Goal ({formatMonthLabel(selectedMonth)})
                  </label>
                  <span className="text-[11px] text-[var(--mu)] tabular-nums">
                    ≈ {formatWhFromMWh(parseFloat(monthlyTarget) || 0)} Wh
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="monthly-energy-target-input"
                    type="number"
                    step="any"
                    min="0.000001"
                    required
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(e.target.value)}
                    className="w-full bg-transparent border border-[var(--line)] focus:border-[var(--acc)] rounded-lg px-3.5 py-2.5 pr-12 text-[var(--t)] tabular-nums text-sm placeholder-[var(--mu)] focus:outline-none"
                    placeholder={hasPrevSuggestion ? String(prevMonthMWh) : 'Enter target in mWh'}
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-[var(--mu)]">
                    mWh
                  </span>
                </div>
                <p className="text-xs text-[var(--mu)] mt-2 mb-0 tabular-nums">
                  Auto-split across {weekCount} calendar weeks:{' '}
                  <strong className="text-[var(--t)]">{formatMWh(autoWeeklyTargetMWh)} mWh / week</strong>
                </p>
              </div>

              {errorMessage && (
                <div className="border-l-2 border-red-500 pl-3 py-1 text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="border-l-2 border-[var(--acc)] pl-3 py-1 text-[var(--acc)] text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Target saved and locked for {formatMonthLabel(selectedMonth)}.</span>
                </div>
              )}

              <p className="text-[11px] text-[var(--mu)] m-0 flex items-center gap-1.5">
                <Lock className="w-3 h-3 shrink-0" />
                <span>Once saved, this month&apos;s goal is permanently locked and cannot be changed.</span>
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)] border border-[var(--line)] transition-colors cursor-pointer"
            >
              {isLocked ? 'Close' : 'Cancel'}
            </button>
            {!isLocked && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 text-white dark:text-black bg-[var(--acc)] hover:opacity-90 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save &amp; Lock Target
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalElement, document.body);
  }

  return modalElement;
}
