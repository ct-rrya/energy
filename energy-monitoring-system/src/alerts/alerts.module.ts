import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AlertEventsListener } from './listeners/alert-events.listener';
import { DashboardModule } from '../dashboard/dashboard.module';

/**
 * Alerts Module
 * 
 * Provides alert management functionality for the Energy Monitoring System.
 * 
 * Features:
 * - Create alerts from system events
 * - Query alerts with filters and pagination
 * - Acknowledge alerts
 * - Resolve alerts
 * - Alert statistics
 * - WebSocket broadcasting (via EventEmitter)
 * 
 * Architecture:
 * - Independent from Messenger notifications
 * - Messenger acts as one delivery channel
 * - Alerts are the source of truth for system events
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Alert.name,
        schema: AlertSchema,
      },
    ]),
    DashboardModule, // Import for WebSocket broadcasting
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertEventsListener],
  exports: [AlertsService], // Export for use in other modules
})
export class AlertsModule {}
