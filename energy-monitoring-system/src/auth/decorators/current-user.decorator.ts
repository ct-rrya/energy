import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current User Decorator
 *
 * Extracts the authenticated user from the request object.
 *
 * Why use this decorator?
 * - Cleaner code (no need to access req.user manually)
 * - Type-safe (can specify User type)
 * - Reusable across all controllers
 * - Standard NestJS pattern
 *
 * Usage:
 *
 * // Without decorator (verbose)
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Req() req: Request) {
 *   const user = req.user; // Not type-safe
 *   return user;
 * }
 *
 * // With decorator (clean)
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user; // Type-safe, clean
 * }
 *
 * // Access specific property
 * @UseGuards(JwtAuthGuard)
 * @Get('my-email')
 * getEmail(@CurrentUser('email') email: string) {
 *   return { email };
 * }
 *
 * How it works:
 * 1. JwtAuthGuard validates token
 * 2. JwtStrategy attaches user to request.user
 * 3. This decorator extracts request.user
 * 4. Returns user object (or specific property)
 *
 * Note:
 * - Only works when @UseGuards(JwtAuthGuard) is applied
 * - Returns undefined if no user (guard not applied)
 * - User object never contains password (excluded by schema)
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // Get HTTP request from execution context
    const request = ctx.switchToHttp().getRequest();

    // Extract user from request (set by JwtStrategy)
    const user = request.user;

    // If data is provided, return specific property
    // Example: @CurrentUser('email') returns user.email
    if (data) {
      return user?.[data];
    }

    // Otherwise return entire user object
    return user;
  },
);
