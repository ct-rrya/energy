import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsInt, Min, Max } from 'class-validator';

export class SubmitQuizDto {
  @ApiProperty({
    description: 'Array of chosen option indices for each question in order (0 to 3)',
    example: [1, 2, 1, 1, 2],
    type: [Number],
  })
  @IsArray({ message: 'Answers must be an array of option indices' })
  @ArrayMinSize(5, { message: 'Must provide answers for all 5 questions' })
  @ArrayMaxSize(5, { message: 'Must provide answers for all 5 questions' })
  @IsInt({ each: true, message: 'Each answer option index must be an integer' })
  @Min(0, { each: true, message: 'Option index cannot be negative' })
  @Max(3, { each: true, message: 'Option index cannot exceed available choices' })
  answers: number[];
}
