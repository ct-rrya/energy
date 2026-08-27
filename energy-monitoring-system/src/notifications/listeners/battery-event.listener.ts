import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { BatteryAlertEvent } from '../dto/notification-event.dto';

/**
 * Battery Event Listener
 * 
 * Listens to battery-related events and triggers notifications.
 * 
 * Events:
 * - battery.alert - Battery threshold alert
 * 
 * Alert Types:
 * - low: Battery below 20%
 * - critical: Battery below 10%
 * - full: Battery at 100%
 * 
 * Throttling:
 * - Max 1 alert per threshold per 30 minutes (implemented in IoT Service)
 */
@Injectable()
export class BatteryEventListener {
  private readonly logger = new Logger(BatteryEventListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Handle Battery Alert
   * 
   * Triggered when battery crosses threshold.
   * 
   * @param payload - Battery alert event data
   */
  @OnEvent('battery.alert')
  async handleBatteryAlert(payload: BatteryAlertEvent): Promise<void> {
    this.logger.log(
      `Battery alert event received: ${payload.sensorName} at ${payload.batteryLevel}%`,
    );

    try {
      await this.notificationsService.sendBatteryAlert(payload);
      this.logger.log(`Battery alert notification sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send battery alert notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
