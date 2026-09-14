import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Reading Source Enum
 *
 * Indicates whether the reading came from real hardware or mock data.
 *
 * Values:
 * - hardware: Real ESP32/Arduino sensor data
 * - mock: Generated mock data for development/testing
 */
export enum ReadingSource {
  HARDWARE = 'hardware',
  MOCK = 'mock',
}

/**
 * Signal Quality Enum
 *
 * Indicates the quality of the sensor connection based on latency.
 *
 * Values:
 * - excellent: < 1 second latency
 * - good: 1-3 seconds latency
 * - fair: 3-10 seconds latency
 * - poor: > 10 seconds latency
 */
export enum SignalQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

/**
 * Energy Reading Document Type
 *
 * Represents an energy reading document from MongoDB with Mongoose methods.
 */
export type EnergyReadingDocument = EnergyReading & Document;

/**
 * Energy Reading Schema
 *
 * Stores energy readings received from ESP32 piezoelectric sensors.
 *
 * Purpose:
 * - Store raw sensor data (voltage, current, power)
 * - Calculate energy consumption (kWh)
 * - Track both ESP32 timestamp and server timestamp
 * - Link readings to specific sensors
 *
 * Relationships:
 * - Belongs to Sensor (via sensorId)
 * - Used by Analytics module for aggregations
 * - Used by Dashboard for real-time display
 *
 * Data Flow:
 * 1. ESP32 sends reading with timestamp
 * 2. Server receives and stores with receivedAt
 * 3. Energy calculated from power and time delta
 * 4. Reading linked to sensor via sensorId
 *
 * Indexes:
 * - Compound: { sensorId, timestamp } for sensor queries
 * - Single: timestamp for recent readings
 * - Future: TTL index for data retention
 */
