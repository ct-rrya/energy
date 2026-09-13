import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { TelemetryDto } from './dto/telemetry.dto';
import { EnergyService } from '../energy/energy.service';

/**
 * PublicController
 * 
 * Serves public telemetry data for the landing page
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.5, 11.9, 11.10
 */
@ApiTags('Public API')
@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly energyService: EnergyService,
  ) {}

  /**
   * GET /api/public/telemetry
   * Get current system telemetry data
   * 
   * This endpoint:
   * - Does NOT require authentication (public access)
   * - Uses 5-second cache to reduce database load
   * - Rate limited to 120 requests per minute (every 0.5s)
   * - Returns 200 with data when available
   * - Returns 503 when data is unavailable
   * 
   * Requirements: 11.1, 11.2, 11.3, 11.5, 11.6, 11.7, 11.8, 11.10
   */
  @Get('telemetry')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5) // Cache for 5 seconds (Requirement 11.7)
  @Throttle({ telemetry: { limit: 120, ttl: 60000 } }) // 120 req/min (Requirement 11.10)
  @ApiOperation({
    summary: 'Get current telemetry data',
    description:
      '**Retrieve real-time system telemetry including voltage, current, power, and energy.**\n\n' +
      '### Features\n' +
      '- 🔓 **No authentication required** - Public endpoint for landing page\n' +
      '- ⚡ **Real-time data** - Latest sensor readings from IoT devices\n' +
      '- 🚀 **Optimized performance** - 5-second cache to reduce database load\n' +
      '- 🛡️ **Rate limited** - 120 requests per minute (1 request every 0.5 seconds)\n\n' +
      '### Use Cases\n' +
      '- Display real-time system status on landing page\n' +
      '- Power dashboards and monitoring displays\n' +
      '- Mobile app integration\n' +
      '- Third-party monitoring tools\n\n' +
      '### Data Freshness\n' +
      '- **Cache TTL**: 5 seconds\n' +
      '- **Update frequency**: Every 0.5-10 seconds (depending on sensor polling)\n' +
      '- **Recommended polling**: Every 10 seconds from frontend\n\n' +
      '### Available Chat Commands\n' +
      'Use the `/api/chat` endpoint to query the system interactively:\n' +
      '- `status` - Get comprehensive system status\n' +
      '- `energy` - Current energy generation\n' +
      '- `today` - Today\'s energy summary\n' +
      '- `help` - List all available commands\n\n' +
      '### Related Endpoints\n' +
      '- `POST /api/chat` - Interactive chat interface for detailed queries\n' +
      '- `GET /api/public/health` - Health check endpoint',
  })
  @ApiResponse({
    status: 200,
    description: '**Telemetry data retrieved successfully** - Returns current system readings and status',
    type: TelemetryDto,
    examples: {
      onlineNormal: {
        summary: 'Online - Normal Operation - System is online with typical power generation levels',
        value: {
          voltage: 12.5,
          current: 2.3,
          power: 28.75,
          energyToday: 0.145,
          timestamp: '2024-01-01T12:00:00.000Z',
          status: 'online',
        },
      },
      onlineHighPower: {
        summary: 'Online - High Power Generation - System is online with elevated power output (peak usage period)',
        value: {
          voltage: 13.2,
          current: 3.1,
          power: 40.92,
          energyToday: 0.287,
          timestamp: '2024-01-01T14:30:00.000Z',
          status: 'online',
        },
      },
      onlineLowPower: {
        summary: 'Online - Low Power Generation - System is online but with minimal activity (off-peak hours)',
        value: {
          voltage: 11.8,
          current: 0.5,
          power: 5.9,
          energyToday: 0.052,
          timestamp: '2024-01-01T03:15:00.000Z',
          status: 'online',
        },
      },
      onlineStartOfDay: {
        summary: 'Online - Start of Day - System readings shortly after midnight (energy counter reset)',
        value: {
          voltage: 12.1,
          current: 1.2,
          power: 14.52,
          energyToday: 0.003,
          timestamp: '2024-01-01T00:15:00.000Z',
          status: 'online',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: '**Too Many Requests** - Rate limit exceeded (max 120 requests per minute)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'Too many requests. Please try again later.' },
        error: { type: 'string', example: 'Too Many Requests' },
        retryAfter: { type: 'number', example: 60, description: 'Seconds until rate limit resets' },
      },
    },
    examples: {
      rateLimitExceeded: {
        summary: 'Rate Limit Exceeded - Exceeded 120 requests per minute limit. Poll every 10 seconds instead of more frequently.',
        value: {
          statusCode: 429,
          message: 'Too many requests. Please try again later.',
          error: 'Too Many Requests',
          retryAfter: 60,
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: '**Service Unavailable** - Telemetry data unavailable (system offline or no recent sensor data)',
    examples: {
      noRecentData: {
        summary: 'No Recent Sensor Data - No sensor readings received in the last polling interval (sensors may be offline)',
        value: {
          statusCode: 503,
          message: 'No recent sensor data available',
          error: 'Service Unavailable',
        },
      },
      systemOffline: {
        summary: 'System Offline - IoT devices are offline or not transmitting data',
        value: {
          statusCode: 503,
          message: 'Telemetry data temporarily unavailable. Please try again later.',
          error: 'Service Unavailable',
        },
      },
      databaseError: {
        summary: 'Database Connection Error - Unable to retrieve data from database (temporary connectivity issue)',
        value: {
          statusCode: 503,
          message: 'Telemetry data temporarily unavailable. Please try again later.',
          error: 'Service Unavailable',
        },
      },
    },
  })
  async getCurrentTelemetry(): Promise<TelemetryDto> {
    this.logger.log('Public telemetry request received');

    try {
      // Get today's energy total (Requirement 3.6)
      const todayData = await this.energyService.getTodayEnergyTotal();
      
      // Get the most recent reading for current voltage, current, and power
      const recentReadings = await this.energyService.getRecentReadings(1);
      
      // Check if we have data (Requirement 3.8, 11.6, 11.8)
      if (!recentReadings || recentReadings.length === 0) {
        this.logger.warn('No recent sensor data available');
        throw new ServiceUnavailableException('No recent sensor data available');
      }

      const latestReading = recentReadings[0];
      
      // Map to TelemetryDto format (Requirement 11.5)
      const telemetryData: TelemetryDto = {
        voltage: Math.round(latestReading.voltage * 100) / 100, // 2 decimal places
        current: Math.round(latestReading.current * 100) / 100,
        power: Math.round(latestReading.power * 100) / 100,
        energyToday: todayData.estimatedEnergyKWh, // Energy in kWh
        timestamp: latestReading.timestamp.toISOString(),
        status: 'online', // If we got data, system is online
      };

      this.logger.log('Telemetry data retrieved successfully');
      return telemetryData; // Return HTTP 200 with JSON data (Requirement 11.5)
      
    } catch (error) {
      this.logger.error('Error fetching telemetry data', error.stack);
      
      // If it's already a ServiceUnavailableException, rethrow it as-is
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      
      // Return HTTP 503 when data unavailable (Requirement 3.8, 11.6, 11.8)
      throw new ServiceUnavailableException(
        'Telemetry data temporarily unavailable. Please try again later.',
      );
    }
  }

  /**
   * GET /api/public/health
   * Health check endpoint for monitoring
   */
  @Get('health')
  @ApiOperation({
    summary: 'Public API health check',
    description:
      '**Check if the public API is running and responsive.**\n\n' +
      'Used for:\n' +
      '- Uptime monitoring and alerting\n' +
      '- Load balancer health checks\n' +
      '- Service availability verification\n' +
      '- Continuous integration testing\n\n' +
      'This endpoint does NOT check:\n' +
      '- Database connectivity (use telemetry endpoint to verify data access)\n' +
      '- IoT device status (telemetry endpoint returns 503 if devices are offline)\n' +
      '- External service dependencies',
  })
  @ApiResponse({
    status: 200,
    description: '**Service is healthy** - Public API is running and responsive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok', description: 'Service health status' },
      },
    },
    examples: {
      healthy: {
        summary: 'Service Healthy - Public API is operational and accepting requests',
        value: {
          status: 'ok',
        },
      },
    },
  })
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }
}
