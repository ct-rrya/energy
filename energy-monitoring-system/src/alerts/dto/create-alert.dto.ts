import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertType, AlertSeverity } from '../schemas/alert.schema';

/**
 * Create Alert DTO
 *
 * Used internally by the system to create alerts.
 */
export class CreateAlertDto {
  @ApiProperty({
    description: 'Alert title',
    example: 'Battery Level Critical',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Alert description',
    example: 'Battery level has dropped below 10% on sensor ESP32-001',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Alert type',
    enum: AlertType,
    example: AlertType.BATTERY_CRITICAL,
  })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({
    description: 'Alert severity',
    enum: AlertSeverity,
    example: AlertSeverity.CRITICAL,
  })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({
    description: 'Source sensor ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  sensorId?: string;

  @ApiPropertyOptional({
    description: 'Source sensor name',
    example: 'ESP32-001',
  })
  @IsOptional()
  @IsString()
  sensorName?: string;

  @ApiPropertyOptional({
    description: 'Source sensor location',
    example: 'Solar Panel Array A',
  })
  @IsOptional()
  @IsString()
  sensorLocation?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      batteryLevel: 8,
      threshold: 10,
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
