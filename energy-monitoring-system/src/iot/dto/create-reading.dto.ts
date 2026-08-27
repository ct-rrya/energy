import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ReadingSource } from '../schemas/energy-reading.schema';

/**
 * Create Reading DTO
 * 
 * Validates the request body from ESP32 devices when submitting readings.
 * 
 * Validation Rules:
 * - voltage: Required, 0-50V range
 * - current: Required, 0-10A range
 * - power: Required, 0-500W range
 * - batteryPercentage: Optional, 0-100% range (default: 100)
 * - temperature: Optional, -40 to 125°C range
 * - frequency: Optional, 0-1000Hz range
 * - timestamp: Required, valid ISO 8601 date string
 * - source: Optional, hardware or mock (default: hardware)
 * 
 * ESP32 Usage:
 * The ESP32 should send JSON in this exact format:
 * 
 * ```json
 * {
 *   "voltage": 5.2,
 *   "current": 0.15,
 *   "power": 0.78,
 *   "batteryPercentage": 85,
 *   "temperature": 25.5,
 *   "frequency": 55,
 *   "timestamp": "2026-07-17T14:30:00.000Z"
 * }
 * ```
 * 
 * Minimal Required Fields (for basic sensors):
 * 
 * ```json
 * {
 *   "voltage": 5.2,
 *   "current": 0.15,
 *   "power": 0.78,
 *   "timestamp": "2026-07-17T14:30:00.000Z"
 * }
 * ```
 * 
 * Why these ranges?
 * - Voltage: Piezoelectric sensors typically output 0-50V
 * - Current: ESP32 ADC can measure 0-10A safely
 * - Power: Calculated or measured, max 500W for safety
 * - Battery: Standard percentage 0-100%
 * - Temperature: Standard sensor range -40 to 125°C
 * - Frequency: Piezoelectric frequency range 0-1000Hz
 * 
 * Validation Layers:
 * 1. DTO (this class): Format and basic range validation
 * 2. Service: Business logic validation (timestamp not in future, etc.)
 * 3. Database: Schema constraints (min values)
 */
export class CreateReadingDto {
  @ApiProperty({
    description: 'Voltage measurement from piezoelectric sensor in volts',
    example: 5.2,
    minimum: 0,
    maximum: 50,
    type: Number,
  })
  @IsNumber({}, { message: 'Voltage must be a valid number' })
  @IsNotEmpty({ message: 'Voltage is required' })
  @Min(0, { message: 'Voltage must be at least 0V' })
  @Max(50, { message: 'Voltage must not exceed 50V' })
  voltage: number;

  @ApiProperty({
    description: 'Current measurement from sensor in amperes',
    example: 0.15,
    minimum: 0,
    maximum: 10,
    type: Number,
  })
  @IsNumber({}, { message: 'Current must be a valid number' })
  @IsNotEmpty({ message: 'Current is required' })
  @Min(0, { message: 'Current must be at least 0A' })
  @Max(10, { message: 'Current must not exceed 10A' })
  current: number;

  @ApiProperty({
    description: 'Instantaneous power in watts (can be calculated by ESP32)',
    example: 0.78,
    minimum: 0,
    maximum: 500,
    type: Number,
  })
  @IsNumber({}, { message: 'Power must be a valid number' })
  @IsNotEmpty({ message: 'Power is required' })
  @Min(0, { message: 'Power must be at least 0W' })
  @Max(500, { message: 'Power must not exceed 500W' })
  power: number;

  @ApiPropertyOptional({
    description: 'Battery charge level percentage (0-100%)',
    example: 85,
    minimum: 0,
    maximum: 100,
    type: Number,
    default: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Battery percentage must be a valid number' })
  @Min(0, { message: 'Battery percentage must be at least 0%' })
  @Max(100, { message: 'Battery percentage must not exceed 100%' })
  batteryPercentage?: number;

  @ApiPropertyOptional({
    description: 'Temperature reading from sensor environment in Celsius',
    example: 25.5,
    minimum: -40,
    maximum: 125,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Temperature must be a valid number' })
  @Min(-40, { message: 'Temperature must be at least -40°C' })
  @Max(125, { message: 'Temperature must not exceed 125°C' })
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Frequency measurement for piezoelectric sensors in Hz',
    example: 55,
    minimum: 0,
    maximum: 1000,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Frequency must be a valid number' })
  @Min(0, { message: 'Frequency must be at least 0Hz' })
  @Max(1000, { message: 'Frequency must not exceed 1000Hz' })
  frequency?: number;

  @ApiProperty({
    description:
      'Timestamp when the reading was taken on ESP32 (ISO 8601 UTC format)',
    example: '2026-07-17T14:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Timestamp must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Timestamp is required' })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Source of the reading: hardware (ESP32) or mock (testing)',
    example: ReadingSource.HARDWARE,
    enum: ReadingSource,
    default: ReadingSource.HARDWARE,
  })
  @IsOptional()
  @IsEnum(ReadingSource, { message: 'Source must be either "hardware" or "mock"' })
  source?: ReadingSource;
}
