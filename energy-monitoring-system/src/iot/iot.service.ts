import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EnergyReading,
  EnergyReadingDocument,
  ReadingSource,
} from './schemas/energy-reading.schema';
import {
  CreateReadingDto,
  CreateReadingResponseDto,
  ReadingResponseDto,
  ReadingQueryDto,
  StatisticsQueryDto,
  PaginatedReadingsResponseDto,
  ReadingStatisticsResponseDto,
} from './dto';
import { SensorsService } from '../sensors/sensors.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { NewReadingEventDto, PowerAlertEventDto } from '../dashboard/dto';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * IoT Service
 *
 * Handles all business logic for IoT data ingestion from ESP32 devices.
 *
 * Responsibilities:
 * - Validate API keys (delegate to SensorsService)
 * - Validate sensor readings (ranges, timestamp)
 * - Store readings in database
 * - Update sensor lastSeenAt timestamp
 * - Broadcast real-time events to dashboard
 * - Check power thresholds and send alerts
 * - Generate lightweight responses for ESP32
 *
 * Does NOT handle:
 * - HTTP request/response (Controller's job)
 * - API key format validation (Guard's job)
 *
 * Security:
 * - All validation before database operations
 * - Generic error messages (no internal details)
 * - Sensor status checking (only active sensors)
 *
 * Performance:
 * - Async operations (non-blocking)
 * - Fire-and-forget lastSeen update
 * - Fire-and-forget dashboard broadcasts
 * - Minimal response payload
 * - Indexed database queries
 */
@Injectable()
export class IotService {
  private dailyEnergyCache: Map<string, number> = new Map(); // Track daily energy for milestones
  private batteryAlertCache: Map<string, number> = new Map(); // Track last battery alert time

  constructor(
    @InjectModel(EnergyReading.name)
    private readingModel: Model<EnergyReadingDocument>,
    private sensorsService: SensorsService,
    @Inject(forwardRef(() => DashboardService))
    private dashboardService: DashboardService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Receive Reading from ESP32
   *
   * Main entry point for ESP32 data submission.
   * Validates API key, validates data, stores reading, updates sensor.
   *
   * @param apiKey - Sensor API key from X-API-Key header
   * @param readingDto - Reading data from ESP32
   * @returns Lightweight response with reading ID
   * @throws UnauthorizedException if API key invalid or sensor not active
   * @throws BadRequestException if data validation fails
   *
   * Process:
   * 1. Validate API key and get sensor
   * 2. Validate reading data (ranges, timestamp)
   * 3. Store reading in database
   * 4. Update sensor lastSeenAt (fire and forget)
   * 5. Return lightweight response
   *
   * Transaction Safety:
   * - Reading stored first (critical operation)
   * - LastSeen updated after (non-critical, can fail)
   * - If lastSeen fails, reading still stored
   *
   * Future Enhancements:
   * - Emit Socket.IO event for dashboard (Phase 7)
   * - Calculate energy from previous reading
   * - Rate limiting per sensor
   * - Anomaly detection
   */
  async receiveReading(
    apiKey: string,
    readingDto: CreateReadingDto,
  ): Promise<CreateReadingResponseDto> {
    // Step 1: Validate API key and get sensor
    const sensor = await this.validateApiKey(apiKey);

    // Step 2: Validate reading data
    this.validateReadingData(readingDto);

    // Step 3: Store reading in database
    const reading = await this.storeReading(sensor._id.toString(), readingDto);

    // Step 4: Broadcast to dashboard (fire and forget)
    this.broadcastNewReading(reading, sensor).catch((error) => {
      console.error('Failed to broadcast new reading:', error);
    });

    // Step 5: Check power threshold and send alert if needed
    this.checkPowerThreshold(reading, sensor).catch((error) => {
      console.error('Failed to check power threshold:', error);
    });

    // Step 5.5: Check battery alerts and emit events (Phase 7)
    this.checkBatteryAlerts(reading, sensor).catch((error) => {
      console.error('Failed to check battery alerts:', error);
    });

    // Step 5.6: Check energy milestones and emit events (Phase 7)
    this.checkEnergyMilestones(reading).catch((error) => {
      console.error('Failed to check energy milestones:', error);
    });

    // Step 6: Update sensor lastSeenAt (fire and forget)
    // Don't await - this is non-critical and shouldn't block response
    this.sensorsService.updateLastSeen(sensor._id.toString()).catch((error) => {
      // Log error but don't fail the request
      console.error('Failed to update sensor lastSeen:', error);
    });

    // Step 7: Return lightweight response
    return {
      success: true,
      readingId: reading._id.toString(),
      receivedAt: reading.receivedAt,
    };
  }

  /**
   * Validate API Key
   *
   * Validates API key against database and checks sensor status.
   *
   * @param apiKey - Sensor API key
   * @returns Sensor document if valid
   * @throws UnauthorizedException if invalid or sensor not active
   *
   * Validation Steps:
   * 1. Check API key exists (not null/undefined)
   * 2. Query database for sensor with this API key
   * 3. Check sensor exists
   * 4. Check sensor status is 'active'
   * 5. Return sensor document
   *
   * Security:
   * - Generic error messages (don't reveal why validation failed)
   * - Same error for "not found" and "not active"
   * - Prevents API key enumeration
   *
   * Performance:
   * - Database query indexed on apiKey (fast O(log n))
   * - Single query gets sensor with all needed fields
   *
   * Why return sensor?
   * - Avoid second database query in storeReading
   * - Sensor ID needed for reading document
   * - Efficient data flow
   */
  private async validateApiKey(apiKey: string) {
    // Check API key provided (should never fail due to guard)
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Query database for sensor with this API key
    const sensor = await this.sensorsService.findByApiKey(apiKey);

    // Check sensor exists
    if (!sensor) {
      throw new UnauthorizedException('Unauthorized'); // Generic message
    }

    // Check sensor is active (not inactive or maintenance)
    if (sensor.status !== 'active') {
      throw new UnauthorizedException('Unauthorized'); // Generic message
    }

    // Valid API key with active sensor
    return sensor;
  }

  /**
   * Validate Reading Data
   *
   * Additional business logic validation beyond DTO validation.
   *
   * @param readingDto - Reading data to validate
   * @throws BadRequestException if validation fails
   *
   * Validation Rules:
   * 1. Timestamp not in future (vs server time)
   * 2. Timestamp not too old (optional, not implemented)
   * 3. Power calculation check (P = V × I, optional)
   * 4. Anomaly detection (optional, future)
   *
   * Why separate from DTO?
   * - DTO: Format validation (class-validator)
   * - Service: Business logic validation
   * - DTO doesn't have access to current server time
   * - Service can compare with previous readings
   *
   * DTO vs Service Validation:
   * - DTO: "Is this a number?" ✓
   * - DTO: "Is it in range 0-50?" ✓
   * - Service: "Is timestamp in the future?" ✓
   * - Service: "Is this an anomaly?" (future)
   */
  private validateReadingData(readingDto: CreateReadingDto): void {
    // Validate timestamp is not in the future
    const readingTime = new Date(readingDto.timestamp);
    const now = new Date();

    if (readingTime > now) {
      throw new BadRequestException('Timestamp cannot be in the future');
    }

    // Optional: Validate timestamp is not too old (e.g., > 24 hours)
    // const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // if (readingTime < oneDayAgo) {
    //   throw new BadRequestException('Timestamp is too old');
    // }

    // Optional: Validate power calculation (P = V × I)
    // const calculatedPower = readingDto.voltage * readingDto.current;
    // const powerDifference = Math.abs(calculatedPower - readingDto.power);
    // const tolerance = 0.1; // 10% tolerance
    // if (powerDifference > calculatedPower * tolerance) {
    //   throw new BadRequestException('Power calculation mismatch');
    // }

    // All validations passed
  }

  /**
   * Store Reading
   *
   * Saves the reading to MongoDB database.
   *
   * @param sensorId - Sensor ID (from validated sensor)
   * @param readingDto - Validated reading data
   * @returns Saved reading document
   * @throws Error if database operation fails
   *
   * Process:
   * 1. Create reading document
   * 2. Set sensorId (link to sensor)
   * 3. Set voltage, current, power from DTO
   * 4. Set timestamp from ESP32
   * 5. Set receivedAt to current server time (automatic)
   * 6. Set energy to 0 (calculated by analytics, Phase 8)
   * 7. Save to database
   * 8. Return saved document
   *
   * Data Transformations:
   * - timestamp: string → Date (from DTO)
   * - receivedAt: auto-set by schema default
   * - sensorId: string → ObjectId (Mongoose handles)
   * - energy: default 0 (calculated later)
   *
   * Future Enhancements:
   * - Calculate energy from previous reading
   * - Store energy per reading (not just aggregated)
   * - Add metadata field for additional ESP32 info
   */
  private async storeReading(
    sensorId: string,
    readingDto: CreateReadingDto,
  ): Promise<EnergyReadingDocument> {
    // Create reading document with all new fields
    const reading = new this.readingModel({
      sensorId, // Link to sensor
      voltage: readingDto.voltage,
      current: readingDto.current,
      power: readingDto.power,
      batteryPercentage: readingDto.batteryPercentage ?? 100, // Default to 100%
      temperature: readingDto.temperature,
      frequency: readingDto.frequency,
      stepCount: readingDto.stepCount,
      capacitorVoltage: readingDto.capacitorVoltage,
      wifiConnected: readingDto.wifiConnected,
      bluetoothConnected: readingDto.bluetoothConnected,
      timestamp: new Date(readingDto.timestamp), // Convert string to Date
      receivedAt: new Date(), // Server timestamp (now)
      energy: 0, // Will be calculated by analytics module
      source: readingDto.source ?? ReadingSource.HARDWARE, // Default to hardware
    });

    // Save to database
    return reading.save();
  }

  /**
   * Get Recent Readings
   *
   * Retrieves recent readings for dashboard or analytics.
   *
   * @param limit - Number of readings to retrieve (default: 10)
   * @returns Array of recent readings
   *
   * Usage:
   * - Dashboard: Display latest readings
   * - Analytics: Recent data analysis
   * - Monitoring: Check sensor activity
   *
   * Query:
   * - Sort by timestamp descending (newest first)
   * - Limit results to prevent large responses
   * - Populate sensor information (optional)
   *
   * Future Enhancement:
   * - Add filtering by sensor
   * - Add date range filtering
   * - Add pagination
   * - Populate sensor name/location
   */
  async getRecentReadings(
    limit: number = 10,
  ): Promise<EnergyReadingDocument[]> {
    return this.readingModel
      .find()
      .sort({ timestamp: -1 }) // Newest first
      .limit(limit)
      .exec();
  }

  /**
   * Get Readings by Sensor
   *
   * Retrieves all readings for a specific sensor.
   *
   * @param sensorId - Sensor ID
   * @param limit - Number of readings to retrieve (default: 100)
   * @returns Array of sensor readings
   *
   * Usage:
   * - Sensor detail page
   * - Analytics per sensor
   * - Historical data export
   *
   * Query:
   * - Filter by sensorId
   * - Sort by timestamp descending
   * - Limit results
   *
   * Performance:
   * - Uses compound index { sensorId, timestamp }
   * - Fast O(log n) query
   *
   * Future Enhancement:
   * - Add date range filtering
   * - Add pagination with skip/limit
   * - Add aggregation (avg, min, max)
   */
  async getReadingsBySensor(
    sensorId: string,
    limit: number = 100,
  ): Promise<EnergyReadingDocument[]> {
    return this.readingModel
      .find({ sensorId })
      .sort({ timestamp: -1 }) // Newest first
      .limit(limit)
      .exec();
  }

  /**
   * Count Total Readings
   *
   * Returns the total number of readings in database.
   *
   * @returns Total count of readings
   *
   * Usage:
   * - Dashboard statistics
   * - System monitoring
   * - Data retention reports
   *
   * Performance:
   * - Count operation on indexed collection
   * - Relatively fast for moderate datasets
   *
   * Note:
   * - For large datasets, consider caching this value
   * - Update cache on each insert
   */
  async countReadings(): Promise<number> {
    return this.readingModel.countDocuments().exec();
  }

  /**
   * Broadcast New Reading
   *
   * Broadcasts new energy reading to dashboard via WebSocket.
   *
   * @param reading - Energy reading document
   * @param sensor - Sensor document
   *
   * Process:
   * 1. Format reading data for broadcast
   * 2. Get dashboard gateway from service
   * 3. Broadcast to all connected clients
   *
   * Fire and Forget:
   * - Called async, doesn't block response to ESP32
   * - Errors logged but don't fail the request
   *
   * Event: 'reading:new'
   */
  private async broadcastNewReading(
    reading: EnergyReadingDocument,
    sensor: any,
  ): Promise<void> {
    try {
      const gateway = this.dashboardService.getGateway();

      const event: NewReadingEventDto = {
        id: reading._id.toString(),
        sensorId: sensor._id.toString(),
        sensorName: sensor.name,
        sensorLocation: sensor.location,
        voltage: reading.voltage,
        current: reading.current,
        power: reading.power,
        energy: reading.energy,
        batteryPercentage: reading.batteryPercentage,
        temperature: reading.temperature,
        frequency: reading.frequency,
        stepCount: reading.stepCount,
        capacitorVoltage: reading.capacitorVoltage,
        wifiConnected: reading.wifiConnected,
        bluetoothConnected: reading.bluetoothConnected,
        timestamp: reading.timestamp,
        receivedAt: reading.receivedAt,
      };

      gateway.broadcastNewReading(event);
    } catch (error) {
      // Log error but don't throw (fire and forget)
      console.error('Failed to broadcast new reading:', error);
    }
  }

  /**
   * Check Power Threshold
   *
   * Checks if reading power exceeds threshold and sends alert.
   *
   * @param reading - Energy reading document
   * @param sensor - Sensor document
   *
   * Process:
   * 1. Get threshold from config
   * 2. Compare reading power with threshold
   * 3. If exceeded, broadcast power alert
   *
   * Fire and Forget:
   * - Called async, doesn't block response
   * - Errors logged but don't fail request
   *
   * Event: 'alert:power'
   *
   * Future Enhancement:
   * - Per-sensor thresholds
   * - Alert throttling (don't spam alerts)
   * - Multiple severity levels
   * - Alert history tracking
   */
  private async checkPowerThreshold(
    reading: EnergyReadingDocument,
    sensor: any,
  ): Promise<void> {
    try {
      // Get threshold from config (default: 100W)
      const threshold =
        this.configService.get<number>('NOTIFICATION_THRESHOLD_POWER') || 100;

      // Check if power exceeds threshold
      if (reading.power > threshold) {
        const gateway = this.dashboardService.getGateway();

        const alert: PowerAlertEventDto = {
          alertId: `alert_${reading._id.toString()}`,
          sensorId: sensor._id.toString(),
          sensorName: sensor.name,
          sensorLocation: sensor.location,
          power: reading.power,
          threshold,
          message: `Power threshold exceeded: ${reading.power}W > ${threshold}W`,
          timestamp: new Date(),
          severity: reading.power > threshold * 1.5 ? 'critical' : 'warning',
        };

        gateway.broadcastPowerAlert(alert);
      }
    } catch (error) {
      // Log error but don't throw (fire and forget)
      console.error('Failed to check power threshold:', error);
    }
  }

  /**
   * Get Latest Reading for Sensor
   *
   * Retrieves the most recent reading for a specific sensor.
   *
   * @param sensorId - Sensor ID
   * @returns Latest reading with virtual fields
   * @throws NotFoundException if no readings found
   */
  async getLatestReading(sensorId: string): Promise<EnergyReadingDocument> {
    // Validate sensor ID format
    if (!Types.ObjectId.isValid(sensorId)) {
      throw new BadRequestException('Invalid sensor ID format');
    }

    const reading = await this.readingModel
      .findOne({ sensorId: new Types.ObjectId(sensorId) })
      .sort({ timestamp: -1 })
      .exec();

    if (!reading) {
      throw new NotFoundException(`No readings found for sensor ${sensorId}`);
    }

    return reading;
  }

  /**
   * Get Latest Readings for All Sensors
   *
   * Retrieves the most recent reading for each sensor.
   * Uses aggregation pipeline for efficient query.
   *
   * @returns Array of latest readings per sensor
   */
  async getLatestReadings(): Promise<EnergyReadingDocument[]> {
    // Aggregation pipeline to get latest reading per sensor
    const latestReadings = await this.readingModel.aggregate([
      // Sort by timestamp descending
      { $sort: { timestamp: -1 } },

      // Group by sensorId and take first (latest) reading
      {
        $group: {
          _id: '$sensorId',
          latestReading: { $first: '$$ROOT' },
        },
      },

      // Replace root with the latest reading document
      { $replaceRoot: { newRoot: '$latestReading' } },

      // Sort by timestamp for consistent ordering
      { $sort: { timestamp: -1 } },
    ]);

    return latestReadings;
  }

  /**
   * Get Reading History
   *
   * Retrieves paginated reading history for a sensor with filters.
   *
   * @param sensorId - Sensor ID
   * @param query - Query parameters (date range, pagination, source)
   * @returns Paginated readings with metadata
   */
  async getReadingHistory(
    sensorId: string,
    query: ReadingQueryDto,
  ): Promise<PaginatedReadingsResponseDto> {
    // Validate sensor ID format
    if (!Types.ObjectId.isValid(sensorId)) {
      throw new BadRequestException('Invalid sensor ID format');
    }

    // Build query filter
    const filter: any = { sensorId: new Types.ObjectId(sensorId) };

    // Add date range filter
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) {
        filter.timestamp.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.timestamp.$lte = new Date(query.endDate);
      }
    }

    // Add source filter
    if (query.source) {
      filter.source = query.source;
    }

    // Calculate pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [readings, total] = await Promise.all([
      this.readingModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.readingModel.countDocuments(filter).exec(),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      readings: readings as any,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get Reading Statistics
   *
   * Calculates aggregated statistics for sensor readings.
   *
   * @param sensorId - Sensor ID
   * @param query - Query parameters (date range, source)
   * @returns Aggregated statistics
   */
  async getReadingStatistics(
    sensorId: string,
    query: StatisticsQueryDto,
  ): Promise<ReadingStatisticsResponseDto> {
    // Validate sensor ID format
    if (!Types.ObjectId.isValid(sensorId)) {
      throw new BadRequestException('Invalid sensor ID format');
    }

    // Build match filter
    const matchFilter: any = { sensorId: new Types.ObjectId(sensorId) };

    // Add date range filter
    if (query.startDate || query.endDate) {
      matchFilter.timestamp = {};
      if (query.startDate) {
        matchFilter.timestamp.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        matchFilter.timestamp.$lte = new Date(query.endDate);
      }
    }

    // Add source filter
    if (query.source) {
      matchFilter.source = query.source;
    }

    // Aggregation pipeline
    const stats = await this.readingModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalReadings: { $sum: 1 },
          minVoltage: { $min: '$voltage' },
          maxVoltage: { $max: '$voltage' },
          avgVoltage: { $avg: '$voltage' },
          minCurrent: { $min: '$current' },
          maxCurrent: { $max: '$current' },
          avgCurrent: { $avg: '$current' },
          minPower: { $min: '$power' },
          maxPower: { $max: '$power' },
          avgPower: { $avg: '$power' },
          totalEnergy: { $sum: '$energy' },
          minBattery: { $min: '$batteryPercentage' },
          maxBattery: { $max: '$batteryPercentage' },
          avgBattery: { $avg: '$batteryPercentage' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          avgTemperature: { $avg: '$temperature' },
          minFrequency: { $min: '$frequency' },
          maxFrequency: { $max: '$frequency' },
          avgFrequency: { $avg: '$frequency' },
          totalSteps: { $sum: '$stepCount' },
          minCapacitorVoltage: { $min: '$capacitorVoltage' },
          maxCapacitorVoltage: { $max: '$capacitorVoltage' },
          avgCapacitorVoltage: { $avg: '$capacitorVoltage' },
          minTimestamp: { $min: '$timestamp' },
          maxTimestamp: { $max: '$timestamp' },
        },
      },
    ]);

    // No readings found
    if (stats.length === 0) {
      throw new NotFoundException(`No readings found for sensor ${sensorId}`);
    }

    const result = stats[0];

    // Build response
    const response: ReadingStatisticsResponseDto = {
      sensorId,
      totalReadings: result.totalReadings,
      startDate: result.minTimestamp,
      endDate: result.maxTimestamp,
      voltage: {
        min: result.minVoltage,
        max: result.maxVoltage,
        avg: result.avgVoltage,
      },
      current: {
        min: result.minCurrent,
        max: result.maxCurrent,
        avg: result.avgCurrent,
      },
      power: {
        min: result.minPower,
        max: result.maxPower,
        avg: result.avgPower,
      },
      totalEnergy: result.totalEnergy,
      battery: {
        min: result.minBattery,
        max: result.maxBattery,
        avg: result.avgBattery,
      },
      totalSteps: result.totalSteps || 0,
    };

    // Add temperature stats if available
    if (result.minTemperature !== null) {
      response.temperature = {
        min: result.minTemperature,
        max: result.maxTemperature,
        avg: result.avgTemperature,
      };
    }

    // Add frequency stats if available
    if (result.minFrequency !== null) {
      response.frequency = {
        min: result.minFrequency,
        max: result.maxFrequency,
        avg: result.avgFrequency,
      };
    }

    // Add capacitor voltage stats if available
    if (result.minCapacitorVoltage !== null) {
      response.capacitorVoltage = {
        min: result.minCapacitorVoltage,
        max: result.maxCapacitorVoltage,
        avg: result.avgCapacitorVoltage,
      };
    }

    return response;
  }

  // ============================================================
  // PHASE 7: EVENT EMISSION FOR NOTIFICATIONS
  // ============================================================

  /**
   * Check Battery Alerts (Phase 7)
   *
   * Checks battery level and emits alert events if thresholds crossed.
   *
   * Thresholds:
   * - <20%: Low battery warning
   * - <10%: Critical battery warning
   * - 100%: Full battery notification
   *
   * Throttling:
   * - Max 1 alert per threshold per 30 minutes
   *
   * @param reading - Energy reading document
   * @param sensor - Sensor document
   */
  private async checkBatteryAlerts(
    reading: EnergyReadingDocument,
    sensor: any,
  ): Promise<void> {
    // Skip if no battery data
    if (!reading.batteryPercentage) return;

    const battery = reading.batteryPercentage;
    const sensorId = sensor._id.toString();
    const now = Date.now();

    // Check throttling (30 minutes = 1800000ms)
    const lastAlertTime = this.batteryAlertCache.get(sensorId) || 0;
    if (now - lastAlertTime < 1800000) {
      return; // Throttled
    }

    // Get thresholds from config
    const lowThreshold =
      this.configService.get<number>('BATTERY_ALERT_LOW_1') || 20;
    const criticalThreshold =
      this.configService.get<number>('BATTERY_ALERT_LOW_2') || 10;
    const fullThreshold =
      this.configService.get<number>('BATTERY_ALERT_FULL') || 100;

    // Determine alert type
    let alertType: 'low' | 'critical' | 'full' | null = null;
    let threshold = 0;

    if (battery >= fullThreshold) {
      alertType = 'full';
      threshold = fullThreshold;
    } else if (battery <= criticalThreshold) {
      alertType = 'critical';
      threshold = criticalThreshold;
    } else if (battery <= lowThreshold) {
      alertType = 'low';
      threshold = lowThreshold;
    }

    // Emit event if alert triggered
    if (alertType) {
      this.eventEmitter.emit('battery.alert', {
        sensorId,
        sensorName: sensor.name,
        sensorLocation: sensor.location,
        batteryLevel: battery,
        threshold,
        timestamp: new Date(),
        alertType,
      });

      // Update cache
      this.batteryAlertCache.set(sensorId, now);
    }
  }

  /**
   * Check Energy Milestones (Phase 7)
   *
   * Tracks daily energy and emits milestone events.
   *
   * Milestones:
   * - 100Wh, 500Wh, 1000Wh (1kWh), 5000Wh (5kWh)
   *
   * @param reading - Energy reading document
   */
  private async checkEnergyMilestones(
    reading: EnergyReadingDocument,
  ): Promise<void> {
    // Get today's date key
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `energy_${today}`;

    // Get current daily total from cache (or calculate)
    let dailyTotal = this.dailyEnergyCache.get(cacheKey) || 0;

    // Add this reading's contribution (power * time interval)
    // For simplicity, assume power is sustained for 1 minute = 60 seconds
    // Energy (Wh) = Power (W) * Time (hours)
    // If reading every minute: Energy += Power / 60
    const energyContribution = reading.power / 60; // Wh
    dailyTotal += energyContribution;

    // Update cache
    this.dailyEnergyCache.set(cacheKey, dailyTotal);

    // Check milestones
    const milestones = [100, 500, 1000, 5000];
    const enabledMilestones = milestones.filter((m) => {
      const key = `MILESTONE_${m}WH`;
      return this.configService.get<string>(key) === 'true';
    });

    // Check if any milestone was just crossed
    const previousTotal = dailyTotal - energyContribution;
    for (const milestone of enabledMilestones) {
      if (previousTotal < milestone && dailyTotal >= milestone) {
        // Milestone reached!
        this.eventEmitter.emit('energy.milestone.reached', {
          milestone,
          totalEnergy: dailyTotal,
          timestamp: new Date(),
        });
        break; // Only emit once per reading
      }
    }

    // Reset cache at midnight (cleanup old entries)
    this.cleanupEnergyCache();
  }

  /**
   * Cleanup Energy Cache
   *
   * Removes old date entries from cache.
   */
  private cleanupEnergyCache(): void {
    const today = new Date().toISOString().split('T')[0];
    const keys = Array.from(this.dailyEnergyCache.keys());

    for (const key of keys) {
      if (!key.includes(today)) {
        this.dailyEnergyCache.delete(key);
      }
    }
  }
}
