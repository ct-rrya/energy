import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * NotificationLog Document Type
 */
export type NotificationLogDocument = NotificationLog & Document;

/**
 * Notification Type Enum
 */
export enum NotificationType {
  MILESTONE = 'milestone',
  BATTERY = 'battery',
  SENSOR = 'sensor',
  SYSTEM = 'system',
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_SUMMARY = 'weekly_summary',
  BROADCAST = 'broadcast',
}

/**
 * Notification Status Enum
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

/**
 * NotificationLog Schema
 * 
 * Stores complete history of all notifications sent to subscribers.
 * 
 * Purpose:
 * - Audit trail for all notifications
 * - Delivery tracking and analytics
 * - Debugging failed notifications
 * - Broadcast campaign tracking
 * 
 * Retention: 90 days (configurable)
 */
@Schema({
  timestamps: true,
  collection: 'notification_logs',
})
export class NotificationLog {
  /**
   * Subscriber ID (Facebook PSID)
   * 
   * Reference to Subscriber.facebookUserId
   */
  @Prop({
    required: true,
    index: true,
  })
  subscriberId: string;

  /**
   * Notification Type
   * 
   * Type of notification sent.
   */
  @Prop({
    required: true,
    type: String,
    enum: Object.values(NotificationType),
    index: true,
  })
  type: NotificationType;

  /**
   * Message Content
   * 
   * Full text of the message sent.
   */
  @Prop({
    required: true,
    type: String,
  })
  content: string;

  /**
   * Delivery Status
   * 
   * Current status of the notification.
   * - pending: Created but not yet sent
   * - sent: Sent to Facebook API
   * - delivered: Confirmed delivered by Facebook (future)
   * - failed: Failed to send
   */
  @Prop({
    required: true,
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true,
  })
  status: NotificationStatus;

  /**
   * Sent At
   * 
   * Timestamp when notification was successfully sent.
   */
  @Prop({
    type: Date,
  })
  sentAt?: Date;

  /**
   * Error Message
   * 
   * Error details if status is 'failed'.
   */
  @Prop({
    type: String,
  })
  errorMessage?: string;

  /**
   * Metadata
   * 
   * Additional context about the notification.
   * Structure depends on notification type.
   */
  @Prop({
    type: Object,
  })
  metadata?: {
    milestone?: number; // For milestone notifications
    batteryLevel?: number; // For battery notifications
    sensorName?: string; // For sensor notifications
    sensorLocation?: string; // For sensor notifications
    broadcastId?: string; // For broadcast notifications
    alertType?: string; // For system alerts
    [key: string]: any;
  };
}

export const NotificationLogSchema =
  SchemaFactory.createForClass(NotificationLog);

/**
 * Schema Indexes
 * 
 * Optimized for common queries:
 * - Find logs by subscriber
 * - Filter by type
 * - Filter by status
 * - Sort by date
 * - Find broadcast logs
 */
NotificationLogSchema.index({ subscriberId: 1, createdAt: -1 });
NotificationLogSchema.index({ type: 1, createdAt: -1 });
NotificationLogSchema.index({ status: 1, createdAt: -1 });
NotificationLogSchema.index({ 'metadata.broadcastId': 1 });

/**
 * Schema Transformation
 */
NotificationLogSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
