import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DiagnosticsService } from './diagnostics.service';
import { DashboardGateway } from '../dashboard/dashboard.gateway';
import {
  CreateReferenceConfigDto,
  ReferenceConfigResponseDto,
  RecordDiagnosticTestDto,
  DiagnosticTestResponseDto,
  DiagnosticHistoryQueryDto,
  DiagnosticHistoryResponseDto,
} from './dto';
import type { UserDocument } from '../users/schemas/user.schema';

/**
 * Diagnostics Controller
 *
 * REST API endpoints for system diagnostic operations.
 * All endpoints are admin-only and protected by JWT authentication + RBAC.
 *
 * Key Features:
 * - Reference configuration management for baseline diagnostic values
 * - Diagnostic test recording and result calculation
 * - Historical test tracking with pagination
 * - Real-time WebSocket event broadcasting for UI updates
 * - Rate limiting to prevent API abuse
 *
 * Design Principle:
 * The system monitors OVERALL energy harvesting performance through
 * standardized reference tests. It does NOT monitor individual
 * piezoelectric disc performance or identify specific components.
 *
 * Endpoints:
 * - POST /api/diagnostics/reference - Create/update reference configuration
 * - GET /api/diagnostics/reference - Get current reference configuration
 * - POST /api/diagnostics/test - Record diagnostic test result
 * - GET /api/diagnostics/history - Get diagnostic test history
 *
 * Security:
 * - JWT authentication required (JwtAuthGuard)
 * - Admin role required (RolesGuard)
 * - Rate limiting applied per endpoint
 *
 * WebSocket Events:
 * - diagnostic:config-updated - Emitted after reference config update
 * - diagnostic:test-completed - Emitted after test recording
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 16.2, 17.3, 17.4,
 *               29.1, 29.2, 29.3, 29.4, 29.5
 */
