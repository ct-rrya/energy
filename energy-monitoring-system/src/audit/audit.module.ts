import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';

/**
 * AuditModule
 *
 * Provides comprehensive audit logging for all administrator actions.
 *
 * Features:
 * - Immutable audit log storage
 * - Queryable audit history
 * - Automatic indexing for performance
 * - Export functionality
 *
 * Exports:
 * - AuditService: For use in other modules to log actions
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService], // Export for use in other modules
})
export class AuditModule {}
