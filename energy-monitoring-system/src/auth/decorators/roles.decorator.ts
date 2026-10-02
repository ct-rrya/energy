import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 *
 * Used to specify which roles are allowed to access a route.
 *
 * Usage:
 *   @Roles('SUPER_ADMIN', 'SYSTEM_ADMIN')
 *   @Get('sensitive-data')
 *   async getSensitiveData() {
 *     // Only SUPER_ADMIN and SYSTEM_ADMIN can access this
 *   }
 *
 * Must be used with RolesGuard:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