@Schema({
  timestamps: true, // Automatically add createdAt and updatedAt
  collection: 'energy_readings',
})
export class EnergyReading {
  /**
   * Sensor ID
   *
   * Reference to the sensor that generated this reading.
   * Links to the Sensors collection.
   *
   * Usage:
   * - Query all readings for a specific sensor
   * - Join sensor metadata with readings
   * - Filter readings by sensor location/name
   *
   * Type: MongoDB ObjectId
   *
   * Example:
   * - "6a5a35213fe6213bf029d104"
   */
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Sensor', // Reference to Sensor model
    index: true, // Index for fast sensor queries
  })
  sensorId: Types.ObjectId;

  /**
   * Voltage (V)
   *
   * Voltage measurement from piezoelectric sensor in volts.
   *
   * Expected Range:
   * - Min: 0 V
   * - Max: 50 V (typical piezoelectric range)
   * - Common: 3-12 V
   *
   * Validation:
   * - Must be positive number
   * - Validated by DTO and service layer
   *
   * Usage:
   * - Calculate power (P = V × I)
   * - Monitor sensor health
   * - Detect anomalies
   *
   * Precision: Stored as double (64-bit float)
   */
  @Prop({
    required: true,
    type: Number,
    min: 0,
  })
  voltage: number;

  /**
   * Current (A)
   *
   * Current measurement from sensor in amperes.
   *
   * Expected Range:
   * - Min: 0 A
   * - Max: 10 A (typical ESP32 ADC range)
   * - Common: 0.01-1 A
   *
   * Validation:
   * - Must be positive number
   * - Validated by DTO and service layer
   *
   * Usage:
   * - Calculate power (P = V × I)
   * - Estimate energy harvesting efficiency
   * - Detect sensor malfunction
   *
   * Precision: Stored as double (64-bit float)
   */
  @Prop({
    required: true,
    type: Number,
    min: 0,
  })
  current: number;

  /**
   * Power (W)
   *
   * Instantaneous power in watts.
   * Can be calculated by ESP32 or server.
   *
   * Formula: P = V × I
   *
   * Expected Range:
   * - Min: 0 W
   * - Max: 500 W (theoretical max)
   * - Common: 0.1-50 W
   *
   * Usage:
   * - Real-time power monitoring
   * - Calculate energy over time
   * - Peak power detection
   * - Dashboard display
   *
   * Note:
   * - ESP32 can send pre-calculated power
   * - Server can recalculate for validation
   * - Stored value is what ESP32 sends
   */
  @Prop({
    required: true,
    type: Number,
    min: 0,
  })
  power: number;

  /**
   * Energy (kWh)
   *
   * Cumulative energy harvested in kilowatt-hours.
   * Calculated from power readings over time.
   *
   * Calculation:
   * - Energy = Power × Time
   * - E (kWh) = P (W) × t (hours) / 1000
   *
   * Example:
   * - 10W for 1 hour = 0.01 kWh
   * - 100W for 30 minutes = 0.05 kWh
   *
   * Usage:
   * - Total energy harvested per sensor
   * - Daily/weekly/monthly aggregations
   * - Environmental impact calculations
   * - Cost savings estimates
   *
   * Calculation Strategy:
   * - Option 1: Calculate during analytics aggregation
   * - Option 2: Calculate on insert using previous reading
   * - Current: Stored as 0, calculated by analytics module
   *
   * Future Enhancement:
   * - Calculate on insert using time delta
   * - Store incremental energy per reading
   */
  @Prop({
    required: true,
    type: Number,
    default: 0,
    min: 0,
  })
  energy: number;

  /**
   * Timestamp (from ESP32)
   *
   * When the reading was taken on the ESP32 device.
   * This is the ACTUAL measurement time.
   *
   * Source: ESP32 RTC or NTP-synced time
   * Format: ISO 8601 UTC
   *
   * Example: "2026-07-17T14:30:00.000Z"
   *
   * Usage:
   * - Chronological ordering of readings
   * - Time-series analysis
   * - Detect clock drift
   * - Compare with receivedAt for latency
   *
   * Validation:
   * - Must not be in the future (vs server time)
   * - Should be within reasonable range (e.g., not too old)
   *
   * Note:
   * - May differ from receivedAt due to network latency
   * - ESP32 time may drift if no NTP
   * - Use receivedAt for server-side ordering
   */
  @Prop({
    required: true,
    type: Date,
    index: true, // Index for time-series queries
  })
  timestamp: Date;

  /**
   * Received At (server time)
   *
   * When the server received and stored this reading.
   * This is the SERVER processing time.
   *
   * Source: Server clock (always accurate)
   * Format: ISO 8601 UTC
   *
   * Example: "2026-07-17T14:30:01.234Z"
   *
   * Usage:
   * - Calculate network/processing latency
   * - Server-side chronological ordering
   * - Detect delayed readings
   * - Database operations ordering
   *
   * Calculation:
   * - Latency = receivedAt - timestamp
   * - Normal: < 1 second
   * - Warning: > 5 seconds
   * - Critical: > 30 seconds
   *
   * Note:
   * - Always use server time (accurate)
   * - Set automatically on creation
   * - Cannot be modified by ESP32
   */
  @Prop({
    required: true,
    type: Date,
    default: Date.now, // Automatically set to current server time
  })
  receivedAt: Date;

  /**
   * Battery Percentage
   *
   * Battery charge level of the energy storage system.
   *
   * Range: 0-100%
   *
   * Usage:
   * - Monitor battery health
   * - Trigger low battery alerts
   * - Track charging efficiency
   * - Prevent over-discharge
   *
   * Alert Thresholds:
   * - Critical: < 10%
   * - Warning: < 20%
   * - Normal: >= 20%
   *
   * Default: 100 (fully charged)
   */
  @Prop({
    required: true,
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  })
  batteryPercentage: number;

  /**
   * Temperature (°C)
   *
   * Optional temperature reading from sensor environment.
   * Useful for detecting overheating or environmental conditions.
   *
   * Range: -40°C to 125°C (typical sensor range)
   *
   * Usage:
   * - Monitor sensor health
   * - Detect overheating
   * - Environmental analysis
   * - Calibration adjustments
   *
   * Optional: Not all sensors have temperature capability
   */
  @Prop({
    required: false,
    type: Number,
    min: -40,
    max: 125,
  })
  temperature?: number;

  /**
   * Frequency (Hz)
   *
   * Optional frequency measurement for piezoelectric sensors.
   * Indicates the vibration/pressure frequency being harvested.
   *
   * Range: 0-1000 Hz (typical piezoelectric range)
   * Common: 50-60 Hz (footstep frequency)
   *
   * Usage:
   * - Analyze energy harvesting efficiency
   * - Detect frequency patterns
   * - Optimize sensor placement
   * - Research applications
   *
   * Optional: Advanced sensors only
   */
  @Prop({
    required: false,
    type: Number,
    min: 0,
    max: 1000,
  })
  frequency?: number;

  /**
   * Reading Source
   *
   * Indicates whether this reading came from real hardware or mock data.
   *
   * Values:
   * - hardware: Real ESP32/Arduino sensor
   * - mock: Generated for development/testing
   *
   * Usage:
   * - Filter out mock data in production analytics
   * - Debug data pipeline
   * - Development vs production separation
   * - Data quality assurance
   *
   * Default: hardware (production mode)
   */
  @Prop({
    required: true,
    type: String,
    enum: ReadingSource,
    default: ReadingSource.HARDWARE,
    index: true, // Index for filtering by source
  })
  source: ReadingSource;

  /**
   * Timestamps
   *
   * Automatically managed by Mongoose timestamps option:
   * - createdAt: When document was inserted (same as receivedAt)
   * - updatedAt: When document was last modified (should never change)
   *
   * These fields are added automatically, no need to define them.
   *
   * Note:
   * - Readings are immutable (never updated after creation)
   * - updatedAt will equal createdAt
   * - Kept for schema consistency
   */
}

