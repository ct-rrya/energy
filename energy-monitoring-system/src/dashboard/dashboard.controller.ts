import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

/**
 * Dashboard Controller
 *
 * Provides dashboard-specific aggregated data endpoints.
 * 
 * All endpoints are publicly accessible to support public dashboard viewing.
 */
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get Dashboard Metrics
   *
   * Returns all key metrics needed for the dashboard in a single call.
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description:
      'Returns aggregated metrics for the dashboard including total readings, today statistics, and active sensors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
  })
  async getMetrics() {
    try {
      const metrics = await this.dashboardService.getDashboardMetrics();
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch dashboard metrics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get Dashboard Alerts
   *
   * Returns recent alerts for the dashboard.
   * (Placeholder - implement based on your alerts system)
   */
  @Get('alerts')
  @ApiOperation({
    summary: 'Get dashboard alerts',
    description: 'Returns recent alerts for the dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard alerts retrieved successfully',
  })
  async getAlerts() {
    // Placeholder - implement based on your alerts system
    return {
      success: true,
      data: [],
    };
  }
}
