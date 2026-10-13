import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for chat response
 *
 * Requirements: 5.7
 */
export class ChatResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'The bot response text',
    example:
      '📊 Current system status: Online. Energy generated today: 0.145 kWh',
  })
  response: string;

  @ApiProperty({
    description: 'Session ID for maintaining conversation context',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Suggested follow-up questions or commands',
    example: ['today', 'energy', 'help'],
    type: [String],
  })
  suggestions?: string[];

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-01-01T12:00:00.000Z',
  })
  timestamp: string;
}