/**
 * Energy Reading Schema Factory
 *
 * Creates the Mongoose schema from the class definition.
 */
export const EnergyReadingSchema = SchemaFactory.createForClass(EnergyReading);

/**
 * Schema Indexes
 *
 * Optimized indexes for common query patterns.
 *
 * 1. Compound Index: { sensorId, timestamp }
 *    - Most common query: Get readings for sensor over time
 *    - Supports: "Find all readings for sensor X between dates Y and Z"
 *    - Order: timestamp descending (newest first)
 *
 * 2. Single Index: { timestamp }
 *    - Already defined in @Prop decorator
 *    - Supports: "Get all recent readings across all sensors"
 *    - Used by dashboard for latest readings
 *
 * 3. Single Index: { sensorId }
 *    - Already defined in @Prop decorator
 *    - Supports: "Get all readings for specific sensor"
 *    - Used by sensor detail page
 *
 * 4. Single Index: { source }
 *    - Already defined in @Prop decorator
 *    - Supports: "Filter by mock vs hardware data"
 *    - Used for development vs production separation
 *
 * Future Indexes:
 * 5. TTL Index: { createdAt: 1 }, expireAfterSeconds
 *    - Automatically delete old readings
 *    - Data retention policy (e.g., keep 1 year)
 *    - Reduces storage costs
 */
EnergyReadingSchema.index({ sensorId: 1, timestamp: -1 });
EnergyReadingSchema.index({ source: 1, timestamp: -1 }); // New: Filter by source

/**
 * Schema Transformation
 *
 * Transform the document when converting to JSON (for API responses).
 *
 * Changes:
 * - Rename _id to id
 * - Remove __v (version key)
 * - Keep all data fields
 *
 * This ensures consistent API responses across all endpoints.
 */
EnergyReadingSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Virtual Fields
 *
 * Computed properties not stored in database.
 * Available when documents are converted to JSON.
 */

/**
 * Signal Quality Virtual
 *
 * Calculates signal quality based on network latency.
 *
 * Logic:
 * - Excellent: < 1 second
 * - Good: 1-3 seconds
 * - Fair: 3-10 seconds
 * - Poor: > 10 seconds
 */
EnergyReadingSchema.virtual('signalQuality').get(function (
  this: EnergyReadingDocument,
) {
  const latency = this.receivedAt.getTime() - this.timestamp.getTime();

  if (latency < 1000) return SignalQuality.EXCELLENT;
  if (latency < 3000) return SignalQuality.GOOD;
  if (latency < 10000) return SignalQuality.FAIR;
  return SignalQuality.POOR;
});

/**
 * Latency Virtual
 *
 * Calculates network/processing latency in milliseconds.
 *
 * Calculation: receivedAt - timestamp
 */
EnergyReadingSchema.virtual('latency').get(function (
  this: EnergyReadingDocument,
) {
  return this.receivedAt.getTime() - this.timestamp.getTime();
});

/**
 * Power in Kilowatts Virtual
 *
 * Converts power from watts to kilowatts.
 */
EnergyReadingSchema.virtual('powerKW').get(function (
  this: EnergyReadingDocument,
) {
  return this.power / 1000;
});

/**
 * Enable virtuals in JSON
 */
EnergyReadingSchema.set('toJSON', {
  virtuals: true, // Include virtual fields
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
