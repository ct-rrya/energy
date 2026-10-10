import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnergyService } from '../energy/energy.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sensor, SensorDocument } from '../sensors/schemas/sensor.schema';

/**
 * Dashboard Controller
 *
 * Provides dashboard-specific aggregated data endpoints.
 */
@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly energyService: EnergyService,
    @InjectModel(Sensor.name) private sensorModel: Model<SensorDocument>,
  ) {}

  /**
   * Get Dashboard Metrics
   *
   * Returns all key metrics needed for the dashboard in a single call.
   *
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "totalReadings": 1250,
   *     "todayTotalPower": 450.25,
   *     "todayAvgPower": 8.66,
   *     "todayEstimatedEnergyKWh": 0.045,
   *     "activeSensors": 3,
   *     "lastReadingAt": "2026-10-10T03:48:40.437Z",
   *     "lastReadingPower": 0.000377,
   *     "lastReadingStepCount": 6
   *   }
   * }
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
      this.logger.debug('Fetching dashboard metrics...');

      // Get statistics from EnergyService
      const stats = await this.energyService.getTotalStatistics();

      // Get active sensors count
      const activeSensors = await this.sensorModel.countDocuments({
        isActive: true,
      });

      // Format response to match frontend expectations
      const metrics = {
        dailyEnergy: stats.todayStats.estimatedEnergyKWh, // Frontend expects "dailyEnergy"
        totalReadings: stats.totalReadings,
        todayTotalPower: stats.todayStats.totalPower,
        todayAvgPower: stats.todayStats.avgPower,
        todayEstimatedEnergyKWh: stats.todayStats.estimatedEnergyKWh,
        activeSensors,
        lastReadingAt: stats.lastReading?.timestamp || null,
        lastReadingPower: stats.lastReading?.power || null,
        lastReadingSensorId: stats.lastReading?.sensorId || null,
      };

      this.logger.debug(
        `Dashboard metrics: ${metrics.totalReadings} total readings, ${activeSensors} active sensors`,
      );

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
