import { ApiProperty } from '@nestjs/swagger';

/**
 * Energy Statistics Response DTO
 *
 * Used for energy aggregation responses (today, date range).
 *
 * Contains:
 * - Total power across all readings
 * - Reading count
 * - Average, max, min power
 * - Estimated energy in kWh
 *
 * Used by:
 * - GET /api/energy/today
 * - GET /api/energy/range
 */
export class EnergyStatisticsDto {
  @ApiProperty({
    description: 'Total power sum across all readings (W)',
    example: 1250.75,
    type: Number,
  })
  totalPower: number;

  @ApiProperty({
    description: 'Number of readings',
    example: 145,
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Average power (W)',
    example: 8.63,
    type: Number,
  })
  avgPower: number;

  @ApiProperty({
    description: 'Maximum power reading (W)',
    example: 25.5,
    type: Number,
  })
  maxPower: number;

  @ApiProperty({
    description: 'Minimum power reading (W)',
    example: 0.5,
    type: Number,
  })
  minPower: number;

  @ApiProperty({
    description: 'Estimated energy consumption (kWh)',
    example: 0.145,
    type: Number,
  })
  estimatedEnergyKWh: number;
}

/**
 * Today Energy Response DTO
 *
 * Energy statistics for current day.
 *
 * Used by:
 * - GET /api/energy/today
 */
export class TodayEnergyResponseDto extends EnergyStatisticsDto {
  @ApiProperty({
    description: 'Date (YYYY-MM-DD)',
    example: '2026-07-17',
    type: String,
  })
  date: string;
}

/**
 * Today Energy by Sensor Response DTO
 *
 * Energy statistics for specific sensor today.
 *
 * Used by:
 * - GET /api/energy/sensor/:sensorId/today
 */
export class TodayEnergySensorResponseDto extends EnergyStatisticsDto {
  @ApiProperty({
    description: 'Sensor ID',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
    type: String,
  })
  sensorId: string;

  @ApiProperty({
    description: 'Date (YYYY-MM-DD)',
    example: '2026-07-17',
    type: String,
  })
  date: string;
}

/**
 * Energy Range Response DTO
 *
 * Energy statistics for date range.
 *
 * Used by:
 * - GET /api/energy/range
 */
export class EnergyRangeResponseDto extends EnergyStatisticsDto {
  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2026-07-01',
    type: String,
  })
  startDate: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2026-07-17',
    type: String,
  })
  endDate: string;
}

/**
 * Energy Range by Sensor Response DTO
 *
 * Energy statistics for specific sensor in date range.
 *
 * Used by:
 * - GET /api/energy/sensor/:sensorId/range
 */
export class EnergyRangeSensorResponseDto extends EnergyStatisticsDto {
  @ApiProperty({
    description: 'Sensor ID',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
    type: String,
  })
  sensorId: string;

  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2026-07-01',
    type: String,
  })
  startDate: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2026-07-17',
    type: String,
  })
  endDate: string;
}

/**
 * Energy Reading Response DTO
 *
 * Individual energy reading for API responses.
 *
 * Used by:
 * - GET /api/energy/recent
 * - GET /api/energy/sensor/:sensorId/recent
 * - GET /api/energy/readings
 *
 * Note:
 * - Simplified version (not full schema)
 * - Only includes essential fields for API
 */
export class EnergyReadingResponseDto {
  @ApiProperty({
    description: 'Reading ID',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Sensor ID',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
    type: String,
  })
  sensorId: string;

  @ApiProperty({
    description: 'Voltage (V)',
    example: 5.2,
    type: Number,
  })
  voltage: number;

  @ApiProperty({
    description: 'Current (A)',
    example: 0.15,
    type: Number,
  })
  current: number;

  @ApiProperty({
    description: 'Power (W)',
    example: 0.78,
    type: Number,
  })
  power: number;

  @ApiProperty({
    description: 'Energy (kWh)',
    example: 0.0,
    type: Number,
  })
  energy: number;

  @ApiProperty({
    description: 'Timestamp (ISO 8601)',
    example: '2026-07-17T14:30:00.000Z',
    type: String,
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Received at server (ISO 8601)',
    example: '2026-07-17T14:30:01.234Z',
    type: String,
  })
  receivedAt: Date;
}

/**
 * Sensor Energy DTO
 *
 * Energy statistics grouped by sensor.
 *
 * Used by:
 * - GET /api/energy/by-sensors
 */
export class SensorEnergyDto {
  @ApiProperty({
    description: 'Sensor ID',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
    type: String,
  })
  sensorId: string;

  @ApiProperty({
    description: 'Total power (W)',
    example: 450.25,
    type: Number,
  })
  totalPower: number;

  @ApiProperty({
    description: 'Number of readings',
    example: 52,
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Average power (W)',
    example: 8.66,
    type: Number,
  })
  avgPower: number;

  @ApiProperty({
    description: 'Maximum power (W)',
    example: 15.3,
    type: Number,
  })
  maxPower: number;
}

/**
 * Total Statistics Response DTO
 *
 * System-wide energy statistics.
 *
 * Used by:
 * - GET /api/energy/statistics
 */
export class TotalStatisticsResponseDto {
  @ApiProperty({
    description: 'Total number of readings in system',
    example: 5432,
    type: Number,
  })
  totalReadings: number;

  @ApiProperty({
    description: "Today's energy statistics",
    type: TodayEnergyResponseDto,
  })
  todayStats: TodayEnergyResponseDto;

  @ApiProperty({
    description: 'Last reading received',
    nullable: true,
  })
  lastReading: {
    timestamp: Date;
    power: number;
    sensorId: string;
  } | null;
}
