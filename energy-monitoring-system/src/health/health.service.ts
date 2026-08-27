import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckResponseDto,
  HealthStatus,
  DatabaseHealthDto,
  MemoryHealthDto,
  SystemInfoDto,
} from './dto';

/**
 * Health Service
 * 
 * Provides comprehensive health check functionality including:
 * - Database connectivity
 * - Memory usage
 * - System information
 * - Application uptime
 * 
 * Used by monitoring tools, load balancers, and DevOps dashboards
 */
@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Perform comprehensive health check
   * Returns detailed health status of all system components
   */
  async check(): Promise<HealthCheckResponseDto> {
    const databaseHealth = await this.checkDatabase();
    const memoryHealth = this.checkMemory();
    const systemInfo = this.getSystemInfo();

    // Determine overall status
    const status = this.determineOverallStatus(databaseHealth, memoryHealth);

    return {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: this.configService.get<string>('app.nodeEnv') || 'development',
      database: databaseHealth,
      memory: memoryHealth,
      system: systemInfo,
    };
  }

  /**
   * Check database health
   * Measures connection status and response time
   */
  private async checkDatabase(): Promise<DatabaseHealthDto> {
    const startTime = Date.now();
    
    try {
      const state = this.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      const isConnected = state === 1;
      const responseTime = Date.now() - startTime;

      return {
        status: isConnected ? 'up' : 'down',
        state: states[state] || 'unknown',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'down',
        state: 'error',
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check memory health
   * Monitors heap usage and calculates percentage
   */
  private checkMemory(): MemoryHealthDto {
    const memoryUsage = process.memoryUsage();
    const used = memoryUsage.heapUsed;
    const total = memoryUsage.heapTotal;
    const percentage = Math.round((used / total) * 100);

    // Consider unhealthy if memory usage > 95% (more lenient for development)
    const status = percentage < 95 ? 'up' : 'down';

    return {
      status,
      used,
      total,
      percentage,
    };
  }

  /**
   * Get system information
   * Returns Node.js version, platform, uptime, and process ID
   */
  private getSystemInfo(): SystemInfoDto {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
    };
  }

  /**
   * Determine overall health status
   * Based on individual component health checks
   */
  private determineOverallStatus(
    database: DatabaseHealthDto,
    memory: MemoryHealthDto,
  ): string {
    // Critical: Database must be up
    if (database.status === 'down') {
      return HealthStatus.UNHEALTHY;
    }

    // Warning: Memory usage is high
    if (memory.status === 'down') {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }
}
