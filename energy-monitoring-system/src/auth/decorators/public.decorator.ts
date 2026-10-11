import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 * 
 * Marks a route as public (skips JWT authentication).
 * 
 * Usage:
 * ```typescript
 * @Public()
 * @Get('recent')
 * async getRecentReadings() {
 *   // This endpoint is accessible without authentication
 * }
 * ```
 * 
 * Use Cases:
 * - Landing page data fetching
 * - Public dashboard endpoints
 * - Health checks
 * - Documentation endpoints
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
