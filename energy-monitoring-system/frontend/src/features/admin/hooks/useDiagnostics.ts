import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diagnosticsService } from '@/api/services';
import { energyService } from '@/api/services/energy.service';
import type {
  ReferenceConfig,
  DiagnosticHistoryResponse,
  CreateReferenceConfigRequest,
  RecordDiagnosticTestRequest,
  DiagnosticTest,
  DiagnosticBaseline,
  DiagnosticInsights,
  RecordStepTestRequest,
  StepTestResult,
  DailyDiagnosticTask,
  CompleteDailyDiagnosticRequest,
  CompleteDailyDiagnosticResponse,
} from '@/types/diagnostic.types';

/**
 * Query Keys for Diagnostics
 */
const DIAGNOSTICS_KEYS = {
  all: ['diagnostics'] as const,
  referenceConfig: ['diagnostics', 'referenceConfig'] as const,
  baseline: ['diagnostics', 'baseline'] as const,
  insights: ['diagnostics', 'insights'] as const,
  todayDailyTask: ['diagnostics', 'dailyTask', 'today'] as const,
  dailyTaskHistory: (limit: number) =>
    ['diagnostics', 'dailyTask', 'history', limit] as const,
  history: (page: number, limit: number) =>
    ['diagnostics', 'history', page, limit] as const,
};

/**
 * Synthesizes DiagnosticInsights client-side from existing baseline + raw readings
 * if the backend /diagnostics/insights endpoint is not yet deployed.
 */
