import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DashboardGateway } from '../../dashboard/dashboard.gateway';

/**
 * Alert Events Listener
 * 
 * Listens to alert events and broadcasts them via WebSocket.
 * 
 * Events:
 * - alert.created - New alert created
 * - alert.acknowledged - Alert acknowledged
 * - alert.resolved - Alert resolved
 */
@Injectable()
export class AlertEventsListener {
  private readonly logger = new Logger(AlertEventsListener.name);

  constructor(private readonly dashboardGateway: DashboardGateway) {}

  /**
   * Handle Alert Created Event
   * 
   * Broadcasts new alert to all connected dashboard clients.
   * 
   * @param alert - Alert data
   */
  @OnEvent('alert.created')
  handleAlertCreated(alert: any) {
    this.logger.log(`Alert created event received: ${alert.id} - ${alert.type}`);
    this.dashboardGateway.broadcastAlertCreated(alert);
  }

  /**
   * Handle Alert Acknowledged Event
   * 
   * Broadcasts alert acknowledgement to all connected dashboard clients.
   * 
   * @param alert - Updated alert data
   */
  @OnEvent('alert.acknowledged')
  handleAlertAcknowledged(alert: any) {
    this.logger.log(`Alert acknowledged event received: ${alert.id}`);
    this.dashboardGateway.broadcastAlertAcknowledged(alert);
  }

  /**
   * Handle Alert Resolved Event
   * 
   * Broadcasts alert resolution to all connected dashboard clients.
   * 
   * @param alert - Updated alert data
   */
  @OnEvent('alert.resolved')
  handleAlertResolved(alert: any) {
    this.logger.log(`Alert resolved event received: ${alert.id}`);
    this.dashboardGateway.broadcastAlertResolved(alert);
  }
}
