import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sensor, SensorDocument } from './schemas/sensor.schema';
import { CreateSensorDto, UpdateSensorDto } from './dto';
import { generateSensorApiKey } from './utils/api-key-generator';

/**
 * Sensors Service
 *
 * Handles all sensor-related business logic and database operations.
 *
 * Responsibilities:
 * - CRUD operations for sensors
 * - API key generation and validation
 * - Sensor status management
 * - Database queries and filtering
 * - Soft delete implementation
 *
 * Used by:
 * - SensorsController (REST API)
 * - IoT Module (API key validation) - Phase 5
 *
 * Security:
 * - All operations require admin authentication (handled by controller)
 * - API keys are unique and validated
 * - Soft delete preserves historical data
 */
@Injectable()
export class SensorsService {
  constructor(
    @InjectModel(Sensor.name)
    private sensorModel: Model<SensorDocument>,
  ) {}

  /**
   * Create New Sensor
   *
   * Registers a new sensor device in the system and generates API key.
   *
   * @param createSensorDto - Sensor creation data
   * @returns Created sensor with API key
   * @throws ConflictException if API key generation fails (unlikely)
   *
   * Process:
   * 1. Generate unique API key
   * 2. Check if API key already exists (collision detection)
   * 3. Create sensor in database
   * 4. Return sensor with API key
   *
   * Note:
   * - API key is only returned in create response
   * - Administrator must save API key for ESP32 configuration
   * - API key cannot be retrieved later (security)
   *
   * Usage:
   * ```typescript
   * const sensor = await sensorsService.create({
   *   name: 'Main Entrance',
   *   location: 'Building A'
   * });
   * console.log(sensor.apiKey); // Configure ESP32 with this key
   * ```
   */
  async create(createSensorDto: CreateSensorDto): Promise<SensorDocument> {
    // Generate unique API key
    let apiKey = generateSensorApiKey();
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure API key is unique (collision detection)
    while (attempts < maxAttempts) {
      const existing = await this.sensorModel.findOne({ apiKey }).exec();

      if (!existing) {
        // API key is unique, break loop
        break;
      }

      // Collision detected (extremely rare), generate new key
      apiKey = generateSensorApiKey();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // Failed to generate unique key after 5 attempts (virtually impossible)
      throw new ConflictException(
        'Failed to generate unique API key. Please try again.',
      );
    }

    // Create sensor with generated API key
    const sensor = new this.sensorModel({
      ...createSensorDto,
      apiKey,
      isActive: true,
    });

    return sensor.save();
  }

  /**
   * Find All Sensors
   *
   * Retrieves all active sensors from the database.
   *
   * @returns Array of active sensors (excludes soft-deleted)
   *
   * Filtering:
   * - Only returns sensors where isActive = true
   * - Excludes API keys for security
   * - Sorted by creation date (newest first)
   *
   * Future Enhancement:
   * - Add pagination (limit, offset)
   * - Add filtering (by status, location)
   * - Add search (by name)
   * - Add sorting options
   *
   * Usage:
   * ```typescript
   * const sensors = await sensorsService.findAll();
   * ```
   */
  async findAll(): Promise<SensorDocument[]> {
    return this.sensorModel
      .find({ isActive: true })
      .select('-apiKey') // Exclude API key from results
      .sort({ createdAt: -1 }) // Newest first
      .exec();
  }

  /**
   * Find Sensor by ID
   *
   * Retrieves a single sensor by its ID.
   *
   * @param id - Sensor ID (MongoDB ObjectId)
   * @returns Sensor document (without API key)
   * @throws NotFoundException if sensor not found or deleted
   *
   * Security:
   * - API key is excluded from response
   * - Only returns active sensors (isActive = true)
   *
   * Usage:
   * ```typescript
   * const sensor = await sensorsService.findOne('64f9a1b2c3d4e5f6g7h8i9j0');
   * ```
   */
  async findOne(id: string): Promise<SensorDocument> {
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid sensor ID format');
    }

    const sensor = await this.sensorModel
      .findOne({ _id: id, isActive: true })
      .select('-apiKey') // Exclude API key
      .exec();

    if (!sensor) {
      throw new NotFoundException(`Sensor with ID "${id}" not found`);
    }

