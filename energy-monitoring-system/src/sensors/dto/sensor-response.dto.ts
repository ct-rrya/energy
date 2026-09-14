import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SensorStatus } from '../schemas/sensor.schema';
import type { SensorMetadata } from '../schemas/sensor.schema';

/**
 * Sensor Response DTO
 *
 * Defines the structure of sensor data returned in API responses.
 *
 * Security:
 * - API key is included ONLY in create response
 * - API key is excluded from list/get responses (for security)
 * - Use SensorWithApiKeyResponseDto for create response
 *
 * Usage:
 * - GET /api/sensors (list)
 * - GET /api/sensors/:id (details)
 * - PATCH /api/sensors/:id (update)
 */
export class SensorResponseDto {
  @ApiProperty({
    description: 'Unique sensor identifier',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  id: string;

  @ApiProperty({
    description: 'Human-readable name for the sensor',
    example: 'Main Entrance Sensor',
  })
  name: string;

  @ApiProperty({
    description: 'Physical location where the sensor is installed',
    example: 'Building A - Main Entrance',
  })
  location: string;

  @ApiProperty({
    description: 'Operational status of the sensor',
    enum: SensorStatus,
    example: SensorStatus.ACTIVE,
  })
  status: SensorStatus;

  @ApiProperty({
    description: 'When the sensor was physically installed',
    example: '2026-07-17T10:00:00.000Z',
  })
  installationDate: Date;

  @ApiPropertyOptional({
    description: 'Last time the sensor sent data (updated by IoT module)',
    example: '2026-07-17T14:30:00.000Z',
    nullable: true,
  })
  lastSeenAt: Date | null;

  @ApiPropertyOptional({
    description: 'Additional metadata about the sensor',
    example: {
      hardwareVersion: 'v1.0',
      firmwareVersion: 'v2.1.0',
      model: 'ESP32-DevKitC',
    },
  })
  metadata: SensorMetadata;

  @ApiProperty({
    description: 'Whether the sensor is active (soft delete flag)',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'When the sensor was registered in the system',
    example: '2026-07-17T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the sensor was last updated',
    example: '2026-07-17T14:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * Sensor Response with API Key DTO
 *
 * Extended response that includes the API key.
 *
 * Security:
 * - ONLY returned when creating a new sensor
 * - NOT returned in list or get endpoints
 * - Client must save API key during creation
 * - API key cannot be retrieved later (security)
 *
 * Usage:
 * - POST /api/sensors (create) - Returns this
 * - POST /api/sensors/:id/regenerate-key - Returns this
 *
 * Important:
 * Administrator should copy API key and configure ESP32 immediately.
 * The API key will not be visible again after creation.
 */
export class SensorWithApiKeyResponseDto extends SensorResponseDto {
  @ApiProperty({
    description:
      'API key for ESP32 authentication (ONLY shown during creation)',
    example: 'esp32_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  apiKey: string;
}
