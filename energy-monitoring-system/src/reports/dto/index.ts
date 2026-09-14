/**
 * Reports DTOs Index
 *
 * Central export point for all Reports module DTOs.
 *
 * Exported DTOs:
 * - GenerateReportDto: Request body for generating reports
 * - ReportResponseDto: Report metadata in API responses
 * - ReportsListResponseDto: List response with pagination
 */

export { GenerateReportDto } from './generate-report.dto';
export {
  ReportResponseDto,
  ReportsListResponseDto,
} from './report-response.dto';
