import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { SensorStatus } from '../schemas/sensor.schema';
import type { SensorMetadata } from '../schemas/sensor.schema';

/**
 * Create Sensor DTO
 *
 * Validates the request body for creating a new sensor.
 *
 * Validation Rules:
 * - name: Required, 3-100 characters
 * - location: Required, 3-200 characters
 * - status: Optional, defaults to 'active'
 * - metadata: Optional, flexible object
 *
 * API Key Generation:
 * - API key is NOT provided by the client
 * - Generated server-side by the service
 * - Returned in the response
 *
 * Usage:
 * POST /api/sensors
 * Body: CreateSensorDto
 */
export class CreateSensorDto {
  @ApiProperty({
    description: 'Human-readable name for the sensor',
    example: 'Main Entrance Sensor',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Sensor name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Sensor name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Physical location where the sensor is installed',
    example: 'Building A - Main Entrance',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Location must be at least 3 characters long' })
  @MaxLength(200, { message: 'Location must not exceed 200 characters' })
  location: string;

  @ApiPropertyOptional({
    description: 'Operational status of the sensor',
    enum: SensorStatus,
    default: SensorStatus.ACTIVE,
    example: SensorStatus.ACTIVE,
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
      firmwareVersion: 'v2.1.0',
      model: 'ESP32-DevKitC',
      notes: 'Initial installation',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: SensorMetadata;
}
