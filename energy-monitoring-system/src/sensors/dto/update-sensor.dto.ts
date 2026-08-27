import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { SensorStatus } from '../schemas/sensor.schema';
import type { SensorMetadata } from '../schemas/sensor.schema';

/**
 * Update Sensor DTO
 * 
 * Validates the request body for updating an existing sensor.
 * 
 * Validation Rules:
 * - All fields are optional (partial update)
 * - name: 3-100 characters if provided
 * - location: 3-200 characters if provided
 * - status: Must be valid enum value
 * - metadata: Flexible object
 * 
 * Notes:
 * - API key cannot be updated directly (use regenerate endpoint)
 * - isActive cannot be updated directly (use delete endpoint)
 * - lastSeenAt cannot be updated (managed by IoT module)
 * 
 * Usage:
 * PATCH /api/sensors/:id
 * Body: UpdateSensorDto (any combination of fields)
 */
export class UpdateSensorDto {
  @ApiPropertyOptional({
    description: 'Human-readable name for the sensor',
    example: 'Main Entrance Sensor - Updated',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Sensor name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Sensor name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Physical location where the sensor is installed',
    example: 'Building A - Main Entrance - North Side',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Location must be at least 3 characters long' })
  @MaxLength(200, { message: 'Location must not exceed 200 characters' })
  location?: string;

  @ApiPropertyOptional({
    description: 'Operational status of the sensor',
    enum: SensorStatus,
    example: SensorStatus.MAINTENANCE,
  })
  @IsOptional()
  @IsEnum(SensorStatus, {
    message: 'Status must be one of: active, inactive, maintenance',
  })
  status?: SensorStatus;

  @ApiPropertyOptional({
    description: 'Additional metadata about the sensor hardware and firmware',
    example: {
      hardwareVersion: 'v1.0',
      firmwareVersion: 'v2.2.0',
      model: 'ESP32-DevKitC',
      notes: 'Firmware updated on 2026-07-17',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: SensorMetadata;
}
