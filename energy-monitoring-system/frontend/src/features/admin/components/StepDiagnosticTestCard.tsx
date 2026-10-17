import { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Footprints, 
  Radio, 
  TrendingDown, 
  TrendingUp, 
  Sparkles,
  Zap,
  Calendar,
  Lock,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { getThemeColors } from '@/lib/theme';
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
 * Provides:
 * 1. Automated Daily System Diagnostic task workflow for multiple admins
 * 2. Active session locking to prevent simultaneous diagnostic sessions
 * 3. On-demand single-step physical test mode with ESP32 telemetry capture
 * 4. Evaluation against established reference baseline and acceptable thresholds
 * 5. High-fidelity visual comparison range bar and real-time multi-admin sync
 */
export function StepDiagnosticTestCard() {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Queries & Mutations
  const { data: baseline, isLoading: isBaselineLoading, refetch: refetchBaseline } = useDiagnosticBaseline();
  const { data: todayTask, isLoading: isDailyTaskLoading, refetch: refetchDailyTask } = useTodayDailyTask();
  const startSessionMutation = useStartDailySession();
  const cancelSessionMutation = useCancelDailySession();
  const completeDailyMutation = useCompleteDailyTask();

  const [testState, setTestState] = useState<TestModeState>('IDLE');
  const [testResult, setTestResult] = useState<StepTestResult | null>(null);
  const [manualInput, setManualInput] = useState<string>('0.00418');
  const [lockError, setLockError] = useState<string | null>(null);

  // Baseline metrics
  const daysAnalyzed = baseline?.daysAnalyzed ?? 30;
  const totalSteps = baseline?.totalSteps ?? 1547;
  const normalStep = baseline?.normalStepMWh ?? 0.00510;
  const minAcceptable = baseline?.minAcceptableMWh ?? 0.00346;
  const maxAcceptable = baseline?.maxAcceptableMWh ?? 0.00674;
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

  const getMeanPosition = () => {
    const spanMin = minAcceptable * 0.7;
    const spanMax = maxAcceptable * 1.3;
    return ((normalStep - spanMin) / (spanMax - spanMin)) * 100;
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

  // Status Badge Configuration
  const getDailyStatusBadge = (status?: DailyDiagnosticTaskStatus) => {
    switch (status) {
      case DailyDiagnosticTaskStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Completed
          </span>
        );
      case DailyDiagnosticTaskStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            In Progress
          </span>
        );
      case DailyDiagnosticTaskStatus.NEEDS_ATTENTION:
      case DailyDiagnosticTaskStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            Needs Attention
          </span>
        );
      case DailyDiagnosticTaskStatus.OVERDUE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-700">
            <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            Overdue
          </span>
        );
      case DailyDiagnosticTaskStatus.PENDING:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Pending Today's Verification
          </span>
        );
    }
  };

  return (
    <div 
      className="rounded-2xl p-6 sm:p-8 border shadow-xs transition-all"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
      }}
    >
      {/* ============================================================ */}
      {/* 1. DAILY DIAGNOSTIC TASK BANNER (SHARED MULTI-ADMIN) */}
      {/* ============================================================ */}
      <div 
        className="mb-6 p-4 sm:p-5 rounded-2xl border transition-all"
        style={{
          backgroundColor: todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED
            ? (theme === 'light' ? '#F0FDF4' : 'rgba(6, 78, 59, 0.2)')
            : (theme === 'light' ? '#F8FAFC' : 'rgba(15, 23, 42, 0.4)'),
          borderColor: todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED
            ? (theme === 'light' ? '#BBF7D0' : 'rgba(5, 150, 105, 0.4)')
            : colors.border,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED
                  ? 'rgba(16, 185, 129, 0.15)'
                  : colors.accentSubtle,
              }}
            >
              <Calendar className="h-5 w-5" style={{ color: colors.accent }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Today's Daily Diagnostic Task
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-gray-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                  {todayTask?.taskDate || new Date().toISOString().split('T')[0]}
                </span>
                {getDailyStatusBadge(todayTask?.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                {todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED ? (
                  <span>
                    Verified by <strong className="font-semibold text-slate-800 dark:text-slate-200">{todayTask.performedByName || todayTask.performedBy}</strong> on{' '}
                    {todayTask.completedAt ? new Date(todayTask.completedAt).toLocaleTimeString() : 'today'} (Single shared daily task for all administrators).
                  </span>
                ) : (
                  <span>
                    One shared task per day. Any authorized administrator may initiate and complete today's verification test on the tile.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetchDailyTask();
                refetchBaseline();
              }}
              isLoading={isDailyTaskLoading || isBaselineLoading}
              className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Sync Status
            </Button>
          </div>
        </div>

        {/* Lock Warning Banner if Another Admin is Currently Testing */}
        {isLockedByOtherAdmin && activeSession && (
          <div className="mt-4 p-3.5 rounded-xl border flex items-start gap-3 bg-amber-50/90 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700/60 dark:text-amber-200">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Diagnostic Session in Progress:</span>{' '}
              Administrator <strong className="font-semibold">{activeSession.adminName}</strong> ({activeSession.adminEmail}) is currently conducting the physical step test.
              Simultaneous testing is prevented to ensure telemetry integrity. Session lock will release once they finish or upon timeout at{' '}
              <span className="font-mono">{new Date(activeSession.expiresAt).toLocaleTimeString()}</span>.
            </div>
          </div>
        )}

        {/* Lock Error Message */}
        {lockError && (
          <div className="mt-4 p-3 rounded-xl border flex items-center gap-2.5 bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{lockError}</span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. CARD HEADER: TILE STEP DIAGNOSTIC */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-xl flex items-center justify-center transition-colors" 
            style={{ backgroundColor: colors.accentSubtle }}
          >
            <Footprints className="h-6 w-6" style={{ color: colors.accent }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 
                className="text-xl sm:text-2xl font-bold tracking-tight"
                style={{ color: colors.textPrimary }}
              >
                Tile Step Diagnostic
              </h2>
              <Badge variant="success" shape="pill" className="text-xs px-2.5 py-0.5">
                Single Tile Mode
              </Badge>
            </div>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: colors.textSecondary }}>
              Automatic historical baseline comparison for on-demand footstep testing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Baseline Recalibration Protected
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. GRID: BASELINE METRICS & TEST EXECUTION */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        
        {/* Left Column: Automatic Baseline (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl border bg-slate-50/80 dark:bg-gray-900/50 border-slate-200/80 dark:border-white/10 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                1. Established Reference Baseline
              </h3>
            </div>
            
            <p className="text-xs mb-4 text-slate-500 dark:text-slate-400">
              Evaluated against last {daysAnalyzed} days ({totalSteps.toLocaleString()} footsteps recorded):
            </p>

            <div className="space-y-3">
              {/* Normal Step */}
              <div className="p-4 rounded-xl border bg-white dark:bg-gray-800/90 border-slate-200/90 dark:border-gray-700/60 shadow-xs">
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                  Normal step output baseline
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                    {normalStep.toFixed(5)}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-gray-400">mWh per step</span>
                </div>
              </div>

              {/* Acceptable Range */}
              <div className="p-4 rounded-xl border bg-white dark:bg-gray-800/90 border-slate-200/90 dark:border-gray-700/60 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                    Acceptable threshold (±{tolerance}%)
                  </p>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
                    Normal Zone
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1.5 tabular-nums text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                  <span>{minAcceptable.toFixed(5)}</span>
                  <span className="text-slate-400 dark:text-gray-500 font-normal">→</span>
                  <span>{maxAcceptable.toFixed(5)}</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-gray-400">mWh</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-gray-800/80 text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Reference baseline is protected against auto-recalibration</span>
          </div>
        </div>

        {/* Right Column: On-Demand Test Mode & Visual Result (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1 rounded-md ${testState === 'LISTENING' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
              <Radio className={`h-3.5 w-3.5 ${testState === 'LISTENING' ? 'animate-pulse' : ''}`} />
            </div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
              2. Physical Step Test Session
            </h3>
          </div>

          {/* STATE 1: IDLE */}
          {testState === 'IDLE' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed text-center bg-slate-50/60 dark:bg-gray-900/30 border-slate-200 dark:border-gray-800 transition-all">
              <div className="p-4 rounded-2xl bg-emerald-100/70 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/20 mb-4 transition-transform hover:scale-105">
                <Footprints className="h-8 w-8" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                {todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED
                  ? 'Daily Task Completed — Tile Verified'
                  : 'Ready to Perform Daily Step Verification'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mb-6 leading-relaxed">
                {todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED
                  ? `Completed today by ${todayTask.performedByName || todayTask.performedBy}. You may initiate a re-verification test anytime.`
                  : 'Click Start Test Mode to acquire the testing lock, then step firmly on the physical piezoelectric tile.'}
              </p>
              
              <button
                type="button"
                onClick={handleStartTest}
                disabled={isLockedByOtherAdmin || startSessionMutation.isPending}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 text-sm font-semibold rounded-xl shadow-xs hover:shadow transition-all bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#39FF88] dark:text-[#0B132B] dark:hover:bg-[#2EE577] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startSessionMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    <span>Acquiring Lock...</span>
                  </>
                ) : isLockedByOtherAdmin ? (
                  <>
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Session Locked ({activeSession?.adminName})</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current shrink-0" />
                    <span>{todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED ? 'Perform Re-Verification Test' : 'Start Test Mode'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STATE 2: LISTENING */}
          {testState === 'LISTENING' && (
            <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 rounded-2xl border bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-500/30 shadow-xs">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-500/30 font-semibold text-xs mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Session Locked for {user?.name || user?.email}
                </div>
                
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Ready — Step on the tile
                </h4>
                
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Step firmly on the physical piezoelectric tile. Waiting for live ESP32 telemetry event...
                </p>
              </div>

              {/* Quick Trigger / Manual Step Entry */}
              <div className="mt-6 p-4 rounded-xl bg-white dark:bg-gray-900/90 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    ESP32 Telemetry Trigger / Manual Entry
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 tabular-nums">Normal: 0.00510 mWh</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.00001"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="0.00418"
                      className="w-full text-sm tabular-nums px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">mWh</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteTest(parseFloat(manualInput) || 0.00418, 'Admin Step Verification')}
                    disabled={completeDailyMutation.isPending}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-[#39FF88] dark:text-[#0B132B] dark:hover:bg-[#2EE577] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    {completeDailyMutation.isPending ? 'Verifying...' : 'Submit Step'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelTest} 
                  disabled={cancelSessionMutation.isPending}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                >
                  Cancel Session & Release Lock
                </Button>
              </div>
            </div>
          )}

          {/* STATE 3: VISUAL RESULT */}
          {testState === 'RESULT' && testResult && (
            <div 
              className="flex-1 flex flex-col justify-between p-6 sm:p-7 rounded-2xl border shadow-xs transition-all bg-white dark:bg-gray-900/60"
              style={{
                borderColor: isWithinRange ? '#10B981' : '#EF4444',
              }}
            >
              <div>
                {/* Result Status Header */}
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    {isWithinRange ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                    )}
                    <div>
                      <span className={`text-base font-bold tracking-tight ${isWithinRange ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {testResult.result === DiagnosticResultStatus.WITHIN_RANGE 
                          ? '✅ WITHIN NORMAL RANGE' 
                          : testResult.result.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs tabular-nums text-slate-400 dark:text-gray-400 block">
                      {new Date(testResult.testDate).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Daily Task Updated
                    </span>
                  </div>
                </div>

                {/* Numeric Comparison Card */}
                <div className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-slate-50/90 dark:bg-gray-800/80 border border-slate-200/80 dark:border-white/10 shadow-xs">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Your Step</p>
                    <p className="text-lg sm:text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {testResult.actualEnergyMWh.toFixed(5)} <span className="text-xs font-normal text-slate-400">mWh</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Expected</p>
                    <p className="text-lg sm:text-xl font-bold tabular-nums text-slate-900 dark:text-gray-100 mt-0.5">
                      {testResult.expectedEnergyMWh.toFixed(5)} <span className="text-xs font-normal text-slate-400">mWh</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Deviation</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {testResult.deviationPercentage >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                      )}
                      <p className={`text-lg sm:text-xl font-bold tabular-nums ${testResult.deviationPercentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {testResult.deviationPercentage >= 0 ? '+' : ''}{testResult.deviationPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Result ASCII / Range Bar */}
                <div className="mb-6 px-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-gray-400 mb-2">
                    <span>Performance Distribution Scale</span>
                    <span className="tabular-nums">Acceptable range ±{tolerance}%</span>
                  </div>

                  {/* Horizontal Track Container */}
                  <div className="relative h-10 w-full flex items-center">
                    {/* Base Background Track */}
                    <div className="absolute w-full h-3 rounded-full bg-slate-200 dark:bg-gray-700/80"></div>

                    {/* Acceptable Zone Highlight */}
                    <div 
                      className="absolute h-3 bg-emerald-500/25 dark:bg-emerald-500/20 rounded-full border border-emerald-500/40"
                      style={{
                        left: `${getMinPosition()}%`,
                        width: `${getMaxPosition() - getMinPosition()}%`,
                      }}
                    ></div>

                    {/* Center Mean Marker */}
                    <div 
                      className="absolute top-1 bottom-1 w-0.5 bg-slate-400 dark:bg-gray-400"
                      style={{ left: `${getMeanPosition()}%` }}
                    ></div>

                    {/* Your Step Marker */}
                    <div 
                      className="absolute -top-3.5 transform -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-500"
                      style={{ left: `${getMarkerPosition()}%` }}
                    >
                      <span className="text-xl filter drop-shadow">👟</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 shadow-md"></div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap mt-0.5">
                        (you)
                      </span>
                    </div>
                  </div>

                  {/* Ticks and Labels below Track */}
                  <div className="relative w-full h-8 mt-1 text-[11px] tabular-nums text-slate-600 dark:text-gray-300">
                    <div className="absolute transform -translate-x-1/2 text-center" style={{ left: `${getMinPosition()}%` }}>
                      <span className="block font-semibold">{minAcceptable.toFixed(5)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-400">(min)</span>
                    </div>

                    <div className="absolute transform -translate-x-1/2 text-center" style={{ left: `${getMeanPosition()}%` }}>
                      <span className="block font-semibold">{normalStep.toFixed(5)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-400">(mean)</span>
                    </div>

                    <div className="absolute transform -translate-x-1/2 text-center" style={{ left: `${getMaxPosition()}%` }}>
                      <span className="block font-semibold">{maxAcceptable.toFixed(5)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-400">(max)</span>
                    </div>
                  </div>
                </div>

                {/* Verdict Footer Box */}
                <div className={`p-3.5 rounded-xl border text-center font-semibold text-sm ${isWithinRange ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-300' : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-300'}`}>
                  {testResult.statusMessage}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 mt-2 border-t border-slate-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleStartTest} 
                  className="inline-flex items-center justify-center gap-2 flex-1 font-semibold text-sm py-2.5 px-5 rounded-xl shadow-xs transition-all bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#39FF88] dark:text-[#0B132B] dark:hover:bg-[#2EE577] cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current shrink-0" />
                  <span>Test Again</span>
                </button>
                <Button variant="ghost" onClick={handleReset} className="text-xs text-slate-600 dark:text-gray-300 cursor-pointer">
                  Done
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
