import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EnergyService } from './energy.service';
import {
  DateRangeQueryDto,
  LimitQueryDto,
  DateRangeLimitQueryDto,
  TodayEnergyResponseDto,
  TodayEnergySensorResponseDto,
  EnergyRangeResponseDto,
  EnergyRangeSensorResponseDto,
  EnergyReadingResponseDto,
  SensorEnergyDto,
  TotalStatisticsResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Energy Controller
 * 
 * Handles HTTP requests for energy data queries.
 * 
 * Endpoints:
 * - GET /api/energy/today                      Today's total energy
 * - GET /api/energy/range                      Energy for date range
 * - GET /api/energy/recent                     Recent readings (all sensors)
 * - GET /api/energy/readings                   Readings for date range
 * - GET /api/energy/by-sensors                 Today's energy by sensor
 * - GET /api/energy/statistics                 System statistics
 * - GET /api/energy/sensor/:id/today           Sensor today's energy
 * - GET /api/energy/sensor/:id/range           Sensor date range energy
 * - GET /api/energy/sensor/:id/recent          Sensor recent readings
 * 
 * Authentication:
 * - All endpoints require JWT authentication
 * - Protected by JwtAuthGuard
 * 
 * Responsibilities:
 * - HTTP request/response handling
 * - Query parameter validation
 * - Swagger documentation
 * 
 * Does NOT:
 * - Business logic (delegated to EnergyService)
 * - Database queries (delegated to EnergyService)
 * - Data storage (IoT module handles this)
 */
@ApiTags('Energy')
@Controller('energy')
@UseGuards(JwtAuthGuard) // All endpoints require authentication
@ApiBearerAuth() // Swagger: Show "Authorize" button
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  /**
   * Get Today's Total Energy
   * 
   * Retrieves energy statistics for current day across all sensors.
   * 
   * @returns Today's energy statistics
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "date": "2026-07-17",
   *     "totalPower": 1250.75,
   *     "count": 145,
   *     "avgPower": 8.63,
   *     "maxPower": 25.5,
   *     "minPower": 0.5,
   *     "estimatedEnergyKWh": 0.145
   *   }
   * }
   */
  @Get('today')
  @ApiOperation({
    summary: "Get today's total energy",
    description:
      'Retrieves energy statistics for the current day across all sensors. ' +
      'Includes total power, reading count, averages, and estimated kWh.',
  })
  @ApiResponse({
    status: 200,
    description: "Today's energy statistics retrieved successfully",
    type: TodayEnergyResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getTodayTotal(): Promise<TodayEnergyResponseDto> {
    return this.energyService.getTodayEnergyTotal();
  }

  /**
   * Get Energy for Date Range
   * 
   * Retrieves energy statistics for a specific date range.
   * 
   * @param query - Start and end dates
   * @returns Energy statistics for date range
   * 
   * Example Request:
   * GET /api/energy/range?startDate=2026-07-01&endDate=2026-07-17
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "startDate": "2026-07-01",
   *     "endDate": "2026-07-17",
   *     "totalPower": 21500.00,
   *     "count": 2450,
   *     "avgPower": 8.78,
   *     "maxPower": 45.2,
   *     "minPower": 0.1,
   *     "estimatedEnergyKWh": 2.15
   *   }
   * }
   */
  @Get('range')
  @ApiOperation({
    summary: 'Get energy for date range',
    description:
      'Retrieves energy statistics for a specific date range across all sensors. ' +
      'Useful for weekly, monthly, or custom period analysis.',
  })
  @ApiResponse({
    status: 200,
    description: 'Energy statistics retrieved successfully',
    type: EnergyRangeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date format - use ISO 8601 (YYYY-MM-DD)',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getEnergyRange(
    @Query() query: DateRangeQueryDto,
  ): Promise<EnergyRangeResponseDto> {
    return this.energyService.getEnergyRange(query.startDate, query.endDate);
  }

  /**
   * Get Recent Readings
   * 
   * Retrieves most recent energy readings across all sensors.
   * 
   * @param query - Limit (optional, default: 100, max: 1000)
   * @returns Array of recent readings
   * 
   * Example Request:
   * GET /api/energy/recent?limit=50
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *       "sensorId": "64f9a1b2c3d4e5f6g7h8i9j0",
   *       "voltage": 5.2,
   *       "current": 0.15,
   *       "power": 0.78,
   *       "energy": 0.0,
   *       "timestamp": "2026-07-17T14:30:00.000Z",
   *       "receivedAt": "2026-07-17T14:30:01.234Z"
   *     }
   *   ]
   * }
   */
  @Get('recent')
  @ApiOperation({
    summary: 'Get recent readings',
    description:
      'Retrieves the most recent energy readings across all sensors. ' +
      'Sorted by timestamp (newest first). Default limit: 100, max: 1000.',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent readings retrieved successfully',
    type: [EnergyReadingResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid limit - must be between 1 and 1000',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getRecentReadings(
    @Query() query: LimitQueryDto,
  ): Promise<EnergyReadingResponseDto[]> {
    const readings = await this.energyService.getRecentReadings(query.limit);
    return readings.map((reading) => reading.toJSON() as any);
  }

  /**
   * Get Readings for Date Range
   * 
   * Retrieves all readings within a date range.
   * Use with caution - can return large datasets.
   * 
   * @param query - Start date, end date, and limit
   * @returns Array of readings
   * 
   * Example Request:
   * GET /api/energy/readings?startDate=2026-07-01&endDate=2026-07-17&limit=500
   * 
   * Note:
   * - Always use limit to prevent memory issues
   * - For statistics, use /range endpoint instead
   * - For large date ranges, consider pagination
   */
  @Get('readings')
  @ApiOperation({
    summary: 'Get readings for date range',
    description:
      'Retrieves all readings within a date range. Use with caution for large ranges. ' +
      'Default limit: 1000, max: 10000. For statistics, use /range endpoint instead.',
  })
  @ApiResponse({
    status: 200,
    description: 'Readings retrieved successfully',
    type: [EnergyReadingResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid date format or limit',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getReadingsRange(
    @Query() query: DateRangeLimitQueryDto,
  ): Promise<EnergyReadingResponseDto[]> {
    const readings = await this.energyService.getReadingsRange(
      query.startDate,
      query.endDate,
      query.limit,
    );
    return readings.map((reading) => reading.toJSON() as any);
  }

  /**
   * Get Energy by Sensors
   * 
   * Groups today's energy by sensor.
   * Shows which sensors are most productive.
   * 
   * @returns Array of sensor energy statistics
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "sensorId": "64f9a1b2c3d4e5f6g7h8i9j0",
   *       "totalPower": 450.25,
   *       "count": 52,
   *       "avgPower": 8.66,
   *       "maxPower": 15.3
   *     }
   *   ]
   * }
   */
  @Get('by-sensors')
  @ApiOperation({
    summary: "Get today's energy by sensor",
    description:
      "Groups today's energy by sensor. Sorted by total power (highest first). " +
      'Useful for comparing sensor productivity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sensor energy statistics retrieved successfully',
    type: [SensorEnergyDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getEnergyBySensors(): Promise<SensorEnergyDto[]> {
    return this.energyService.getEnergyBySensors();
  }

  /**
   * Get Total Statistics
   * 
   * Returns overall system statistics.
   * 
   * @returns System-wide statistics
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "totalReadings": 5432,
   *     "todayStats": { ... },
   *     "lastReading": {
   *       "timestamp": "2026-07-17T14:30:00.000Z",
   *       "power": 0.78,
   *       "sensorId": "64f9a1b2c3d4e5f6g7h8i9j0"
   *     }
   *   }
   * }
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get total statistics',
    description:
      'Returns overall system statistics including total readings, ' +
      "today's stats, and last reading received.",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: TotalStatisticsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getTotalStatistics(): Promise<TotalStatisticsResponseDto> {
    return this.energyService.getTotalStatistics();
  }

  /**
   * Get Sensor's Today Energy
   * 
   * Retrieves energy statistics for a specific sensor today.
   * 
   * @param sensorId - Sensor ID
   * @returns Today's energy statistics for sensor
   * 
   * Example Request:
   * GET /api/energy/sensor/64f9a1b2c3d4e5f6g7h8i9j0/today
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "sensorId": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "date": "2026-07-17",
   *     "totalPower": 450.25,
   *     "count": 52,
   *     "avgPower": 8.66,
   *     "maxPower": 15.3,
   *     "minPower": 1.2,
   *     "estimatedEnergyKWh": 0.045
   *   }
   * }
   */
  @Get('sensor/:id/today')
  @ApiOperation({
    summary: "Get sensor's today energy",
    description:
      'Retrieves energy statistics for a specific sensor for the current day.',
  })
  @ApiParam({
    name: 'id',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: "Sensor's today energy retrieved successfully",
    type: TodayEnergySensorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid sensor ID format',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getSensorTodayEnergy(
    @Param('id') sensorId: string,
  ): Promise<TodayEnergySensorResponseDto> {
    return this.energyService.getTodayEnergySensor(sensorId);
  }

  /**
   * Get Sensor's Energy Range
   * 
   * Retrieves energy statistics for a specific sensor in date range.
   * 
   * @param sensorId - Sensor ID
   * @param query - Start and end dates
   * @returns Energy statistics for sensor in date range
   * 
   * Example Request:
   * GET /api/energy/sensor/64f9a1b2c3d4e5f6g7h8i9j0/range?startDate=2026-07-01&endDate=2026-07-17
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "sensorId": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "startDate": "2026-07-01",
   *     "endDate": "2026-07-17",
   *     "totalPower": 7650.50,
   *     "count": 884,
   *     "avgPower": 8.65,
   *     "maxPower": 22.1,
   *     "minPower": 0.8,
   *     "estimatedEnergyKWh": 0.765
   *   }
   * }
   */
  @Get('sensor/:id/range')
  @ApiOperation({
    summary: "Get sensor's energy range",
    description:
      'Retrieves energy statistics for a specific sensor within a date range.',
  })
  @ApiParam({
    name: 'id',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: "Sensor's energy range retrieved successfully",
    type: EnergyRangeSensorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid sensor ID or date format',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getSensorEnergyRange(
    @Param('id') sensorId: string,
    @Query() query: DateRangeQueryDto,
  ): Promise<EnergyRangeSensorResponseDto> {
    return this.energyService.getEnergyRangeSensor(
      sensorId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * Get Sensor's Recent Readings
   * 
   * Retrieves recent readings for a specific sensor.
   * 
   * @param sensorId - Sensor ID
   * @param query - Limit (optional, default: 100, max: 1000)
   * @returns Array of sensor's recent readings
   * 
   * Example Request:
   * GET /api/energy/sensor/64f9a1b2c3d4e5f6g7h8i9j0/recent?limit=50
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *       "sensorId": "64f9a1b2c3d4e5f6g7h8i9j0",
   *       "voltage": 5.2,
   *       "current": 0.15,
   *       "power": 0.78,
   *       "energy": 0.0,
   *       "timestamp": "2026-07-17T14:30:00.000Z",
   *       "receivedAt": "2026-07-17T14:30:01.234Z"
   *     }
   *   ]
   * }
   */
  @Get('sensor/:id/recent')
  @ApiOperation({
    summary: "Get sensor's recent readings",
    description:
      'Retrieves the most recent readings for a specific sensor. ' +
      'Sorted by timestamp (newest first). Default limit: 100, max: 1000.',
  })
  @ApiParam({
    name: 'id',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: "Sensor's recent readings retrieved successfully",
    type: [EnergyReadingResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid sensor ID or limit',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async getSensorRecentReadings(
    @Param('id') sensorId: string,
    @Query() query: LimitQueryDto,
  ): Promise<EnergyReadingResponseDto[]> {
    const readings = await this.energyService.getRecentReadingsSensor(
      sensorId,
      query.limit,
    );
    return readings.map((reading) => reading.toJSON() as any);
  }
}
