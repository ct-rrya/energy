import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { EnergyMilestoneEvent } from '../dto/notification-event.dto';

/**
 * Energy Event Listener
 *
 * Listens to energy-related events and triggers notifications.
 *
 * Events:
 * - energy.milestone.reached - Energy milestone notification
 *
 * Decoupled Architecture:
 * - IoT Service emits events
 * - This listener responds
 * - NotificationsService sends notifications
 * - No circular dependencies
 */
@Injectable()
export class EnergyEventListener {
  private readonly logger = new Logger(EnergyEventListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Handle Energy Milestone Reached
   *
   * Triggered when energy generation reaches milestone (100Wh, 500Wh, 1kWh, 5kWh).
   *
   * @param payload - Energy milestone event data
   */
  @OnEvent('energy.milestone.reached')
  async handleEnergyMilestone(payload: EnergyMilestoneEvent): Promise<void> {
    this.logger.log(`Energy milestone event received: ${payload.milestone}Wh`);

    try {
      await this.notificationsService.sendEnergyMilestone(payload);
      this.logger.log(`Energy milestone notification sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send energy milestone notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
