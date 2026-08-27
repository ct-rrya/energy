import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * API Key Decorator
 * 
 * Custom parameter decorator to extract API key from request.
 * 
 * Purpose:
 * - Clean extraction of API key in controller
 * - Type-safe parameter
 * - Avoids direct request object access
 * - Works with ApiKeyGuard
 * 
 * Usage:
 * ```typescript
 * @UseGuards(ApiKeyGuard)
 * @Post('readings')
 * async receiveReading(
 *   @ApiKey() apiKey: string,  // <-- Clean extraction
 *   @Body() readingDto: CreateReadingDto,
 * ) {
 *   // apiKey is already validated by guard
 *   return this.iotService.receiveReading(apiKey, readingDto);
 * }
 * ```
 * 
 * Why use decorator?
 * - Cleaner than @Req() request and request.apiKey
 * - Type-safe (TypeScript knows it's a string)
 * - Consistent with @Body(), @Param(), @Query() style
 * - Self-documenting code
 * 
 * Prerequisites:
 * - ApiKeyGuard must be applied to the route
 * - Guard attaches apiKey to request object
 * - If guard not applied, apiKey will be undefined
 * 
 * Similar to:
 * - @CurrentUser() from Auth module
 * - @Body() for request body
 * - @Param() for route parameters
 */
export const ApiKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKey;
  },
);
