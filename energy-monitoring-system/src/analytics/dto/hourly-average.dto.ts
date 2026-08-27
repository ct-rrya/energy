import { ApiProperty } from '@nestjs/swagger';

/**
 * Hourly Average DTO
 * 
 * Represents average metrics for a single hour of the day.
 * Used for daily pattern analysis (0-23 hours).
 */
export class HourlyAverageDto {
  @ApiProperty({
    description: 'Hour of day (0-23)',
    example: 14,
  })
  hour: number;

  @ApiProperty({
    description: 'Average power for this hour (W)',
    example: 12.5,
  })
  avgPower: number;

  @ApiProperty({
    description: 'Average voltage for this hour (V)',
    example: 5.2,
  })
  avgVoltage: number;

  @ApiProperty({
    description: 'Average current for this hour (A)',
    example: 2.4,
  })
  avgCurrent: number;

  @ApiProperty({
    description: 'Number of readings in this hour',
    example: 60,
  })
  readingCount: number;
}

/**
 * Hourly Averages Response DTO
 * 
 * Complete 24-hour pattern data.
 */
export class HourlyAveragesResponseDto {
  @ApiProperty({
    description: 'Date of analysis (YYYY-MM-DD)',
    example: '2026-07-17',
  })
  date: string;

  @ApiProperty({
    description: 'Hourly averages (0-23)',
    type: [HourlyAverageDto],
  })
  hourlyData: HourlyAverageDto[];

  @ApiProperty({
    description: 'Peak hour',
    example: 14,
  })
  peakHour: number;

  @ApiProperty({
    description: 'Peak hour average power (W)',
    example: 35.2,
  })
  peakHourPower: number;
}
