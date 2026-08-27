import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

/**
 * Test Validation DTO
 * 
 * This DTO is used to verify that the global ValidationPipe is working correctly.
 * It tests various validation decorators and scenarios.
 * 
 * This endpoint should be removed before production deployment.
 */

export enum TestStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class TestValidationDto {
  @ApiProperty({
    description: 'Name must be a string between 3-50 characters',
    example: 'John Doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Valid email address',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Age must be a number between 0 and 150',
    example: 25,
    minimum: 0,
    maximum: 150,
  })
  @IsNumber()
  @Min(0)
  @Max(150)
  age: number;

  @ApiProperty({
    description: 'Status must be either active or inactive',
    enum: TestStatus,
    example: TestStatus.ACTIVE,
  })
  @IsEnum(TestStatus)
  status: TestStatus;

  @ApiProperty({
    description: 'Optional boolean field',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Optional notes field',
    example: 'Some additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Test Validation Response DTO
 */
export class TestValidationResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Validation passed! All fields are valid.',
  })
  message: string;

  @ApiProperty({
    description: 'The validated data that was received',
    type: TestValidationDto,
  })
  data: TestValidationDto;
}
