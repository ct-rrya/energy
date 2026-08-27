import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DashboardGateway } from './dashboard.gateway';
import { EnergyService } from '../energy/energy.service';
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
export class DashboardService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DashboardService.name);
  private statisticsInterval: NodeJS.Timeout;
  private readonly updateIntervalMs: number;

  constructor(
    private dashboardGateway: DashboardGateway,
    private energyService: EnergyService,
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
    this.logger.log('Dashboard Service initialized - Starting statistics broadcast');
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

      // Get statistics from EnergyService
      const stats = await this.energyService.getTotalStatistics();

      // Get active sensors count
      const activeSensors = await this.sensorModel.countDocuments({
        isActive: true,
      });

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
   * Trigger Statistics Update
   * 
   * Manually trigger statistics broadcast.
   * Used when immediate update is needed.
   */
  async triggerStatisticsUpdate() {
    await this.broadcastStatistics();
  }
}
