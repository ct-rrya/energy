import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminManagementService } from './admin-management.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAdminDto, UpdateAdminStatusDto } from './dto';

/**
 * AdminManagementController
 *
 * Provides API endpoints for SUPER_ADMIN to manage administrator accounts.
 *
 * Security:
 * - All endpoints require authentication (JwtAuthGuard)
 * - All endpoints require SUPER_ADMIN role (RolesGuard)
 * - All operations are audited
 *
 * Endpoints:
 * - GET /admin-management/administrators - List all admins
 * - GET /admin-management/administrators/stats - Get admin counts
 * - POST /admin-management/administrators - Create new admin
 * - GET /admin-management/administrators/:id - Get admin details
 * - POST /admin-management/administrators/:id/reset-code - Reset access code
 * - PATCH /admin-management/administrators/:id/status - Update status
 * - DELETE /admin-management/administrators/:id - Delete admin
 */
@Controller('admin-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN') // All endpoints require SUPER_ADMIN
export class AdminManagementController {
  constructor(
    private readonly adminManagementService: AdminManagementService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List all administrators
   *
   * GET /admin-management/administrators
   *
   * Returns all administrator accounts (SUPER_ADMIN and SYSTEM_ADMIN).
   *
   * Response:
   * {
   *   "administrators": [
   *     {
   *       "id": "...",
   *       "email": "john@example.com",
   *       "name": "John Doe",
   *       "role": "SYSTEM_ADMIN",
   *       "isActive": true,
   *       "lastLoginAt": "2024-01-01T10:00:00Z",
   *       "createdAt": "2024-01-01T09:00:00Z"
   *     }
   *   ]
   * }
   */
  @Get('administrators')
  async listAdministrators(@Req() req: any) {
    const administrators =
      await this.adminManagementService.listAdministrators();

    // Audit the access
    await this.auditService.logSuccess({
      administratorId: req.user.userId,
      administratorName: req.user.name || 'Unknown',
      administratorRole: req.user.role,
      action: 'VIEW_AUDIT_LOGS',
      details: {
        view: 'admin_list',
        count: administrators.length,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.user.jti,
    });

    return { administrators };
  }

  /**
   * Get administrator statistics
   *
   * GET /admin-management/administrators/stats
   *
   * Returns count of admins by role.
   *
   * Response:
   * {
   *   "stats": {
   *     "SUPER_ADMIN": 2,
   *     "SYSTEM_ADMIN": 13,
   *     "total": 15
   *   }
   * }
   */
  @Get('administrators/stats')
  async getAdminStats(@Req() req: any) {
    const counts = await this.adminManagementService.countByRole();

    return {
      stats: {
        SUPER_ADMIN: counts.SUPER_ADMIN,
        SYSTEM_ADMIN: counts.SYSTEM_ADMIN,
        total: counts.SUPER_ADMIN + counts.SYSTEM_ADMIN,
      },
    };
  }

  /**
   * Create new administrator
   *
   * POST /admin-management/administrators
   *
   * Creates a new administrator account with auto-generated access code.
   *
   * Request:
   * {
   *   "email": "john@example.com",
   *   "name": "John Doe",
   *   "role": "SYSTEM_ADMIN"
   * }
   *
   * Response:
   * {
   *   "message": "Administrator created successfully",
   *   "administrator": {
   *     "id": "...",
   *     "email": "john@example.com",
   *     "name": "John Doe",
   *     "role": "SYSTEM_ADMIN",
   *     "isActive": true
   *   },
   *   "accessCode": "xY7pQ3mN9kL2"  // Shown only once!
   * }
   *
   * Important:
   * - Access code is shown only once
   * - User must save it immediately
   * - Cannot be retrieved later
   * - Can only be reset (generates new code)
   */
  @Post('administrators')
  @HttpCode(HttpStatus.CREATED)
  async createAdministrator(
    @Body() createAdminDto: CreateAdminDto,
    @Req() req: any,
  ) {
    try {
      const result =
        await this.adminManagementService.createAdmin(createAdminDto);

      // Audit successful creation
      await this.auditService.logSuccess({
        administratorId: req.user.userId,
        administratorName: req.user.name || 'Unknown',
        administratorRole: req.user.role,
        action: 'CREATE_ADMIN_ACCOUNT',
        target: result.admin._id.toString(),
        targetType: 'user',
        details: {
          email: result.admin.email,
          name: result.admin.name,
          role: result.admin.role,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.user.jti,
      });

      return {
        message: 'Administrator created successfully',
        administrator: {
          id: result.admin._id.toString(),
          email: result.admin.email,
          name: result.admin.name,
          role: result.admin.role,
          isActive: result.admin.isActive,
          createdAt: (result.admin as any).createdAt,
        },
        accessCode: result.accessCode, // Shown only once!
      };
    } catch (error) {
      // Audit failed creation
      await this.auditService.logFailure(
        {
          administratorId: req.user.userId,
          administratorName: req.user.name || 'Unknown',
          administratorRole: req.user.role,
          action: 'CREATE_ADMIN_ACCOUNT',
          details: {
            email: createAdminDto.email,
            role: createAdminDto.role,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          sessionId: req.user.jti,
        },
        error,
      );

      throw error;
    }
  }

  /**
   * Get administrator details
   *
   * GET /admin-management/administrators/:id
   *
   * Returns details of a specific administrator.
   *
   * Response:
   * {
   *   "administrator": {
   *     "id": "...",
   *     "email": "john@example.com",
   *     "name": "John Doe",
   *     "role": "SYSTEM_ADMIN",
   *     "isActive": true,
   *     "lastLoginAt": "2024-01-01T10:00:00Z",
   *     "lastActivityAt": "2024-01-01T10:30:00Z",
   *     "createdAt": "2024-01-01T09:00:00Z"
   *   }
   * }
   */
  @Get('administrators/:id')
  async getAdministrator(@Param('id') id: string, @Req() req: any) {
    const administrator =
      await this.adminManagementService.getAdministratorById(id);

    return { administrator };
  }

  /**
   * Reset administrator access code
   *
   * POST /admin-management/administrators/:id/reset-code
   *
   * Generates a new access code for an administrator.
   * Old access code is immediately invalidated.
   *
   * Response:
   * {
   *   "message": "Access code reset successfully",
   *   "accessCode": "aB2cD3eF4gH5"  // Shown only once!
   * }
   *
   * Important:
   * - New access code is shown only once
   * - User must save it immediately
   * - Old access code immediately stops working
   * - Cannot be undone
   */
  @Post('administrators/:id/reset-code')
  @HttpCode(HttpStatus.OK)
  async resetAccessCode(@Param('id') id: string, @Req() req: any) {
    try {
      // Get admin details for audit log
      const admin =
        await this.adminManagementService.getAdministratorById(id);

      // Reset access code
      const newAccessCode =
        await this.adminManagementService.resetAccessCode(id);

      // Audit successful reset
      await this.auditService.logSuccess({
        administratorId: req.user.userId,
        administratorName: req.user.name || 'Unknown',
        administratorRole: req.user.role,
        action: 'RESET_ACCESS_CODE',
        target: id,
        targetType: 'user',
        details: {
          targetEmail: admin.email,
          targetName: admin.name,
          targetRole: admin.role,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.user.jti,
      });

      return {
        message: 'Access code reset successfully',
        accessCode: newAccessCode, // Shown only once!
      };
    } catch (error) {
      // Audit failed reset
      await this.auditService.logFailure(
        {
          administratorId: req.user.userId,
          administratorName: req.user.name || 'Unknown',
          administratorRole: req.user.role,
          action: 'RESET_ACCESS_CODE',
          target: id,
          targetType: 'user',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          sessionId: req.user.jti,
        },
        error,
      );

      throw error;
    }
  }

  /**
   * Update administrator status
   *
   * PATCH /admin-management/administrators/:id/status
   *
   * Activates or deactivates an administrator account.
   *
   * Request:
   * {
   *   "isActive": false
   * }
   *
   * Response:
   * {
   *   "message": "Administrator status updated successfully",
   *   "administrator": {
   *     "id": "...",
   *     "email": "john@example.com",
   *     "name": "John Doe",
   *     "role": "SYSTEM_ADMIN",
   *     "isActive": false
   *   }
   * }
   */
  @Patch('administrators/:id/status')
  async updateAdministratorStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAdminStatusDto,
    @Req() req: any,
  ) {
    try {
      // Get admin details before update for audit log
      const adminBefore =
        await this.adminManagementService.getAdministratorById(id);

      // Update status
      const admin = await this.adminManagementService.updateStatus(
        id,
        updateStatusDto,
      );

      // Audit successful status change
      const action = updateStatusDto.isActive
        ? 'ACTIVATE_ADMIN_ACCOUNT'
        : 'DEACTIVATE_ADMIN_ACCOUNT';

      await this.auditService.logSuccess({
        administratorId: req.user.userId,
        administratorName: req.user.name || 'Unknown',
        administratorRole: req.user.role,
        action,
        target: id,
        targetType: 'user',
        details: {
          targetEmail: admin.email,
          targetName: admin.name,
          targetRole: admin.role,
          oldStatus: adminBefore.isActive,
          newStatus: updateStatusDto.isActive,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.user.jti,
      });

      return {
        message: 'Administrator status updated successfully',
        administrator: {
          id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isActive: admin.isActive,
        },
      };
    } catch (error) {
      // Audit failed status change
      await this.auditService.logFailure(
        {
          administratorId: req.user.userId,
          administratorName: req.user.name || 'Unknown',
          administratorRole: req.user.role,
          action: updateStatusDto.isActive
            ? 'ACTIVATE_ADMIN_ACCOUNT'
            : 'DEACTIVATE_ADMIN_ACCOUNT',
          target: id,
          targetType: 'user',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          sessionId: req.user.jti,
        },
        error,
      );

      throw error;
    }
  }

  /**
   * Delete administrator
   *
   * DELETE /admin-management/administrators/:id
   *
   * Permanently deletes an administrator account.
   * Cannot delete the last SUPER_ADMIN (prevents lockout).
   *
   * Response:
   * {
   *   "message": "Administrator deleted successfully"
   * }
   *
   * Warning:
   * - This is a hard delete (cannot be undone)
   * - Audit logs remain (denormalized name)
   * - Cannot delete last SUPER_ADMIN
   */
  @Delete('administrators/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAdministrator(@Param('id') id: string, @Req() req: any) {
    try {
      // Get admin details before deletion for audit log
      const admin =
        await this.adminManagementService.getAdministratorById(id);

      // Delete administrator
      await this.adminManagementService.deleteAdministrator(id);

      // Audit successful deletion
      await this.auditService.logSuccess({
        administratorId: req.user.userId,
        administratorName: req.user.name || 'Unknown',
        administratorRole: req.user.role,
        action: 'DELETE_ADMIN_ACCOUNT',
        target: id,
        targetType: 'user',
        details: {
          deletedEmail: admin.email,
          deletedName: admin.name,
          deletedRole: admin.role,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.user.jti,
      });

      return {
        message: 'Administrator deleted successfully',
      };
    } catch (error) {
      // Audit failed deletion
      await this.auditService.logFailure(
        {
          administratorId: req.user.userId,
          administratorName: req.user.name || 'Unknown',
          administratorRole: req.user.role,
          action: 'DELETE_ADMIN_ACCOUNT',
          target: id,
          targetType: 'user',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          sessionId: req.user.jti,
        },
        error,
      );

      throw error;
    }
  }
}
