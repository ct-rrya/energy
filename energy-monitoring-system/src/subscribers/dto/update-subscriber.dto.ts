import {
  IsOptional,
  IsArray,
  IsString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Subscriber DTO
 *
 * Request body for updating subscriber information.
 */
export class UpdateSubscriberDto {
  @ApiPropertyOptional({
    description: 'Subscriber status',
    enum: ['active', 'inactive', 'blocked'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'])
  status?: 'active' | 'inactive' | 'blocked';

  @ApiPropertyOptional({
    description: 'Tags for segmentation',
    example: ['vip', 'beta-tester'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Notification preferences',
    example: {
      dailyReport: true,
      weeklyReport: true,
      alerts: true,
      energyMilestones: true,
      batteryAlerts: true,
      sensorEvents: false,
      systemAlerts: true,
    },
  })
  @IsOptional()
  @IsObject()
  notificationPreferences?: {
    dailyReport?: boolean;
    weeklyReport?: boolean;
    alerts?: boolean;
    energyMilestones?: boolean;
    batteryAlerts?: boolean;
    sensorEvents?: boolean;
    systemAlerts?: boolean;
  };

  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}
