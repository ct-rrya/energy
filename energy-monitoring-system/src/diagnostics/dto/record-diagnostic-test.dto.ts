import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Record Diagnostic Test DTO
 *
 * Data Transfer Object for recording diagnostic test results.
 *
 * Validation:
 * - actualEnergy: Required, must be positive number (Wh)
 * - notes: Optional, max 500 characters
 *
 * Usage:
 * POST /api/diagnostics/test
 * {
 *   "actualEnergy": 2.35,
 *   "notes": "Morning test, 70kg load, room temperature"
 * }
 *
 * The backend will:
 * - Calculate difference (actual - expected)
 * - Calculate performance percentage
 * - Determine result status (Within Range, Below Expected, Above Expected)
 * - Store the test with timestamp and user info
 */
export class RecordDiagnosticTestDto {
  @ApiProperty({
    description: 'Actual measured energy during diagnostic test (Wh)',
    example: 2.35,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Actual energy must be a number' })
  @Min(0, { message: 'Actual energy must be a positive number' })
  actualEnergy: number;

  @ApiPropertyOptional({
    description: 'Optional notes about test conditions or observations',
    example: 'Morning test, 70kg load, room temperature',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}
