import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DashboardGateway } from './dashboard.gateway';
import { EnergyService } from '../energy/energy.service';
import { GeminiAIService } from '../ai/gemini-ai.service';
import { StatisticsUpdateEventDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sensor, SensorDocument } from '../sensors/schemas/sensor.schema';

/**
 * Dashboard Service
 *
 * Provides business logic for dashboard operations.
 *
 * Responsibilities:
 * - Periodic statistics updates
 * - Coordinate data aggregation
 * - Trigger broadcasts via gateway
 * - Monitor sensor health
 *
 * Features:
 * - Auto-start statistics broadcasting on application bootstrap
 * - Configurable update intervals
 * - Sensor health monitoring
 * - Graceful shutdown with cleanup
 *
 * Lifecycle:
 * - Uses OnApplicationBootstrap (not OnModuleInit) to ensure
 *   Socket.IO gateway is fully initialized before starting broadcasts
 * - Uses OnModuleDestroy for cleanup
 *
 * Performance:
 * - Caches statistics between broadcasts
 * - Efficient queries via EnergyService
 * - Throttled updates (every 10 seconds default)
 */
@Injectable()
export class DashboardService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(DashboardService.name);
  private statisticsInterval: NodeJS.Timeout;
  private readonly updateIntervalMs: number;
  private readonly metricsCacheTtlMs = 60_000;
  private readonly aiInsightTtlMs = 60_000;
  private metricsCache: { data: any; expiresAt: number } | null = null;
  private metricsInFlight: Promise<any> | null = null;
  private lastAiInsight: string | null = null;
  private aiInsightUpdatedAt: number = 0;
  private aiInsightInFlight: boolean = false;

  constructor(
    private dashboardGateway: DashboardGateway,
    private energyService: EnergyService,
    private geminiAIService: GeminiAIService,
    private configService: ConfigService,
    @InjectModel(Sensor.name) private sensorModel: Model<SensorDocument>,
  ) {
    // Get update interval from config (default: 10 seconds)
    this.updateIntervalMs = 10000; // 10 seconds
  }

  /**
   * On Application Bootstrap
   *
   * Called after all modules have been initialized and gateways are ready.
   *
   * Lifecycle Timing:
   * - Runs AFTER OnModuleInit
   * - Runs AFTER Socket.IO gateway initialization (afterInit)
   * - Ensures this.dashboardGateway.server is fully initialized
   *
   * Why Not OnModuleInit?
   * - OnModuleInit runs before Socket.IO gateway is ready
   * - Accessing gateway.server.sockets.sockets would fail
   * - OnApplicationBootstrap guarantees all components are ready
   *
   * Starts periodic statistics broadcasting to connected clients.
   */
  async onApplicationBootstrap() {
    this.logger.log(
      'Dashboard Service initialized - Starting statistics broadcast',
    );
    this.startStatisticsBroadcast();
  }

  /**
   * On Module Destroy
   *
   * Called when module is being destroyed (app shutdown).
   * Cleans up timers and resources.
   *
   * Prevents:
   * - Memory leaks from running timers
   * - Errors from broadcasts during shutdown
   */
  onModuleDestroy() {
    this.logger.log('Dashboard Service shutting down');
    this.stopStatisticsBroadcast();
  }

  /**
   * Start Statistics Broadcast
   *
   * Starts periodic broadcasting of system statistics.
   * Updates sent every 10 seconds (configurable).
   *
   * Statistics Include:
   * - Total readings count
   * - Today's energy totals
   * - Active sensors count
   * - Last reading info
   */
  startStatisticsBroadcast() {
    this.logger.log(
      `Starting statistics broadcast (interval: ${this.updateIntervalMs}ms)`,
    );

    // Broadcast immediately on start
    this.broadcastStatistics();

    // Then broadcast periodically
    this.statisticsInterval = setInterval(() => {
      this.broadcastStatistics();
    }, this.updateIntervalMs);
  }

  /**
   * Stop Statistics Broadcast
   *
   * Stops periodic statistics broadcasting.
   * Called on module cleanup.
   */
  stopStatisticsBroadcast() {
    if (this.statisticsInterval) {
      clearInterval(this.statisticsInterval);
      this.logger.log('Stopped statistics broadcast');
    }
  }

  /**
   * Broadcast Statistics
   *
   * Fetches current statistics and broadcasts to all clients.
   *
   * Process:
   * 1. Get total statistics from EnergyService
   * 2. Get active sensors count
   * 3. Format statistics event
   * 4. Broadcast via gateway
   */
  async broadcastStatistics() {
    try {
      // Check if any clients are connected
      const connectedClients = this.dashboardGateway.getConnectedClientsCount();
      if (connectedClients === 0) {
        // No clients connected, skip broadcast
        return;
      }

      this.logger.debug('Broadcasting statistics update...');

      // Fetch statistics and active sensor count concurrently
      const [stats, activeSensors] = await Promise.all([
        this.energyService.getTotalStatistics(),
        this.sensorModel.countDocuments({ isActive: true }).exec(),
      ]);

      // Format statistics event
      const statisticsEvent: StatisticsUpdateEventDto = {
        totalReadings: stats.totalReadings,
        todayTotalPower: stats.todayStats.totalPower,
        todayAvgPower: stats.todayStats.avgPower,
        todayEstimatedEnergyKWh: stats.todayStats.estimatedEnergyKWh,
        activeSensors,
        lastReadingAt: stats.lastReading?.timestamp || null,
        lastReadingPower: stats.lastReading?.power || null,
        updatedAt: new Date(),
      };

      // Broadcast to all connected clients
      this.dashboardGateway.broadcastStatistics(statisticsEvent);

      this.logger.debug(
        `Statistics broadcasted to ${connectedClients} client(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast statistics: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get Dashboard Gateway
   *
   * Returns the dashboard gateway instance.
   * Used by other modules (IoT) to broadcast events.
   *
   * @returns DashboardGateway instance
   */
  getGateway(): DashboardGateway {
    return this.dashboardGateway;
  }

  /**
   * Invalidate the dashboard metrics cache when a new reading arrives so the
   * next request fetches fresh MongoDB aggregates and schedules a background AI refresh.
   */
  invalidateMetricsCache(): void {
    this.metricsCache = null;
    this.aiInsightUpdatedAt = 0;
  }

  /**
   * Get Dashboard Metrics (60s in-memory TTL cache + non-blocking background AI insight)
   */
  async getDashboardMetrics() {
    const now = Date.now();
    if (this.metricsCache && now < this.metricsCache.expiresAt) {
      return this.metricsCache.data;
    }

    if (this.metricsInFlight) {
      return this.metricsInFlight;
    }

    this.metricsInFlight = this.computeDashboardMetrics()
      .then((metrics) => {
        this.metricsCache = {
          data: metrics,
          expiresAt: Date.now() + this.metricsCacheTtlMs,
        };
        return metrics;
      })
      .finally(() => {
        this.metricsInFlight = null;
      });

    return this.metricsInFlight;
  }

  private getDefaultInsight(rawStats: any, detailedStats: any): string {
    const todayEnergy = rawStats?.totalEnergyMWh ?? 0;
    const avgPower = rawStats?.avgPowerW ?? 0;
    const maxPower = rawStats?.peakPowerW ?? 0;
    const readingCount = rawStats?.readingCount ?? 0;
    const totalSteps = detailedStats?.totalSteps ?? 0;

    if (readingCount === 0) {
      return 'No sensor data recorded today';
    }
    if (todayEnergy === 0 && maxPower === 0) {
      return 'System active but no energy generated yet';
    }
    if (todayEnergy < 0.001) {
      return `Minimal activity: ${(avgPower * 1000).toFixed(2)}mW avg, ${totalSteps} steps detected`;
    }
    return `Active generation: ${maxPower.toFixed(4)}W peak from ${totalSteps} steps`;
  }

  private refreshAiInsightInBackground(rawStats: any, detailedStats: any): void {
    const now = Date.now();
    if (this.aiInsightInFlight) {
      return;
    }
    if (this.lastAiInsight && now - this.aiInsightUpdatedAt < this.aiInsightTtlMs) {
      return;
    }

    this.aiInsightInFlight = true;
    const todayEnergy = rawStats.totalEnergyMWh;
    const avgPower = rawStats.avgPowerW;
    const maxPower = rawStats.peakPowerW;
    const readingCount = rawStats.readingCount;
    const totalSteps = detailedStats.totalSteps;

    let statusGuidance: string;
    if (readingCount === 0) {
      statusGuidance = 'NO_READINGS';
    } else if (todayEnergy === 0 && maxPower === 0) {
      statusGuidance = 'ZERO_GENERATION';
    } else if (todayEnergy > 0 && todayEnergy < 0.001) {
      statusGuidance = 'MINIMAL_GENERATION';
    } else {
      statusGuidance = 'NORMAL_GENERATION';
    }

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

    void this.geminiAIService
      .processQuery(prompt)
      .then((aiResponse) => {
        if (aiResponse) {
          const trimmed =
            aiResponse.length > 150
              ? aiResponse.substring(0, 147) + '...'
              : aiResponse;
          this.lastAiInsight = trimmed;
          this.aiInsightUpdatedAt = Date.now();
          if (this.metricsCache?.data) {
            this.metricsCache.data.aiInsight = trimmed;
          }
        }
      })
      .catch((error: any) => {
        this.logger.warn(`[AI] Background insight refresh failed: ${error?.message || error}`);
      })
      .finally(() => {
        this.aiInsightInFlight = false;
      });
  }

  private async computeDashboardMetrics() {
    this.logger.debug('Computing dashboard metrics (cache miss)...');

    // Run all independent MongoDB queries concurrently
    const [stats, detailedStats, activeSensors, rawStats] = await Promise.all([
      this.energyService.getTotalStatistics(),
      this.energyService.getTodayDetailedStats(),
      this.sensorModel.countDocuments({ isActive: true }).exec(),
      this.energyService.getTodayRawStatistics(),
    ]);

    // Refresh AI insight asynchronously in the background without blocking HTTP response
    this.refreshAiInsightInBackground(rawStats, detailedStats);

    const aiInsight =
      this.lastAiInsight || this.getDefaultInsight(rawStats, detailedStats);

    return {
      dailyEnergy: stats.todayStats.estimatedEnergyKWh,
      totalReadings: stats.totalReadings,
      todayTotalPower: stats.todayStats.totalPower,
      todayAvgPower: stats.todayStats.avgPower,
      todayEstimatedEnergyKWh: stats.todayStats.estimatedEnergyKWh,
      todayTotalSteps: detailedStats.totalSteps,
      todayMaxVoltage: detailedStats.maxVoltage,
      todayPeakPower: detailedStats.peakPower,
      todayPeakCurrent: detailedStats.peakCurrent,
      todayAvgVoltage: detailedStats.avgVoltage,
      todayAvgCurrent: detailedStats.avgCurrent,
      activeSensors,
      lastReadingAt: stats.lastReading?.timestamp || null,
      lastReadingPower: stats.lastReading?.power || null,
      lastReadingSensorId: stats.lastReading?.sensorId || null,
      aiInsight,
    };
  }

  /**
   * Trigger Statistics Update
   *
   * Manually trigger statistics broadcast.
   * Used when immediate update is needed.
   */
  async triggerStatisticsUpdate() {
    await this.broadcastStatistics();
  }
}
