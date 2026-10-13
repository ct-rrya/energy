import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { toZonedTime } from 'date-fns-tz';
import {
  EnergyReading,
  EnergyReadingDocument,
} from '../iot/schemas/energy-reading.schema';

/**
 * Energy Service
 *
 * Provides query and aggregation capabilities for energy data.
 *
 * Responsibilities:
 * - Query readings with filters (sensor, date range)
 * - Calculate today's energy totals
 * - Provide historical data
 * - Generate statistics (min, max, average)
 * - Aggregate energy by sensor
 *
 * Does NOT:
 * - Store readings (IoT module handles this)
 * - Authenticate devices (IoT module handles this)
 * - Emit real-time events (Dashboard module handles this)
 *
 * Performance Considerations:
 * - Always uses indexed queries (sensorId, timestamp)
 * - Limits result sets to prevent memory issues
 * - Uses aggregation pipelines for calculations
 * - Considers caching for frequent queries
 *
 * Index Requirements:
 * - { sensorId: 1, timestamp: -1 } - Sensor time series
 * - { timestamp: -1, sensorId: 1 } - Recent readings
 */
@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);
  private readonly timezone: string;

  constructor(
    @InjectModel(EnergyReading.name)
    private readingModel: Model<EnergyReadingDocument>,
    private configService: ConfigService,
  ) {
    // Get timezone from config, default to Asia/Manila
    this.timezone =
      this.configService.get<string>('NOTIFICATION_TIMEZONE') || 'Asia/Manila';
    this.logger.log(`EnergyService initialized with timezone: ${this.timezone}`);
  }

  /**
   * Get Daily Boundary Dates in Project Timezone
   * 
   * Returns start and end dates for "today" in the configured timezone (Asia/Manila).
   * This ensures daily aggregations match user expectations regardless of server timezone.
   * 
   * NOTE: When readings have historical timestamps (e.g., January 2025 while server time 
   * is October 2026), this will return empty results. Use getMatchingDayBoundary() instead
   * to match ANY year's same month/day.
   * 
   * @param date - Optional specific date, defaults to today
   * @returns Object with todayStart and todayEnd in project timezone
   */
  private getDailyBoundary(date?: Date): { todayStart: Date; todayEnd: Date } {
    const targetDate = date || new Date();
    
    // Convert to project timezone
    const zonedDate = toZonedTime(targetDate, this.timezone);
    
    // Set to midnight (start of day)
    const todayStart = new Date(zonedDate);
    todayStart.setHours(0, 0, 0, 0);
    
    // Set to end of day
    const todayEnd = new Date(zonedDate);
    todayEnd.setHours(23, 59, 59, 999);
    
    return { todayStart, todayEnd };
  }

  /**
   * Get Today's Energy Total
   *
   * Calculates total energy for current day across all sensors using delta calculation.
   * 
   * IMPORTANT: For systems with historical data (readings from past years), this uses
   * MongoDB aggregation to match readings from today's date ACROSS ALL YEARS.
   * 
   * Example: If today is Oct 13, 2026, this will aggregate:
   * - Oct 13, 2025 readings
   * - Oct 13, 2024 readings
   * - Oct 13, 2026 readings
   * 
   * This prevents returning 0 when readings exist but have historical timestamps.
   * 
   * Strategy:
   * - ESP32 sends CUMULATIVE energy that increases during each session
   * - When ESP32 reboots, cumulative counter resets to 0
   * - We calculate deltas between consecutive readings to avoid double-counting
   * - Resets are detected when energy decreases between readings
   *
   * @returns Today's energy statistics
   *
   * Performance:
   * - Uses { timestamp: -1 } index
   * - Aggregation pipeline with $setWindowFields for delta calculation
   * - Handles multiple sensors independently
   *
   * Energy Calculation:
   * - Correct: Sum of energy deltas (increments only)
   * - Not: Sum of cumulative values (would double-count)
   */
  async getTodayEnergyTotal() {
    const now = new Date();
    const zonedNow = toZonedTime(now, this.timezone);
    
    // Extract today's month and day (ignore year to match historical readings)
    const targetMonth = zonedNow.getMonth(); // 0-11
    const targetDay = zonedNow.getDate(); // 1-31

    this.logger.debug(
      `Calculating today's energy total for month=${targetMonth + 1}, day=${targetDay} (any year) in timezone ${this.timezone}`,
    );

    // Try MongoDB 5.0+ $setWindowFields approach first
    try {
      const result = await this.readingModel.aggregate([
        {
          // Match readings from today's month and day (any year)
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $month: '$timestamp' }, targetMonth + 1] }, // MongoDB months are 1-12
                { $eq: [{ $dayOfMonth: '$timestamp' }, targetDay] },
              ],
            },
            source: 'hardware' as any, // REQUIREMENT 12.1: Filter for hardware data only
          },
        },
        {
          $sort: { sensorId: 1, timestamp: 1 }, // Sort by sensor, then time
        },
        {
          // Calculate previous energy for each reading within same sensor
          $setWindowFields: {
            partitionBy: '$sensorId', // Separate window per sensor
            sortBy: { timestamp: 1 },
            output: {
              previousEnergy: {
                $shift: {
                  output: '$energy',
                  by: -1, // Previous reading
                },
              },
            },
          },
        },
        {
          // Calculate delta, handling resets
          $addFields: {
            energyDelta: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$previousEnergy', null] }, // First reading for sensor
                    { $lt: ['$energy', '$previousEnergy'] }, // Reset detected
                  ],
                },
                then: 0, // Skip this reading's contribution
                else: { $subtract: ['$energy', '$previousEnergy'] }, // Normal delta
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPower: { $sum: '$power' }, // Sum of all power readings (W)
            totalEnergy: { $sum: '$energyDelta' }, // Sum of energy deltas (mWh)
            count: { $sum: 1 }, // Number of readings
            avgPower: { $avg: '$power' }, // Average power (W)
            maxPower: { $max: '$power' }, // Peak power (W)
            minPower: { $min: '$power' }, // Minimum power (W)
          },
        },
      ]);

      if (result.length === 0) {
        return {
          date: `${zonedNow.getFullYear()}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`,
          totalPower: 0,
          count: 0,
          avgPower: 0,
          maxPower: 0,
          minPower: 0,
          estimatedEnergyKWh: 0,
        };
      }

      const stats = result[0];

      // ESP32 sends energy in mWh, convert to kWh (1 kWh = 1,000,000 mWh)
      const totalEnergyMWh = stats.totalEnergy || 0;
      const estimatedEnergyKWh = totalEnergyMWh / 1000000;

      return {
        date: `${zonedNow.getFullYear()}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`,
        totalPower: Math.round(stats.totalPower * 100) / 100,
        count: stats.count,
        avgPower: Math.round(stats.avgPower * 100) / 100,
        maxPower: Math.round(stats.maxPower * 100) / 100,
        minPower: Math.round(stats.minPower * 100) / 100,
        estimatedEnergyKWh: Math.round(estimatedEnergyKWh * 1000) / 1000, // 3 decimals for kWh
      };
    } catch (error) {
      // Fallback for MongoDB < 5.0 or if $setWindowFields fails
      this.logger.warn(
        `$setWindowFields failed, using fallback calculation: ${error.message}`,
      );
      return this.getTodayEnergyTotalFallback(targetMonth, targetDay);
    }
  }

  /**
   * Fallback Energy Calculation (for MongoDB < 5.0)
   * 
   * Calculates energy deltas in application code instead of aggregation pipeline.
   * Less efficient but compatible with older MongoDB versions.
   * 
   * @param targetMonth - Month to match (0-11)
   * @param targetDay - Day to match (1-31)
   */
  private async getTodayEnergyTotalFallback(
    targetMonth: number,
    targetDay: number,
  ) {
    const zonedNow = toZonedTime(new Date(), this.timezone);
    
    const readings = await this.readingModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $month: '$timestamp' }, targetMonth + 1] },
            { $eq: [{ $dayOfMonth: '$timestamp' }, targetDay] },
          ],
        },
        source: 'hardware' as any,
      })
      .sort({ sensorId: 1, timestamp: 1 })
      .exec();

    if (readings.length === 0) {
      return {
        date: `${zonedNow.getFullYear()}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`,
        totalPower: 0,
        count: 0,
        avgPower: 0,
        maxPower: 0,
        minPower: 0,
        estimatedEnergyKWh: 0,
      };
    }

    // Calculate deltas in memory
    let totalEnergy = 0;
    let totalPower = 0;
    let maxPower = 0;
    let minPower = Infinity;
    const sensorPrevious = new Map<string, number>();

    for (const reading of readings) {
      const sensorIdStr = reading.sensorId.toString();
      const previousEnergy = sensorPrevious.get(sensorIdStr);

      // Calculate delta if not first reading and no reset detected
      if (
        previousEnergy !== undefined &&
        reading.energy >= previousEnergy
      ) {
        totalEnergy += reading.energy - previousEnergy;
      }

      // Update tracking
      sensorPrevious.set(sensorIdStr, reading.energy);
      totalPower += reading.power;
      maxPower = Math.max(maxPower, reading.power);
      minPower = Math.min(minPower, reading.power);
    }

    const avgPower = totalPower / readings.length;

    // ESP32 sends energy in mWh, convert to kWh (1 kWh = 1,000,000 mWh)
    const estimatedEnergyKWh = totalEnergy / 1000000;

    return {
      date: `${zonedNow.getFullYear()}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`,
      totalPower: Math.round(totalPower * 100) / 100,
      count: readings.length,
      avgPower: Math.round(avgPower * 100) / 100,
      maxPower: Math.round(maxPower * 100) / 100,
      minPower: Math.round((minPower === Infinity ? 0 : minPower) * 100) / 100,
      estimatedEnergyKWh: Math.round(estimatedEnergyKWh * 1000) / 1000, // 3 decimals for kWh
    };
  }

  /**
   * Get Today's Energy by Sensor
   *
   * Calculates energy for specific sensor today.
   *
   * @param sensorId - Sensor ID
   * @returns Today's energy statistics for sensor
   *
   * Performance:
   * - Uses { sensorId: 1, timestamp: -1 } index
   * - Efficient compound index scan
   * - Small result set (one sensor, one day)
   */
  async getTodayEnergySensor(sensorId: string) {
    const { todayStart, todayEnd } = this.getDailyBoundary();

    const result = await this.readingModel.aggregate([
      {
        $match: {
          sensorId: sensorId as any,
          timestamp: {
            $gte: todayStart,
            $lte: todayEnd,
          },
        },
      },
      {
        $group: {
          _id: '$sensorId',
          totalPower: { $sum: '$power' },
          count: { $sum: 1 },
          avgPower: { $avg: '$power' },
          maxPower: { $max: '$power' },
          minPower: { $min: '$power' },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        sensorId,
        date: todayStart.toISOString().split('T')[0],
        totalPower: 0,
        count: 0,
        avgPower: 0,
        maxPower: 0,
        minPower: 0,
        estimatedEnergyKWh: 0,
      };
    }

    const stats = result[0];

    const hoursElapsed =
      (new Date().getTime() - todayStart.getTime()) / (1000 * 60 * 60);
    const estimatedEnergyKWh = stats.avgPower * hoursElapsed;

    return {
      sensorId,
      date: todayStart.toISOString().split('T')[0],
      totalPower: Math.round(stats.totalPower * 100) / 100,
      count: stats.count,
      avgPower: Math.round(stats.avgPower * 100) / 100,
      maxPower: Math.round(stats.maxPower * 100) / 100,
      minPower: Math.round(stats.minPower * 100) / 100,
      estimatedEnergyKWh: Math.round(estimatedEnergyKWh * 1000) / 1000,
    };
  }

  /**
   * Get Energy for Date Range
   *
   * Calculates energy statistics for a date range.
   *
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @returns Energy statistics for date range
   *
   * Performance:
   * - Uses { timestamp: -1 } index
   * - Range scan on timestamp
   * - Limit to reasonable date ranges (< 1 year)
   *
   * Usage:
   * - Weekly reports
   * - Monthly summaries
   * - Custom date range analysis
   */
  async getEnergyRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const result = await this.readingModel.aggregate([
      {
        $match: {
          timestamp: {
            $gte: start,
            $lte: end,
          },
          source: 'hardware' as any, // REQUIREMENT 12.1: Filter for hardware data only
        },
      },
      {
        $group: {
          _id: null,
          totalPower: { $sum: '$power' },
          count: { $sum: 1 },
          avgPower: { $avg: '$power' },
          maxPower: { $max: '$power' },
          minPower: { $min: '$power' },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalPower: 0,
        count: 0,
        avgPower: 0,
        maxPower: 0,
        minPower: 0,
        estimatedEnergyKWh: 0,
      };
    }

    const stats = result[0];

    // Calculate energy based on time span
    const hoursSpan = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const estimatedEnergyKWh = stats.avgPower * hoursSpan;

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalPower: Math.round(stats.totalPower * 100) / 100,
      count: stats.count,
      avgPower: Math.round(stats.avgPower * 100) / 100,
      maxPower: Math.round(stats.maxPower * 100) / 100,
      minPower: Math.round(stats.minPower * 100) / 100,
      estimatedEnergyKWh: Math.round(estimatedEnergyKWh * 1000) / 1000,
    };
  }

  /**
   * Get Energy for Date Range by Sensor
   *
   * Calculates energy for specific sensor in date range.
   *
   * @param sensorId - Sensor ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Energy statistics for sensor in date range
   *
   * Performance:
   * - Uses { sensorId: 1, timestamp: -1 } compound index
   * - Optimal for single sensor queries
   * - Fast range scan
   */
  async getEnergyRangeSensor(
    sensorId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const result = await this.readingModel.aggregate([
      {
        $match: {
          sensorId: sensorId as any,
          timestamp: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: '$sensorId',
          totalPower: { $sum: '$power' },
          count: { $sum: 1 },
          avgPower: { $avg: '$power' },
          maxPower: { $max: '$power' },
          minPower: { $min: '$power' },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        sensorId,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalPower: 0,
        count: 0,
        avgPower: 0,
        maxPower: 0,
        minPower: 0,
        estimatedEnergyKWh: 0,
      };
    }

    const stats = result[0];

    const hoursSpan = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const estimatedEnergyKWh = stats.avgPower * hoursSpan;

    return {
      sensorId,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalPower: Math.round(stats.totalPower * 100) / 100,
      count: stats.count,
      avgPower: Math.round(stats.avgPower * 100) / 100,
      maxPower: Math.round(stats.maxPower * 100) / 100,
      minPower: Math.round(stats.minPower * 100) / 100,
      estimatedEnergyKWh: Math.round(estimatedEnergyKWh * 1000) / 1000,
    };
  }

  /**
   * Get Recent Readings
   *
   * Retrieves most recent readings across all sensors.
   *
   * @param limit - Number of readings to retrieve (default: 100, max: 1000)
   * @returns Array of recent readings
   *
   * Performance:
   * - Uses { timestamp: -1 } index
   * - Sorted scan (already in index order)
   * - Limited result set prevents memory issues
   *
   * Usage:
   * - Dashboard recent activity
   * - Real-time monitoring
   * - System health check
   */
  async getRecentReadings(
    limit: number = 100,
  ): Promise<EnergyReadingDocument[]> {
    // Cap limit to prevent abuse
    const safeLimit = Math.min(limit, 1000);

    return this.readingModel
      .find()
      .sort({ timestamp: -1 }) // Newest first
      .limit(safeLimit)
      .populate('sensorId', 'name location') // Include sensor details
      .exec();
  }

  /**
   * Get Recent Readings by Sensor
   *
   * Retrieves recent readings for specific sensor.
   *
   * @param sensorId - Sensor ID
   * @param limit - Number of readings (default: 100, max: 1000)
   * @returns Array of sensor readings
   *
   * Performance:
   * - Uses { sensorId: 1, timestamp: -1 } compound index
   * - Optimal for single sensor queries
   * - Efficient range scan with limit
   */
  async getRecentReadingsSensor(
    sensorId: string,
    limit: number = 100,
  ): Promise<EnergyReadingDocument[]> {
    const safeLimit = Math.min(limit, 1000);

    return this.readingModel
      .find({ sensorId: sensorId as any })
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .exec();
  }

  /**
   * Get Readings for Date Range
   *
   * Retrieves all readings within date range.
   * Use with caution - can return large datasets.
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @param limit - Maximum readings (default: 1000)
   * @returns Array of readings
   *
   * Performance:
   * - Uses { timestamp: -1 } index
   * - Range scan on timestamp
   * - ALWAYS use limit to prevent memory issues
   *
   * Recommendation:
   * - Use aggregation for statistics instead
   * - Use pagination for large date ranges
   * - Limit to < 1 week for raw data queries
   */
  async getReadingsRange(
    startDate: string,
    endDate: string,
    limit: number = 1000,
  ): Promise<EnergyReadingDocument[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const safeLimit = Math.min(limit, 10000);

    return this.readingModel
      .find({
        timestamp: {
          $gte: start,
          $lte: end,
        },
      })
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .populate('sensorId', 'name location')
      .exec();
  }

  /**
   * Get Energy by All Sensors (Today)
   *
   * Groups today's energy by sensor.
   *
   * @returns Array of sensor energy statistics
   *
   * Performance:
   * - Uses { timestamp: -1, sensorId: 1 } index
   * - Groups after filtering by date
   * - Result size = number of active sensors (small)
   *
   * Usage:
   * - Dashboard sensor comparison
   * - Identify most productive sensors
   * - System-wide statistics
   */
  async getEnergyBySensors() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result = await this.readingModel.aggregate([
      {
        $match: {
          timestamp: {
            $gte: todayStart,
            $lte: todayEnd,
          },
        },
      },
      {
        $group: {
          _id: '$sensorId',
          totalPower: { $sum: '$power' },
          count: { $sum: 1 },
          avgPower: { $avg: '$power' },
          maxPower: { $max: '$power' },
        },
      },
      {
        $sort: { totalPower: -1 }, // Highest energy first
      },
    ]);

    return result.map((item) => ({
      sensorId: item._id.toString(),
      totalPower: Math.round(item.totalPower * 100) / 100,
      count: item.count,
      avgPower: Math.round(item.avgPower * 100) / 100,
      maxPower: Math.round(item.maxPower * 100) / 100,
    }));
  }

  /**
   * Get Total Statistics
   *
   * Returns overall system statistics.
   *
   * @returns System-wide statistics
   *
   * Performance:
   * - Multiple queries (consider caching)
   * - Each query uses indexes
   * - Relatively fast for moderate datasets
   */
  async getTotalStatistics() {
    const totalReadings = await this.readingModel.countDocuments();

    const todayStats = await this.getTodayEnergyTotal();

    const lastReading = await this.readingModel
      .findOne()
      .sort({ timestamp: -1 })
      .exec();

    return {
      totalReadings,
      todayStats,
      lastReading: lastReading
        ? {
            timestamp: lastReading.timestamp,
            power: lastReading.power,
            sensorId: lastReading.sensorId.toString(),
          }
        : null,
    };
  }
}
