import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for sending a chat message
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'The chat message text',
    example: 'What is the current energy status?',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @MaxLength(2000, { message: 'Message too long (max 2000 characters)' })
  @Transform(({ value }) => value?.trim())
  message: string;

  @ApiPropertyOptional({
    description: 'Optional session ID for continuing a conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid session ID format' })
  sessionId?: string;
}
