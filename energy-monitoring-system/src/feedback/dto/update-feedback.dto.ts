import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
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

export class VoteFeedbackDto {
  @ApiProperty({
    description: 'Vote direction (up or down)',
    enum: ['up', 'down'],
    example: 'up',
  })
  @IsIn(['up', 'down'], { message: 'Vote direction must be up or down' })
  direction: 'up' | 'down';

  @ApiPropertyOptional({
    description: 'Anonymous browser visitor ID used to track vote state',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  voterId?: string;
}

export class CreateAnswerDto {
  @ApiProperty({
    description: 'Answer or comment body',
    minLength: 2,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Answer cannot be empty' })
  @MinLength(2, { message: 'Answer must be at least 2 characters' })
  @MaxLength(2000, { message: 'Answer must not exceed 2000 characters' })
  body: string;

  @ApiPropertyOptional({
    description: 'Display nickname of the answer author',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  authorName?: string;

  @ApiPropertyOptional({
    description: 'Optional parent answer/comment ID for threaded nested replies',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  parentAnswerId?: string;
}
