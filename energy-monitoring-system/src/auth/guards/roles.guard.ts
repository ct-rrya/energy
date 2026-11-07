import { Injectable, CanActivate, ExecutionContext, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuditService } from '../../audit/audit.service';
import { extractSafeIp } from '../../audit/utils/audit-ip.utils';

/**
 * RolesGuard
 *
 * Authorization guard that checks if the authenticated user has the required role(s).
 * If authorization fails, records an UNAUTHORIZED_ACCESS_ATTEMPT with DENIED status in audit log.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional() private readonly auditService?: AuditService,
  ) {}

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
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole && this.auditService) {
      // Record unauthorized access attempt as DENIED server-side
      this.auditService.logDenied(
        {
          administratorId: user.userId || user._id || '000000000000000000000000',
          administratorName: user.name || user.email || 'Unauthorized User',
          administratorRole: user.role || 'PUBLIC_USER',
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          module: 'SECURITY',
          target: request.originalUrl || request.url,
          targetType: 'endpoint',
          details: {
            method: request.method,
            path: request.originalUrl || request.url,
            userRole: user.role,
            requiredRoles,
          },
          ipAddress: extractSafeIp(request),
          userAgent: request.headers?.['user-agent'],
          sessionId: user.jti,
        },
        `Forbidden: Role '${user.role}' lacks required permissions [${requiredRoles.join(', ')}]`,
      ).catch((err) => console.warn('Failed to record denied audit attempt:', err));
    }

    return hasRole;
  }
}
