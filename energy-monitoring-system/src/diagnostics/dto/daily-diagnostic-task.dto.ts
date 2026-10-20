import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DailyDiagnosticTaskStatus,
} from '../schemas/daily-diagnostic-task.schema';
import { DiagnosticResultStatus } from '../schemas/diagnostic-test.schema';

export class ActiveDiagnosticSessionDto {
  @ApiProperty({ description: 'Admin email locking the session' })
  adminEmail: string;

  @ApiProperty({ description: 'Admin name locking the session' })
  adminName: string;

  @ApiProperty({ description: 'Lock start time' })
  startedAt: Date;

  @ApiProperty({ description: 'Lock expiration time' })
  expiresAt: Date;
}

export class DailyDiagnosticTaskResponseDto {
  @ApiProperty({ description: 'Task calendar date (YYYY-MM-DD)', example: '2026-10-17' })
  taskDate: string;

  @ApiProperty({
    description: 'Current task status',
    enum: DailyDiagnosticTaskStatus,
    example: DailyDiagnosticTaskStatus.PENDING,
  })
  status: DailyDiagnosticTaskStatus;

  @ApiPropertyOptional({
    description: 'Active diagnostic session if an admin is currently testing',
    type: ActiveDiagnosticSessionDto,
  })
  activeSession?: ActiveDiagnosticSessionDto;

  @ApiPropertyOptional({ description: 'Admin email who performed test' })
  performedBy?: string;

  @ApiPropertyOptional({ description: 'Admin display name who performed test' })
  performedByName?: string;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Measured step energy (mWh)', example: 0.00418 })
  actualEnergyMWh?: number;

  @ApiPropertyOptional({ description: 'Expected step energy baseline (mWh)', example: 0.0051 })
  expectedEnergyMWh?: number;

  @ApiPropertyOptional({ description: 'Deviation percentage', example: -18.0 })
  deviationPercentage?: number;

  @ApiPropertyOptional({ description: 'Performance percentage', example: 82.0 })
  performancePercentage?: number;

  @ApiPropertyOptional({
    description: 'Result classification status',
    enum: DiagnosticResultStatus,
  })
  result?: DiagnosticResultStatus;

  @ApiPropertyOptional({ description: 'Status message', example: 'Tile operating normally ✅' })
  statusMessage?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Linked diagnostic test ID' })
  diagnosticTestId?: string;

  @ApiPropertyOptional({ description: 'Last reminder timestamp' })
  reminderSentAt?: Date;
}

export class CompleteDailyDiagnosticDto {
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
    example: 'Daily morning tile step verification',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}
