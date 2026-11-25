export const DiagnosticResultStatus = {
  WITHIN_RANGE: 'Within Range',
  BELOW_EXPECTED: 'Below Expected',
  ABOVE_EXPECTED: 'Above Expected',
} as const;

export type DiagnosticResultStatus =
  (typeof DiagnosticResultStatus)[keyof typeof DiagnosticResultStatus];

export interface ReferenceConfig {
  appliedWeightKg: number;
  expectedEnergyWh: number;
  tolerancePercent: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticTest {
  id: string;
  testDate: string;
  performedBy: string;
  actualEnergy: number;
  expectedEnergy: number;
  difference: number;
  performancePercentage: number;
  result: DiagnosticResultStatus;
  referenceConfig: {
    appliedWeightKg: number;
    expectedEnergyWh: number;
    tolerancePercent: number;
  };
  notes?: string;
}

export interface DiagnosticHistoryResponse {
  tests: DiagnosticTest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReferenceConfigRequest {
  appliedWeightKg: number;
  expectedEnergyWh: number;
  tolerancePercent: number;
}

export interface RecordDiagnosticTestRequest {
  actualEnergy: number;
  notes?: string;
}

export interface DiagnosticBaseline {
  daysAnalyzed: number;
  totalSteps: number;
  totalEnergyMWh: number;
  normalStepMWh: number;
  tolerancePercent: number;
  minAcceptableMWh: number;
  maxAcceptableMWh: number;
  readingCount: number;
}

export interface RecordStepTestRequest {
  actualStepEnergyMWh: number;
  notes?: string;
}

export interface StepTestResult {
  id: string;
  testDate: string;
  performedBy: string;
  actualEnergyMWh: number;
  expectedEnergyMWh: number;
  deviationPercentage: number;
  performancePercentage: number;
  minAcceptableMWh: number;
  maxAcceptableMWh: number;
  result: DiagnosticResultStatus;
  statusMessage: string;
  notes?: string;
}

export const DailyDiagnosticTaskStatus = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  NEEDS_ATTENTION: 'Needs Attention',
  FAILED: 'Failed',
} as const;

export type DailyDiagnosticTaskStatus =
  (typeof DailyDiagnosticTaskStatus)[keyof typeof DailyDiagnosticTaskStatus];

export interface ActiveDiagnosticSession {
  adminEmail: string;
  adminName: string;
  startedAt: string;
  expiresAt: string;
}

export interface DailyDiagnosticTask {
  _id?: string;
  taskDate: string;
  status: DailyDiagnosticTaskStatus;
  activeSession?: ActiveDiagnosticSession;
  performedBy?: string;
  performedByName?: string;
  completedAt?: string;
  actualEnergyMWh?: number;
  expectedEnergyMWh?: number;
  deviationPercentage?: number;
  performancePercentage?: number;
  result?: DiagnosticResultStatus;
  statusMessage?: string;
  notes?: string;
  diagnosticTestId?: string;
  reminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteDailyDiagnosticRequest {
  actualStepEnergyMWh: number;
  notes?: string;
}

export interface CompleteDailyDiagnosticResponse {
  task: DailyDiagnosticTask;
  stepResult: StepTestResult;
}

export type PipelineStageStatus = 'ok' | 'warn' | 'fail' | 'idle';

export type FaultSignatureCode =
  | 'NOMINAL'
  | 'NO_RECENT_TELEMETRY'
  | 'WEAK_PIEZO_OUTPUT'
  | 'OPEN_LOAD_LOW_CURRENT'
  | 'STEP_COUNTER_MISMATCH'
  | 'EFFICIENCY_DRIFT'
  | 'UNSTABLE_TELEMETRY'
  | 'ELEVATED_SPIKE';

export type FaultSeverity = 'healthy' | 'warning' | 'critical' | 'info';

export interface PipelineStage {
  id: 'piezo' | 'electrical' | 'energy' | 'esp32' | 'cloud';
  label: string;
  shortLabel: string;
  status: PipelineStageStatus;
  primaryValue: string;
  detail: string;
}

export interface FaultDiagnosis {
  code: FaultSignatureCode;
  severity: FaultSeverity;
  title: string;
  summary: string;
  probableCause: string;
  recommendedChecks: string[];
}

export interface DailyFatiguePoint {
  date: string;
  mWhPerStep: number;
  steps: number;
  avgVoltageV: number;
  avgCurrentMA: number;
  readingCount: number;
}

export interface ElectricalSnapshot {
  latestVoltageV: number;
  latestCurrentMA: number;
  latestPowerMW: number;
  latestEnergyMWh: number;
  latestSteps: number;
  avgVoltage7dV: number;
  avgCurrent7dMA: number;
}

export interface FatigueRadar {
  baseline30dMWhPerStep: number;
  recent7dMWhPerStep: number;
  driftPercent: number;
  driftStatus: 'stable' | 'improving' | 'watch' | 'degrading' | 'insufficient_data';
  totalLifetimeSteps: number;
  stepsLast7d: number;
  readingsLast24h: number;
  avgLatencyMs: number;
  poorSignalRatioPercent: number;
  lastReadingAt: string | null;
  dailyTrend: DailyFatiguePoint[];
  electricalSnapshot: ElectricalSnapshot;
}

export interface DiagnosticInsights {
  healthScore: number;
  status: 'healthy' | 'degraded' | 'attention' | 'offline';
  scoreBreakdown: {
    harvesting: number;
    consistency: number;
    telemetry: number;
  };
  pipelineStages: PipelineStage[];
  faultDiagnosis: FaultDiagnosis;
  fatigueRadar: FatigueRadar;
  generatedAt: string;
}
