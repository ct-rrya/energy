import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { CreateReadingDto } from './create-reading.dto';

/**
 * Create Piezo Reading DTO
 *
 * Extends CreateReadingDto with piezo-specific validation.
 * Capacitor voltage and step count are REQUIRED for piezo sensors.
 * 
 * This DTO is specifically for ESP32 piezoelectric footstep energy harvesting sensors.
 * Hardware: 10-15 piezo discs → LTC3588-1 → 2200µF 50V capacitor
 */
export class CreatePiezoReadingDto extends CreateReadingDto {
  @ApiProperty({
    description: 'Capacitor voltage (REQUIRED for piezo sensors) - from voltage divider measurement',
    example: 12.5,
    minimum: 0,
    maximum: 50,
    required: true,
  })
  @IsNotEmpty({ message: 'Capacitor voltage is required for piezo sensors' })
  @IsNumber({}, { message: 'Capacitor voltage must be a valid number' })
  @Min(0, { message: 'Capacitor voltage must be at least 0V' })
  @Max(50, { message: 'Capacitor voltage must not exceed 50V' })
  declare capacitorVoltage: number; // Override optional base property to required

  @ApiProperty({
    description: 'Cumulative step count (REQUIRED for piezo sensors) - total footsteps detected',
    example: 42,
    minimum: 0,
    required: true,
  })
  @IsNotEmpty({ message: 'Step count is required for piezo sensors' })
  @IsNumber({}, { message: 'Step count must be a valid number' })
  @Min(0, { message: 'Step count must be at least 0' })
  declare stepCount: number; // Override optional base property to required
}