@ApiTags('Diagnostics')
@ApiBearerAuth()
@Controller('diagnostics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DiagnosticsController {
  private readonly logger = new Logger(DiagnosticsController.name);

  constructor(
    private readonly diagnosticsService: DiagnosticsService,
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  /**
   * Create or Update Reference Configuration
   *
   * Sets the baseline configuration for diagnostic tests.
   * Only one configuration exists at any time (singleton pattern).
   *
   * Rate Limit: 10 requests per 60 seconds
   *
   * @param dto - Reference configuration data
   * @param user - Current authenticated admin user
   * @returns The created/updated reference configuration
   *
   * Requirements: 6.1, 29.2
   */
  @Post('reference')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create or update reference configuration (admin only)',
    description:
      'Sets the baseline configuration for diagnostic tests including applied weight, expected energy, and tolerance. Only one configuration exists at any time.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reference configuration created/updated successfully',
    type: ReferenceConfigResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid configuration values',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
  })
  async createOrUpdateReference(
    @Body() dto: CreateReferenceConfigDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ReferenceConfigResponseDto> {
    this.logger.log(
      `Admin ${user.email} creating/updating reference configuration`,
    );

    const config = await this.diagnosticsService.createOrUpdateReferenceConfig(
      dto,
      user.email,
    );

    // Broadcast WebSocket event to admin clients only
    this.dashboardGateway.emitToAdmins('diagnostic:config-updated', {
      appliedWeightKg: config.appliedWeightKg,
      expectedEnergyWh: config.expectedEnergyWh,
      tolerancePercent: config.tolerancePercent,
      createdBy: config.createdBy,
      updatedAt: config.updatedAt,
    });

    this.logger.log('Reference configuration saved and broadcasted to admins');

    return {
      appliedWeightKg: config.appliedWeightKg,
      expectedEnergyWh: config.expectedEnergyWh,
      tolerancePercent: config.tolerancePercent,
      createdBy: config.createdBy,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Get Current Reference Configuration
   *
   * Retrieves the active reference configuration.
   * Returns null if no configuration has been set yet.
   *
   * @returns The current reference configuration or null
   *
   * Requirements: 6.2
   */
  @Get('reference')
  @ApiOperation({
    summary: 'Get current reference configuration (admin only)',
    description:
      'Retrieves the active reference configuration. Returns null if no configuration has been set yet.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reference configuration retrieved successfully',
    type: ReferenceConfigResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getReference(): Promise<ReferenceConfigResponseDto | null> {
    this.logger.debug('Fetching current reference configuration');

    const config = await this.diagnosticsService.getReferenceConfig();

    if (!config) {
      this.logger.debug('No reference configuration found');
      return null;
    }

    return {
      appliedWeightKg: config.appliedWeightKg,
      expectedEnergyWh: config.expectedEnergyWh,
      tolerancePercent: config.tolerancePercent,
      createdBy: config.createdBy,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Record Diagnostic Test
   *
   * Records a new diagnostic test result by comparing actual measured
   * energy against the expected baseline from reference configuration.
   *
   * Automatically calculates:
   * - Difference (actual - expected)
   * - Performance percentage ((actual / expected) × 100)
   * - Result status (Within Range, Below Expected, Above Expected)
   *
   * Rate Limit: 5 requests per 60 seconds
   *
   * @param dto - Test data with actual measured energy and optional notes
   * @param user - Current authenticated admin user
   * @returns The recorded diagnostic test with calculated results
   *
   * Requirements: 6.3, 29.1
   */
  @Post('test')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Record diagnostic test (admin only)',
    description:
      'Records a new diagnostic test by comparing actual measured energy against expected baseline. Automatically calculates difference, performance percentage, and result status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Diagnostic test recorded successfully',
    type: DiagnosticTestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid test data or no reference configuration exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
  })
  async recordTest(
    @Body() dto: RecordDiagnosticTestDto,
    @CurrentUser() user: UserDocument,
  ): Promise<DiagnosticTestResponseDto> {
    this.logger.log(
      `Admin ${user.email} recording diagnostic test: ${dto.actualEnergy} Wh`,
    );

    const test = await this.diagnosticsService.recordDiagnosticTest(
      dto,
      user.email,
    );

    // Convert to plain object to access _id
    const testDoc = test as any;

    // Broadcast WebSocket event to admin clients only
    this.dashboardGateway.emitToAdmins('diagnostic:test-completed', {
      id: testDoc._id?.toString(),
      testDate: test.testDate,
      performedBy: test.performedBy,
      actualEnergy: test.actualEnergy,
      expectedEnergy: test.expectedEnergy,
      difference: test.difference,
      performancePercentage: test.performancePercentage,
      result: test.result,
      notes: test.notes,
    });

    this.logger.log(
      `Diagnostic test recorded and broadcasted to admins: Result=${test.result}, Performance=${test.performancePercentage}%`,
    );

    return {
      id: testDoc._id?.toString(),
      testDate: test.testDate,
      performedBy: test.performedBy,
      actualEnergy: test.actualEnergy,
      expectedEnergy: test.expectedEnergy,
      difference: test.difference,
      performancePercentage: test.performancePercentage,
      result: test.result,
      referenceConfig: test.referenceConfig,
      notes: test.notes,
    };
  }

  /**
   * Get Diagnostic History
   *
   * Retrieves paginated diagnostic test history sorted by date (newest first).
   *
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   *
   * Rate Limit: 20 requests per 60 seconds
   *
   * @param query - Query parameters for pagination
   * @returns Paginated diagnostic test results with pagination metadata
   *
   * Requirements: 6.4, 29.3
   */
  @Get('history')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get diagnostic test history (admin only)',
    description:
      'Retrieves paginated diagnostic test history sorted by date (newest first). Supports pagination with page and limit query parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Diagnostic history retrieved successfully',
    type: DiagnosticHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
  })
  async getHistory(
    @Query() query: DiagnosticHistoryQueryDto,
  ): Promise<DiagnosticHistoryResponseDto> {
    this.logger.debug(
      `Fetching diagnostic history: page=${query.page || 1}, limit=${query.limit || 20}`,
    );

    const result = await this.diagnosticsService.getDiagnosticHistory(query);

    this.logger.debug(
      `Retrieved ${result.tests.length} tests out of ${result.pagination.total} total`,
    );

    return {
      tests: result.tests.map((test) => {
        const testDoc = test as any;
        return {
          id: testDoc._id?.toString(),
          testDate: test.testDate,
          performedBy: test.performedBy,
          actualEnergy: test.actualEnergy,
          expectedEnergy: test.expectedEnergy,
          difference: test.difference,
          performancePercentage: test.performancePercentage,
          result: test.result,
          referenceConfig: test.referenceConfig,
          notes: test.notes,
        };
      }),
      pagination: result.pagination,
    };
  }
}