async function buildFallbackInsights(): Promise<DiagnosticInsights> {
  const [baseline, rawRes] = await Promise.all([
    diagnosticsService.getBaseline().catch(() => ({
      daysAnalyzed: 30,
      totalSteps: 0,
      totalEnergyMWh: 0,
      normalStepMWh: 0.00051,
      tolerancePercent: 34,
      minAcceptableMWh: 0.00034,
      maxAcceptableMWh: 0.00068,
      readingCount: 0,
    })),
    energyService.getRawReadings(undefined, undefined, 1, 100, false).catch(() => ({
      data: [],
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 1,
    })),
  ]);

  const readings = rawRes.data || [];
  const latest = readings[0];
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const last7d = readings.filter((r) => new Date(r.timestamp).getTime() >= sevenDaysAgo);
  const last24h = readings.filter((r) => new Date(r.timestamp).getTime() >= oneDayAgo);

  const stepsLast7d = last7d.reduce((s, r) => s + (r.stepCount || 0), 0);
  const energyLast7d = last7d.reduce((s, r) => s + (r.energy || 0), 0);
  const avgVoltage7dV = last7d.length
    ? last7d.reduce((s, r) => s + (r.voltage || 0), 0) / last7d.length
    : latest?.voltage || 0;
  const avgCurrent7dMA = last7d.length
    ? (last7d.reduce((s, r) => s + (r.current || 0), 0) / last7d.length) * 1000
    : (latest?.current || 0) * 1000;

  const baseline30d = baseline.normalStepMWh || 0.00051;
  const recent7d = stepsLast7d > 0 ? energyLast7d / stepsLast7d : baseline30d;
  const has7d = stepsLast7d > 0 && energyLast7d > 0;
  const driftPercent = has7d
    ? Number((((recent7d - baseline30d) / baseline30d) * 100).toFixed(1))
    : 0;
  const driftStatus = !has7d
    ? 'insufficient_data'
    : driftPercent <= -20
      ? 'degrading'
      : driftPercent <= -10
        ? 'watch'
        : driftPercent >= 10
          ? 'improving'
          : 'stable';

  const lastReadingAt = latest?.timestamp ? new Date(latest.timestamp).toISOString() : null;
  const minutesSinceLast = lastReadingAt
    ? (now - new Date(lastReadingAt).getTime()) / 60000
    : Number.POSITIVE_INFINITY;

  const isOffline = !latest || minutesSinceLast > 24 * 60;
  const latestVoltageV = Number((latest?.voltage ?? 0).toFixed(2));
  const latestCurrentMA = Number(((latest?.current ?? 0) * 1000).toFixed(3));
  const latestPowerMW = Number(((latest?.power ?? 0) * 1000).toFixed(2));
  const latestEnergyMWh = Number((latest?.energy ?? 0).toFixed(4));
  const latestSteps = latest?.stepCount ?? 0;

  const dailyMap = new Map<string, { energy: number; steps: number; v: number; c: number; n: number }>();
  for (const r of readings) {
    const key = new Date(r.timestamp).toISOString().slice(0, 10);
    const cur = dailyMap.get(key) || { energy: 0, steps: 0, v: 0, c: 0, n: 0 };
    cur.energy += r.energy || 0;
    cur.steps += r.stepCount || 0;
    cur.v += r.voltage || 0;
    cur.c += (r.current || 0) * 1000;
    cur.n += 1;
    dailyMap.set(key, cur);
  }
  const dailyTrend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, agg]) => ({
      date,
      mWhPerStep: agg.steps > 0 ? Number((agg.energy / agg.steps).toFixed(5)) : Number(agg.energy.toFixed(5)),
      steps: agg.steps,
      avgVoltageV: agg.n ? Number((agg.v / agg.n).toFixed(2)) : 0,
      avgCurrentMA: agg.n ? Number((agg.c / agg.n).toFixed(2)) : 0,
      readingCount: agg.n,
    }));

  const harvesting = isOffline ? (latest ? 78 : 0) : driftStatus === 'degrading' ? 62 : 92;
  const consistency = isOffline ? (latest ? 80 : 0) : 88;
  const telemetry = isOffline ? 35 : 95;
  const healthScore = latest
    ? Math.round(harvesting * 0.45 + consistency * 0.25 + telemetry * 0.3)
    : 0;

  return {
    healthScore,
    status: isOffline ? 'offline' : driftStatus === 'degrading' ? 'degraded' : 'healthy',
    scoreBreakdown: { harvesting, consistency, telemetry },
    pipelineStages: [
      {
        id: 'piezo',
        label: 'Floor Tile (Footsteps)',
        shortLabel: 'Floor Tile',
        status: isOffline ? 'idle' : 'ok',
        primaryValue: `${stepsLast7d || latestSteps} steps`,
        detail: `${(baseline.totalSteps || stepsLast7d).toLocaleString()} footsteps recorded in the last 30 days`,
      },
      {
        id: 'electrical',
        label: 'Electrical Output (Voltage & Current)',
        shortLabel: 'Volts & Amps',
        status: isOffline ? 'idle' : latestVoltageV > 1.5 && latestCurrentMA < 0.05 ? 'warn' : 'ok',
        primaryValue: `${(avgVoltage7dV || latestVoltageV).toFixed(1)}V • ${(avgCurrent7dMA || latestCurrentMA).toFixed(1)}mA`,
        detail: `Last measured: ${latestVoltageV.toFixed(2)} V, ${latestCurrentMA.toFixed(2)} mA`,
      },
      {
        id: 'energy',
        label: 'Energy Stored Per Step',
        shortLabel: 'Energy Yield',
        status: isOffline ? 'idle' : driftStatus === 'degrading' ? 'warn' : 'ok',
        primaryValue: `${recent7d.toFixed(4)} mWh`,
        detail: `Average per step vs ${baseline30d.toFixed(4)} mWh monthly average`,
      },
      {
        id: 'esp32',
        label: 'Tile Control Box',
        shortLabel: 'Control Box',
        status: isOffline ? 'idle' : 'ok',
        primaryValue: isOffline
          ? 'Idle'
          : minutesSinceLast < 2
            ? 'Active now'
            : `${Math.max(1, Math.round(minutesSinceLast))}m ago`,
        detail: `Sent ${last24h.length} updates in the last 24 hours`,
      },
      {
        id: 'cloud',
        label: 'Online Dashboard Sync',
        shortLabel: 'Online Sync',
        status: isOffline ? 'idle' : 'ok',
        primaryValue: 'Connected',
        detail: 'Ready to receive live updates',
      },
    ],
    faultDiagnosis: isOffline
      ? {
          code: 'NO_RECENT_TELEMETRY',
          severity: 'info',
          title: 'Tile is Idle — No Recent Activity',
          summary: 'No new readings have come in during the past 24 hours.',
          probableCause: 'Nobody has stepped on the tile recently, the control box is unplugged, or Wi-Fi needs to be reconnected.',
          recommendedChecks: [
            'Walk across the tile or run a quick Step Test below.',
            'Use the Bluetooth & Wi-Fi box below to check the tile connection.',
          ],
        }
      : {
          code: 'NOMINAL',
          severity: 'healthy',
          title: 'Everything Is Working Normally',
          summary: 'Footstep sensing, electrical output, energy storage, and online updates are all within normal range.',
          probableCause: 'No wiring, tile wear, or connection problems found.',
          recommendedChecks: [
            'No repair needed — run a Step Test anytime to log a checkup.',
            'Check the 14-day wear chart below occasionally to spot slow wear early.',
          ],
        },
    fatigueRadar: {
      baseline30dMWhPerStep: baseline30d,
      recent7dMWhPerStep: Number(recent7d.toFixed(5)),
      driftPercent,
      driftStatus,
      totalLifetimeSteps: baseline.totalSteps || stepsLast7d,
      stepsLast7d,
      readingsLast24h: last24h.length,
      avgLatencyMs: 0,
      poorSignalRatioPercent: 0,
      lastReadingAt,
      dailyTrend,
      electricalSnapshot: {
        latestVoltageV,
        latestCurrentMA,
        latestPowerMW,
        latestEnergyMWh,
        latestSteps,
        avgVoltage7dV: Number(avgVoltage7dV.toFixed(2)),
        avgCurrent7dMA: Number(avgCurrent7dMA.toFixed(2)),
      },
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Use Diagnostic Insights Hook
 * 
 * Fetches 5-stage pipeline health, fault-signature diagnosis, and fatigue radar.
 * Falls back gracefully to client-side synthesis if backend endpoint is unavailable.
 */
export function useDiagnosticInsights() {
  return useQuery<DiagnosticInsights>({
    queryKey: DIAGNOSTICS_KEYS.insights,
    queryFn: async () => {
      try {
        return await diagnosticsService.getInsights();
      } catch {
        return buildFallbackInsights();
      }
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Use Diagnostic Baseline Hook
 * 
 * Fetches the 30-day historical baseline metrics.
 */
export function useDiagnosticBaseline() {
  return useQuery<DiagnosticBaseline>({
    queryKey: DIAGNOSTICS_KEYS.baseline,
    queryFn: diagnosticsService.getBaseline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Use Reference Config Hook
 * 
 * Fetches the current reference configuration for diagnostic tests.
 * Returns null if no configuration has been set yet.
 * 
 * @returns Query result with reference configuration or null
 */
export function useReferenceConfig() {
  return useQuery<ReferenceConfig | null>({
    queryKey: DIAGNOSTICS_KEYS.referenceConfig,
    queryFn: diagnosticsService.getReferenceConfig,
    staleTime: 10 * 60 * 1000, // 10 minutes (configuration changes infrequently)
    refetchOnWindowFocus: false,
  });
}

/**
 * Use Create Reference Config Hook
 * 
 * Mutation hook for creating or updating the reference configuration.
 * Automatically invalidates and refetches the reference config query on success.
 * 
 * @returns Mutation result for creating/updating reference configuration
 */
export function useCreateReferenceConfig() {
  const queryClient = useQueryClient();

  return useMutation<ReferenceConfig, Error, CreateReferenceConfigRequest>({
    mutationFn: diagnosticsService.createOrUpdateReference,
    onSuccess: (data) => {
      // Invalidate and refetch reference config
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.referenceConfig,
      });

      // Update cache optimistically
      queryClient.setQueryData(DIAGNOSTICS_KEYS.referenceConfig, data);
    },
  });
}

/**
 * Use Diagnostic History Hook
 * 
 * Fetches paginated diagnostic test history.
 * Results are sorted by date in descending order (newest first).
 * 
 * @param page - Page number (default: 1)
 * @param limit - Number of tests per page (default: 20)
 * @returns Query result with paginated diagnostic test history
 */
export function useDiagnosticHistory(page: number = 1, limit: number = 20) {
  return useQuery<DiagnosticHistoryResponse>({
    queryKey: DIAGNOSTICS_KEYS.history(page, limit),
    queryFn: () => diagnosticsService.getDiagnosticHistory(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData, // Keep previous page data while fetching new page
  });
}

/**
 * Use Record Diagnostic Test Hook
 * 
 * Mutation hook for recording a new diagnostic test.
 * Automatically invalidates and refetches diagnostic history on success.
 * 
 * @returns Mutation result for recording diagnostic test
 */
export function useRecordDiagnosticTest() {
  const queryClient = useQueryClient();

  return useMutation<DiagnosticTest, Error, RecordDiagnosticTestRequest>({
    mutationFn: diagnosticsService.recordDiagnosticTest,
    onSuccess: () => {
      // Invalidate all history queries to refetch with new test
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', 'history'],
      });
    },
  });
}

/**
 * Use Record Step Test Hook
 * 
 * Mutation hook for recording an on-demand footstep test.
 */
export function useRecordStepTest() {
  const queryClient = useQueryClient();

  return useMutation<StepTestResult, Error, RecordStepTestRequest>({
    mutationFn: diagnosticsService.recordStepTest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', 'history'],
      });
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.baseline,
      });
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.insights,
      });
    },
  });
}

