import {
  Controller,
  Post,
  Get,
  Body,
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
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IotService } from './iot.service';
import {
  CreateReadingDto,
  CreateReadingResponseDto,
  ReadingResponseDto,
  ReadingQueryDto,
  StatisticsQueryDto,
  PaginatedReadingsResponseDto,
  ReadingStatisticsResponseDto,
} from './dto';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiKey } from './decorators/api-key.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * IoT Controller
 * 
 * Handles HTTP requests from ESP32 devices for data ingestion.
 * 
 * Endpoints:
 * - POST /api/iot/readings - Submit energy reading
 * 
 * Authentication:
 * - Uses ApiKeyGuard (not JWT)
 * - API key in X-API-Key header
 * - Validated against Sensors collection
 * 
 * Design Philosophy:
 * - Thin controller (no business logic)
 * - Delegates to service layer
 * - Handles HTTP concerns only
 * - Returns lightweight responses
 * 
 * Why separate from admin endpoints?
 * - Different authentication (API key vs JWT)
 * - Different consumers (ESP32 vs Admin)
 * - Different response format (lightweight vs detailed)
 * - Different security requirements
 * 
 * ESP32 Usage Example:
 * ```cpp
 * HTTPClient http;
 * http.begin("http://server.com:3000/api/iot/readings");
 * http.addHeader("Content-Type", "application/json");
 * http.addHeader("X-API-Key", "esp32_abc123...");
 * 
 * String payload = "{\"voltage\":5.2,\"current\":0.15,\"power\":0.78,\"timestamp\":\"2026-07-17T14:30:00.000Z\"}";
 * int httpCode = http.POST(payload);
 * 
 * if (httpCode == 201) {
 *   Serial.println("Success");
 * }
 * ```
 */
@ApiTags('IoT')
@Controller('iot')
export class IotController {
  constructor(private readonly iotService: IotService) {}

