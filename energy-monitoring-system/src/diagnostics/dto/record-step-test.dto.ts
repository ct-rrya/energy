import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DiagnosticResultStatus } from '../schemas/diagnostic-test.schema';

/**
 * Record Step Test DTO
 *
 * Request payload for testing a single physical footstep on the tile.
 */
export class RecordStepTestDto {
  @ApiProperty({
    description: 'Measured energy from footstep on the tile (mWh)',
    example: 0.00418,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Actual step energy must be a number' })
  @Min(0, { message: 'Actual step energy must be a positive number' })
  actualStepEnergyMWh: number;

  @ApiPropertyOptional({
    description: 'Optional notes about footstep test conditions',
    example: 'Manual single-step verification',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}

/**
 * Step Test Response DTO
 *
 * Detailed visual comparison result for the admin test mode.
 */
export class StepTestResponseDto {
  @ApiProperty({
    description: 'Diagnostic test ID',
    example: '60d0fe4f5311236168a109ca',
  })
  id: string;

  @ApiProperty({
    description: 'Test timestamp',
    example: '2026-10-16T14:30:00.000Z',
  })
  testDate: Date;

  @ApiProperty({
    description: 'Admin user who initiated the test',
    example: 'admin@ecostep.com',
  })
  performedBy: string;

  @ApiProperty({
    description: 'Your step energy output (mWh)',
    example: 0.00418,
  })
  actualEnergyMWh: number;

  @ApiProperty({
    description: 'Expected normal step energy baseline (mWh)',
    example: 0.0051,
  })
  expectedEnergyMWh: number;

  @ApiProperty({
    description: 'Deviation percentage from expected (e.g., -18.0%)',
    example: -18.0,
  })
  deviationPercentage: number;

  @ApiProperty({
    description: 'Performance percentage relative to baseline (e.g., 82.0%)',
    example: 81.96,
  })
  performancePercentage: number;

  @ApiProperty({
    description: 'Minimum acceptable threshold (mWh)',
    example: 0.00346,
  })
  minAcceptableMWh: number;

  @ApiProperty({
    description: 'Maximum acceptable threshold (mWh)',
    example: 0.00674,
  })
  maxAcceptableMWh: number;

  @ApiProperty({
    description: 'Result classification status',
    enum: DiagnosticResultStatus,
    example: DiagnosticResultStatus.WITHIN_RANGE,
  })
  result: DiagnosticResultStatus;

  @ApiProperty({
    description: 'Human-readable status summary',
    example: 'Tile operating normally ✅',
  })
  statusMessage: string;

  @ApiPropertyOptional({
    description: 'Optional test notes',
    example: 'Manual single-step verification',
  })
  notes?: string;
}
