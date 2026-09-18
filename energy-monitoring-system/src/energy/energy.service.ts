import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
  constructor(
    @InjectModel(EnergyReading.name)
    private readingModel: Model<EnergyReadingDocument>,
  ) {}

  /**
   * Get Today's Energy Total
   *
   * Calculates total energy for current day across all sensors.
   *
   * @returns Today's energy statistics
   *
   * Calculation:
   * - Filters readings from 00:00:00 to 23:59:59 today
   * - Sums power (W) to estimate energy
   * - Counts total readings
   * - Calculates average power
   *
   * Performance:
   * - Uses { timestamp: -1 } index
   * - Aggregation pipeline on filtered data
   * - Result cached for 5 minutes (future)
   *
   * Energy Calculation Note:
   * - Simplified: Sum of power readings
   * - Accurate: Integrate power over time
   * - For now: Sum power, divide by readings to get average
   * - Future: Calculate kWh based on time intervals
   */
  async getTodayEnergyTotal() {
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
          source: 'hardware' as any, // REQUIREMENT 12.1: Filter for hardware data only
        },
      },
      {
        $group: {
          _id: null,
          totalPower: { $sum: '$power' }, // Sum of all power readings (W)
          count: { $sum: 1 }, // Number of readings
          avgPower: { $avg: '$power' }, // Average power (W)
          maxPower: { $max: '$power' }, // Peak power (W)
          minPower: { $min: '$power' }, // Minimum power (W)
        },
      },
    ]);

    if (result.length === 0) {
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

    // Estimate energy in kWh
    // Simple formula: Average power × hours / 1000
    // More accurate: Sum (power × time_interval) / 1000
    const hoursElapsed =
      (new Date().getTime() - todayStart.getTime()) / (1000 * 60 * 60);
    const estimatedEnergyKWh = (stats.avgPower * hoursElapsed) / 1000;

    return {
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

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
    const estimatedEnergyKWh = (stats.avgPower * hoursElapsed) / 1000;

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
    const estimatedEnergyKWh = (stats.avgPower * hoursSpan) / 1000;

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
    const estimatedEnergyKWh = (stats.avgPower * hoursSpan) / 1000;

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
