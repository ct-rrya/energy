import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Settings2, X, Check, Save, AlertCircle, Calendar, Zap, Footprints, Lock, ShieldAlert } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { UpdateMonthTargetsPayload, WeeklyTargetsMWh, MonthlyConfigurationPolicy } from '../types/milestone.types';
import { formatWhFromMWh, parsePositiveDecimal, formatMonthLabel } from '../utils/milestone.utils';

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
  currentMonthTargetMWh = 0.1,
  currentWeeklyTargetMWh,
  currentWeeklyTargetsMWh,
  configurationPolicy,
  onSave,
}: AdminMilestonesModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const initialWeekly =
    currentWeeklyTargetMWh ??
    currentWeeklyTargetsMWh?.week1MWh ??
    0.025;

  const [selectedMonth, setSelectedMonth] = useState(activeMonth);
  const [monthlyTarget, setMonthlyTarget] = useState(String(currentMonthTargetMWh ?? 0.1));
  const [weeklyTarget, setWeeklyTarget] = useState(String(initialWeekly));
  const [correctionReason, setCorrectionReason] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  // Month-locking evaluation
  const isMonthSelectedActive = selectedMonth === activeMonth;
  const isLocked = Boolean(isMonthSelectedActive && configurationPolicy?.isLocked);
  const isOverdue = Boolean(isMonthSelectedActive && configurationPolicy?.status === 'OVERDUE');
  const isPending = Boolean(isMonthSelectedActive && configurationPolicy?.status === 'PENDING');
  const isReadOnly = isLocked && !isSuperAdmin;

  // Lock body scrolling when modal is open
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

  // Close on Escape key press
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
      setMonthlyTarget(String(currentMonthTargetMWh ?? 0.1));
      const wTarget = currentWeeklyTargetMWh ?? currentWeeklyTargetsMWh?.week1MWh ?? 0.025;
      setWeeklyTarget(String(wTarget));
      setErrorMessage(null);
      setSuccessMessage(false);
    }
  }, [isOpen, activeMonth, currentMonthTargetMWh, currentWeeklyTargetMWh, currentWeeklyTargetsMWh]);

  if (!isOpen) return null;

  // Practical presets calibrated directly to actual piezoelectric prototype telemetry
  const presets = [
    {
      name: 'Pilot / Micro Harvest (Default)',
      monthly: 0.1,
      weekly: 0.025,
      isDefault: true,
      description: 'Single-tile bench testing & prototype validation (~100–400 footsteps)',
    },
    {
      name: 'Active Walkway (Moderate Traffic)',
      monthly: 0.5,
      weekly: 0.1,
      isDefault: false,
      description: 'Regular prototype hallway pedestrian testing (~400–2,000 footsteps)',
    },
    {
      name: 'Corridor Array (High Traffic)',
      monthly: 2.0,
      weekly: 0.5,
      isDefault: false,
      description: 'Multi-tile corridor or busy entrance array (~2,000–8,000 footsteps)',
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    if (isReadOnly) return;
    setMonthlyTarget(String(p.monthly));
    setWeeklyTarget(String(p.weekly));
    setErrorMessage(null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isReadOnly) return;

    if (isLocked && isSuperAdmin && !correctionReason.trim()) {
      setErrorMessage(
        'Super Administrator corrections on locked months require an audit justification reason.'
      );
      return;
    }

    const mTarget = parsePositiveDecimal(monthlyTarget);
    const wTarget = parsePositiveDecimal(weeklyTarget);

    if (mTarget === null || wTarget === null) {
      setErrorMessage(
        'Please enter valid positive decimal numbers (e.g. 0.025, 0.1, 0.5 mWh) for both monthly and weekly targets.'
      );
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        month: selectedMonth,
        monthlyTargetMWh: mTarget,
        weeklyTargetMWh: wTarget,
        ...(isLocked && isSuperAdmin ? { reason: correctionReason.trim() } : {}),
      });

      setSuccessMessage(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save milestone targets. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalElement = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.38)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-milestones-title"
    >
      {/* Clickable Backdrop Dismiss Overlay */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-xl rounded-[22px] border p-6 relative overflow-hidden shadow-2xl max-h-[92vh] flex flex-col my-auto bg-[var(--panel)] border-[var(--line)] text-[var(--t)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[var(--acc)]">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="admin-milestones-title" className="text-lg font-bold text-[var(--t)] tracking-tight">
                Configure Milestone Targets
              </h3>
              <p className="text-xs text-[var(--mu)]">
                Calibrated to piezoelectric prototype telemetry (in milliwatt-hours, mWh)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="overflow-y-auto pr-1 py-4 space-y-5">
          {/* Policy Status Banner */}
          {isLocked && !isSuperAdmin && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="font-bold">Targets Locked for {formatMonthLabel(selectedMonth)}</div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  Target configuration was submitted by {configurationPolicy?.configuredBy || 'an administrator'}{' '}
                  {configurationPolicy?.configuredAt ? `on ${new Date(configurationPolicy.configuredAt).toLocaleDateString()}` : ''}.
                  Under the Monthly Goal Configuration Policy, ordinary modifications are locked.
                </div>
                <div className="text-[11px] font-semibold mt-1 text-amber-800 dark:text-amber-200">
                  Only authorized Super Administrators can perform exceptional corrections.
                </div>
              </div>
            </div>
          )}

          {isLocked && isSuperAdmin && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="font-bold">Super Administrator Exceptional Correction</div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  Targets for {formatMonthLabel(selectedMonth)} are locked. As an authorized Super Administrator, you may perform an exceptional correction. All changes and your reason will be appended to the audit log.
                </div>
              </div>
            </div>
          )}

          {!isLocked && isOverdue && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div>
                <div className="font-bold">Configuration Overdue</div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  The configuration deadline for {formatMonthLabel(selectedMonth)} was{' '}
                  {configurationPolicy?.deadlineLabel || 'the 2nd day of the month (Asia/Manila)'}.
                  Submitting targets now will lock the goals for this month and resolve the overdue status.
                </div>
              </div>
            </div>
          )}

          {!isLocked && isPending && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0 text-[var(--acc)]" />
              <div className="text-[11px]">
                <span className="font-semibold">Goal Policy:</span> Deadline is{' '}
                {configurationPolicy?.deadlineLabel || 'the 2nd day of the month, 11:59 PM (Asia/Manila)'}.
                Once submitted, targets lock against ordinary modifications.
              </div>
            </div>
          )}

          {/* Month Selection */}
          <div className="p-3.5 rounded-xl bg-[var(--soft)] border border-[var(--line)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--acc)]" />
              <span className="text-xs font-semibold text-[var(--t)]">Target Calendar Month:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[var(--panel)] border border-[var(--line)] text-[var(--t)] text-xs rounded-lg px-3 py-1.5 font-semibold focus:outline-none focus:border-[var(--acc)] shadow-sm"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-[var(--panel)] text-[var(--t)]">
                  {formatMonthLabel(m)} ({m})
                </option>
              ))}
            </select>
          </div>

          {/* Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[var(--mu)] uppercase tracking-wider block">
                Calibrated Target Presets
              </span>
              <span
                className="text-[10px] text-[var(--acc)] font-[500] tracking-[-0.02em] tabular-nums"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Hardware: ~0.086 mWh / 300 steps
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presets.map((p) => {
                const isSelected =
                  parseFloat(monthlyTarget) === p.monthly && parseFloat(weeklyTarget) === p.weekly;

                return (
                  <button
                    type="button"
                    key={p.name}
                    disabled={isReadOnly}
                    onClick={() => handleApplyPreset(p)}
                    className={`px-3 py-2.5 rounded-xl text-xs text-left transition-all flex flex-col justify-between border ${
                      isReadOnly ? 'opacity-60 cursor-not-allowed' : ''
                    } ${
                      isSelected
                        ? 'bg-[var(--mint)] text-[var(--acc)] border-[var(--acc)] shadow-sm font-semibold'
                        : 'bg-[var(--soft)] hover:bg-[var(--mint)]/50 border-[var(--line)] text-[var(--t)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold block truncate text-[11px]">{p.name}</span>
                        {p.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-[var(--acc)] border border-emerald-500/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--mu)] mt-1 leading-snug line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                    <div
                      className="text-[10px] text-[var(--acc)] font-[500] tracking-[-0.02em] tabular-nums mt-2 pt-1 border-t border-[var(--line)]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Month: <strong>{p.monthly}</strong> mWh • Week: <strong>{p.weekly}</strong> mWh
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. Monthly Target Input */}
          <div className="p-4 rounded-xl bg-[var(--soft)] border border-[var(--line)]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[var(--t)] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[var(--acc)]" />
                Monthly Energy Target ({formatMonthLabel(selectedMonth)})
              </label>
              <span
                className="text-[11px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--mu)]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ≈ {formatWhFromMWh(parseFloat(monthlyTarget) || 0)} Wh
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                disabled={isReadOnly}
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                className="w-full bg-[var(--panel)] border border-[var(--line)] focus:border-[var(--acc)] rounded-xl px-4 py-2.5 text-[var(--t)] font-[500] tracking-[-0.02em] tabular-nums text-sm placeholder-[var(--mu)] focus:outline-none shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                placeholder="0.1"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[var(--mu)]">
                mWh
              </span>
            </div>
            <span className="text-[11px] text-[var(--mu)] mt-1.5 block">
              Cumulative goal for all kinetic energy generated throughout {formatMonthLabel(selectedMonth)}.
            </span>
          </div>

          {/* 2. Weekly Energy Target Input */}
          <div className="p-4 rounded-xl bg-[var(--soft)] border border-[var(--line)]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[var(--t)] uppercase tracking-wider flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-cyan-500" />
                Weekly Energy Target (Applies to All Weeks)
              </label>
              <span
                className="text-[11px] font-[500] tracking-[-0.02em] tabular-nums text-[var(--mu)]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ≈ {formatWhFromMWh(parseFloat(weeklyTarget) || 0)} Wh
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                disabled={isReadOnly}
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(e.target.value)}
                className="w-full bg-[var(--panel)] border border-[var(--line)] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-[var(--t)] font-[500] tracking-[-0.02em] tabular-nums text-sm placeholder-[var(--mu)] focus:outline-none shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                placeholder="0.025"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[var(--mu)]">
                mWh
              </span>
            </div>
            <span className="text-[11px] text-[var(--mu)] mt-1.5 block">
              Shared target automatically applied to each calendar week in {formatMonthLabel(selectedMonth)}.
            </span>
          </div>

          {/* 3. Super Admin Correction Reason (if locked & Super Admin) */}
          {isLocked && isSuperAdmin && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <label className="text-xs font-bold text-[var(--t)] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Audit Justification Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g. Piezoelectric sensor recalibration, campus walkway schedule changes"
                className="w-full bg-[var(--panel)] border border-[var(--line)] focus:border-purple-500 rounded-xl px-4 py-2 text-[var(--t)] text-xs placeholder-[var(--mu)] focus:outline-none shadow-sm"
              />
              <span className="text-[11px] text-[var(--mu)] mt-1.5 block">
                This explanation will be permanently recorded in the audit log alongside your administrator ID and timestamp.
              </span>
            </div>
          )}

          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Milestone targets updated successfully for {formatMonthLabel(selectedMonth)}!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)] border border-[var(--line)] transition-colors"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {isReadOnly ? (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--mu)] bg-[var(--soft)] border border-[var(--line)] flex items-center gap-2 cursor-not-allowed opacity-80"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Locked (Super Admin Only)
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 ${
                  isLocked && isSuperAdmin
                    ? 'text-white bg-purple-600 hover:bg-purple-700'
                    : 'text-white dark:text-black bg-[var(--acc)] hover:bg-[var(--brand-mid)]'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : isLocked && isSuperAdmin ? (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Apply Audited Correction
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Lock {formatMonthLabel(selectedMonth)} Targets
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
