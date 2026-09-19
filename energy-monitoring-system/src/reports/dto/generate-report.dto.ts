import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportFormat } from '../schemas/report.schema';

/**
 * Generate Report DTO
 *
 * Validates the request body for generating a new report.
 *
 * Validation Rules:
 * - type: Required, must be 'daily' | 'weekly' | 'monthly' | 'custom'
 * - format: Required, must be 'pdf' | 'excel'
 * - year: Required for daily/weekly/monthly, 1900-2100
 * - month: Required for daily/monthly, 1-12
 * - day: Required for daily only, 1-31
 * - startDate: Required for custom only, YYYY-MM-DD format
 * - endDate: Required for custom only, YYYY-MM-DD format
 *
 * Examples:
 *
 * Daily Report:
 * {
 *   "type": "daily",
 *   "format": "pdf",
 *   "year": 2026,
 *   "month": 7,
 *   "day": 18
 * }
 *
 * Weekly Report:
 * {
 *   "type": "weekly",
 *   "format": "excel",
 *   "year": 2026,
 *   "month": 7,
 *   "day": 14  // Any day in the week (Monday will be calculated)
 * }
 *
 * Monthly Report:
 * {
 *   "type": "monthly",
 *   "format": "pdf",
 *   "year": 2026,
 *   "month": 7
 * }
 *
 * Custom Report:
 * {
 *   "type": "custom",
 *   "format": "pdf",
 *   "startDate": "2026-07-01",
 *   "endDate": "2026-07-15"
 * }
 */
export class GenerateReportDto {
  /**
   * Report Type
   *
   * The type of report to generate.
   *
   * Values:
   * - daily: Single day report
   * - weekly: Monday to Sunday report
   * - monthly: Full month report
   * - custom: User-specified date range
   */
  @ApiProperty({
    enum: ReportType,
    description: 'Type of report to generate',
    example: ReportType.MONTHLY,
  })
  @IsEnum(ReportType, {
    message: 'type must be one of: daily, weekly, monthly, custom',
  })
  type: ReportType;

