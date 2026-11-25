import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  Bluetooth,
  BluetoothConnected,
  Wifi,
  Sparkles,
  Plus,
  RotateCcw,
  Radio,
  Sliders,
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useBle } from '@/contexts/BleContext';
import {
  useDiagnosticBaseline,
  useTodayDailyTask,
  useCompleteDailyTask,
  useRecordStepTest,
} from '../hooks/useDiagnostics';
import {
  DailyDiagnosticTaskStatus,
  DiagnosticResultStatus,
  type StepTestResult,
} from '@/types/diagnostic.types';
import { EcoStepBleModal } from '@/features/ble/components/EcoStepBleModal';

export interface BenchSample {
  id: string;
  energyPerStepMWh: number;
  voltageV?: number;
  currentMA?: number;
  steps?: number;
  source: 'ws' | 'ble' | 'manual' | 'simulated';
  capturedAt: string;
}

interface BenchEvaluation {
  meanMWh: number;
  peakMWh: number;
  consistencyScore: number;
  benchHealthScore: number;
  sampleCount: number;
  electricalHint: string;
  stepResult: StepTestResult;
  dailyCheckMarked: boolean;
}

type BenchMode = 'IDLE' | 'CAPTURING' | 'RESULT';

/**
 * DiagnosticWorkbenchCard
 *
 * Left (Main): Guided Multi-Sample Bench Test
 * - Run anytime (auto-marks Today's Daily Check on first run, logs on-demand runs thereafter)
 * - Auto-captures live WebSocket (`reading:new`) AND BLE (`latestTelemetry`) events
 * - Configurable 1 / 3 / 5 sample targets + Finish Early once >= 1 sample captured
 * - Manual sample input + Simulate Step fallback so demos/checks never hang
 * - Live SVG oscilloscope sparkline plotted against 30-day baseline band
 *
 * Right (Rail): 30-Day Baseline Band + BLE Field Link & Wi-Fi Check
 */
