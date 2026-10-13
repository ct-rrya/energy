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
        // Get RAW unrounded values from database for AI analysis
        const rawStats = await this.energyService.getTodayRawStatistics();
        
        const todayEnergy = rawStats.totalEnergyMWh; // Raw mWh value
        const avgPower = rawStats.avgPower; // Unrounded W
        const maxPower = rawStats.maxPower; // Unrounded W
        const readingCount = rawStats.count;
        const totalSteps = detailedStats.totalSteps;

        this.logger.log('[AI] Generating insight with RAW unrounded data:');
        this.logger.log(`  - Energy: ${todayEnergy} mWh (${(todayEnergy / 1000000).toFixed(9)} kWh)`);
        this.logger.log(`  - Avg Power: ${avgPower} W (unrounded)`);
        this.logger.log(`  - Peak Power: ${maxPower} W (unrounded)`);
        this.logger.log(`  - Readings: ${readingCount}`);
        this.logger.log(`  - Steps: ${totalSteps}`);

        // Determine status category for AI guidance
        let statusGuidance: string;
        if (readingCount === 0) {
          statusGuidance = 'NO_READINGS';
        } else if (todayEnergy === 0 && maxPower === 0) {
          statusGuidance = 'ZERO_GENERATION';
        } else if (todayEnergy > 0 && todayEnergy < 0.001) {
          statusGuidance = 'MINIMAL_GENERATION'; // Less than 0.001 mWh
        } else {
          statusGuidance = 'NORMAL_GENERATION';
        }

        this.logger.log(`[AI] Status category: ${statusGuidance}`);

        // Build context-aware prompt with explicit units
        const prompt = `You are analyzing a piezoelectric energy monitoring system. Here's today's data:

STATUS: ${statusGuidance}
- Total energy harvested: ${todayEnergy} milliwatt-hours (mWh)
- Average power: ${avgPower} watts (W)
- Peak power: ${maxPower} watts (W)  
- Number of readings: ${readingCount}
- Total footsteps detected: ${totalSteps}

IMPORTANT RULES:
1. If STATUS is NO_READINGS: Say "No sensor data recorded today"
2. If STATUS is ZERO_GENERATION: Say "System active but no energy generated yet"
3. If STATUS is MINIMAL_GENERATION: Acknowledge the tiny energy (use mW or μW if appropriate)
4. If STATUS is NORMAL_GENERATION: Provide performance insight

Provide ONE concise statement (60-100 characters) about today's performance.

Examples for MINIMAL_GENERATION:
- "Minimal activity: ${(avgPower * 1000).toFixed(2)}mW avg, ${totalSteps} steps detected"
- "Light usage today: ${maxPower.toFixed(4)}W peak from ${totalSteps} steps"

Examples for NORMAL_GENERATION:
- "Strong performance: ${maxPower.toFixed(1)}W peak power"
- "Steady generation throughout the day"`;

        this.logger.log('[AI] Calling AI service...');
        const aiResponse = await this.geminiAIService.processQuery(prompt);
        
        this.logger.log(`[AI] Response received: ${aiResponse ? `"${aiResponse}"` : 'null'}`);
        
        if (aiResponse) {
          // Trim to 150 characters max
          aiInsight = aiResponse.length > 150 
            ? aiResponse.substring(0, 147) + '...'
            : aiResponse;
          
          this.logger.log(`[AI] ✅ Generated insight: "${aiInsight}"`);
        } else {
          aiInsight = undefined; // Fallback to "Analysis in progress..."
          this.logger.warn('[AI] ⚠️  No response from AI service, will show "Analysis in progress..."');
        }
      } catch (error) {
        this.logger.error(`[AI] ❌ Failed to generate AI insight: ${error.message}`);
        this.logger.error(error.stack);
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

      this.logger.log(
        `[DIAGNOSTIC] Dashboard metrics response:`,
      );
      this.logger.log(
        `  - dailyEnergy: ${metrics.dailyEnergy} kWh`,
      );
      this.logger.log(
        `  - todayTotalSteps: ${metrics.todayTotalSteps} steps`,
      );
      this.logger.log(
        `  - todayAvgPower: ${metrics.todayAvgPower} W`,
      );
      this.logger.log(
        `  - todayPeakPower: ${metrics.todayPeakPower} W`,
      );
      this.logger.log(
        `  - totalReadings: ${metrics.totalReadings}`,
      );
      this.logger.log(
        `  - activeSensors: ${activeSensors}`,
      );
      this.logger.log(
        `  - aiInsight: ${metrics.aiInsight ? `"${metrics.aiInsight}"` : 'undefined'}`,
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