  /**
   * Report Format
   *
   * The file format for the generated report.
   *
   * Values:
   * - pdf: PDF document
   * - excel: Excel spreadsheet (.xlsx)
   */
  @ApiProperty({
    enum: ReportFormat,
    description: 'Output format for the report',
    example: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat, {
    message: 'format must be one of: pdf, excel',
  })
  format: ReportFormat;

  /**
   * Year
   *
   * Required for: daily, weekly, monthly
   * Not used for: custom, energy_monitoring, historical_analytics, system_diagnostics, system_summary
   *
   * Range: 1900-2100
   */
  @ApiPropertyOptional({
    description: 'Year (required for daily/weekly/monthly reports)',
    example: 2026,
    minimum: 1900,
    maximum: 2100,
  })
  @ValidateIf((o) => 
    o.type === ReportType.DAILY || 
    o.type === ReportType.WEEKLY || 
    o.type === ReportType.MONTHLY
  )
  @IsNumber({}, { message: 'year must be a number' })
  @Min(1900, { message: 'year must be at least 1900' })
  @Max(2100, { message: 'year must be at most 2100' })
  year?: number;

  /**
   * Month
   *
   * Required for: daily, monthly
   * Optional for: weekly (used to determine which week)
   * Not used for: custom, energy_monitoring, historical_analytics, system_diagnostics, system_summary
   *
   * Range: 1-12
   */
  @ApiPropertyOptional({
    description:
      'Month (required for daily/monthly reports, optional for weekly)',
    example: 7,
    minimum: 1,
    maximum: 12,
  })
  @ValidateIf(
    (o) =>
      o.type === ReportType.DAILY ||
      o.type === ReportType.MONTHLY ||
      o.type === ReportType.WEEKLY,
  )
  @IsNumber({}, { message: 'month must be a number' })
  @Min(1, { message: 'month must be between 1 and 12' })
  @Max(12, { message: 'month must be between 1 and 12' })
  month?: number;

  /**
   * Day
   *
   * Required for: daily
   * Optional for: weekly (any day in the week)
   * Not used for: monthly, custom, energy_monitoring, historical_analytics, system_diagnostics, system_summary
   *
   * Range: 1-31
   */
  @ApiPropertyOptional({
    description: 'Day (required for daily reports, optional for weekly)',
    example: 18,
    minimum: 1,
    maximum: 31,
  })
  @ValidateIf(
    (o) => o.type === ReportType.DAILY || o.type === ReportType.WEEKLY,
  )
  @IsNumber({}, { message: 'day must be a number' })
  @Min(1, { message: 'day must be between 1 and 31' })
  @Max(31, { message: 'day must be between 1 and 31' })
  day?: number;

  /**
   * Start Date
   *
   * Required for: custom, energy_monitoring, historical_analytics, system_diagnostics, system_summary
   * Not used for: daily, weekly, monthly
   *
   * Format: YYYY-MM-DD
   * Example: 2026-07-01
   */
  @ApiPropertyOptional({
    description: 'Start date (required for custom and new report types, format: YYYY-MM-DD)',
    example: '2026-07-01',
  })
  @ValidateIf((o) => 
    o.type === ReportType.CUSTOM ||
    o.type === ReportType.ENERGY_MONITORING ||
    o.type === ReportType.HISTORICAL_ANALYTICS ||
    o.type === ReportType.SYSTEM_DIAGNOSTICS ||
    o.type === ReportType.SYSTEM_SUMMARY
  )
  @IsDateString({}, { message: 'startDate must be a valid date (YYYY-MM-DD)' })
  startDate?: string;

  /**
   * End Date
   *
   * Required for: custom, energy_monitoring, historical_analytics, system_diagnostics, system_summary
   * Not used for: daily, weekly, monthly
   *
   * Format: YYYY-MM-DD
   * Example: 2026-07-31
   *
   * Must be after or equal to startDate.
   */
  @ApiPropertyOptional({
    description: 'End date (required for custom and new report types, format: YYYY-MM-DD)',
    example: '2026-07-31',
  })
  @ValidateIf((o) => 
    o.type === ReportType.CUSTOM ||
    o.type === ReportType.ENERGY_MONITORING ||
    o.type === ReportType.HISTORICAL_ANALYTICS ||
    o.type === ReportType.SYSTEM_DIAGNOSTICS ||
    o.type === ReportType.SYSTEM_SUMMARY
  )
  @IsDateString({}, { message: 'endDate must be a valid date (YYYY-MM-DD)' })
  endDate?: string;

  /**
   * Electricity Rate (Optional)
   *
   * Custom electricity rate for cost savings calculation.
   *
   * Default: 0.12 (US average)
   * Unit: USD per kWh
   *
   * Example: 0.15 means $0.15 per kWh
   */
  @ApiPropertyOptional({
    description:
      'Custom electricity rate in USD per kWh (optional, defaults to 0.12)',
    example: 0.12,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'electricityRate must be a number' })
  @Min(0, { message: 'electricityRate must be at least 0' })
  @Max(1, { message: 'electricityRate must be at most 1' })
  electricityRate?: number;

  /**
   * Include Sections (Optional)
   *
   * Array of section names to include in the report.
   * Used for new report types (energy_monitoring, historical_analytics, system_summary).
   *
   * Possible values:
   * - energySummary
   * - voltage
   * - current
   * - stepActivity
   * - energyChart
   * - diagnosticHistory
   * - performanceResults
   *
   * If not provided, all available sections are included.
   */
  @ApiPropertyOptional({
    description: 'Sections to include in the report (optional)',
    example: ['energySummary', 'voltage', 'current'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  includeSections?: string[];

  /**
   * Aggregation Period (Optional)
   *
   * Data aggregation period for historical analytics reports.
   *
   * Values:
   * - hourly: Hourly aggregation
   * - daily: Daily aggregation
   * - weekly: Weekly aggregation
   *
   * Default: daily
   */
  @ApiPropertyOptional({
    description: 'Data aggregation period for historical reports (optional)',
    example: 'daily',
    enum: ['hourly', 'daily', 'weekly'],
  })
  @IsOptional()
  @IsString()
  aggregation?: 'hourly' | 'daily' | 'weekly';
}
