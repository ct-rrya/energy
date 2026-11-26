import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FeedbackCategory } from '../schemas/feedback.schema';

export class CreateFeedbackDto {
  @ApiPropertyOptional({
    description: 'Short headline / main problem summary',
    example: 'Tile voltage drops when multiple people step quickly',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(160, { message: 'Title must not exceed 160 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Display name of the submitter (defaults to Anonymous)',
    example: 'EcoWalker-482',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'Name must not exceed 60 characters' })
  authorName?: string;

  @ApiProperty({
    description: 'Feedback category',
    enum: FeedbackCategory,
    example: FeedbackCategory.REVIEW,
  })
  @IsEnum(FeedbackCategory, {
    message: 'Category must be review, suggestion, issue, or general',
  })
  category: FeedbackCategory;

  @ApiPropertyOptional({
    description: 'Optional star rating from 1 to 5',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsOptional()
  @IsInt({ message: 'Rating must be a whole number from 1 to 5' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating?: number;

  @ApiProperty({
    description: 'Feedback message or full problem details',
    minLength: 3,
    maxLength: 2000,
    example: 'The EcoStep tile works smoothly and the live dashboard is easy to understand!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(3, { message: 'Message must be at least 3 characters' })
  @MaxLength(2000, { message: 'Message must not exceed 2000 characters' })
  message: string;
}
