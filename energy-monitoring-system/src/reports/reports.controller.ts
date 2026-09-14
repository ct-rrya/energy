import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import {
  GenerateReportDto,
  ReportResponseDto,
  ReportsListResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportType, ReportFormat } from './schemas/report.schema';

/**
 * Reports Controller
 *
 * Handles HTTP requests for report generation and management.
 *
 * Endpoints:
 * - POST   /api/reports/generate          Generate new report
 * - GET    /api/reports                   List user's reports
 * - GET    /api/reports/:id               Get report metadata
 * - GET    /api/reports/:id/download      Download report file
 * - DELETE /api/reports/:id               Delete report
 * - GET    /api/reports/types/available   Get available report types
 *
 * Authentication:
 * - All endpoints require JWT authentication
 * - Protected by JwtAuthGuard
 * - Users can only access their own reports
 *
 * Security:
 * - Ownership validation on all operations
 * - File path validation on downloads
 * - No direct file system access without auth
 */
@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Generate Report
   *
   * Generates a new energy report in PDF or Excel format.
   *
   * Process:
   * 1. Validate request parameters
   * 2. Fetch data from AnalyticsService
   * 3. Generate report file (PDF or Excel)
   * 4. Save file and metadata
   * 5. Return metadata with download URL
   *
   * Report Types:
   * - Daily: Single day report
   * - Weekly: Monday to Sunday report
   * - Monthly: Full month report
   * - Custom: User-specified date range
   *
   * Formats:
   * - PDF: Professional PDF document
   * - Excel: Excel spreadsheet (.xlsx)
   *
   * Example Request (Monthly PDF):
   * POST /api/reports/generate
   * {
   *   "type": "monthly",
   *   "format": "pdf",
   *   "year": 2026,
   *   "month": 7
   * }
   *
   * Example Request (Custom Excel):
   * POST /api/reports/generate
   * {
   *   "type": "custom",
   *   "format": "excel",
   *   "startDate": "2026-07-01",
   *   "endDate": "2026-07-15"
   * }
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate new report',
    description:
      'Generates a new energy report in PDF or Excel format. ' +
      'Supports daily, weekly, monthly, and custom date range reports. ' +
      'Report is saved for 30 days and can be downloaded multiple times.',
  })
  @ApiResponse({
    status: 201,
    description: 'Report generated successfully',
    type: ReportResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - invalid parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async generate(
    @Body() generateReportDto: GenerateReportDto,
    @CurrentUser() user: any,
  ) {
    const report = await this.reportsService.generate(
      generateReportDto,
      user.userId,
    );

    return {
      success: true,
      message: 'Report generated successfully',
      data: {
        ...report.toJSON(),
        fileUrl: `/api/reports/${report._id.toString()}/download`,
      },
    };
  }

  /**
   * List Reports
   *
   * Retrieves all reports for the current user with pagination.
   *
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - type: Filter by report type (optional)
   * - format: Filter by file format (optional)
   *
   * Sorting:
   * - Newest reports first (by createdAt)
   *
   * Example Request:
   * GET /api/reports?page=1&limit=10&type=monthly&format=pdf
   *
   * Example Response:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "...",
   *       "type": "monthly",
   *       "format": "pdf",
   *       "fileName": "monthly-report-2026-07-1721300400000.pdf",
   *       "fileUrl": "/api/reports/.../download",
   *       "summary": { ... },
   *       "createdAt": "2026-07-18T10:30:00.000Z"
   *     }
   *   ],
   *   "meta": {
   *     "total": 15,
   *     "page": 1,
   *     "limit": 10,
   *     "totalPages": 2
   *   }
   * }
   */
  @Get()
  @ApiOperation({
    summary: 'List user reports',
    description:
      'Retrieves all reports for the current user with pagination. ' +
      'Supports filtering by type and format. Sorted by newest first.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ReportType,
    description: 'Filter by report type',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReportFormat,
    description: 'Filter by file format',
  })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
    type: ReportsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: ReportType,
    @Query('format') format?: ReportFormat,
  ) {
    // Validate pagination
    const validPage = Math.max(1, Number(page));
    const validLimit = Math.min(100, Math.max(1, Number(limit)));

    const { data, meta } = await this.reportsService.findAll(
      user.userId,
      validPage,
      validLimit,
      type,
      format,
    );

    // Add fileUrl to each report
    const reportsWithUrls = data.map((report) => ({
      ...report.toJSON(),
      fileUrl: `/api/reports/${report._id.toString()}/download`,
    }));

    return {
      success: true,
      data: reportsWithUrls,
      meta,
    };
  }

  /**
   * Get Report Details
   *
   * Retrieves detailed metadata for a specific report.
   *
   * @param id - Report ID (MongoDB ObjectId)
   *
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "type": "monthly",
   *     "format": "pdf",
   *     "fileName": "monthly-report-2026-07-1721300400000.pdf",
   *     "fileUrl": "/api/reports/.../download",
   *     "fileSize": 245678,
   *     "startDate": "2026-07-01",
   *     "endDate": "2026-07-31",
   *     "summary": {
   *       "totalEnergyKWh": 1250.5,
   *       "avgPowerW": 1680.2,
   *       "co2AvoidedKg": 625.25,
   *       ...
   *     },
   *     "downloadCount": 3,
   *     "createdAt": "2026-07-18T10:30:00.000Z",
   *     "expiresAt": "2026-08-17T10:30:00.000Z"
   *   }
   * }
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get report details',
    description:
      'Retrieves detailed metadata for a specific report. ' +
      'User must own the report to access it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: 'Report details retrieved successfully',
    type: ReportResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Report not found',
  })
  @ApiForbiddenResponse({
    description: 'Access denied - user does not own this report',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const report = await this.reportsService.findOne(id, user.userId);

    return {
      success: true,
      data: {
        ...report.toJSON(),
        fileUrl: `/api/reports/${report._id.toString()}/download`,
      },
    };
  }

  /**
   * Download Report
   *
   * Downloads the report file.
   *
   * Returns a file stream with appropriate headers:
   * - Content-Type: application/pdf or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   * - Content-Disposition: attachment; filename="..."
   *
   * Increments download count each time file is downloaded.
   *
   * Security:
   * - User must own the report
   * - File path validated (no directory traversal)
   * - File must exist in uploads directory
   *
   * Example Request:
   * GET /api/reports/64f9a1b2c3d4e5f6g7h8i9j0/download
   * Authorization: Bearer <jwt>
   *
   * Example Response:
   * (Binary file stream with headers)
   */
  @Get(':id/download')
  @ApiOperation({
    summary: 'Download report file',
    description:
      'Downloads the report file as a stream. ' +
      'User must own the report. Download count is incremented.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: 'Report file downloaded successfully',
    content: {
      'application/pdf': {},
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
    },
  })
  @ApiNotFoundResponse({
    description: 'Report or file not found',
  })
  @ApiForbiddenResponse({
    description:
      'Access denied - user does not own this report or invalid file path',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, report } = await this.reportsService.download(
      id,
      user.userId,
    );

    // Set response headers
    const contentType =
      report.format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${report.fileName}"`,
      'Content-Length': report.fileSize,
    });

    return new StreamableFile(stream);
  }

  /**
   * Delete Report
   *
   * Deletes a report and its file.
   *
   * Process:
   * 1. Validate ownership
   * 2. Delete file from file system
   * 3. Delete metadata from database
   *
   * Example Request:
   * DELETE /api/reports/64f9a1b2c3d4e5f6g7h8i9j0
   * Authorization: Bearer <jwt>
   *
   * Example Response:
   * {
   *   "success": true,
   *   "message": "Report deleted successfully",
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "fileName": "monthly-report-2026-07-1721300400000.pdf"
   *   }
   * }
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete report',
    description:
      'Deletes a report and its file. ' +
      'User must own the report. Both file and metadata are removed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Report ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Report not found',
  })
  @ApiForbiddenResponse({
    description: 'Access denied - user does not own this report',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const report = await this.reportsService.delete(id, user.userId);

    return {
      success: true,
      message: 'Report deleted successfully',
      data: {
        id: report._id.toString(),
        fileName: report.fileName,
      },
    };
  }

  /**
   * Get Available Report Types
   *
   * Returns information about available report types and formats.
   *
   * Useful for:
   * - Building report generation UI
   * - Showing available options
   * - Client-side validation
   *
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "types": [
   *       {
   *         "value": "daily",
   *         "label": "Daily Report",
   *         "description": "Energy report for a single day",
   *         "requiredFields": ["year", "month", "day"]
   *       },
   *       {
   *         "value": "weekly",
   *         "label": "Weekly Report",
   *         "description": "Energy report for a week (Monday to Sunday)",
   *         "requiredFields": ["year", "month", "day"]
   *       },
   *       ...
   *     ],
   *     "formats": [
   *       { "value": "pdf", "label": "PDF Document" },
   *       { "value": "excel", "label": "Excel Spreadsheet" }
   *     ]
   *   }
   * }
   */
  @Get('types/available')
  @ApiOperation({
    summary: 'Get available report types',
    description:
      'Returns information about available report types and formats. ' +
      'Useful for building report generation forms.',
  })
  @ApiResponse({
    status: 200,
    description: 'Available report types retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getAvailableTypes() {
    return {
      success: true,
      data: {
        types: [
          {
            value: ReportType.DAILY,
            label: 'Daily Report',
            description: 'Energy report for a single day',
            requiredFields: ['year', 'month', 'day'],
          },
          {
            value: ReportType.WEEKLY,
            label: 'Weekly Report',
            description: 'Energy report for a week (Monday to Sunday)',
            requiredFields: ['year', 'month', 'day'],
          },
          {
            value: ReportType.MONTHLY,
            label: 'Monthly Report',
            description: 'Energy report for a full month',
            requiredFields: ['year', 'month'],
          },
          {
            value: ReportType.CUSTOM,
            label: 'Custom Date Range',
            description: 'Energy report for a custom date range',
            requiredFields: ['startDate', 'endDate'],
          },
        ],
        formats: [
          {
            value: ReportFormat.PDF,
            label: 'PDF Document',
            description: 'Professional PDF report',
            extension: 'pdf',
          },
          {
            value: ReportFormat.EXCEL,
            label: 'Excel Spreadsheet',
            description: 'Excel spreadsheet with data',
            extension: 'xlsx',
          },
        ],
      },
    };
  }
}
