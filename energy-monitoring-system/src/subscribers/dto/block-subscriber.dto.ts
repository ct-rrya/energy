import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Block Subscriber DTO
 * 
 * Request body for blocking a subscriber.
 */
export class BlockSubscriberDto {
  @ApiPropertyOptional({
    description: 'Reason for blocking subscriber',
    example: 'Spam or abusive behavior',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
