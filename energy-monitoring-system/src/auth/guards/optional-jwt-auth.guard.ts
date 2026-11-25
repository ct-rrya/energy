import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Authentication Guard
 *
 * Allows both authenticated and unauthenticated requests through.
 * - If a valid Bearer JWT is present, populates req.user with the authenticated user.
 * - If no token or an invalid/expired token is present, sets req.user = null and allows access.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(_err: any, user: TUser): TUser | null {
    return user || null;
  }
}
