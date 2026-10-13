import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Subscriber Document Type
 */
export type SubscriberDocument = Subscriber & Document;

/**
 * Subscriber Schema
 *
 * Stores Facebook Messenger subscribers for notifications.
 *
 * Purpose:
 * - Track who subscribed via Messenger Bot
 * - Store notification preferences
 * - Send targeted notifications
 *
 * Usage:
 * - Subscribe: User sends "subscribe" command
 * - Unsubscribe: User sends "unsubscribe" command
 * - Notifications: Send to all active subscribers
 */
@Schema({
  timestamps: true,
  collection: 'subscribers',
})
export class Subscriber {
  /**
   * Facebook User ID (PSID)
   *
   * Page-Scoped ID from Facebook Messenger.
   * Unique identifier for the user.
   */
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  facebookUserId: string;

  /**
   * First Name (from Facebook profile)
   */
  @Prop({
    required: false,
  })
  firstName?: string;

  /**
   * Last Name (from Facebook profile)
   */
  @Prop({
    required: false,
  })
  lastName?: string;

  /**
   * Is Subscribed
   *
   * True if user is subscribed to notifications.
   * False if user unsubscribed.
   */
  @Prop({
    required: true,
    default: true,
  })
  isSubscribed: boolean;

  /**
   * Subscribed At
   *
   * When user subscribed.
   */
  @Prop({
    required: true,
    default: Date.now,
  })
  subscribedAt: Date;

  /**
   * Unsubscribed At
   *
   * When user unsubscribed (null if never unsubscribed).
   */
  @Prop({
    required: false,
  })
  unsubscribedAt?: Date;

  /**
   * Last Interaction At
   *
   * When user last sent a message.
   */
  @Prop({
    required: false,
  })
  lastInteractionAt?: Date;

  /**
   * Notification Preferences (Legacy - kept for backward compatibility)
   *
   * What notifications user wants to receive.
   */
  @Prop({
    type: Object,
    default: {
      dailyReport: true,
      weeklyReport: true,
      alerts: true,
    },
  })
  preferences: {
    dailyReport: boolean;
    weeklyReport: boolean;
    alerts: boolean;
  };

  // ============================================================
  // PHASE 7 ENHANCEMENTS - Notification Platform
  // ============================================================

  /**
   * Subscriber Status
   *
   * - active: Normal subscriber, receives notifications
   * - inactive: Temporarily inactive (e.g., away)
   * - blocked: Blocked by admin, no notifications
   */
  @Prop({
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active',
    index: true,
  })
  status: 'active' | 'inactive' | 'blocked';

  /**
   * Tags for Segmentation
   *
   * Used for targeted broadcasts.
   * Examples: ['vip', 'tester', 'beta', 'developer']
   */
  @Prop({
    type: [String],
    default: [],
    index: true,
  })
  tags: string[];

  /**
   * Enhanced Notification Preferences
   *
   * Granular control over notification types.
   */
  @Prop({
    type: Object,
    default: {
      dailyReport: true,
      weeklyReport: true,
      alerts: true,
      energyMilestones: true,
      batteryAlerts: true,
      sensorEvents: true,
      systemAlerts: true,
    },
  })
  notificationPreferences: {
    dailyReport: boolean;
    weeklyReport: boolean;
    alerts: boolean;
    energyMilestones: boolean;
    batteryAlerts: boolean;
    sensorEvents: boolean;
    systemAlerts: boolean;
  };

  /**
   * Total Notifications Received
   *
   * Counter for analytics.
   */
  @Prop({
    type: Number,
    default: 0,
  })
  totalNotificationsReceived: number;

  /**
   * Last Notification Sent At
   *
   * Timestamp of last notification sent to this subscriber.
   */
  @Prop({
    type: Date,
  })
  lastNotificationAt?: Date;

  /**
   * Blocked Reason
   *
   * Why subscriber was blocked (if status is 'blocked').
   */
  @Prop({
    type: String,
  })
  blockedReason?: string;

  /**
   * Blocked At
   *
   * When subscriber was blocked.
   */
  @Prop({
    type: Date,
  })
  blockedAt?: Date;
}

export const SubscriberSchema = SchemaFactory.createForClass(Subscriber);

/**
 * Schema Transformation
 */
SubscriberSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
