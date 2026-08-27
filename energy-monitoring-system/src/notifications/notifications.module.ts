import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EnergyEventListener } from './listeners/energy-event.listener';
import { BatteryEventListener } from './listeners/battery-event.listener';
import { SensorEventListener } from './listeners/sensor-event.listener';
import {
  NotificationLog,
  NotificationLogSchema,
} from './schemas/notification-log.schema';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { MessengerModule } from '../messenger/messenger.module';
import { AnalyticsModule } from '../analytics/analytics.module';

/**
 * Notifications Module
 * 
 * Complete notification platform for the Energy Monitoring System.
 * 
 * Features:
 * - Automated event-driven notifications
 * - Scheduled daily/weekly summaries (cron jobs)
 * - Broadcast messaging system
 * - Complete notification logging
 * - Admin APIs for management
 * 
 * Architecture:
 * - Event-driven using @nestjs/event-emitter
 * - Scheduled jobs using @nestjs/schedule
 * - Consumes Messenger, Subscribers, Analytics modules
 * - Never accesses IoT/Sensors DB directly
 * 
 * Dependencies:
 * - @nestjs/schedule (cron jobs)
 * - @nestjs/event-emitter (event-driven)
 * - SubscribersModule (targeting)
 * - MessengerModule (delivery)
 * - AnalyticsModule (data)
 */
@Module({
  imports: [
    // MongoDB schemas
    MongooseModule.forFeature([
      {
        name: NotificationLog.name,
        schema: NotificationLogSchema,
      },
    ]),

    // Enable scheduling for cron jobs
    ScheduleModule.forRoot(),

    // Module dependencies
    SubscribersModule,
    MessengerModule,
    AnalyticsModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EnergyEventListener,
    BatteryEventListener,
    SensorEventListener,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
