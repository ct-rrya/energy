import { IsString, IsOptional, IsArray, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Broadcast Message DTO
 * 
 * Request body for sending broadcast messages to subscribers.
 */
export class BroadcastMessageDto {
  @ApiProperty({
    description: 'Message text to broadcast',
    example: '🎉 New feature: Real-time battery monitoring now available!',
    maxLength: 640,
  })
  @IsString()
  @MaxLength(640, { message: 'Message must not exceed 640 characters' })
  message: string;

  @ApiPropertyOptional({
    description: 'Target subscribers by tags',
    example: ['vip', 'beta'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetTags?: string[];

  @ApiPropertyOptional({
    description: 'Send to all subscribers (ignores tags)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  targetAll?: boolean;
}

/**
 * Broadcast Result DTO
 * 
 * Response after sending broadcast.
 */
export class BroadcastResultDto {
  broadcastId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'completed' | 'in_progress' | 'failed';
}
