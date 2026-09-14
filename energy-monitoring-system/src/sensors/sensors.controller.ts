import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SensorsService } from './sensors.service';
import {
  CreateSensorDto,
  UpdateSensorDto,
  SensorResponseDto,
  SensorWithApiKeyResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Sensors Controller
 *
 * Handles HTTP requests for sensor management.
 *
 * Endpoints:
 * - POST   /api/sensors              Create sensor
 * - GET    /api/sensors              List all sensors
 * - GET    /api/sensors/:id          Get sensor details
 * - PATCH  /api/sensors/:id          Update sensor
 * - DELETE /api/sensors/:id          Delete sensor
 * - POST   /api/sensors/:id/regenerate-key   Regenerate API key
 *
 * Authentication:
 * - All endpoints require JWT authentication (admin only)
 * - Protected by JwtAuthGuard
 *
 * Authorization:
 * - Only administrators can manage sensors
 * - ESP32 devices cannot access these endpoints
 * - ESP32 uses separate IoT endpoints (Phase 5)
 */
@ApiTags('Sensors')
@Controller('sensors')
@UseGuards(JwtAuthGuard) // All endpoints require authentication
@ApiBearerAuth() // Swagger: Show "Authorize" button
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  /**
   * Create New Sensor
   *
   * Registers a new sensor device and generates API key.
   *
   * @param createSensorDto - Sensor creation data
   * @returns Created sensor with API key
   *
   * Important:
   * - API key is ONLY returned in this response
   * - Administrator must save API key immediately
   * - API key cannot be retrieved later (security)
   * - Configure ESP32 with the returned API key
   *
   * Process:
   * 1. Admin submits sensor details
   * 2. System generates unique API key
   * 3. Sensor is saved in database
   * 4. API key is returned (one-time only)
   * 5. Admin configures ESP32 with API key
   *
   * Example Request:
   * POST /api/sensors
   * {
   *   "name": "Main Entrance Sensor",
   *   "location": "Building A - Main Entrance",
   *   "status": "active",
   *   "metadata": {
   *     "hardwareVersion": "v1.0",
   *     "firmwareVersion": "v2.1.0"
   *   }
   * }
   *
   * Example Response:
   * {
   *   "success": true,
   *   "message": "Sensor created successfully",
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "name": "Main Entrance Sensor",
   *     "apiKey": "esp32_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
   *     ...
   *   }
   * }
   */
  @Post()
  @ApiOperation({
    summary: 'Create new sensor',
    description:
      'Registers a new sensor device and generates a unique API key for ESP32 authentication. ' +
      'The API key is only returned in this response and cannot be retrieved later.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sensor created successfully with API key',
    type: SensorWithApiKeyResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - invalid sensor data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async create(
    @Body() createSensorDto: CreateSensorDto,
  ): Promise<SensorWithApiKeyResponseDto> {
    const sensor = await this.sensorsService.create(createSensorDto);
    return sensor.toJSON() as SensorWithApiKeyResponseDto;
  }

  /**
   * List All Sensors
   *
   * Retrieves all active sensors.
   *
   * @returns Array of sensors (excludes API keys)
   *
   * Security:
   * - API keys are excluded from response
   * - Only active sensors returned (isActive = true)
   *
   * Sorting:
   * - Newest sensors first (by createdAt)
   *
   * Future Enhancement:
   * - Add pagination
   * - Add filtering by status
   * - Add search by name/location
   *
   * Example Response:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *       "name": "Main Entrance Sensor",
   *       "location": "Building A",
   *       "status": "active",
   *       "lastSeenAt": "2026-07-17T14:30:00.000Z",
   *       ...
   *     }
   *   ]
   * }
   */
  @Get()
  @ApiOperation({
    summary: 'List all sensors',
    description:
      'Retrieves all active sensors. API keys are excluded for security. ' +
      'Returns sensors sorted by creation date (newest first).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sensors retrieved successfully',
    type: [SensorResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async findAll(): Promise<SensorResponseDto[]> {
    const sensors = await this.sensorsService.findAll();
    return sensors.map((sensor) => sensor.toJSON() as SensorResponseDto);
  }

  /**
   * Get Sensor Details
   *
   * Retrieves detailed information about a specific sensor.
   *
   * @param id - Sensor ID (MongoDB ObjectId)
   * @returns Sensor details (excludes API key)
   *
   * Security:
   * - API key is excluded from response
   * - Only returns active sensors
   *
   * Example Response:
   * {
   *   "success": true,
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "name": "Main Entrance Sensor",
   *     "location": "Building A - Main Entrance",
   *     "status": "active",
   *     "installationDate": "2026-07-17T10:00:00.000Z",
   *     "lastSeenAt": "2026-07-17T14:30:00.000Z",
   *     "metadata": { ... },
   *     "createdAt": "2026-07-17T10:00:00.000Z",
   *     "updatedAt": "2026-07-17T14:00:00.000Z"
   *   }
   * }
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get sensor details',
    description:
      'Retrieves detailed information about a specific sensor. ' +
      'API key is excluded for security.',
  })
  @ApiParam({
    name: 'id',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: 'Sensor details retrieved successfully',
    type: SensorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sensor not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid sensor ID format',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async findOne(@Param('id') id: string): Promise<SensorResponseDto> {
    const sensor = await this.sensorsService.findOne(id);
    return sensor.toJSON() as SensorResponseDto;
  }

  /**
   * Update Sensor
   *
   * Updates sensor information (name, location, status, metadata).
   *
   * @param id - Sensor ID
   * @param updateSensorDto - Fields to update
   * @returns Updated sensor (excludes API key)
   *
   * Restrictions:
   * - Cannot update API key (use regenerate-key endpoint)
   * - All fields are optional (partial update)
   *
   * Example Request:
   * PATCH /api/sensors/:id
   * {
   *   "status": "maintenance",
   *   "metadata": {
   *     "notes": "Under maintenance - firmware update"
   *   }
   * }
   *
   * Example Response:
   * {
   *   "success": true,
   *   "message": "Sensor updated successfully",
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "status": "maintenance",
   *     ...
   *   }
   * }
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update sensor',
    description:
      'Updates sensor information. All fields are optional (partial update). ' +
      'Cannot update API key - use regenerate-key endpoint instead.',
  })
  @ApiParam({
    name: 'id',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: 'Sensor updated successfully',
    type: SensorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sensor not found',
  })
  @ApiBadRequestResponse({
    description: 'Validation error or invalid sensor ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSensorDto: UpdateSensorDto,
  ): Promise<SensorResponseDto> {
    const sensor = await this.sensorsService.update(id, updateSensorDto);
    return sensor.toJSON() as SensorResponseDto;
  }

  /**
   * Delete Sensor
   *
   * Soft deletes a sensor (marks as inactive).
   *
   * @param id - Sensor ID
   * @returns Deleted sensor
   *
   * Implementation:
   * - Soft delete: Sets isActive = false
   * - Sensor remains in database
   * - Historical readings preserved
   * - Cannot send new data (API key invalid)
   *
   * Example Response:
   * {
   *   "success": true,
   *   "message": "Sensor deleted successfully",
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "isActive": false,
   *     ...
   *   }
   * }
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK) // Return 200 instead of 204
  @ApiOperation({
    summary: 'Delete sensor',
    description:
      'Soft deletes a sensor by marking it as inactive. ' +
      'The sensor and its historical data are preserved in the database.',
  })
  @ApiParam({
    name: 'id',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: 'Sensor deleted successfully',
    type: SensorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sensor not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid sensor ID format',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async remove(@Param('id') id: string): Promise<SensorResponseDto> {
    const sensor = await this.sensorsService.remove(id);
    return sensor.toJSON() as SensorResponseDto;
  }

  /**
   * Regenerate API Key
   *
   * Generates a new API key for a sensor.
   * Used when API key is compromised or lost.
   *
   * @param id - Sensor ID
   * @returns Sensor with new API key
   *
   * Important:
   * - Old API key becomes invalid immediately
   * - ESP32 must be reconfigured with new key
   * - New key is ONLY shown in this response
   * - Cannot retrieve key later
   *
   * Use Cases:
   * - API key compromised or exposed
   * - API key lost (not documented)
   * - ESP32 replacement
   * - Security rotation
   *
   * Example Request:
   * POST /api/sensors/:id/regenerate-key
   *
   * Example Response:
   * {
   *   "success": true,
   *   "message": "API key regenerated successfully",
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "apiKey": "esp32_9f8e7d6c5b4a3928176f5e4d3c2b1a09",
   *     ...
   *   }
   * }
   */
  @Post(':id/regenerate-key')
  @ApiOperation({
    summary: 'Regenerate sensor API key',
    description:
      'Generates a new API key for a sensor. The old key becomes invalid immediately. ' +
      'The new key is only returned in this response and cannot be retrieved later. ' +
      'ESP32 must be reconfigured with the new key.',
  })
  @ApiParam({
    name: 'id',
    description: 'Sensor ID (MongoDB ObjectId)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @ApiResponse({
    status: 200,
    description: 'API key regenerated successfully',
    type: SensorWithApiKeyResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sensor not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid sensor ID format',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  async regenerateApiKey(
    @Param('id') id: string,
  ): Promise<SensorWithApiKeyResponseDto> {
    const sensor = await this.sensorsService.regenerateApiKey(id);
    return sensor.toJSON() as SensorWithApiKeyResponseDto;
  }
}
