import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Alert Document Type
 */
export type AlertDocument = Alert & Document;

/**
 * Alert Severity Enum
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Alert Type Enum
 */
export enum AlertType {
  BATTERY_LOW = 'battery_low',
  BATTERY_CRITICAL = 'battery_critical',
  SENSOR_OFFLINE = 'sensor_offline',
  SENSOR_ONLINE = 'sensor_online',
  VOLTAGE_THRESHOLD = 'voltage_threshold',
  CURRENT_THRESHOLD = 'current_threshold',
  ENERGY_MILESTONE = 'energy_milestone',
  SYSTEM_ERROR = 'system_error',
  DATABASE_CONNECTION = 'database_connection',
  DEVICE_COMMUNICATION = 'device_communication',
}

/**
 * Alert Status Enum
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

/**
 * Alert Schema
 *
 * Represents system alerts for monitoring and notification.
 *
 * Purpose:
 * - Track system alerts independently from notification delivery
 * - Provide alert management interface for administrators
 * - Support alert acknowledgement and resolution workflow
 * - Enable alert history and analytics
 */
@Schema({
  timestamps: true,
  collection: 'alerts',
})
export class Alert {
  /**
   * Alert Title
   *
   * Short, descriptive title for the alert.
   */
  @Prop({
    required: true,
    type: String,
    index: true,
  })
  title: string;

  /**
   * Alert Description
   *
   * Detailed description of the alert.
   */
  @Prop({
    required: true,
    type: String,
  })
  description: string;

  /**
   * Alert Type
   *
   * Category of the alert.
   */
  @Prop({
    required: true,
    type: String,
    enum: Object.values(AlertType),
    index: true,
  })
  type: AlertType;

  /**
   * Alert Severity
   *
   * Severity level of the alert.
   */
  @Prop({
    required: true,
    type: String,
    enum: Object.values(AlertSeverity),
    index: true,
  })
  severity: AlertSeverity;

  /**
   * Alert Status
   *
   * Current status of the alert.
   */
  @Prop({
    required: true,
    type: String,
    enum: Object.values(AlertStatus),
    default: AlertStatus.ACTIVE,
    index: true,
  })
  status: AlertStatus;

  /**
   * Source Sensor ID
   *
   * Reference to the sensor that triggered the alert (if applicable).
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'Sensor',
    index: true,
  })
  sensorId?: Types.ObjectId;

  /**
   * Source Sensor Name
   *
   * Denormalized sensor name for faster queries.
   */
  @Prop({
    type: String,
  })
  sensorName?: string;

  /**
   * Source Sensor Location
   *
   * Denormalized sensor location.
   */
  @Prop({
    type: String,
  })
  sensorLocation?: string;

  /**
   * Metadata
   *
   * Additional context about the alert.
   * Structure depends on alert type.
   */
  @Prop({
    type: Object,
  })
  metadata?: {
    batteryLevel?: number;
    voltage?: number;
    current?: number;
    threshold?: number;
    milestone?: number;
    errorMessage?: string;
    errorCode?: string;
    [key: string]: any;
  };

  /**
   * Acknowledged By
   *
   * Reference to the user who acknowledged the alert.
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  acknowledgedBy?: Types.ObjectId;

  /**
   * Acknowledged At
   *
   * Timestamp when the alert was acknowledged.
   */
  @Prop({
    type: Date,
  })
  acknowledgedAt?: Date;

  /**
   * Resolved By
   *
   * Reference to the user who resolved the alert.
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  resolvedBy?: Types.ObjectId;

  /**
   * Resolved At
   *
   * Timestamp when the alert was resolved.
   */
  @Prop({
    type: Date,
  })
  resolvedAt?: Date;

  /**
   * Timestamps
   *
   * Automatically managed by Mongoose.
   */
  createdAt?: Date;
  updatedAt?: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

/**
 * Schema Indexes
 *
 * Optimized for common queries:
 * - Find active alerts
 * - Filter by severity
 * - Filter by type
 * - Filter by sensor
 * - Sort by date
 */
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ severity: 1, status: 1 });
AlertSchema.index({ type: 1, status: 1 });
AlertSchema.index({ sensorId: 1, createdAt: -1 });
AlertSchema.index({ createdAt: -1 });

/**
 * Schema Transformation
 */
AlertSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