    return sensor;
  }

  /**
   * Find Sensor by API Key
   *
   * Retrieves a sensor by its API key.
   * Used by IoT module to validate ESP32 requests.
   *
   * @param apiKey - Sensor API key
   * @returns Sensor document (includes API key)
   * @returns null if sensor not found
   *
   * Security:
   * - Only returns active sensors (isActive = true)
   * - Checks sensor status (must be 'active')
   * - Used internally by IoT module
   *
   * Note:
   * - This method returns null instead of throwing error
   * - IoT module handles authentication error
   * - Returns full sensor document including API key
   *
   * Usage (in IoT module):
   * ```typescript
   * const sensor = await sensorsService.findByApiKey(apiKey);
   * if (!sensor || sensor.status !== 'active') {
   *   throw new UnauthorizedException('Invalid API key');
   * }
   * ```
   */
  async findByApiKey(apiKey: string): Promise<SensorDocument | null> {
    return this.sensorModel.findOne({ apiKey, isActive: true }).exec();
  }

  /**
   * Update Sensor
   *
   * Updates sensor information (name, location, status, metadata).
   *
   * @param id - Sensor ID
   * @param updateSensorDto - Fields to update
   * @returns Updated sensor (without API key)
   * @throws NotFoundException if sensor not found
   *
   * Restrictions:
   * - Cannot update API key (use regenerateApiKey instead)
   * - Cannot update isActive (use remove instead)
   * - Cannot update lastSeenAt (managed by IoT module)
   *
   * Usage:
   * ```typescript
   * const updated = await sensorsService.update(id, {
   *   status: 'maintenance',
   *   metadata: { notes: 'Under maintenance' }
   * });
   * ```
   */
  async update(
    id: string,
    updateSensorDto: UpdateSensorDto,
  ): Promise<SensorDocument> {
    // Validate sensor exists
    await this.findOne(id);

    // Update sensor
    const updatedSensor = await this.sensorModel
      .findByIdAndUpdate(
        id,
        { $set: updateSensorDto },
        { new: true }, // Return updated document
      )
      .select('-apiKey')
      .exec();

    if (!updatedSensor) {
      throw new NotFoundException(`Sensor with ID "${id}" not found`);
    }

    return updatedSensor;
  }

  /**
   * Delete Sensor (Soft Delete)
   *
   * Marks sensor as inactive (soft delete).
   * Preserves sensor and its historical data.
   *
   * @param id - Sensor ID
   * @returns Deleted sensor
   * @throws NotFoundException if sensor not found
   *
   * Implementation:
   * - Sets isActive = false
   * - Sensor remains in database
   * - Historical readings preserved
   * - Can be "undeleted" if needed
   *
   * Alternative (Hard Delete):
   * - Would remove sensor from database
   * - Would orphan energy readings
   * - Not recommended for production
   *
   * Usage:
   * ```typescript
   * await sensorsService.remove('64f9a1b2c3d4e5f6g7h8i9j0');
   * ```
   */
  async remove(id: string): Promise<SensorDocument> {
    // Validate sensor exists
    await this.findOne(id);

    // Soft delete: Set isActive to false
    const deletedSensor = await this.sensorModel
      .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
      .select('-apiKey')
      .exec();

    if (!deletedSensor) {
      throw new NotFoundException(`Sensor with ID "${id}" not found`);
    }

    return deletedSensor;
  }

  /**
   * Regenerate API Key
   *
   * Generates a new API key for a sensor.
   * Used when API key is compromised or lost.
   *
   * @param id - Sensor ID
   * @returns Sensor with new API key
   * @throws NotFoundException if sensor not found
   * @throws ConflictException if key generation fails
   *
   * Process:
   * 1. Validate sensor exists
   * 2. Generate new unique API key
   * 3. Update sensor with new key
   * 4. Return sensor with new API key
   *
   * Important:
   * - Old API key becomes invalid immediately
   * - ESP32 must be reconfigured with new key
   * - New key is only shown once
   *
   * Usage:
   * ```typescript
   * const sensor = await sensorsService.regenerateApiKey(id);
   * console.log(sensor.apiKey); // Configure ESP32 with new key
   * ```
   */
  async regenerateApiKey(id: string): Promise<SensorDocument> {
    // Validate sensor exists
    await this.findOne(id);

    // Generate new unique API key
    let apiKey = generateSensorApiKey();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const existing = await this.sensorModel.findOne({ apiKey }).exec();

      if (!existing) {
        break;
      }

      apiKey = generateSensorApiKey();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new ConflictException(
        'Failed to generate unique API key. Please try again.',
      );
    }

    // Update sensor with new API key
    const updatedSensor = await this.sensorModel
      .findByIdAndUpdate(id, { $set: { apiKey } }, { new: true })
      .exec();

    if (!updatedSensor) {
      throw new NotFoundException(`Sensor with ID "${id}" not found`);
    }

    // Return sensor WITH API key (exception to normal rule)
    return updatedSensor;
  }

  /**
   * Update Last Seen Timestamp
   *
   * Updates the lastSeenAt field when sensor sends data.
   * Called by IoT module when receiving readings.
   *
   * @param id - Sensor ID
   * @returns void
   *
   * Note:
   * - Fire and forget operation
   * - Does not return updated sensor
   * - Atomic update operation
   * - Used for health monitoring
   *
   * Usage (in IoT module):
   * ```typescript
   * await sensorsService.updateLastSeen(sensor._id);
   * ```
   */
  async updateLastSeen(id: string): Promise<void> {
    await this.sensorModel
      .findByIdAndUpdate(id, {
        $set: { lastSeenAt: new Date() },
      })
      .exec();
  }

  /**
   * Count Active Sensors
   *
   * Returns the total number of active sensors.
   * Used for dashboard statistics.
   *
   * @returns Number of active sensors
   *
   * Usage:
   * ```typescript
   * const count = await sensorsService.count();
   * console.log(`Total active sensors: ${count}`);
   * ```
   */
  async count(): Promise<number> {
    return this.sensorModel.countDocuments({ isActive: true }).exec();
  }
}
