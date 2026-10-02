import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard
 *
 * Authorization guard that checks if the authenticated user has the required role(s).
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('SUPER_ADMIN', 'SYSTEM_ADMIN')
 *   @Get('admin-only')
 *   async adminOnlyRoute() {
 *     // Only users with SUPER_ADMIN or SYSTEM_ADMIN role can access
 *   }
 *
 * Important:
 * - Must be used AFTER JwtAuthGuard (requires req.user to be populated)
 * - Must be used WITH @Roles decorator
 * - If no @Roles decorator, guard allows access (public route)
 *
 * Role Hierarchy:
 * - SUPER_ADMIN: Can manage administrator accounts/access codes
 * - SYSTEM_ADMIN: Can perform operational dashboard functions
 * - PUBLIC_USER: Public monitoring access only
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @Roles decorator, allow access (public route)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (populated by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, deny access (should be caught by JwtAuthGuard first)
    if (!user || !user.role) {
      return false;
    }

    // Check if user has any of the required roles
    return requiredRoles.includes(user.role);
  }
}
