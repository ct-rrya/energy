import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FeedbackStatus } from '../schemas/feedback.schema';

export class UpdateFeedbackDto {
  @ApiPropertyOptional({
    description: 'Resolution status (open or resolved)',
    enum: FeedbackStatus,
    example: FeedbackStatus.RESOLVED,
  })
  @IsOptional()
  @IsEnum(FeedbackStatus, { message: 'Status must be open or resolved' })
  status?: FeedbackStatus;

  @ApiPropertyOptional({
    description: 'Official administrator reply displayed publicly on the feedback card',
    maxLength: 1000,
    example: 'Thank you for reporting this! We inspected the tile and resolved the issue.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Admin reply must not exceed 1000 characters' })
  adminReply?: string;
}

export class UpvoteFeedbackDto {
  @ApiPropertyOptional({
    description: 'Anonymous client token used to toggle upvotes cleanly',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  voterId?: string;
}
