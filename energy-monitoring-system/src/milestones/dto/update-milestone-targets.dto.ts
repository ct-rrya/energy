import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Validates that a numeric value has at most 6 decimal places
 * (safely avoids JS exponential notation string split issues).
 */
@ValidatorConstraint({ name: 'isMax6Decimals', async: false })
export class IsMax6DecimalsConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return false;
    const str = value.toFixed(10);
    const parts = str.split('.');
    if (!parts[1]) return true;
    return parts[1].slice(6).replace(/0+$/, '').length === 0;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a number with at most 6 decimal places`;
  }
}

/**
 * WeeklyTargetsDto
 * Targets for individual weeks of a calendar month.
 */
export class WeeklyTargetsDto {
  @ApiProperty({ description: 'Target for Week 1 (Days 1–7) in mWh', required: false, example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'week1MWh must be a valid number' })
  @Min(0.000001, { message: 'week1MWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  week1MWh?: number;

  @ApiProperty({ description: 'Target for Week 2 (Days 8–14) in mWh', required: false, example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'week2MWh must be a valid number' })
  @Min(0.000001, { message: 'week2MWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  week2MWh?: number;

  @ApiProperty({ description: 'Target for Week 3 (Days 15–21) in mWh', required: false, example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'week3MWh must be a valid number' })
  @Min(0.000001, { message: 'week3MWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  week3MWh?: number;

  @ApiProperty({ description: 'Target for Week 4 (Days 22–28) in mWh', required: false, example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'week4MWh must be a valid number' })
  @Min(0.000001, { message: 'week4MWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  week4MWh?: number;

  @ApiProperty({ description: 'Target for Week 5 (Days 29 through end of month) in mWh', required: false, example: 2500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'week5MWh must be a valid number' })
  @Min(0.000001, { message: 'week5MWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  week5MWh?: number;

  @ApiProperty({ description: 'Target for Week 6 (if month spans 6 calendar rows) in mWh', required: false, example: 2500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'week6MWh must be a valid number' })
  @Min(0.000001, { message: 'week6MWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  week6MWh?: number;
}

/**
 * UpdateMilestoneTargetsDto
 *
 * Supports monthly and weekly targets by calendar month (e.g. month: "2026-10", "2026-11").
 * Preserves backwards compatibility with legacy rolling fields.
 */
export class UpdateMilestoneTargetsDto {
  @ApiProperty({
    description: 'Target month in YYYY-MM format (e.g. "2026-10", "2026-11"). If omitted, applies to current month.',
    example: '2026-11',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format (e.g. 2026-11)' })
  month?: string;

  @ApiProperty({
    description: 'Target for the entire calendar month in milliwatt-hours (mWh)',
    example: 25000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'monthlyTargetMWh must be a valid number' })
  @Min(0.000001, { message: 'monthlyTargetMWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  monthlyTargetMWh?: number;

  @ApiProperty({
    description: 'Weekly energy target in milliwatt-hours (mWh) that automatically applies to all weeks in the selected month',
    example: 5000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'weeklyTargetMWh must be a valid number' })
  @Min(0.000001, { message: 'weeklyTargetMWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  weeklyTargetMWh?: number;

  @ApiProperty({
    description: 'Weekly targets for individual weeks of the month',
    type: WeeklyTargetsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyTargetsDto)
  weeklyTargetsMWh?: WeeklyTargetsDto;

  // Legacy fields preserved for backwards compatibility
  @ApiProperty({
    description: 'Energy target for 1 Week in milliwatt-hours (mWh)',
    example: 0.09,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'target1WeekMWh must be a valid number' })
  @Min(0.000001, { message: 'target1WeekMWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  target1WeekMWh?: number;

  @ApiProperty({
    description: 'Energy target for 1 Month in milliwatt-hours (mWh)',
    example: 0.005,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'target1MonthMWh must be a valid number' })
  @Min(0.000001, { message: 'target1MonthMWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  target1MonthMWh?: number;

  @ApiProperty({
    description: 'Energy target for 3 Months in milliwatt-hours (mWh)',
    example: 0.0001,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'target3MonthsMWh must be a valid number' })
  @Min(0.000001, { message: 'target3MonthsMWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  target3MonthsMWh?: number;

  @ApiProperty({
    description: 'Energy target for 6 Months in milliwatt-hours (mWh)',
    example: 1.25,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'target6MonthsMWh must be a valid number' })
  @Min(0.000001, { message: 'target6MonthsMWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  target6MonthsMWh?: number;

  @ApiProperty({
    description: 'Energy target for 1 Year in milliwatt-hours (mWh)',
    example: 5000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'target1YearMWh must be a valid number' })
  @Min(0.000001, { message: 'target1YearMWh must be at least 0.000001 mWh' })
  @Validate(IsMax6DecimalsConstraint)
  target1YearMWh?: number;

  // Optional Wh aliases for backwards compatibility
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.000000001)
  target1WeekWh?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.000000001)
  target1MonthWh?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.000000001)
  target3MonthsWh?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.000000001)
  target6MonthsWh?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.000000001)
  target1YearWh?: number;
}

