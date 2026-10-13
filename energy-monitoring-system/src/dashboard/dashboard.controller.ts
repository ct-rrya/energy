import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnergyService } from '../energy/energy.service';
import { GeminiAIService } from '../ai/gemini-ai.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sensor, SensorDocument } from '../sensors/schemas/sensor.schema';

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

  constructor(
    private readonly energyService: EnergyService,
    private readonly geminiAIService: GeminiAIService,
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
   *     "lastReadingStepCount": 6,
   *     "aiInsight": "Peak generation at 2pm today, 15% above average"
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
      const detailedStats = await this.energyService.getTodayDetailedStats();

      // Get active sensors count
      const activeSensors = await this.sensorModel.countDocuments({
        isActive: true,
      });

      // Generate AI insight for today's energy data
      let aiInsight: string | undefined;
      try {
        const todayEnergy = stats.todayStats.estimatedEnergyKWh;
        const avgPower = stats.todayStats.avgPower;
        const maxPower = stats.todayStats.maxPower;
        const readingCount = stats.todayStats.count;

        const prompt = `Analyze today's energy generation briefly (max 60-100 characters):
- Total energy: ${todayEnergy} kWh
- Average power: ${avgPower.toFixed(2)} W
- Peak power: ${maxPower.toFixed(2)} W
- Readings: ${readingCount}

Provide ONE concise insight about today's performance. Keep it under 100 characters. Examples:
- "Peak generation at 2pm, 15% above average"
- "Steady output throughout the day"
- "Strong performance with ${maxPower.toFixed(1)}W peak"`;

        const aiResponse = await this.geminiAIService.processQuery(prompt);
        
        if (aiResponse) {
          // Trim to 150 characters max
          aiInsight = aiResponse.length > 150 
            ? aiResponse.substring(0, 147) + '...'
            : aiResponse;
          
          this.logger.debug(`Generated AI insight: ${aiInsight}`);
        } else {
          aiInsight = undefined; // Fallback to "Analysis in progress..."
        }
      } catch (error) {
        this.logger.warn(`Failed to generate AI insight: ${error.message}`);
        aiInsight = undefined;
      }

      // Format response to match frontend expectations
      const metrics = {
        // Energy metrics
        dailyEnergy: stats.todayStats.estimatedEnergyKWh,
        totalReadings: stats.totalReadings,
        todayTotalPower: stats.todayStats.totalPower,
        todayAvgPower: stats.todayStats.avgPower,
        todayEstimatedEnergyKWh: stats.todayStats.estimatedEnergyKWh,
        
        // Daily aggregates (NEW)
        todayTotalSteps: detailedStats.totalSteps,
        todayMaxVoltage: detailedStats.maxVoltage,
        todayPeakPower: detailedStats.peakPower,
        todayPeakCurrent: detailedStats.peakCurrent,
        todayAvgVoltage: detailedStats.avgVoltage,
        todayAvgCurrent: detailedStats.avgCurrent,
        
        // System metrics
        activeSensors,
        lastReadingAt: stats.lastReading?.timestamp || null,
        lastReadingPower: stats.lastReading?.power || null,
        lastReadingSensorId: stats.lastReading?.sensorId || null,
        
        // AI insight
        aiInsight,
      };

      this.logger.debug(
        `Dashboard metrics: ${metrics.totalReadings} total readings, ${activeSensors} active sensors, ${metrics.todayTotalSteps} steps today`,
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