export function DiagnosticWorkbenchCard() {
  const { socket, isConnected } = useSocket();
  const ble = useBle();

  const { data: baseline } = useDiagnosticBaseline();
  const { data: todayTask } = useTodayDailyTask();
  const completeDailyMutation = useCompleteDailyTask();
  const recordStepMutation = useRecordStepTest();

  const [mode, setMode] = useState<BenchMode>('IDLE');
  const [targetSamples, setTargetSamples] = useState<1 | 3 | 5>(3);
  const [samples, setSamples] = useState<BenchSample[]>([]);
  const [manualInput, setManualInput] = useState<string>('');
  const [evaluation, setEvaluation] = useState<BenchEvaluation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBleModalOpen, setIsBleModalOpen] = useState(false);

  const lastBleTimestampRef = useRef<string | null>(null);
  const isEvaluatingRef = useRef<boolean>(false);

  // Baseline values
  const daysAnalyzed = baseline?.daysAnalyzed ?? 30;
  const normalStep = baseline?.normalStepMWh ?? 0.00051;
  const minAcceptable = baseline?.minAcceptableMWh ?? normalStep * 0.66;
  const maxAcceptable = baseline?.maxAcceptableMWh ?? normalStep * 1.34;
  const tolerance = baseline?.tolerancePercent ?? 34;

  const isDailyAlreadyDone =
    todayTask?.status === DailyDiagnosticTaskStatus.COMPLETED ||
    todayTask?.status === DailyDiagnosticTaskStatus.NEEDS_ATTENTION;

  // Initialize manual input placeholder once baseline arrives
  useEffect(() => {
    if (!manualInput && normalStep > 0) {
      setManualInput(normalStep.toFixed(5));
    }
  }, [normalStep, manualInput]);

  // Evaluate and persist a completed set of samples
  const finalizeSamples = async (captured: BenchSample[]) => {
    if (captured.length === 0 || isEvaluatingRef.current) return;
    isEvaluatingRef.current = true;
    setErrorMessage(null);

    try {
      const values = captured.map((s) => s.energyPerStepMWh);
      const meanMWh = values.reduce((a, b) => a + b, 0) / values.length;
      const peakMWh = Math.max(...values);

      // Consistency score (100% for single sample, CV-based for multi-sample)
      let consistencyScore = 100;
      if (values.length >= 2 && meanMWh > 0) {
        const variance =
          values.reduce((acc, v) => acc + Math.pow(v - meanMWh, 2), 0) / values.length;
        const cv = Math.sqrt(variance) / meanMWh;
        consistencyScore = Math.max(20, Math.min(100, Math.round(100 - cv * 100)));
      }

      // Quick electrical sanity check across captured samples
      const vSamples = captured.filter((s) => s.voltageV !== undefined);
      const maxV = vSamples.reduce((m, s) => Math.max(m, s.voltageV ?? 0), 0);
      const maxI = vSamples.reduce((m, s) => Math.max(m, s.currentMA ?? 0), 0);
      let electricalHint = 'Clean electrical profile across captured samples.';
      if (vSamples.length > 0 && maxV >= 1.5 && maxI < 0.05) {
        electricalHint = 'Voltage spiked without measurable current — check INA219 / load path.';
      } else if (vSamples.length > 0 && maxV < 0.05 && meanMWh < minAcceptable) {
        electricalHint = 'Near-zero voltage during test — inspect piezo-to-rectifier wiring.';
      } else if (consistencyScore < 70 && values.length >= 2) {
        electricalHint = 'High variance between steps — check for intermittent contact or loose disc.';
      }

      const sourceSummary = Array.from(new Set(captured.map((s) => s.source))).join('+');
      const notes = `Bench Test (${captured.length} sample${captured.length > 1 ? 's' : ''}, ${sourceSummary}) • Peak ${peakMWh.toFixed(5)} mWh • Consistency ${consistencyScore}%`;

      let stepResult: StepTestResult;
      let dailyCheckMarked = false;

      if (!isDailyAlreadyDone) {
        const res = await completeDailyMutation.mutateAsync({
          actualStepEnergyMWh: parseFloat(meanMWh.toFixed(5)),
          notes,
        });
        stepResult = res.stepResult;
        dailyCheckMarked = true;
      } else {
        stepResult = await recordStepMutation.mutateAsync({
          actualStepEnergyMWh: parseFloat(meanMWh.toFixed(5)),
          notes,
        });
      }

      // Compute 0-100 Bench Health Score combining baseline closeness + consistency
      const deviationAbs = Math.abs(stepResult.deviationPercentage || 0);
      const outputScore = Math.max(15, Math.min(100, Math.round(100 - Math.max(0, deviationAbs - 10) * 1.4)));
      const benchHealthScore = Math.round(outputScore * 0.65 + consistencyScore * 0.35);

      setEvaluation({
        meanMWh,
        peakMWh,
        consistencyScore,
        benchHealthScore,
        sampleCount: captured.length,
        electricalHint,
        stepResult,
        dailyCheckMarked,
      });
      setMode('RESULT');
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Failed to record diagnostic bench test.',
      );
    } finally {
      isEvaluatingRef.current = false;
    }
  };

  // Append a newly captured sample & auto-finish when targetSamples reached
  const appendSample = (sample: BenchSample) => {
    setSamples((prev) => {
      if (prev.length >= targetSamples) return prev;
      const next = [...prev, sample];
      if (next.length >= targetSamples) {
        // Trigger finalize outside state updater
        setTimeout(() => {
          void finalizeSamples(next);
        }, 120);
      }
      return next;
    });
  };

  // Listen to WebSocket `reading:new` while capturing
  useEffect(() => {
    if (!socket || !isConnected || mode !== 'CAPTURING') return;

    const handleNewReading = (reading: any) => {
      if (!reading) return;
      const energy = Number(reading.energy ?? 0);
      const power = Number(reading.power ?? 0);
      const voltage = Number(reading.voltage ?? 0);
      const current = Number(reading.current ?? 0);
      const steps = Number(reading.stepCount ?? 0);

      if (energy <= 0 && power <= 0 && voltage <= 0 && steps <= 0) return;

      const energyPerStepMWh =
        energy > 0 ? (steps > 0 ? energy / steps : energy) : normalStep;

      appendSample({
        id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        energyPerStepMWh: parseFloat(energyPerStepMWh.toFixed(5)),
        voltageV: voltage > 0 ? Number(voltage.toFixed(2)) : undefined,
        currentMA: current > 0 ? Number((current * 1000).toFixed(3)) : undefined,
        steps: steps > 0 ? steps : 1,
        source: 'ws',
        capturedAt: new Date().toISOString(),
      });
    };

    socket.on('reading:new', handleNewReading);
    return () => {
      socket.off('reading:new', handleNewReading);
    };
  }, [socket, isConnected, mode, targetSamples, normalStep]);

  // Also auto-capture live BLE step notifications while capturing (works even if Wi-Fi is down!)
  useEffect(() => {
    if (mode !== 'CAPTURING' || !ble.latestTelemetry) return;
    const t = ble.latestTelemetry;
    const sig = `${t.steps ?? ''}-${t.energy ?? ''}-${t.power ?? ''}-${t.voltage ?? ''}-${t.freq ?? ''}`;
    if (lastBleTimestampRef.current === sig) return;
    lastBleTimestampRef.current = sig;

    const energy = Number(t.energy ?? 0);
    const steps = Number(t.steps ?? 1);
    const energyPerStepMWh =
      energy > 0 ? (steps > 0 ? energy / steps : energy) : normalStep;

    appendSample({
      id: `ble-${Date.now()}`,
      energyPerStepMWh: parseFloat(energyPerStepMWh.toFixed(5)),
      voltageV: typeof t.voltage === 'number' ? Number(t.voltage.toFixed(2)) : undefined,
      steps,
      source: 'ble',
      capturedAt: new Date().toISOString(),
    });
  }, [mode, ble.latestTelemetry, targetSamples, normalStep]);

  const handleStartBench = () => {
    setErrorMessage(null);
    setEvaluation(null);
    setSamples([]);
    setMode('CAPTURING');
  };

  const handleStopBench = () => {
    setMode('IDLE');
    setSamples([]);
    setErrorMessage(null);
  };

  const handleAddManualSample = () => {
    const val = parseFloat(manualInput);
    if (isNaN(val) || val <= 0) {
      setErrorMessage('Enter a valid positive energy value (mWh/step).');
      return;
    }
    setErrorMessage(null);
    appendSample({
      id: `manual-${Date.now()}`,
      energyPerStepMWh: parseFloat(val.toFixed(5)),
      steps: 1,
      source: 'manual',
      capturedAt: new Date().toISOString(),
    });
  };

  const handleSimulateSample = () => {
    setErrorMessage(null);
    // Natural ±12% jitter around baseline for realistic demo/calibration simulation
    const jitter = 1 + (Math.random() * 0.24 - 0.12);
    const simEnergy = parseFloat((normalStep * jitter).toFixed(5));
    const simVoltage = Number((3.6 + Math.random() * 0.9).toFixed(2));
    const simCurrentMA = Number((7.2 + Math.random() * 2.4).toFixed(2));
    appendSample({
      id: `sim-${Date.now()}`,
      energyPerStepMWh: simEnergy,
      voltageV: simVoltage,
      currentMA: simCurrentMA,
      steps: 1,
      source: 'simulated',
      capturedAt: new Date().toISOString(),
    });
  };

  // Live Sparkline SVG math
  const sparkline = useMemo(() => {
    const width = 420;
    const height = 110;
    const padX = 16;
    const padY = 14;
    const allVals = [
      minAcceptable * 0.8,
      maxAcceptable * 1.2,
      ...samples.map((s) => s.energyPerStepMWh),
    ];
    const minY = Math.max(0, Math.min(...allVals));
    const maxY = Math.max(minY + 0.0001, Math.max(...allVals));

    const toY = (v: number) =>
      height - padY - ((v - minY) / (maxY - minY)) * (height - padY * 2);

    const bandTop = toY(maxAcceptable);
    const bandBottom = toY(minAcceptable);
    const baselineY = toY(normalStep);

    const slotCount = Math.max(targetSamples, samples.length, 2);
    const points = samples.map((s, idx) => {
      const x =
        slotCount <= 1
          ? width / 2
          : padX + (idx / (slotCount - 1)) * (width - padX * 2);
      const y = toY(s.energyPerStepMWh);
      return { x, y, sample: s };
    });

    const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

    return { width, height, bandTop, bandBottom, baselineY, points, polyline };
  }, [samples, targetSamples, minAcceptable, maxAcceptable, normalStep]);

  const isSaving = completeDailyMutation.isPending || recordStepMutation.isPending;

  return (
    <section
      id="diagnostic-workbench"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      aria-label="Diagnostic Bench Test and BLE Field Check"
    >
      {/* LEFT (8 cols): Guided Multi-Sample Bench Test */}
      <div className="lg:col-span-8 cd !p-5 sm:!p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] sm:text-[18px] font-bold tracking-tight text-[var(--t)] m-0">
                Guided Multi-Sample Bench Test
              </h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isDailyAlreadyDone
                    ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25'
                }`}
              >
                {isDailyAlreadyDone ? 'Daily Check: Verified ✓' : 'Daily Check: Pending'}
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[var(--mu)] mt-1 m-0">
              Captures live ESP32 uploads (WebSocket or BLE) to score peak yield and repeatability. Run anytime — first run of the day automatically verifies today’s daily check.
            </p>
          </div>

          {/* Sample Target Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
              Samples:
            </span>
            <div className="sgc sgc-sm flex" role="group" aria-label="Bench sample count">
              {([1, 3, 5] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  disabled={mode === 'CAPTURING'}
                  onClick={() => setTargetSamples(cnt)}
                  className={targetSamples === cnt ? 'on' : ''}
                >
                  {cnt}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Oscilloscope / Baseline Band Visualization */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)]/45 p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--mu)] mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <Radio
                className={`w-3.5 h-3.5 ${
                  mode === 'CAPTURING' ? 'text-emerald-500 animate-pulse' : 'text-[var(--mu)]'
                }`}
              />
              {mode === 'CAPTURING'
                ? `Listening on WebSocket${ble.isConnected ? ' + BLE' : ''} (${samples.length}/${targetSamples} captured)`
                : mode === 'RESULT'
                  ? `Bench Run Complete (${evaluation?.sampleCount ?? samples.length} samples)`
                  : `Ready • Acceptable band: ${minAcceptable.toFixed(5)} – ${maxAcceptable.toFixed(5)} mWh/step`}
            </span>
            <span className="tabular-nums text-[var(--t)]">
              Baseline {normalStep.toFixed(5)} mWh
            </span>
          </div>

          <svg
            viewBox={`0 0 ${sparkline.width} ${sparkline.height}`}
            className="w-full h-[110px] overflow-visible"
            role="img"
            aria-label="Live step energy oscilloscope sparkline"
          >
            {/* Acceptable tolerance green band */}
            <rect
              x="0"
              y={sparkline.bandTop}
              width={sparkline.width}
              height={Math.max(4, sparkline.bandBottom - sparkline.bandTop)}
              fill="rgba(16, 185, 129, 0.14)"
              rx="6"
            />
            {/* Dashed 30-day normal baseline */}
            <line
              x1="0"
              y1={sparkline.baselineY}
              x2={sparkline.width}
              y2={sparkline.baselineY}
              stroke="#10B981"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.7"
            />
            {/* Polyline connecting captured samples */}
            {sparkline.points.length >= 2 && (
              <polyline
                fill="none"
                stroke="var(--acc)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparkline.polyline}
              />
            )}
            {/* Sample Dots */}
            {sparkline.points.map((pt, i) => {
              const inBand =
                pt.sample.energyPerStepMWh >= minAcceptable &&
                pt.sample.energyPerStepMWh <= maxAcceptable;
              return (
                <g key={pt.sample.id}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5.5"
                    fill={inBand ? '#10B981' : '#F59E0B'}
                    stroke="var(--panel)"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={Math.max(10, pt.y - 9)}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="var(--t)"
                  >
                    #{i + 1}
                  </text>
                </g>
              );
            })}
            {sparkline.points.length === 0 && (
              <text
                x={sparkline.width / 2}
                y={sparkline.height / 2 + 4}
                textAnchor="middle"
                fontSize="11.5"
                fill="var(--mu)"
              >
                {mode === 'CAPTURING'
                  ? 'Step on the EcoStep tile (or use Manual / Simulate below)...'
                  : 'Click "Start Bench Test" to capture live step samples'}
              </text>
            )}
          </svg>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Mode-specific Controls */}
        {mode === 'IDLE' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleStartBench}
              className="min-h-[42px] px-5 py-2.5 rounded-full inline-flex items-center gap-2 text-sm font-bold bg-[var(--acc)] text-white dark:text-[#04210f] hover:bg-[var(--bar)] shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start {targetSamples}-Sample Bench Test</span>
            </button>
            <span className="text-xs text-[var(--mu)]">
              Works with both batched ESP32 uploads and individual step triggers.
            </span>
          </div>
        )}

        {mode === 'CAPTURING' && (
          <div className="flex flex-col gap-3">
            {/* Captured Sample Chips */}
            {samples.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {samples.map((s, idx) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-[var(--t)] tabular-nums"
                  >
                    <strong className="text-[var(--acc)]">#{idx + 1}</strong>
                    {s.energyPerStepMWh.toFixed(5)} mWh
                    {s.voltageV !== undefined && (
                      <span className="text-[var(--mu)]">• {s.voltageV}V</span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-[var(--mu)]">
                      ({s.source})
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Primary Capture Actions + Manual / Simulate Fallback */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={samples.length === 0 || isSaving}
                  onClick={() => void finalizeSamples(samples)}
                  className="px-4 py-2 rounded-full inline-flex items-center gap-1.5 text-xs font-bold bg-[var(--acc)] text-white dark:text-[#04210f] hover:bg-[var(--bar)] disabled:opacity-45 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isSaving
                      ? 'Evaluating...'
                      : `Finish & Evaluate (${samples.length}/${targetSamples})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleStopBench}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:bg-[var(--panel)] cursor-pointer"
                >
                  <Square className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              </div>

              {/* Manual + Simulate Fallback */}
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="number"
                  step="0.00001"
                  min="0"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  aria-label="Manual sample mWh per step"
                  placeholder="mWh/step"
                  className="w-28 px-2.5 py-1.5 rounded-lg text-xs border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleAddManualSample}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:bg-[var(--panel)] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={handleSimulateSample}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:bg-[var(--panel)] inline-flex items-center gap-1 cursor-pointer"
                  title="Capture a simulated step sample for demo/testing"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
                  Simulate
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'RESULT' && evaluation && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)]/60 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {evaluation.stepResult.result === DiagnosticResultStatus.WITHIN_RANGE ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-sm font-bold text-[var(--t)]">
                  {evaluation.stepResult.statusMessage}
                </span>
                {evaluation.dailyCheckMarked && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Today’s Daily Check Logged
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleStartBench}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] hover:bg-[var(--soft)] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Run Another Test
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
                <div className="text-[10px] uppercase font-bold text-[var(--mu)]">Bench Score</div>
                <div className="text-lg font-extrabold tabular-nums text-[var(--acc)]">
                  {evaluation.benchHealthScore}/100
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
                <div className="text-[10px] uppercase font-bold text-[var(--mu)]">Mean Output</div>
                <div className="text-sm font-bold tabular-nums text-[var(--t)] mt-0.5">
                  {evaluation.meanMWh.toFixed(5)} mWh
                </div>
                <div className="text-[11px] text-[var(--mu)] tabular-nums">
                  {evaluation.stepResult.deviationPercentage >= 0 ? '+' : ''}
                  {evaluation.stepResult.deviationPercentage}% vs base
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
                <div className="text-[10px] uppercase font-bold text-[var(--mu)]">Peak Output</div>
                <div className="text-sm font-bold tabular-nums text-[var(--t)] mt-0.5">
                  {evaluation.peakMWh.toFixed(5)} mWh
                </div>
                <div className="text-[11px] text-[var(--mu)]">
                  {evaluation.sampleCount} sample{evaluation.sampleCount > 1 ? 's' : ''}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
                <div className="text-[10px] uppercase font-bold text-[var(--mu)]">Consistency</div>
                <div className="text-sm font-bold tabular-nums text-[var(--t)] mt-0.5">
                  {evaluation.consistencyScore}%
                </div>
                <div className="text-[11px] text-[var(--mu)]">Repeatability</div>
              </div>
            </div>

            <p className="text-xs text-[var(--mu)] m-0">
              <strong className="text-[var(--t)]">Electrical check:</strong> {evaluation.electricalHint}
            </p>
          </div>
        )}
      </div>

      {/* RIGHT (4 cols): Baseline Band + BLE Field Check */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        {/* Compact 30-Day Baseline Reference Card */}
        <div className="cd !p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--mu)] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[var(--acc)]" />
              {daysAnalyzed}-Day Baseline Band
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--soft)] text-[var(--t)] border border-[var(--line)] tabular-nums">
              ±{tolerance}%
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold tabular-nums text-[var(--t)]">
              {normalStep.toFixed(5)}
            </span>
            <span className="text-xs font-semibold text-[var(--mu)]">mWh / step</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[var(--soft)] border border-[var(--line)] relative overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/35 border-x border-emerald-500/70"
              style={{ left: '20%', right: '20%' }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[var(--acc)]"
              style={{ left: '50%' }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--mu)] tabular-nums">
            <span>Min {minAcceptable.toFixed(5)}</span>
            <span>Max {maxAcceptable.toFixed(5)}</span>
          </div>
        </div>

        {/* BLE Field Link & Wi-Fi Readiness Card */}
        <div className="cd !p-5 flex flex-col gap-3 flex-1 justify-between">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--mu)] flex items-center gap-1.5">
                {ble.isConnected ? (
                  <BluetoothConnected className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Bluetooth className="w-3.5 h-3.5 text-[var(--acc)]" />
                )}
                BLE Field Check
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  ble.isConnected
                    ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    : 'bg-[var(--soft)] text-[var(--mu)] border-[var(--line)]'
                }`}
              >
                {ble.isConnected ? (ble.isSimulation ? 'Demo Linked' : 'Connected') : 'Offline / Ready'}
              </span>
            </div>

            <p className="text-xs text-[var(--mu)] m-0 leading-relaxed">
              Verify the ESP32 locally over Bluetooth even when Wi-Fi or cloud sync is unavailable.
            </p>

            <div className="rounded-xl bg-[var(--soft)]/70 border border-[var(--line)] p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--mu)]">Device</span>
                <span className="font-semibold text-[var(--t)] truncate">
                  {ble.connectedDevice?.name || ble.savedDevice?.name || 'Not paired yet'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--mu)] flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Wi-Fi Status
                </span>
                <span className="font-semibold text-[var(--t)] truncate">
                  {ble.wifiStatus?.status === 'CONNECTED'
                    ? `${ble.wifiStatus.ssid || 'Connected'}${ble.wifiStatus.ip ? ` (${ble.wifiStatus.ip})` : ''}`
                    : ble.wifiStatus?.status || (ble.savedDevice?.lastSsid ? `Last: ${ble.savedDevice.lastSsid}` : 'Unknown')}
                </span>
              </div>
              {ble.latestTelemetry && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--line)]">
                  <span className="text-[var(--mu)]">Live BLE Packet</span>
                  <span className="font-semibold text-[var(--acc)] tabular-nums">
                    {ble.latestTelemetry.voltage?.toFixed?.(1) ?? '—'}V • {ble.latestTelemetry.steps ?? 0} steps
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!ble.isConnected ? (
              <>
                <button
                  type="button"
                  onClick={() => void ble.connect()}
                  disabled={ble.isConnecting || !ble.isSupported}
                  className="flex-1 px-3.5 py-2 rounded-full text-xs font-bold bg-[var(--acc)] text-white dark:text-[#04210f] hover:bg-[var(--bar)] disabled:opacity-45 cursor-pointer"
                >
                  {ble.isConnecting ? 'Pairing...' : 'Connect ESP32'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBleModalOpen(true)}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:bg-[var(--panel)] cursor-pointer"
                >
                  Wi-Fi Setup
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsBleModalOpen(true)}
                  className="flex-1 px-3.5 py-2 rounded-full text-xs font-bold bg-[var(--soft)] border border-[var(--line)] text-[var(--t)] hover:bg-[var(--panel)] cursor-pointer"
                >
                  Configure Wi-Fi
                </button>
                <button
                  type="button"
                  onClick={() => ble.disconnect()}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <EcoStepBleModal isOpen={isBleModalOpen} onClose={() => setIsBleModalOpen(false)} />
    </section>
  );
}