/**
 * Use Today's Daily Task Hook
 */
export function useTodayDailyTask() {
  return useQuery<DailyDiagnosticTask>({
    queryKey: DIAGNOSTICS_KEYS.todayDailyTask,
    queryFn: diagnosticsService.getTodayDailyTask,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // Periodically poll every 15s in addition to WebSockets
  });
}

/**
 * Use Daily Task History Hook
 */
export function useDailyTaskHistory(limit: number = 30) {
  return useQuery<DailyDiagnosticTask[]>({
    queryKey: DIAGNOSTICS_KEYS.dailyTaskHistory(limit),
    queryFn: () => diagnosticsService.getDailyTaskHistory(limit),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Use Start Daily Session Hook (Lock)
 */
export function useStartDailySession() {
  const queryClient = useQueryClient();

  return useMutation<DailyDiagnosticTask, Error>({
    mutationFn: diagnosticsService.startDailySession,
    onSuccess: (data) => {
      queryClient.setQueryData(DIAGNOSTICS_KEYS.todayDailyTask, data);
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.todayDailyTask,
      });
    },
  });
}

/**
 * Use Cancel Daily Session Hook (Unlock)
 */
export function useCancelDailySession() {
  const queryClient = useQueryClient();

  return useMutation<DailyDiagnosticTask, Error>({
    mutationFn: diagnosticsService.cancelDailySession,
    onSuccess: (data) => {
      queryClient.setQueryData(DIAGNOSTICS_KEYS.todayDailyTask, data);
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.todayDailyTask,
      });
    },
  });
}

/**
 * Use Complete Daily Diagnostic Task Hook
 */
export function useCompleteDailyTask() {
  const queryClient = useQueryClient();

  return useMutation<
    CompleteDailyDiagnosticResponse,
    Error,
    CompleteDailyDiagnosticRequest
  >({
    mutationFn: diagnosticsService.completeDailyTask,
    onSuccess: (data) => {
      queryClient.setQueryData(DIAGNOSTICS_KEYS.todayDailyTask, data.task);
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.todayDailyTask,
      });
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', 'dailyTask', 'history'],
      });
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', 'history'],
      });
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.baseline,
      });
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.insights,
      });
    },
  });
}
