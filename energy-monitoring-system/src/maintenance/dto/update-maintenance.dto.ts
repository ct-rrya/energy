import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateMaintenanceDto {
  @ApiProperty({
    description: 'Whether Maintenance Mode & Hardware Pause is active',
    example: true,
  })
  @IsBoolean({ message: 'enabled must be a boolean value' })
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Custom public message explaining the maintenance window',
    maxLength: 400,
    example: 'Scheduled floor mat wiring inspection and calibration in progress.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400, { message: 'Message must not exceed 400 characters' })
  message?: string;

  @ApiPropertyOptional({
    description: 'Optional ISO-8601 estimated completion / resume timestamp (null to clear)',
    nullable: true,
    example: '2026-11-27T15:00:00.000Z',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsISO8601({}, { message: 'estimatedResumeAt must be a valid ISO date string' })
  estimatedResumeAt?: string | null;
}
