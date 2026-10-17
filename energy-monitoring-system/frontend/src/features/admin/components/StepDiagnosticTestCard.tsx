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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useSocket } from '@/contexts/SocketContext';
import { getThemeColors } from '@/lib/theme';
import { useDiagnosticBaseline, useRecordStepTest } from '../hooks/useDiagnostics';
import { DiagnosticResultStatus } from '@/types/diagnostic.types';
import type { StepTestResult } from '@/types/diagnostic.types';

type TestModeState = 'IDLE' | 'LISTENING' | 'RESULT';

/**
 * Step Diagnostic Test Card
 * 
 * Provides:
 * 1. Automatic 30-day baseline calculation
 * 2. On-demand single-step test mode with live hardware listener
 * 3. High-fidelity visual comparison range bar
 */
export function StepDiagnosticTestCard() {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { socket, isConnected } = useSocket();

  const { data: baseline, isLoading: isBaselineLoading, refetch: refetchBaseline } = useDiagnosticBaseline();
  const recordMutation = useRecordStepTest();

  const [testState, setTestState] = useState<TestModeState>('IDLE');
  const [testResult, setTestResult] = useState<StepTestResult | null>(null);
  const [manualInput, setManualInput] = useState<string>('0.00418');

  // Values with fallbacks matching specs
  const daysAnalyzed = baseline?.daysAnalyzed ?? 30;
  const totalSteps = baseline?.totalSteps ?? 1547;
  const normalStep = baseline?.normalStepMWh ?? 0.00510;
  const minAcceptable = baseline?.minAcceptableMWh ?? 0.00346;
  const maxAcceptable = baseline?.maxAcceptableMWh ?? 0.00674;
  const tolerance = baseline?.tolerancePercent ?? 34;

  // Listen for real-time readings from hardware tile when in LISTENING mode
  useEffect(() => {
    if (!socket || !isConnected || testState !== 'LISTENING') return;

    const handleNewReading = (reading: any) => {
      // If hardware tile transmitted an energy reading
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

  const handleStartTest = () => {
    setTestResult(null);
    setTestState('LISTENING');
  };

  const handleExecuteTest = async (energyVal: number, notes?: string) => {
    try {
      const res = await recordMutation.mutateAsync({
        actualStepEnergyMWh: energyVal,
        notes: notes || 'Single Step Verification Test',
      });
      setTestResult(res);
      setTestState('RESULT');
    } catch (err) {
      console.error('Failed to record step test:', err);
    }
  };

  const handleReset = () => {
    setTestState('IDLE');
    setTestResult(null);
  };

  // Visual Gauge Math
  const getMarkerPosition = () => {
    if (!testResult) return 50;
    const actual = testResult.actualEnergyMWh;
    // Scale span: 30% padding below min and above max
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

  const isWithinRange = testResult?.result === DiagnosticResultStatus.WITHIN_RANGE;

  return (
    <div 
      className="rounded-2xl p-6 sm:p-8 border shadow-xs transition-all"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
      }}
    >
      {/* Title & Badge */}
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

        {/* Recalculate Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetchBaseline()}
          isLoading={isBaselineLoading}
          className="self-start sm:self-auto gap-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refresh Baseline
        </Button>
      </div>

      {/* Grid: Baseline Info & Test Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        
        {/* Left Column: Automatic Baseline (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl border bg-slate-50/80 dark:bg-gray-900/50 border-slate-200/80 dark:border-white/10 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                1. Automatic Baseline
              </h3>
            </div>
            
            <p className="text-xs mb-4 text-slate-500 dark:text-slate-400">
              System analyzes last {daysAnalyzed} days ({totalSteps.toLocaleString()} steps):
            </p>

            <div className="space-y-3">
              {/* Normal Step */}
              <div className="p-4 rounded-xl border bg-white dark:bg-gray-800/90 border-slate-200/90 dark:border-gray-700/60 shadow-xs">
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                  Normal step output
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
                    Acceptable range (±{tolerance}%)
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
            <span>Hardware verification baseline is continuously auto-synced</span>
          </div>
        </div>

        {/* Right Column: On-Demand Test Mode & Visual Result (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1 rounded-md ${testState === 'LISTENING' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
              <Radio className={`h-3.5 w-3.5 ${testState === 'LISTENING' ? 'animate-pulse' : ''}`} />
            </div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
              2. On-Demand Test Mode
            </h3>
          </div>

          {/* STATE 1: IDLE */}
          {testState === 'IDLE' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed text-center bg-slate-50/60 dark:bg-gray-900/30 border-slate-200 dark:border-gray-800 transition-all">
              <div className="p-4 rounded-2xl bg-emerald-100/70 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/20 mb-4 transition-transform hover:scale-105">
                <Footprints className="h-8 w-8" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                Ready to Verify Footstep Tile
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mb-6 leading-relaxed">
                Click Start Test Mode, then step on the physical tile once. The system will instantly compare your step against the 30-day baseline.
              </p>
              
              <button
                type="button"
                onClick={handleStartTest}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 text-sm font-semibold rounded-xl shadow-xs hover:shadow transition-all bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#39FF88] dark:text-[#0B132B] dark:hover:bg-[#2EE577] active:scale-[0.98] cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current shrink-0" />
                <span className="whitespace-nowrap">Start Test Mode</span>
              </button>
            </div>
          )}

          {/* STATE 2: LISTENING */}
          {testState === 'LISTENING' && (
            <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 rounded-2xl border bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-500/30 shadow-xs">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-500/30 font-semibold text-xs mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Active Listening Mode
                </div>
                
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Ready — Step on the tile
                </h4>
                
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Walk or step firmly on the physical footstep tile. Waiting for ESP32 telemetry event...
                </p>
              </div>

              {/* Quick Simulator / Trigger Box (for convenience or desk testing) */}
              <div className="mt-6 p-4 rounded-xl bg-white dark:bg-gray-900/90 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Quick Trigger / Manual Step Entry
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 tabular-nums">Spec default: 0.00418 mWh</span>
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
                    onClick={() => handleExecuteTest(parseFloat(manualInput) || 0.00418, 'Manual Step Simulation')}
                    disabled={recordMutation.isPending}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-[#39FF88] dark:text-[#0B132B] dark:hover:bg-[#2EE577] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    Submit Step
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white cursor-pointer">
                  Cancel Test
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

                  <span className="text-xs tabular-nums text-slate-400 dark:text-gray-400">
                    {new Date(testResult.testDate).toLocaleTimeString()}
                  </span>
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

                    {/* Acceptable Zone Highlight (Green shaded) */}
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

                    {/* Your Step Marker (Shoe Icon) */}
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
                    {/* Min Label */}
                    <div className="absolute transform -translate-x-1/2 text-center" style={{ left: `${getMinPosition()}%` }}>
                      <span className="block font-semibold">{minAcceptable.toFixed(5)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-400">(min)</span>
                    </div>

                    {/* Mean Label */}
                    <div className="absolute transform -translate-x-1/2 text-center" style={{ left: `${getMeanPosition()}%` }}>
                      <span className="block font-semibold">{normalStep.toFixed(5)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-400">(mean)</span>
                    </div>

                    {/* Max Label */}
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
                  Close
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
