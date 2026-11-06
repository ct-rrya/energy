import { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useDiagnosticBaseline, 
  useTodayDailyTask,
  useStartDailySession,
  useCancelDailySession,
  useCompleteDailyTask,
} from '../hooks/useDiagnostics';
import { 
  DiagnosticResultStatus, 
  DailyDiagnosticTaskStatus 
} from '@/types/diagnostic.types';
import type { StepTestResult } from '@/types/diagnostic.types';

type TestModeState = 'IDLE' | 'LISTENING' | 'RESULT';

/**
 * Step Diagnostic Test Card
 * 
 * Clean, modern layout matching the EcoStep design spec:
 * - Left: Interactive daily verification flow (Idle -> Testing with manual fallback -> Result)
 * - Right: Baseline normal output & horizontal distribution scale
 */
export function StepDiagnosticTestCard() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Queries & Mutations
  const { data: baseline } = useDiagnosticBaseline();
  const { data: todayTask } = useTodayDailyTask();
  const startSessionMutation = useStartDailySession();
  const cancelSessionMutation = useCancelDailySession();
  const completeDailyMutation = useCompleteDailyTask();

  const [testState, setTestState] = useState<TestModeState>('IDLE');
  const [testResult, setTestResult] = useState<StepTestResult | null>(null);
  const [manualInput, setManualInput] = useState<string>('0.00418');
  const [lockError, setLockError] = useState<string | null>(null);

  // Baseline metrics
  const daysAnalyzed = baseline?.daysAnalyzed ?? 30;
  const totalSteps = baseline?.totalSteps ?? 169;
  const normalStep = baseline?.normalStepMWh ?? 0.00051;
  const minAcceptable = baseline?.minAcceptableMWh ?? 0.00034;
  const maxAcceptable = baseline?.maxAcceptableMWh ?? 0.00068;
  const tolerance = baseline?.tolerancePercent ?? 34;

  // Session & Lock Status
  const now = new Date();
  const activeSession = todayTask?.activeSession;
  const isSessionActive = Boolean(
    activeSession && new Date(activeSession.expiresAt) > now
  );
  const isLockedByOtherAdmin = Boolean(
    isSessionActive && activeSession?.adminEmail !== user?.email
  );
  const isLockedByCurrentUser = Boolean(
    isSessionActive && activeSession?.adminEmail === user?.email
  );

  // Synchronize state if current user has an active session
  useEffect(() => {
    if (isLockedByCurrentUser && testState === 'IDLE' && todayTask?.status === DailyDiagnosticTaskStatus.IN_PROGRESS) {
      setTestState('LISTENING');
    }
  }, [isLockedByCurrentUser, todayTask?.status, testState]);

  // Listen for real-time readings from ESP32 hardware tile when in LISTENING mode
  useEffect(() => {
    if (!socket || !isConnected || testState !== 'LISTENING') return;

    const handleNewReading = (reading: any) => {
      if (reading && (reading.energy > 0 || reading.power > 0)) {
        const stepEnergy = reading.energy > 0 
          ? (reading.stepCount && reading.stepCount > 0 ? reading.energy / reading.stepCount : reading.energy)
          : normalStep;

        handleExecuteTest(parseFloat(stepEnergy.toFixed(5)), 'Hardware Tile Step Detected');
      }
    };

    socket.on('reading:new', handleNewReading);
    return () => {
      socket.off('reading:new', handleNewReading);
    };
  }, [socket, isConnected, testState, normalStep]);

  // Start Diagnostic Session (Acquire Lock)
  const handleStartTest = async () => {
    setLockError(null);
    setTestResult(null);

    try {
      await startSessionMutation.mutateAsync();
      setTestState('LISTENING');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Could not acquire session lock';
      setLockError(errMsg);
    }
  };

  // Cancel Diagnostic Session (Release Lock)
  const handleCancelTest = async () => {
    try {
      await cancelSessionMutation.mutateAsync();
    } catch (err) {
      console.warn('Error releasing session lock:', err);
    } finally {
      setTestState('IDLE');
      setTestResult(null);
      setLockError(null);
    }
  };

  // Execute & Complete Daily Diagnostic
  const handleExecuteTest = async (energyVal: number, notes?: string) => {
    try {
      const response = await completeDailyMutation.mutateAsync({
        actualStepEnergyMWh: energyVal,
        notes: notes || 'Single Step Verification Test',
      });
      setTestResult(response.stepResult);
      setTestState('RESULT');
      setLockError(null);
    } catch (err: any) {
      console.error('Failed to complete daily diagnostic test:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to complete test';
      setLockError(errMsg);
    }
  };

  const handleReset = () => {
    setTestState('IDLE');
    setTestResult(null);
    setLockError(null);
  };

  // Visual Gauge Math
  const getMarkerPosition = () => {
    const actual = testResult ? testResult.actualEnergyMWh : (todayTask?.actualEnergyMWh ?? normalStep);
    const spanMin = minAcceptable * 0.7;
    const spanMax = maxAcceptable * 1.3;
    const range = spanMax - spanMin;
    const pct = ((actual - spanMin) / range) * 100;
    return Math.max(8, Math.min(92, pct));
  };

  const getMinPosition = () => {
    const spanMin = minAcceptable * 0.7;
    const spanMax = maxAcceptable * 1.3;
    return ((minAcceptable - spanMin) / (spanMax - spanMin)) * 100;
  };

  const getMaxPosition = () => {
    const spanMin = minAcceptable * 0.7;
    const spanMax = maxAcceptable * 1.3;
    return ((maxAcceptable - spanMin) / (spanMax - spanMin)) * 100;
  };

  const isWithinRange = testResult
    ? testResult.result === DiagnosticResultStatus.WITHIN_RANGE
    : todayTask?.result === DiagnosticResultStatus.WITHIN_RANGE;

  const isCompleted = todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED;
  const isNeedsAttention = todayTask?.status === DailyDiagnosticTaskStatus.NEEDS_ATTENTION || todayTask?.status === DailyDiagnosticTaskStatus.FAILED;
  const isOverdue = todayTask?.status === DailyDiagnosticTaskStatus.OVERDUE;
  const taskDate = todayTask?.taskDate || new Date().toISOString().split('T')[0];

  return (
    <section 
      className="cd !p-5 sm:!p-6 rounded-[22px] flex flex-wrap gap-6 lg:gap-10 items-center justify-between"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ─────────────────────────────────────────────────────────────
          LEFT COLUMN: Interactive Test Mode Flow
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 basis-[280px] min-w-0 flex flex-col gap-3.5 items-start">
        
        {/* STATE 1: IDLE */}
        {testState === 'IDLE' && (
          <>
            {/* Status Pill Badge */}
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-[600] text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-0.5 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Completed · {taskDate}
              </span>
            ) : isNeedsAttention ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-[600] text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-full px-3 py-0.5 whitespace-nowrap">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Needs attention · {taskDate}
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-[600] text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 rounded-full px-3 py-0.5 whitespace-nowrap">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Overdue · {taskDate}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-[600] text-amber-600 dark:text-[#fbbf24] bg-amber-500/15 dark:bg-[#2a2108] border border-amber-500/30 dark:border-[#5a4710] rounded-full px-3 py-0.5 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Pending · {taskDate}
              </span>
            )}

            {/* Title & Description */}
            <h2 className="m-0 text-[20px] sm:text-[22px] font-[600] tracking-[-0.01em] leading-[1.2] text-[var(--t)]">
              {isCompleted ? 'Daily task completed' : 'Daily step verification'}
            </h2>
            <p className="m-0 text-[13px] sm:text-[14px] leading-[1.5] text-[var(--mu)]">
              {isCompleted
                ? `Verified by ${todayTask?.performedByName || todayTask?.performedBy || 'admin'}. You may re-verify the tile anytime.`
                : 'Start test mode, then step firmly on the tile.'}
            </p>

            {/* Error Message if Lock Collision */}
            {lockError && (
              <p className="m-0 text-[12px] text-rose-600 dark:text-rose-400 font-medium">
                {lockError}
              </p>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleStartTest}
              disabled={isLockedByOtherAdmin || startSessionMutation.isPending}
              className="min-h-[42px] sm:min-h-[44px] px-5 sm:px-6 inline-flex items-center gap-2 border-0 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f] text-[14px] sm:text-[15px] font-[600] hover:bg-[var(--bar)] transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {startSessionMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  <span>Acquiring Lock...</span>
                </>
              ) : isLockedByOtherAdmin ? (
                <span>Locked ({activeSession?.adminName})</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>{isCompleted ? 'Perform re-verification' : 'Start test mode'}</span>
                </>
              )}
            </button>
          </>
        )}

        {/* STATE 2: LISTENING / TESTING */}
        {testState === 'LISTENING' && (
          <>
            {/* Status Pill Badge with Live Pulse */}
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-[12px] font-[600] text-emerald-600 dark:text-[#4ade80] bg-emerald-500/15 dark:bg-[#0f2a1a] border border-emerald-500/30 dark:border-[#1d4a2e] rounded-full px-3 py-0.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#22c55e] animate-ping shrink-0" />
              Locked for {user?.name || user?.email || 'Administrator'}
            </span>

            {/* Title & Description */}
            <h2 className="m-0 text-[20px] sm:text-[22px] font-[600] tracking-[-0.01em] leading-[1.2] text-[var(--t)]">
              Step on the tile
            </h2>
            <p className="m-0 text-[13px] sm:text-[14px] leading-[1.5] text-[var(--mu)]">
              Step firmly. Waiting for the tile reading…
            </p>

            {/* Sleek Manual Fallback Entry */}
            <div className="w-full box-border flex flex-col gap-2 bg-[var(--soft)] dark:bg-[#0a120e] border border-[var(--line)] dark:border-[#1d3326] rounded-xl p-3.5">
              <label htmlFor="manual-reading" className="text-[12px] sm:text-[13px] font-[500] text-[var(--mu)]">
                Or enter the reading manually
              </label>
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[140px] flex items-center gap-2 bg-[var(--panel)] dark:bg-[#101c15] border border-[var(--line)] dark:border-[#264232] rounded-full px-3.5 min-h-[40px]">
                  <input
                    id="manual-reading"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00418"
                    className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[var(--t)] dark:text-[#e8f3ec] font-['DM_Sans',sans-serif] text-[14px] sm:text-[15px] font-[500] tabular-nums"
                  />
                  <span className="text-[12px] text-[var(--mu)]">mWh</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleExecuteTest(parseFloat(manualInput) || 0.00418, 'Admin Step Verification')}
                  disabled={completeDailyMutation.isPending}
                  className="min-h-[40px] px-5 border-0 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f] text-[13px] sm:text-[14px] font-[600] hover:bg-[var(--bar)] transition-all cursor-pointer disabled:opacity-50 select-none"
                >
                  {completeDailyMutation.isPending ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Cancel & Release Lock Link */}
            <button
              type="button"
              onClick={handleCancelTest}
              disabled={cancelSessionMutation.isPending}
              className="min-h-[36px] px-1 bg-transparent border-0 text-[var(--mu)] text-[13px] font-[500] underline underline-offset-4 hover:text-[var(--t)] cursor-pointer select-none"
            >
              Cancel and release lock
            </button>
          </>
        )}

        {/* STATE 3: RESULT */}
        {testState === 'RESULT' && testResult && (
          <>
            {/* Status Pill Badge */}
            <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-[600] rounded-full px-3 py-0.5 whitespace-nowrap border ${
              isWithinRange
                ? 'text-emerald-600 dark:text-[#4ade80] bg-emerald-500/15 dark:bg-[#0f2a1a] border-emerald-500/30 dark:border-[#1d4a2e]'
                : 'text-amber-600 dark:text-[#fbbf24] bg-amber-500/15 dark:bg-[#2a2108] border-amber-500/30 dark:border-[#5a4710]'
            }`}>
              {isWithinRange ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
              {isWithinRange ? 'Within normal range' : 'Deviation detected'}
            </span>

            {/* Title */}
            <h2 className="m-0 text-[20px] sm:text-[22px] font-[600] tracking-[-0.01em] leading-[1.2] text-[var(--t)]">
              Verification completed
            </h2>

            {/* Measured Comparison Row */}
            <div className="flex items-center gap-5 flex-wrap py-0.5">
              <div>
                <span className="block text-[11px] font-[600] uppercase tracking-[0.08em] text-[var(--mu)]">
                  Measured
                </span>
                <span className="text-[20px] sm:text-[22px] font-[500] tracking-[-0.02em] tabular-nums font-['DM_Sans',sans-serif] text-[var(--t)]">
                  {testResult.actualEnergyMWh.toFixed(5)} <span className="text-xs font-normal text-[var(--mu)]">mWh</span>
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-[600] uppercase tracking-[0.08em] text-[var(--mu)]">
                  Expected
                </span>
                <span className="text-[20px] sm:text-[22px] font-[500] tracking-[-0.02em] tabular-nums font-['DM_Sans',sans-serif] text-[var(--t)]">
                  {testResult.expectedEnergyMWh.toFixed(5)} <span className="text-xs font-normal text-[var(--mu)]">mWh</span>
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-[600] uppercase tracking-[0.08em] text-[var(--mu)]">
                  Deviation
                </span>
                <span className={`text-[20px] sm:text-[22px] font-[500] tracking-[-0.02em] tabular-nums font-['DM_Sans',sans-serif] ${
                  isWithinRange ? 'text-emerald-600 dark:text-[#4ade80]' : 'text-amber-600 dark:text-[#fbbf24]'
                }`}>
                  {testResult.deviationPercentage >= 0 ? '+' : ''}{testResult.deviationPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Completion Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[40px] px-5 border-0 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f] text-[14px] font-[600] hover:bg-[var(--bar)] transition-all cursor-pointer shadow-sm select-none"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleStartTest}
                className="min-h-[40px] px-4 rounded-full border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] text-[13px] font-[500] hover:bg-[var(--panel)] transition-all cursor-pointer inline-flex items-center gap-1.5 select-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Test again</span>
              </button>
            </div>
          </>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT COLUMN: Normal Output & Horizontal Distribution Scale
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 basis-[320px] min-w-0 flex flex-col gap-4">
        
        {/* Normal Output Header */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-[600] tracking-[0.08em] uppercase text-[var(--mu)]">
            Normal output
          </span>
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
            <span className="text-[28px] sm:text-[34px] font-[500] tracking-[-0.02em] leading-none tabular-nums text-[var(--t)] font-['DM_Sans',sans-serif]">
              {normalStep.toFixed(5)}
            </span>
            <span className="text-[13px] sm:text-[14px] text-[var(--mu)] font-normal">
              mWh per step
            </span>
          </div>
        </div>

        {/* Distribution Scale Bar */}
        <div className="flex flex-col gap-2 px-2 pb-6">
          <div className="relative h-[12px] rounded-full bg-[var(--soft)] dark:bg-[#1a2b21] border border-[var(--line)]">
            {/* Acceptable Zone highlight */}
            <div
              className="absolute top-0 bottom-0 rounded-full bg-emerald-500/30 dark:bg-[#166534]"
              style={{
                left: `${Math.max(0, getMinPosition())}%`,
                width: `${Math.min(100 - getMinPosition(), getMaxPosition() - getMinPosition())}%`,
              }}
            />

            {/* Center Mean / Current Test Marker */}
            <div
              className="absolute top-[-4px] w-1 h-[20px] -ml-[2px] rounded-sm bg-emerald-500 dark:bg-[#22c55e] shadow-xs"
              style={{ left: `${Math.max(4, Math.min(96, testState === 'RESULT' ? getMarkerPosition() : 50))}%` }}
            />

            {/* Min threshold tick label */}
            <span
              className="absolute top-5 -translate-x-1/2 font-['DM_Sans',sans-serif] text-[11px] font-[500] tabular-nums text-[var(--mu)] select-none"
              style={{ left: `${Math.max(6, getMinPosition())}%` }}
            >
              {minAcceptable.toFixed(5)}
            </span>

            {/* Max threshold tick label */}
            <span
              className="absolute top-5 -translate-x-1/2 font-['DM_Sans',sans-serif] text-[11px] font-[500] tabular-nums text-[var(--mu)] select-none"
              style={{ left: `${Math.min(94, getMaxPosition())}%` }}
            >
              {maxAcceptable.toFixed(5)}
            </span>
          </div>
        </div>

        {/* Normal Zone Pill & Baseline Protection Footnote */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-[12px] sm:text-[13px] text-[var(--mu)]">
          <span className="text-[10px] sm:text-[11px] font-[600] px-2.5 py-0.5 rounded-full text-emerald-600 dark:text-[#4ade80] bg-emerald-500/15 dark:bg-[#0f2a1a] border border-emerald-500/30 dark:border-[#1d4a2e] whitespace-nowrap shrink-0">
            Normal zone ±{tolerance}%
          </span>
          <span>
            {totalSteps.toLocaleString()} footsteps over {daysAnalyzed} days · baseline locked
          </span>
        </div>

      </div>
    </section>
  );
}
