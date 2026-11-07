import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditController, LogsController } from './audit.controller';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

/**
 * AuditModule
 *
 * Provides comprehensive audit logging for all administrator actions.
 * Marked as @Global() so any feature module can record operations authoritatively.
 */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AuditController, LogsController],
  providers: [AuditService],
  exports: [AuditService], // Export for use in other modules
})
export class AuditModule {}
