import { ApiProperty } from '@nestjs/swagger';

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

export interface PipelineStageDto {
  id: 'piezo' | 'electrical' | 'energy' | 'esp32' | 'cloud';
  label: string;
  shortLabel: string;
  status: PipelineStageStatus;
  primaryValue: string;
  detail: string;
}

export interface FaultDiagnosisDto {
  code: FaultSignatureCode;
  severity: FaultSeverity;
  title: string;
  summary: string;
  probableCause: string;
  recommendedChecks: string[];
}

export interface DailyFatiguePointDto {
  date: string;
  mWhPerStep: number;
  steps: number;
  avgVoltageV: number;
  avgCurrentMA: number;
  readingCount: number;
}

export interface ElectricalSnapshotDto {
  latestVoltageV: number;
  latestCurrentMA: number;
  latestPowerMW: number;
  latestEnergyMWh: number;
  latestSteps: number;
  avgVoltage7dV: number;
  avgCurrent7dMA: number;
}

export interface FatigueRadarDto {
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
  dailyTrend: DailyFatiguePointDto[];
  electricalSnapshot: ElectricalSnapshotDto;
}

export class DiagnosticInsightsResponseDto {
  @ApiProperty({ description: 'Overall tile health score (0-100)', example: 92 })
  healthScore: number;

  @ApiProperty({
    description: 'High-level status derived from pipeline and fault analysis',
    enum: ['healthy', 'degraded', 'attention', 'offline'],
  })
  status: 'healthy' | 'degraded' | 'attention' | 'offline';

  @ApiProperty({ description: 'Sub-score breakdown (0-100 each)' })
  scoreBreakdown: {
    harvesting: number;
    consistency: number;
    telemetry: number;
  };

  @ApiProperty({ description: 'Stage-by-stage hardware pipeline status' })
  pipelineStages: PipelineStageDto[];

  @ApiProperty({ description: 'Fault-signature diagnosis & inspection checklist' })
  faultDiagnosis: FaultDiagnosisDto;

  @ApiProperty({ description: 'Passive 7-day vs 30-day fatigue & drift radar' })
  fatigueRadar: FatigueRadarDto;

  @ApiProperty({ description: 'ISO timestamp when insights were generated' })
  generatedAt: string;
}
