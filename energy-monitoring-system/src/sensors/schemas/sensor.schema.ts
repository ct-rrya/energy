import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Sensor Status Enum
 *
 * Defines the operational status of a sensor device.
 *
 * Values:
 * - active: Sensor is operational and can send data
 * - inactive: Sensor is disabled and cannot send data
 * - maintenance: Sensor is under maintenance, temporarily offline
 */
export enum SensorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

/**
 * Sensor Metadata Interface
 *
 * Stores additional information about the sensor hardware and firmware.
 */
export interface SensorMetadata {
  hardwareVersion?: string;
  firmwareVersion?: string;
  model?: string;
  notes?: string;
}

/**
 * Sensor Document Type
 *
 * Represents a sensor document from MongoDB with Mongoose methods.
 */
export type SensorDocument = Sensor & Document;

/**
 * Sensor Schema
 *
 * Represents a registered piezoelectric sensor device (ESP32) in the system.
 *
 * Purpose:
 * - Track registered sensor devices
 * - Store sensor metadata and configuration
 * - Manage sensor authentication (API keys)
 * - Monitor sensor status and health
 *
 * Relationships:
 * - Has many EnergyReadings (via IoT module)
 * - Belongs to system (managed by admins)
 *
 * Authentication Flow:
 * 1. Admin registers sensor → API key generated
 * 2. ESP32 configured with API key
 * 3. ESP32 sends data with API key in header
 * 4. IoT module validates API key against this collection
 *
 * Security:
 * - API key is unique and indexed for fast lookup
 * - API key is NOT hashed (needed for ESP32 validation)
 * - Only admins can manage sensors
 * - ESP32 uses API key for data submission
 */
@Schema({
  timestamps: true, // Automatically add createdAt and updatedAt
  collection: 'sensors',
})
export class Sensor {
  /**
   * Sensor Name
   *
   * Human-readable identifier for the sensor.
   * Used in dashboards and reports.
   *
   * Examples:
   * - "Main Entrance Sensor"
   * - "Building A - Floor 1"
   * - "Cafeteria Entrance"
   *
   * Validation:
   * - Required field
   * - Trimmed whitespace
   */
  @Prop({
    required: true,
    trim: true,
    index: true, // Index for faster searches
  })
  name: string;

  /**
   * Sensor Location
   *
   * Physical location where the sensor is installed.
   * Helps administrators identify and manage sensors.
   *
   * Examples:
   * - "Building A - Main Entrance"
   * - "Campus Center - North Door"
   * - "Library - Floor 2 - Room 201"
   *
   * Validation:
   * - Required field
   * - Trimmed whitespace
   */
  @Prop({
    required: true,
    trim: true,
  })
  location: string;

  /**
   * Sensor Status
   *
   * Current operational status of the sensor.
   *
   * Values:
   * - active: Sensor is operational, can send data
   * - inactive: Sensor is disabled, cannot send data
   * - maintenance: Sensor is under maintenance
   *
   * Usage:
   * - IoT module checks this before accepting data
   * - Dashboard shows sensor status
   * - Alerts if sensor goes offline
   *
   * Default: active (new sensors are active by default)
   */
  @Prop({
    required: true,
    enum: SensorStatus,
    default: SensorStatus.ACTIVE,
    index: true, // Index for filtering by status
  })
  status: SensorStatus;

  /**
   * API Key
   *
   * Unique authentication key for ESP32 devices.
   * Used to authenticate data submissions to the IoT module.
   *
   * Format: "esp32_" + 32 random characters
   * Example: "esp32_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
   *
   * Security:
   * - Unique across all sensors (enforced by unique index)
   * - NOT hashed (ESP32 needs to send it as-is)
   * - Generated server-side using crypto.randomBytes
   * - Should be kept secret and only shared with ESP32
   *
   * Usage:
   * - ESP32 sends API key in X-API-Key header
   * - IoT module validates against this field
   * - Can be regenerated if compromised
   *
   * Note:
   * - Never exposed in public APIs
   * - Only returned during sensor creation
   * - Administrators can view but not modify directly
   */
  @Prop({
    required: true,
    unique: true, // Enforce uniqueness
    index: true, // Index for fast API key lookups
  })
  apiKey: string;

  /**
   * Installation Date
   *
   * When the sensor was physically installed.
   * Used for tracking sensor age and maintenance schedules.
   *
   * Default: Current date/time when sensor is created
   */
  @Prop({
    required: true,
    default: Date.now,
  })
  installationDate: Date;

  /**
   * Last Seen Timestamp
   *
   * Last time the sensor sent data to the system.
   * Updated by the IoT module when receiving readings.
   *
   * Purpose:
   * - Monitor sensor health and connectivity
   * - Detect offline sensors
   * - Trigger alerts if sensor hasn't reported
   *
   * Updated by: IoT module (not Sensors module)
   *
   * Alert Logic (Phase 11 - Notifications):
   * - If lastSeenAt > 10 minutes ago → Warning
   * - If lastSeenAt > 1 hour ago → Critical alert
   *
   * Initial value: null (until first reading received)
   */
  @Prop({
    required: false,
    default: null,
  })
  lastSeenAt: Date;

  /**
   * Sensor Metadata
   *
   * Additional information about the sensor hardware and firmware.
   * Stored as a flexible JSON object.
   *
   * Common fields:
   * - hardwareVersion: "v1.0", "v2.0"
   * - firmwareVersion: "v1.2.3"
   * - model: "ESP32-DevKitC"
   * - notes: "Replaced on 2026-07-01"
   *
   * Usage:
   * - Track sensor versions for maintenance
   * - Store custom configuration
   * - Document hardware changes
   *
   * Optional field (can be empty object)
   */
  @Prop({
    type: Object,
    required: false,
    default: {},
  })
  metadata: SensorMetadata;

  /**
   * Active Flag
   *
   * Soft delete flag. When false, sensor is considered deleted.
   *
   * Purpose:
   * - Preserve historical data and readings
   * - Allow "undelete" functionality
   * - Maintain referential integrity
   *
   * Implementation:
   * - Default: true (new sensors are active)
   * - On delete: Set to false (soft delete)
   * - Queries filter by isActive: true
   *
   * Note:
   * - Different from "status" field
   * - status = operational state (active/inactive/maintenance)
   * - isActive = existence flag (true/false)
   */
  @Prop({
    required: true,
    default: true,
    index: true, // Index for filtering active sensors
  })
  isActive: boolean;

  /**
   * Timestamps
   *
   * Automatically managed by Mongoose timestamps option:
   * - createdAt: When sensor was registered
   * - updatedAt: When sensor was last modified
   *
   * These fields are added automatically, no need to define them.
   */
}

/**
 * Sensor Schema Factory
 *
 * Creates the Mongoose schema from the class definition.
 */
export const SensorSchema = SchemaFactory.createForClass(Sensor);

/**
 * Schema Indexes
 *
 * Additional compound indexes for optimized queries.
 *
 * 1. Active sensors by status
 *    - Common query: Get all active sensors with specific status
 *    - Used in dashboard and monitoring
 *
 * 2. Name text search
 *    - Enable fuzzy search on sensor names
 *    - Used in sensor selection dropdowns
 */
SensorSchema.index({ isActive: 1, status: 1 });
SensorSchema.index({ name: 'text', location: 'text' });

/**
 * Schema Transformation
 *
 * Transform the document when converting to JSON (for API responses).
 *
 * Changes:
 * - Rename _id to id
 * - Remove __v (version key)
 * - Remove sensitive fields can be added here if needed
 *
 * This ensures consistent API responses across all endpoints.
 */
SensorSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
