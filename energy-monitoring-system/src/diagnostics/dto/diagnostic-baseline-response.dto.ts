import { ApiProperty } from '@nestjs/swagger';

/**
 * Diagnostic Baseline Response DTO
 *
 * Represents the statistical baseline calculated automatically
 * from the last 30 days of historical energy readings.
 */
export class DiagnosticBaselineResponseDto {
  @ApiProperty({
    description: 'Number of historical days analyzed',
    example: 30,
  })
  daysAnalyzed: number;

  @ApiProperty({
    description: 'Total number of steps analyzed in the period',
    example: 1547,
  })
  totalSteps: number;

  @ApiProperty({
    description: 'Total energy harvested in the period (mWh)',
    example: 7.89,
  })
  totalEnergyMWh: number;

  @ApiProperty({
    description: 'Normal/Expected baseline energy per step (mWh)',
    example: 0.0051,
  })
  normalStepMWh: number;

  @ApiProperty({
    description: 'Acceptable tolerance percentage (±%)',
    example: 34,
  })
  tolerancePercent: number;

  @ApiProperty({
    description: 'Minimum acceptable energy per step (mWh)',
    example: 0.00346,
  })
  minAcceptableMWh: number;

  @ApiProperty({
    description: 'Maximum acceptable energy per step (mWh)',
    example: 0.00674,
  })
  maxAcceptableMWh: number;

  @ApiProperty({
    description: 'Number of individual readings aggregated',
    example: 120,
  })
  readingCount: number;
}
