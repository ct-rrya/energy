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
// import { SubscribersService } from '../subscribers/subscribers.service'; // ARCHIVED
// import { MessengerService } from '../messenger/messenger.service'; // ARCHIVED
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
    // private subscribersService: SubscribersService, // ARCHIVED
    // private messengerService: MessengerService, // ARCHIVED
    private analyticsService: AnalyticsService,
    private configService: ConfigService,
  ) {
    this.timezone =
      this.configService.get<string>('NOTIFICATION_TIMEZONE') || 'Asia/Manila';
    this.logger.warn(
      `Notifications Service initialized (Timezone: ${this.timezone}) - Messenger/Subscribers services ARCHIVED - notifications disabled`,
    );
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
    this.logger.warn(`Energy milestone reached: ${event.milestone}Wh - Notifications disabled (messenger archived)`);
    // Notification sending disabled - messenger module archived
    return;
  }

  /**
   * Send Battery Alert Notification
   *
   * Triggered when battery crosses threshold.
   *
   * @param event - Battery alert event data
   */
  async sendBatteryAlert(event: BatteryAlertEvent): Promise<void> {
    this.logger.warn(
      `Battery alert: ${event.sensorName} at ${event.batteryLevel}% - Notifications disabled (messenger archived)`,
    );
    // Notification sending disabled - messenger module archived
    return;
  }

  /**
   * Send Sensor Online Notification
   *
   * Triggered when sensor comes online.
   *
   * @param event - Sensor online event data
   */
  async sendSensorOnline(event: SensorOnlineEvent): Promise<void> {
    this.logger.warn(`Sensor online: ${event.sensorName} - Notifications disabled (messenger archived)`);
    // Notification sending disabled - messenger module archived
    return;
  }

  /**
   * Send Sensor Offline Notification
   *
   * Triggered when sensor goes offline.
   *
   * @param event - Sensor offline event data
   */
  async sendSensorOffline(event: SensorOfflineEvent): Promise<void> {
    this.logger.warn(`Sensor offline: ${event.sensorName} - Notifications disabled (messenger archived)`);
    // Notification sending disabled - messenger module archived
    return;
  }

  /**
   * Send System Alert Notification
   *
   * Triggered for system-level events.
   *
   * @param event - System alert event data
   */
  async sendSystemAlert(event: SystemAlertEvent): Promise<void> {
    this.logger.warn(`System alert: ${event.alertType} - ${event.message} - Notifications disabled (messenger archived)`);
    // Notification sending disabled - messenger module archived
    return;
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
    this.logger.warn('Daily summary job skipped - Notifications disabled (messenger archived)');
    // Notification sending disabled - messenger module archived
    return;
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
    this.logger.warn('Weekly summary job skipped - Notifications disabled (messenger archived)');
    // Notification sending disabled - messenger module archived
    return;
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
    this.logger.warn('Broadcast message skipped - Notifications disabled (messenger archived)');
    
    const broadcastId = `broadcast_${Date.now()}`;
    
    // Return empty result - notifications disabled
    return {
      broadcastId,
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
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
    // SubscribersService archived - return empty array
    return [];
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
    // MessengerService archived - no sending capability
    this.logger.warn('sendToMultiple skipped - MessengerService archived');
    return;
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
    // MessengerService and SubscribersService archived - no sending capability
    this.logger.warn(`sendNotification skipped for ${subscriberId} - MessengerService archived`);
    return;
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
    const emoji =
      event.milestone >= 5000 ? '🏆' : event.milestone >= 1000 ? '🎉' : '⚡';
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
    const emoji =
      event.alertType === 'critical'
        ? '🔴'
        : event.alertType === 'low'
          ? '🟡'
          : '🟢';
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
