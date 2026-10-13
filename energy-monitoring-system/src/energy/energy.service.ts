import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { toZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';
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
   * Calculates total energy for current day by summing energy increments from ESP32.
   * ESP32 sends energy increments per upload (not cumulative), so we sum them directly.
   * Uses server-side receivedAt timestamp for reliable daily boundaries.
   * 
   * Strategy:
   * - ESP32 counts steps until batch threshold (e.g., 35 steps)
   * - Each upload contains energy generated during that batch period (increment)
   * - ESP32 resets step counter after successful upload
   * - Backend sums all increments for today to get total daily energy
   * - Convert from mWh to kWh (÷ 1,000,000)
   * 
   * Example:
   *   Upload 1: 10 mWh increment → Daily total: 10 mWh
   *   Upload 2: 15 mWh increment → Daily total: 25 mWh
   *   Upload 3: 8 mWh increment  → Daily total: 33 mWh
   *
   * @returns Today's energy statistics
   *
   * Performance:
   * - Uses { receivedAt: 1, sensorId: 1 } index
   * - Simple aggregation pipeline with sum
   * - Efficient for daily queries
   *
   * Energy Calculation:
   * - Correct: Sum all energy field values (they are increments)
   * - Each value represents energy generated in that batch period
   * - No delta calculation needed (values are not cumulative)
   */
  async getTodayEnergyTotal() {
    const now = new Date();
    
    // Get current time in Manila timezone
    const zonedNow = toZonedTime(now, this.timezone);
    
    // Get start and end of day (this gives us correct UTC boundaries)
    const todayStart = startOfDay(zonedNow);
    const todayEnd = endOfDay(zonedNow);

    this.logger.debug(
      `Calculating today's energy total for ${todayStart.toISOString()} to ${todayEnd.toISOString()} in timezone ${this.timezone}`,
    );

    try {
      const result = await this.readingModel.aggregate([
        {
          // Match readings received today (use server timestamp, not ESP32 timestamp)
          $match: {
            receivedAt: {
              $gte: todayStart,
              $lte: todayEnd,
            },
            source: 'hardware' as any, // REQUIREMENT 12.1: Filter for hardware data only
          },
        },
        {
          $group: {
            _id: null,
            totalPower: { $sum: '$power' }, // Sum of all power readings (W)
            totalEnergy: { $sum: '$energy' }, // Sum of energy increments (mWh)
            count: { $sum: 1 }, // Number of readings
            avgPower: { $avg: '$power' }, // Average power (W)
            maxPower: { $max: '$power' }, // Peak power (W)
            minPower: { $min: '$power' }, // Minimum power (W)
          },
        },
      ]);

      if (result.length === 0) {
        this.logger.warn('No energy readings found for today');
        return {
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

      // ESP32 sends energy increments in mWh, convert to kWh (1 kWh = 1,000,000 mWh)
      const totalEnergyMWh = stats.totalEnergy || 0;
      const estimatedEnergyKWh = totalEnergyMWh / 1000000;

      return {
        date: todayStart.toISOString().split('T')[0],
        totalPower: Math.round(stats.totalPower * 100) / 100,
        count: stats.count,
        avgPower: Math.round(stats.avgPower * 100) / 100,
        maxPower: Math.round(stats.maxPower * 100) / 100,
        minPower: Math.round(stats.minPower * 100) / 100,
        estimatedEnergyKWh: Math.round(estimatedEnergyKWh * 10000) / 10000, // 4 decimals for kWh
      };
    } catch (error) {
      // Fallback for MongoDB errors
      this.logger.warn(
        `Energy aggregation failed, using fallback calculation: ${error.message}`,
      );
      return this.getTodayEnergyTotalFallback(todayStart, todayEnd);
    }
  }

  /**
   * Fallback Energy Calculation (for MongoDB errors)
   * 
   * Calculates energy by summing energy increment values in application code.
   * ESP32 sends batch-based increments, so we sum them directly.
   * 
   * @param todayStart - Start of today in Manila timezone
   * @param todayEnd - End of today in Manila timezone
   */
  private async getTodayEnergyTotalFallback(
    todayStart: Date,
    todayEnd: Date,
  ) {
    const readings = await this.readingModel
      .find({
        receivedAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        source: 'hardware' as any,
      })
      .sort({ sensorId: 1, receivedAt: 1 })
      .exec();

    if (readings.length === 0) {
      this.logger.warn('No energy readings found for today (fallback method)');
      return {
        date: todayStart.toISOString().split('T')[0],
        totalPower: 0,
        count: 0,
        avgPower: 0,
        maxPower: 0,
        minPower: 0,
        estimatedEnergyKWh: 0,
      };
    }

    // Sum energy increments directly
    let totalEnergy = 0;  // mWh
    let totalPower = 0;
    let maxPower = 0;
    let minPower = Infinity;

    for (const reading of readings) {
      totalEnergy += reading.energy || 0;  // Each value is an increment
      totalPower += reading.power;
      maxPower = Math.max(maxPower, reading.power);
      minPower = Math.min(minPower, reading.power);
    }

    const avgPower = totalPower / readings.length;

    // Convert mWh to kWh (1 kWh = 1,000,000 mWh)
    const estimatedEnergyKWh = totalEnergy / 1000000;

    return {
      date: todayStart.toISOString().split('T')[0],
      totalPower: Math.round(totalPower * 100) / 100,
      count: readings.length,
      avgPower: Math.round(avgPower * 100) / 100,
      maxPower: Math.round(maxPower * 100) / 100,
      minPower: Math.round((minPower === Infinity ? 0 : minPower) * 100) / 100,
      estimatedEnergyKWh: Math.round(estimatedEnergyKWh * 10000) / 10000, // 4 decimals for kWh
    };
  }

  /**
   * Get Today's Detailed Statistics
   * 
   * Returns comprehensive daily statistics including steps total, max voltage,
   * peak power, and peak current. Uses server-side receivedAt timestamp for accurate
   * daily aggregation regardless of ESP32 clock accuracy.
   * 
   * Note: For cumulative counters (steps), we use delta calculation to avoid double-counting.
   * For instantaneous measurements (voltage, power, current), we use max/peak values.
   * 
   * @returns Daily statistics with totals and peaks
   */
  async getTodayDetailedStats() {
    const now = new Date();
    const zonedNow = toZonedTime(now, this.timezone);
    
    // Set today's boundaries in Manila timezone
    const todayStart = new Date(zonedNow);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(zonedNow);
    todayEnd.setHours(23, 59, 59, 999);

    this.logger.debug(
      `Calculating today's detailed stats for ${todayStart.toISOString()} to ${todayEnd.toISOString()}`,
    );

    try {
      const result = await this.readingModel.aggregate([
        {
          // Match readings received today (use server timestamp, not ESP32 timestamp)
          $match: {
            receivedAt: {
              $gte: todayStart,
              $lte: todayEnd,
            },
            source: 'hardware' as any,
          },
        },
        {
          $sort: { sensorId: 1, receivedAt: 1 },
        },
        {
          // Calculate previous stepCount for delta
          $setWindowFields: {
            partitionBy: '$sensorId',
            sortBy: { receivedAt: 1 },
            output: {
              previousStepCount: {
                $shift: {
                  output: '$stepCount',
                  by: -1,
                },
              },
            },
          },
        },
        {
          // Calculate step delta, handling resets
          $addFields: {
            stepDelta: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$previousStepCount', null] },
                    { $lt: ['$stepCount', '$previousStepCount'] }, // Reset detected
                  ],
                },
                then: 0,
                else: { $subtract: ['$stepCount', '$previousStepCount'] },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSteps: { $sum: '$stepDelta' },
            maxVoltage: { $max: '$voltage' },
            peakPower: { $max: '$power' },
            peakCurrent: { $max: '$current' },
            avgVoltage: { $avg: '$voltage' },
            avgPower: { $avg: '$power' },
            avgCurrent: { $avg: '$current' },
            count: { $sum: 1 },
          },
        },
      ]);

      if (result.length === 0) {
        return {
          totalSteps: 0,
          maxVoltage: 0,
          peakPower: 0,
          peakCurrent: 0,
          avgVoltage: 0,
          avgPower: 0,
          avgCurrent: 0,
          count: 0,
        };
      }

      const stats = result[0];

      return {
        totalSteps: Math.round(stats.totalSteps || 0),
        maxVoltage: Math.round(stats.maxVoltage * 100) / 100,
        peakPower: Math.round(stats.peakPower * 1000) / 1000,
        peakCurrent: Math.round(stats.peakCurrent * 1000) / 1000,
        avgVoltage: Math.round(stats.avgVoltage * 100) / 100,
        avgPower: Math.round(stats.avgPower * 1000) / 1000,
        avgCurrent: Math.round(stats.avgCurrent * 1000) / 1000,
        count: stats.count,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to calculate detailed stats: ${error.message}`,
      );
      
      // Fallback: simple query without window functions
      const readings = await this.readingModel
        .find({
          receivedAt: {
            $gte: todayStart,
            $lte: todayEnd,
          },
          source: 'hardware' as any,
        })
        .sort({ sensorId: 1, receivedAt: 1 })
        .exec();

      if (readings.length === 0) {
        return {
          totalSteps: 0,
          maxVoltage: 0,
          peakPower: 0,
          peakCurrent: 0,
          avgVoltage: 0,
          avgPower: 0,
          avgCurrent: 0,
          count: 0,
        };
      }

      // Calculate in memory
      let totalSteps = 0;
      let maxVoltage = 0;
      let peakPower = 0;
      let peakCurrent = 0;
      let totalVoltage = 0;
      let totalPower = 0;
      let totalCurrent = 0;
      const sensorPreviousSteps = new Map<string, number>();

      for (const reading of readings) {
        const sensorIdStr = reading.sensorId.toString();
        const previousSteps = sensorPreviousSteps.get(sensorIdStr);
        const currentSteps = reading.stepCount || 0;

        // Calculate step delta
        if (
          previousSteps !== undefined &&
          currentSteps >= previousSteps
        ) {
          totalSteps += currentSteps - previousSteps;
        }

        sensorPreviousSteps.set(sensorIdStr, currentSteps);

        // Track max values
        maxVoltage = Math.max(maxVoltage, reading.voltage || 0);
        peakPower = Math.max(peakPower, reading.power || 0);
        peakCurrent = Math.max(peakCurrent, reading.current || 0);
        
        // Track totals for averages
        totalVoltage += reading.voltage || 0;
        totalPower += reading.power || 0;
        totalCurrent += reading.current || 0;
      }

      return {
        totalSteps: Math.round(totalSteps),
        maxVoltage: Math.round(maxVoltage * 100) / 100,
        peakPower: Math.round(peakPower * 1000) / 1000,
        peakCurrent: Math.round(peakCurrent * 1000) / 1000,
        avgVoltage: Math.round((totalVoltage / readings.length) * 100) / 100,
        avgPower: Math.round((totalPower / readings.length) * 1000) / 1000,
        avgCurrent: Math.round((totalCurrent / readings.length) * 1000) / 1000,
        count: readings.length,
      };
    }
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
