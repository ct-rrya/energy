import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

/**
 * Create Reference Config DTO
 *
 * Data Transfer Object for creating or updating the system diagnostic reference configuration.
 *
 * Validation:
 * - appliedWeightKg: 0.1 to 500 kg (physical weight limits)
 * - expectedEnergyWh: 0.001 to 100 Wh (energy output range)
 * - tolerancePercent: 0 to 50% (acceptable variance)
 *
 * Usage:
 * POST /api/diagnostics/reference
 * {
 *   "appliedWeightKg": 70,
 *   "expectedEnergyWh": 2.5,
 *   "tolerancePercent": 10
 * }
 *
 * Note: This configures the reference baseline for diagnostic tests.
 * Only one configuration exists at any time (singleton pattern).
 */
export class CreateReferenceConfigDto {
  @ApiProperty({
    description: 'Applied weight during reference test (kg)',
    example: 70,
    minimum: 0.1,
    maximum: 500,
  })
  @IsNumber({}, { message: 'Applied weight must be a number' })
  @Min(0.1, { message: 'Applied weight must be at least 0.1 kg' })
  @Max(500, { message: 'Applied weight must not exceed 500 kg' })
  appliedWeightKg: number;

  @ApiProperty({
    description: 'Expected energy output for reference test (Wh)',
    example: 2.5,
    minimum: 0.001,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Expected energy must be a number' })
  @Min(0.001, { message: 'Expected energy must be at least 0.001 Wh' })
  @Max(100, { message: 'Expected energy must not exceed 100 Wh' })
  expectedEnergyWh: number;

  @ApiProperty({
    description: 'Acceptable tolerance percentage for test results',
    example: 10,
    minimum: 0,
    maximum: 50,
  })
  @IsNumber({}, { message: 'Tolerance must be a number' })
  @Min(0, { message: 'Tolerance must be at least 0%' })
  @Max(50, { message: 'Tolerance must not exceed 50%' })
  tolerancePercent: number;
}