  /**
   * Receive Energy Reading from ESP32
   * 
   * Endpoint for ESP32 devices to submit energy readings.
   * 
   * @param apiKey - Sensor API key (extracted by ApiKeyGuard and decorator)
   * @param readingDto - Reading data from ESP32
   * @returns Lightweight confirmation response
   * 
   * Authentication:
   * - API key required in X-API-Key header
   * - ApiKeyGuard validates format
   * - Service validates against database
   * 
   * Process Flow:
   * 1. ApiKeyGuard validates API key format
   * 2. Controller extracts API key and body
   * 3. Controller delegates to service
   * 4. Service validates API key against database
   * 5. Service validates reading data
   * 6. Service stores reading
   * 7. Service updates sensor lastSeen
   * 8. Service returns response
   * 9. Controller serializes to JSON
   * 10. ESP32 receives confirmation
   * 
   * Request Example:
   * POST /api/iot/readings
   * Headers:
   *   Content-Type: application/json
   *   X-API-Key: esp32_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   * Body:
   * {
   *   "voltage": 5.2,
   *   "current": 0.15,
   *   "power": 0.78,
   *   "timestamp": "2026-07-17T14:30:00.000Z"
   * }
   * 
   * Success Response (201):
   * {
   *   "success": true,
   *   "readingId": "6a5a40f1e7b0307577942940",
   *   "receivedAt": "2026-07-17T14:30:01.234Z"
   * }
   * 
   * Error Response (401):
   * {
   *   "statusCode": 401,
   *   "message": "Unauthorized"
   * }
   * 
   * Error Response (400):
   * {
   *   "statusCode": 400,
   *   "message": ["Voltage must be at least 0V", "Current is required"],
   *   "error": "Bad Request"
   * }
   */
  @Post('readings')
  @UseGuards(ApiKeyGuard) // Validate API key format and attach to request
  @HttpCode(HttpStatus.CREATED) // Return 201 Created (not 200 OK)
  @ApiOperation({
    summary: 'Submit energy reading from ESP32',
    description:
      'Endpoint for ESP32 devices to submit energy readings. ' +
      'Requires valid sensor API key in X-API-Key header. ' +
      'Returns lightweight confirmation response.',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Sensor API key for authentication',
    required: true,
    example: 'esp32_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @ApiResponse({
    status: 201,
    description: 'Reading received and stored successfully',
    type: CreateReadingResponseDto,
    schema: {
      example: {
        success: true,
        readingId: '6a5a40f1e7b0307577942940',
        receivedAt: '2026-07-17T14:30:01.234Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Validation error - invalid data format, out of range values, or timestamp issues',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Voltage must be at least 0V',
          'Current must not exceed 10A',
          'Timestamp cannot be in the future',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Invalid API key, sensor not found, or sensor not active',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async receiveReading(
    @ApiKey() apiKey: string, // Extracted by ApiKeyGuard and decorator
    @Body() readingDto: CreateReadingDto, // Validated by class-validator
  ): Promise<CreateReadingResponseDto> {
    // Delegate all business logic to service
    // Controller only handles HTTP concerns
    return this.iotService.receiveReading(apiKey, readingDto);
  }

  /**
   * Get Latest Reading for Sensor
   * 
   * Admin endpoint to get the most recent reading for a sensor.
   * 
   * @param sensorId - Sensor ID
   * @returns Latest reading with calculated fields
   */
  @Get('readings/latest/:sensorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get latest reading for a sensor',
    description: 'Returns the most recent reading for the specified sensor.',
  })
  @ApiParam({
    name: 'sensorId',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '6a5a35213fe6213bf029d100',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest reading retrieved successfully',
  })
  async getLatestReading(@Param('sensorId') sensorId: string) {
    return this.iotService.getLatestReading(sensorId);
  }

  /**
   * Get Latest Readings for All Sensors
   * 
   * Admin endpoint to get the most recent reading for each sensor.
   * 
   * @returns Array of latest readings
   */
  @Get('readings/latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get latest readings for all sensors',
    description:
      'Returns the most recent reading for each sensor in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest readings retrieved successfully',
  })
  async getLatestReadings() {
    return this.iotService.getLatestReadings();
  }

  /**
   * Get Reading History
   * 
   * Admin endpoint to get paginated reading history for a sensor.
   * 
   * @param sensorId - Sensor ID
   * @param query - Query parameters (pagination, filters)
   * @returns Paginated readings with metadata
   */
  @Get('readings/history/:sensorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get reading history for a sensor',
    description:
      'Returns paginated reading history with optional date range and source filtering.',
  })
  @ApiParam({
    name: 'sensorId',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '6a5a35213fe6213bf029d100',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO 8601)',
    example: '2026-07-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO 8601)',
    example: '2026-07-17T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    description: 'Filter by source (hardware or mock)',
    enum: ['hardware', 'mock'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Reading history retrieved successfully',
    type: PaginatedReadingsResponseDto,
  })
  async getReadingHistory(
    @Param('sensorId') sensorId: string,
    @Query() query: ReadingQueryDto,
  ): Promise<PaginatedReadingsResponseDto> {
    return this.iotService.getReadingHistory(sensorId, query);
  }

  /**
   * Get Reading Statistics
   * 
   * Admin endpoint to get aggregated statistics for sensor readings.
   * 
   * @param sensorId - Sensor ID
   * @param query - Query parameters (date range, source)
   * @returns Aggregated statistics
   */
  @Get('readings/statistics/:sensorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get reading statistics for a sensor',
    description:
      'Returns aggregated statistics (min, max, avg) for sensor readings.',
  })
  @ApiParam({
    name: 'sensorId',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '6a5a35213fe6213bf029d100',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO 8601)',
    example: '2026-07-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO 8601)',
    example: '2026-07-17T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    description: 'Filter by source (hardware or mock)',
    enum: ['hardware', 'mock'],
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: ReadingStatisticsResponseDto,
  })
  async getReadingStatistics(
    @Param('sensorId') sensorId: string,
    @Query() query: StatisticsQueryDto,
  ): Promise<ReadingStatisticsResponseDto> {
    return this.iotService.getReadingStatistics(sensorId, query);
  }

  /**
   * Future Endpoints (Not Implemented Yet)
   * 
   * These endpoints may be added in future phases:
   * 
   * 1. GET /api/iot/readings/recent
   *    - Get recent readings for dashboard
   *    - Requires admin JWT authentication
   * 
   * 2. GET /api/iot/readings/sensor/:sensorId
   *    - Get readings for specific sensor
   *    - Requires admin JWT authentication
   * 
   * 3. GET /api/iot/health
   *    - Check IoT module health
   *    - Public endpoint
   * 
   * 4. POST /api/iot/batch
   *    - Submit multiple readings at once
   *    - For ESP32 offline buffer
   * 
   * Note: These are admin or utility endpoints, not ESP32 endpoints.
   */
}
