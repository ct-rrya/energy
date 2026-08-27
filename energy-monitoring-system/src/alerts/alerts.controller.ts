import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';
import { AlertQueryDto } from './dto';

/**
 * Alerts Controller
 * 
 * Manages system alerts for administrators.
 * 
 * All endpoints require JWT authentication.
 * 
 * Endpoints:
 * - GET  /api/alerts - Get all alerts (with filters)
 * - GET  /api/alerts/stats - Get alert statistics
 * - GET  /api/alerts/:id - Get alert by ID
 * - POST /api/alerts/:id/acknowledge - Acknowledge an alert
 * - POST /api/alerts/:id/resolve - Resolve an alert
 */
@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Get Alerts
   * 
   * Query alerts with filters, pagination, and sorting.
   * 
   * @param query - Query parameters
   * @returns Paginated alerts
   */
  @Get()
  @ApiOperation({
    summary: 'Get alerts',
    description: 'Query alerts with filters, pagination, and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Alerts retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAlerts(@Query() query: AlertQueryDto) {
    return this.alertsService.getAlerts(query);
  }

  /**
   * Get Alert Statistics
   * 
   * Returns aggregate statistics about alerts.
   * 
   * @returns Alert statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get alert statistics',
    description: 'Returns aggregate statistics (total, active, critical, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAlertStats() {
    return this.alertsService.getAlertStats();
  }

  /**
   * Get Alert by ID
   * 
   * @param id - Alert ID
   * @returns Alert details
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get alert by ID',
    description: 'Retrieve detailed information about a specific alert.',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Alert not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAlertById(@Param('id') id: string) {
    return this.alertsService.getAlertById(id);
  }

  /**
   * Acknowledge Alert
   * 
   * Marks an alert as acknowledged by the current user.
   * 
   * @param id - Alert ID
   * @param user - Current user (from JWT)
   * @returns Updated alert
   */
  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Acknowledge alert',
    description: 'Marks an alert as acknowledged by the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert acknowledged successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Alert not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Alert cannot be acknowledged (wrong status)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async acknowledgeAlert(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.alertsService.acknowledgeAlert(id, user.sub);
  }

  /**
   * Resolve Alert
   * 
   * Marks an alert as resolved by the current user.
   * 
   * @param id - Alert ID
   * @param user - Current user (from JWT)
   * @returns Updated alert
   */
  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve alert',
    description: 'Marks an alert as resolved by the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert resolved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Alert not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Alert is already resolved',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async resolveAlert(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.alertsService.resolveAlert(id, user.sub);
  }
}
