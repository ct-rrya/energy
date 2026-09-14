import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import {
  SensorOnlineEvent,
  SensorOfflineEvent,
  SystemAlertEvent,
} from '../dto/notification-event.dto';

/**
 * Sensor Event Listener
 *
 * Listens to sensor and system events and triggers notifications.
 *
 * Events:
 * - sensor.online - Sensor came online
 * - sensor.offline - Sensor went offline
 * - system.alert - System-level alert
 */
@Injectable()
export class SensorEventListener {
  private readonly logger = new Logger(SensorEventListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Handle Sensor Online
   *
   * Triggered when sensor comes online.
   *
   * @param payload - Sensor online event data
   */
  @OnEvent('sensor.online')
  async handleSensorOnline(payload: SensorOnlineEvent): Promise<void> {
    this.logger.log(`Sensor online event received: ${payload.sensorName}`);

    try {
      await this.notificationsService.sendSensorOnline(payload);
      this.logger.log(`Sensor online notification sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send sensor online notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle Sensor Offline
   *
   * Triggered when sensor goes offline.
   *
   * @param payload - Sensor offline event data
   */
  @OnEvent('sensor.offline')
  async handleSensorOffline(payload: SensorOfflineEvent): Promise<void> {
    this.logger.warn(`Sensor offline event received: ${payload.sensorName}`);

    try {
      await this.notificationsService.sendSensorOffline(payload);
      this.logger.log(`Sensor offline notification sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send sensor offline notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle System Alert
   *
   * Triggered for system-level events.
   *
   * @param payload - System alert event data
   */
  @OnEvent('system.alert')
  async handleSystemAlert(payload: SystemAlertEvent): Promise<void> {
    this.logger.log(`System alert event received: ${payload.alertType}`);

    try {
      await this.notificationsService.sendSystemAlert(payload);
      this.logger.log(`System alert notification sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send system alert notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
