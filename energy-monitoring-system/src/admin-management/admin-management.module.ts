import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminManagementService } from './admin-management.service';
import { AdminManagementController } from './admin-management.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

/**
 * AdminManagementModule
 *
 * Provides SUPER_ADMIN functionality for managing administrator accounts.
 *
 * Features:
 * - Create new administrator accounts
 * - Generate and reset access codes
 * - Activate/deactivate accounts
 * - List and view administrators
 * - Delete administrator accounts
 * - Comprehensive audit logging
 *
 * Security:
 * - All endpoints restricted to SUPER_ADMIN role
 * - Access codes are cryptographically random
 * - All operations audited
 * - Last SUPER_ADMIN cannot be deleted
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule, // For AuthService (access code hashing)
    AuditModule, // For audit logging
  ],
  controllers: [AdminManagementController],
  providers: [AdminManagementService],
  exports: [AdminManagementService], // Export for potential use in seed scripts
})
export class AdminManagementModule {}
