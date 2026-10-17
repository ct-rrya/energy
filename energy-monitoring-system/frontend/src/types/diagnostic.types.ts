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
