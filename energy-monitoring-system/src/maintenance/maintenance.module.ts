import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MaintenanceState,
  MaintenanceStateSchema,
} from './schemas/maintenance-state.schema';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { AuditModule } from '../audit/audit.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MaintenanceState.name, schema: MaintenanceStateSchema },
    ]),
    AuditModule,
    forwardRef(() => DashboardModule),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
