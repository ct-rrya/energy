import { ApiProperty } from '@nestjs/swagger';
import { ReportType, ReportFormat } from '../schemas/report.schema';
import type { ReportSummary } from '../schemas/report.schema';

/**
 * Report Response DTO
 *
 * Represents a report in API responses.
 *
 * Used in:
 * - GET /api/reports (list reports)
 * - GET /api/reports/:id (get report details)
 * - POST /api/reports/generate (after generation)
 * - PATCH /api/reports/:id (after update)
 *
 * Security:
 * - Only includes metadata (not file content)
 * - File content is downloaded via separate endpoint
 * - User can only see their own reports
 */
export class ReportResponseDto {
  /**
   * Report ID
   *
   * MongoDB ObjectId as string.
   * Used for download, delete, and retrieval.
   */
  @ApiProperty({
    description: 'Report ID',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  id: string;

  /**
   * Report Type
   *
   * daily | weekly | monthly | custom
   */
  @ApiProperty({
    enum: ReportType,
    description: 'Type of report',
    example: ReportType.MONTHLY,
  })
  type: ReportType;

  /**
   * Report Format
   *
   * pdf | excel
   */
  @ApiProperty({
    enum: ReportFormat,
    description: 'File format of the report',
    example: ReportFormat.PDF,
  })
  format: ReportFormat;

  /**
   * File Name
   *
   * Name of the generated file.
   *
   * Format: {type}-report-{period}-{timestamp}.{ext}
   * Example: monthly-report-2026-07-1721300400000.pdf
   */
  @ApiProperty({
    description: 'Name of the generated file',
    example: 'monthly-report-2026-07-1721300400000.pdf',
  })
  fileName: string;

  /**
   * File URL
   *
   * URL to download the report file.
   *
   * Format: /api/reports/{id}/download
   *
   * Client should:
   * 1. Call this URL with JWT token
   * 2. Receive file stream
   * 3. Save or display file
   */
  @ApiProperty({
    description: 'URL to download the report file',
    example: '/api/reports/64f9a1b2c3d4e5f6g7h8i9j0/download',
  })
  fileUrl: string;

  /**
   * File Size
   *
   * Size of the file in bytes.
   *
   * For display:
   * - < 1 KB: Show bytes
   * - < 1 MB: Show KB
   * - >= 1 MB: Show MB
   */
  @ApiProperty({
    description: 'File size in bytes',
    example: 245678,
  })
  fileSize: number;

  /**
   * Start Date
   *
   * Start date of the report period.
   *
   * Format: YYYY-MM-DD
   * Example: 2026-07-01
   */
  @ApiProperty({
    description: 'Start date of the report period',
    example: '2026-07-01',
  })
  startDate: string;

  /**
   * End Date
   *
   * End date of the report period.
   *
   * Format: YYYY-MM-DD
   * Example: 2026-07-31
   */
  @ApiProperty({
    description: 'End date of the report period',
    example: '2026-07-31',
  })
  endDate: string;

  /**
   * Summary
   *
   * Key metrics from the report.
   *
   * Displayed in report list without opening file.
   */
  @ApiProperty({
    description: 'Summary of report metrics',
    example: {
      totalEnergyKWh: 1250.5,
      avgPowerW: 1680.2,
      peakPowerW: 3200.0,
      co2AvoidedKg: 625.25,
      costSavingsUSD: 150.06,
      readingCount: 8640,
    },
  })
  summary: ReportSummary;

  /**
   * Download Count
   *
   * Number of times this report has been downloaded.
   */
  @ApiProperty({
    description: 'Number of times this report has been downloaded',
    example: 3,
  })
  downloadCount: number;

  /**
   * Created At
   *
   * When the report was generated.
   *
   * ISO 8601 format.
   */
  @ApiProperty({
    description: 'When the report was generated',
    example: '2026-07-18T10:30:00.000Z',
  })
  createdAt: Date;

  /**
   * Expires At
   *
   * When the report will be automatically deleted.
   *
   * Default: 30 days from creation.
   *
   * ISO 8601 format.
   */
  @ApiProperty({
    description: 'When the report will be automatically deleted',
    example: '2026-08-17T10:30:00.000Z',
  })
  expiresAt: Date;
}

/**
 * Reports List Response DTO
 *
 * Response for GET /api/reports (list endpoint).
 *
 * Includes pagination metadata.
 */
export class ReportsListResponseDto {
  @ApiProperty({
    description: 'Array of reports',
    type: [ReportResponseDto],
  })
  data: ReportResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 15,
      page: 1,
      limit: 10,
      totalPages: 2,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
