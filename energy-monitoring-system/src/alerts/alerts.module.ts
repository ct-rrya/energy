import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { HealthMonitorService } from './health-monitor.service';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AlertEventsListener } from './listeners/alert-events.listener';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EmailModule } from '../email/email.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { DiagnosticsModule } from '../diagnostics/diagnostics.module';
import { User, UserSchema } from '../users/schemas/user.schema';

/**
 * Alerts Module
 *
 * Provides alert management functionality for the Energy Monitoring System.
 *
 * Features:
 * - Create alerts from system events
 * - Automated tile health anomaly monitoring (cron + on-demand)
 * - Query alerts with filters and pagination
 * - Acknowledge alerts
 * - Resolve alerts
 * - Alert statistics
 * - WebSocket broadcasting (via EventEmitter)
 * - Automated email notifications to active admins
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Alert.name,
        schema: AlertSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    DashboardModule, // Import for WebSocket broadcasting
    EmailModule,
    MaintenanceModule,
    forwardRef(() => DiagnosticsModule),
  ],
  controllers: [AlertsController],
  providers: [AlertsService, HealthMonitorService, AlertEventsListener],
  exports: [AlertsService, HealthMonitorService], // Export for use in other modules
})
export class AlertsModule {}
