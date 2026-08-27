import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  NotificationLog,
  NotificationLogDocument,
  NotificationType,
  NotificationStatus,
} from './schemas/notification-log.schema';
import { SubscribersService } from '../subscribers/subscribers.service';
import { MessengerService } from '../messenger/messenger.service';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  EnergyMilestoneEvent,
  BatteryAlertEvent,
  SensorOnlineEvent,
  SensorOfflineEvent,
  SystemAlertEvent,
} from './dto/notification-event.dto';
import {
  BroadcastMessageDto,
  BroadcastResultDto,
} from './dto/broadcast-message.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

/**
 * Notifications Service
 * 
 * Core service for the notification platform.
 * 
 * Responsibilities:
 * - Process notification events
 * - Send notifications via MessengerService
 * - Log all notifications to database
 * - Handle scheduled summaries (cron jobs)
 * - Broadcast messages to multiple subscribers
 * - Query notification logs
 * 
 * Architecture:
 * - Consumes MessengerService for sending
 * - Consumes SubscribersService for targeting
 * - Consumes AnalyticsService for data
 * - Never accesses IoT/Sensors DB directly
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly timezone: string;

  constructor(
    @InjectModel(NotificationLog.name)
    private notificationLogModel: Model<NotificationLogDocument>,
    private subscribersService: SubscribersService,
    private messengerService: MessengerService,
    private analyticsService: AnalyticsService,
    private configService: ConfigService,
  ) {
    this.timezone = this.configService.get<string>('NOTIFICATION_TIMEZONE') || 'Asia/Manila';
    this.logger.log(`Notifications Service initialized (Timezone: ${this.timezone})`);
  }


  // ============================================================
  // AUTOMATED NOTIFICATIONS
  // ============================================================

  /**
   * Send Energy Milestone Notification
   * 
   * Triggered when energy generation reaches milestone.
   * 
   * @param event - Energy milestone event data
   */
  async sendEnergyMilestone(event: EnergyMilestoneEvent): Promise<void> {
    this.logger.log(`Energy milestone reached: ${event.milestone}Wh`);

    // Get active subscribers with milestone preference
    const subscribers = await this.getSubscribersForNotification('energyMilestones');

    // Format message
    const message = this.formatEnergyMilestoneMessage(event);

    // Send to all subscribers
    await this.sendToMultiple(subscribers, NotificationType.MILESTONE, message, {
      milestone: event.milestone,
    });
  }

  /**
   * Send Battery Alert Notification
   * 
   * Triggered when battery crosses threshold.
   * 
   * @param event - Battery alert event data
   */
  async sendBatteryAlert(event: BatteryAlertEvent): Promise<void> {
    this.logger.log(
      `Battery alert: ${event.sensorName} at ${event.batteryLevel}%`,
    );

    // Get active subscribers with battery alert preference
    const subscribers = await this.getSubscribersForNotification('batteryAlerts');

    // Format message
    const message = this.formatBatteryAlertMessage(event);

    // Send to all subscribers
    await this.sendToMultiple(subscribers, NotificationType.BATTERY, message, {
      batteryLevel: event.batteryLevel,
      sensorName: event.sensorName,
      sensorLocation: event.sensorLocation,
    });
  }

  /**
   * Send Sensor Online Notification
   * 
   * Triggered when sensor comes online.
   * 
   * @param event - Sensor online event data
   */
  async sendSensorOnline(event: SensorOnlineEvent): Promise<void> {
    this.logger.log(`Sensor online: ${event.sensorName}`);

    // Get active subscribers with sensor events preference
    const subscribers = await this.getSubscribersForNotification('sensorEvents');

    // Format message
    const message = `✅ **Sensor Online**\n\n${event.sensorName} (${event.sensorLocation}) is now online and reporting data.\n\n📡 Status: Active\n⏰ Time: ${event.timestamp.toLocaleTimeString()}`;

    // Send to all subscribers
    await this.sendToMultiple(subscribers, NotificationType.SENSOR, message, {
      sensorName: event.sensorName,
      sensorLocation: event.sensorLocation,
    });
  }

  /**
   * Send Sensor Offline Notification
   * 
   * Triggered when sensor goes offline.
   * 
   * @param event - Sensor offline event data
   */
  async sendSensorOffline(event: SensorOfflineEvent): Promise<void> {
    this.logger.warn(`Sensor offline: ${event.sensorName}`);

    // Get active subscribers with sensor events preference
    const subscribers = await this.getSubscribersForNotification('sensorEvents');

    // Format message
    const message = `⚠️ **Sensor Offline**\n\n${event.sensorName} (${event.sensorLocation}) has gone offline.\n\n📡 Status: Inactive\n⏰ Last Seen: ${event.lastSeenAt.toLocaleTimeString()}\n\n💡 Check sensor connection.`;

    // Send to all subscribers
    await this.sendToMultiple(subscribers, NotificationType.SENSOR, message, {
      sensorName: event.sensorName,
      sensorLocation: event.sensorLocation,
    });
  }

  /**
   * Send System Alert Notification
   * 
   * Triggered for system-level events.
   * 
   * @param event - System alert event data
   */
  async sendSystemAlert(event: SystemAlertEvent): Promise<void> {
    this.logger.log(`System alert: ${event.alertType} - ${event.message}`);

    // Get active subscribers with system alerts preference
    const subscribers = await this.getSubscribersForNotification('systemAlerts');

    // Format message
    const emoji = event.severity === 'critical' ? '🚨' : event.severity === 'warning' ? '⚠️' : 'ℹ️';
    const message = `${emoji} **System ${event.alertType.toUpperCase()}**\n\n${event.message}\n\n⏰ Time: ${event.timestamp.toLocaleTimeString()}`;

    // Send to all subscribers
    await this.sendToMultiple(subscribers, NotificationType.SYSTEM, message, {
      alertType: event.alertType,
      severity: event.severity,
      ...event.metadata,
    });
  }


  // ============================================================
  // SCHEDULED SUMMARIES (CRON JOBS)
  // ============================================================

  /**
   * Send Daily Summary
   * 
   * Cron job: Every day at 8 PM (configurable via env)
   * 
   * Sends daily energy report to all subscribed users.
   */
  @Cron('0 20 * * *', {
    name: 'daily-summary',
    timeZone: 'Asia/Manila',
  })
  async sendDailySummary(): Promise<void> {
    this.logger.log('Starting daily summary job');

    try {
      // Get active subscribers with daily report preference
      const subscribers = await this.getSubscribersForNotification('dailyReport');

      if (subscribers.length === 0) {
        this.logger.log('No subscribers for daily summary');
        return;
      }

      // Get today's analytics
      const today = await this.analyticsService.getDailySummary(new Date());

      // Format message
      const message = this.formatDailySummaryMessage(today);

      // Send to all subscribers
      await this.sendToMultiple(
        subscribers,
        NotificationType.DAILY_SUMMARY,
        message,
      );

      this.logger.log(
        `Daily summary sent to ${subscribers.length} subscribers`,
      );
    } catch (error) {
      this.logger.error(`Failed to send daily summary: ${error.message}`, error.stack);
    }
  }

  /**
   * Send Weekly Summary
   * 
   * Cron job: Every Monday at 9 AM
   * 
   * Sends weekly energy report to all subscribed users.
   */
  @Cron('0 9 * * 1', {
    name: 'weekly-summary',
    timeZone: 'Asia/Manila',
  })
  async sendWeeklySummary(): Promise<void> {
    this.logger.log('Starting weekly summary job');

    try {
      // Get active subscribers with weekly report preference
      const subscribers = await this.getSubscribersForNotification('weeklyReport');

      if (subscribers.length === 0) {
        this.logger.log('No subscribers for weekly summary');
        return;
      }

      // Get this week's analytics
      const week = await this.analyticsService.getWeeklySummary();

      // Format message
      const message = this.formatWeeklySummaryMessage(week);

      // Send to all subscribers
      await this.sendToMultiple(
        subscribers,
        NotificationType.WEEKLY_SUMMARY,
        message,
      );

      this.logger.log(
        `Weekly summary sent to ${subscribers.length} subscribers`,
      );
    } catch (error) {
      this.logger.error(`Failed to send weekly summary: ${error.message}`, error.stack);
    }
  }


  // ============================================================
  // BROADCAST SYSTEM
  // ============================================================

  /**
   * Broadcast Message
   * 
   * Send message to multiple subscribers based on targeting.
   * 
   * @param dto - Broadcast message DTO
   * @returns Broadcast result with delivery statistics
   */
  async broadcastMessage(
    dto: BroadcastMessageDto,
  ): Promise<BroadcastResultDto> {
    this.logger.log('Starting broadcast');

    const broadcastId = `broadcast_${Date.now()}`;

    // Get target subscribers
    let subscribers;
    if (dto.targetAll) {
      subscribers = await this.subscribersService.getActiveSubscribers();
    } else if (dto.targetTags && dto.targetTags.length > 0) {
      // Filter by tags
      const allSubscribers = await this.subscribersService.getActiveSubscribers();
      subscribers = allSubscribers.filter((sub) =>
        dto.targetTags!.some((tag) => sub.tags.includes(tag)),
      );
    } else {
      subscribers = await this.subscribersService.getActiveSubscribers();
    }

    if (subscribers.length === 0) {
      return {
        broadcastId,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
        status: 'completed',
      };
    }

    // Send to all subscribers with rate limiting
    let sentCount = 0;
    let failedCount = 0;

    const batchSize = this.configService.get<number>('NOTIFICATION_RATE_LIMIT') || 50;
    const batchDelay = this.configService.get<number>('NOTIFICATION_BATCH_DELAY') || 100;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (subscriber) => {
          try {
            await this.sendNotification(
              subscriber.facebookUserId,
              NotificationType.BROADCAST,
              dto.message,
              { broadcastId },
            );
            sentCount++;
          } catch (error) {
            this.logger.error(
              `Failed to send broadcast to ${subscriber.facebookUserId}: ${error.message}`,
            );
            failedCount++;
          }
        }),
      );

      // Delay between batches to respect rate limits
      if (i + batchSize < subscribers.length) {
        await this.delay(batchDelay);
      }
    }

    this.logger.log(
      `Broadcast ${broadcastId} completed: ${sentCount} sent, ${failedCount} failed`,
    );

    return {
      broadcastId,
      totalRecipients: subscribers.length,
      sentCount,
      failedCount,
      status: 'completed',
    };
  }


  // ============================================================
  // NOTIFICATION LOGGING & QUERIES
  // ============================================================

  /**
   * Get Notification Logs
   * 
   * Query notification logs with filters and pagination.
   * 
   * @param query - Query parameters
   * @returns Paginated notification logs
   */
  async getNotificationLogs(query: NotificationQueryDto): Promise<{
    logs: NotificationLogDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Build filter
    const filter: any = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.subscriberId) filter.subscriberId = query.subscriberId;
    if (query.broadcastId) filter['metadata.broadcastId'] = query.broadcastId;

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    // Execute query with pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.notificationLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationLogModel.countDocuments(filter).exec(),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Notification Statistics
   * 
   * Returns aggregated statistics for notifications.
   * 
   * @returns Notification statistics
   */
  async getNotificationStats(): Promise<{
    totalSent: number;
    deliveryRate: number;
    failedRate: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const [total, byType, byStatus] = await Promise.all([
      this.notificationLogModel.countDocuments().exec(),
      this.notificationLogModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.notificationLogModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const byTypeObj: Record<string, number> = {};
    byType.forEach((item) => {
      byTypeObj[item._id] = item.count;
    });

    const byStatusObj: Record<string, number> = {};
    byStatus.forEach((item) => {
      byStatusObj[item._id] = item.count;
    });

    const sentCount = byStatusObj[NotificationStatus.SENT] || 0;
    const deliveredCount = byStatusObj[NotificationStatus.DELIVERED] || 0;
    const failedCount = byStatusObj[NotificationStatus.FAILED] || 0;
    const successCount = sentCount + deliveredCount;

    return {
      totalSent: total,
      deliveryRate: total > 0 ? (successCount / total) * 100 : 0,
      failedRate: total > 0 ? (failedCount / total) * 100 : 0,
      byType: byTypeObj,
      byStatus: byStatusObj,
    };
  }


  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Get Subscribers for Notification
   * 
   * Returns active subscribers with specific notification preference enabled.
   * 
   * @param preferenceKey - Notification preference key
   * @returns Array of subscribers
   */
  private async getSubscribersForNotification(
    preferenceKey: keyof any,
  ): Promise<any[]> {
    const allSubscribers = await this.subscribersService.getActiveSubscribers();

    return allSubscribers.filter(
      (sub) =>
        sub.status === 'active' &&
        sub.isSubscribed &&
        sub.notificationPreferences?.[preferenceKey] !== false,
    );
  }

  /**
   * Send to Multiple Subscribers
   * 
   * Sends notification to multiple subscribers with rate limiting.
   * 
   * @param subscribers - Array of subscribers
   * @param type - Notification type
   * @param message - Message text
   * @param metadata - Additional metadata
   */
  private async sendToMultiple(
    subscribers: any[],
    type: NotificationType,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const batchSize = 50;
    const batchDelay = 100; // ms

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (subscriber) => {
          try {
            await this.sendNotification(
              subscriber.facebookUserId,
              type,
              message,
              metadata,
            );
          } catch (error) {
            this.logger.error(
              `Failed to send to ${subscriber.facebookUserId}: ${error.message}`,
            );
          }
        }),
      );

      if (i + batchSize < subscribers.length) {
        await this.delay(batchDelay);
      }
    }
  }

  /**
   * Send Notification
   * 
   * Sends notification and logs it to database.
   * 
   * @param subscriberId - Subscriber Facebook PSID
   * @param type - Notification type
   * @param message - Message text
   * @param metadata - Additional metadata
   */
  private async sendNotification(
    subscriberId: string,
    type: NotificationType,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Create log entry (pending)
    const log = await this.notificationLogModel.create({
      subscriberId,
      type,
      content: message,
      status: NotificationStatus.PENDING,
      metadata,
    });

    try {
      // Send via Messenger
      await this.messengerService.sendMessage(subscriberId, message);

      // Update log (sent)
      log.status = NotificationStatus.SENT;
      log.sentAt = new Date();
      await log.save();

      // Update subscriber stats
      await this.subscribersService.updateLastInteraction(subscriberId);
    } catch (error) {
      // Update log (failed)
      log.status = NotificationStatus.FAILED;
      log.errorMessage = error.message;
      await log.save();

      throw error;
    }
  }

  /**
   * Delay Helper
   * 
   * Utility for adding delays between batches.
   * 
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


  // ============================================================
  // MESSAGE FORMATTING
  // ============================================================

  /**
   * Format Energy Milestone Message
   */
  private formatEnergyMilestoneMessage(event: EnergyMilestoneEvent): string {
    const emoji = event.milestone >= 5000 ? '🏆' : event.milestone >= 1000 ? '🎉' : '⚡';
    return `
${emoji} **Energy Milestone Reached!**

Congratulations! You've generated **${event.milestone}Wh** of clean energy!

📊 Total Today: ${event.totalEnergy.toFixed(1)}Wh
⏰ Time: ${event.timestamp.toLocaleTimeString()}

Keep up the great work! 🌞

💡 Type "today" to see full daily report.
    `.trim();
  }

  /**
   * Format Battery Alert Message
   */
  private formatBatteryAlertMessage(event: BatteryAlertEvent): string {
    const emoji = event.alertType === 'critical' ? '🔴' : event.alertType === 'low' ? '🟡' : '🟢';
    const title = event.alertType === 'full' ? 'Battery Full' : 'Battery Alert';

    return `
${emoji} **${title}**

${event.sensorName} (${event.sensorLocation})

🔋 Battery Level: ${event.batteryLevel}%
${event.alertType === 'critical' ? '⚠️ Critical - Immediate attention needed!' : ''}
${event.alertType === 'low' ? '⚠️ Low battery - Consider charging soon' : ''}
${event.alertType === 'full' ? '✅ Battery fully charged' : ''}

⏰ Time: ${event.timestamp.toLocaleTimeString()}

💡 Type "battery" for current battery status.
    `.trim();
  }

  /**
   * Format Daily Summary Message
   */
  private formatDailySummaryMessage(today: any): string {
    return `
🌞 **Daily Energy Report** - ${today.date}
${today.dayOfWeek}

⚡ **Generation:**
• Total Energy: ${today.totalEnergyKWh.toFixed(3)} kWh
• Average Power: ${today.avgPowerW.toFixed(2)} W
• Peak Power: ${today.peakPowerW.toFixed(2)} W

📊 **Activity:**
• Readings: ${today.readingCount}

💡 Type "week" for weekly summary or "status" for complete overview.
    `.trim();
  }

  /**
   * Format Weekly Summary Message
   */
  private formatWeeklySummaryMessage(week: any): string {
    return `
📅 **Weekly Energy Report**
Week ${week.weekNumber}: ${week.weekStart} to ${week.weekEnd}

⚡ **Generation:**
• Total Energy: ${week.totalEnergyKWh.toFixed(3)} kWh
• Average Power: ${week.avgPowerW.toFixed(2)} W
• Peak Power: ${week.peakPowerW.toFixed(2)} W

📊 **Activity:**
• Readings: ${week.readingCount}

🏆 **Best Day:**
${week.dailyBreakdown.length > 0 ? `• ${week.dailyBreakdown[0].date}: ${week.dailyBreakdown[0].totalEnergyKWh.toFixed(3)} kWh` : '• No data'}

💡 Type "month" for monthly summary.
    `.trim();
  }
}
