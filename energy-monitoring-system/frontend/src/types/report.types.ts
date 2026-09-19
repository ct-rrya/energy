/**
 * Report Type Definitions
 * 
 * Matches backend report schema.
 */

/**
 * Report Type
 */
export const ReportType = {
  // Legacy types (kept for backward compatibility)
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
  // New report types
  ENERGY_MONITORING: 'energy_monitoring',
  HISTORICAL_ANALYTICS: 'historical_analytics',
  SYSTEM_DIAGNOSTICS: 'system_diagnostics',
  SYSTEM_SUMMARY: 'system_summary',
} as const;

export type ReportType = typeof ReportType[keyof typeof ReportType];

/**
 * Report Format
 */
export const ReportFormat = {
  PDF: 'pdf',
  EXCEL: 'excel',
} as const;

export type ReportFormat = typeof ReportFormat[keyof typeof ReportFormat];

/**
 * Report Summary
 */
export interface ReportSummary {
  totalEnergyKWh: number;
  avgPowerW: number;
  peakPowerW: number;
  co2AvoidedKg: number;
  costSavingsUSD: number;
  readingCount: number;
}

/**
 * Report Interface
 */
export interface Report {
  id: string;
  type: ReportType;
  format: ReportFormat;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  startDate: string;
  endDate: string;
  parameters?: Record<string, any>;
  summary: ReportSummary;
  downloadCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate Report DTO
 */
export interface GenerateReportDto {
  type: ReportType;
  format: ReportFormat;
  year?: number;
  month?: number;
  day?: number;
  startDate?: string;
  endDate?: string;
  electricityRate?: number;
  includeSections?: string[];
  aggregation?: 'hourly' | 'daily' | 'weekly';
}

/**
 * Reports List Response
 */
export interface ReportsListResponse {
  data: Report[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Report Type Info
 */
export interface ReportTypeInfo {
  value: ReportType;
  label: string;
  description: string;
  requiredFields: string[];
}

/**
 * Report Format Info
 */
export interface ReportFormatInfo {
  value: ReportFormat;
  label: string;
  description: string;
  extension: string;
}

/**
 * Available Report Types Response
 */
export interface AvailableReportTypesResponse {
  types: ReportTypeInfo[];
  formats: ReportFormatInfo[];
}
