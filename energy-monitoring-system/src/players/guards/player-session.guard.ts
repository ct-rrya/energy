import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PlayersService } from '../players.service';

/**
 * PlayerSessionGuard
 *
 * Validates the guest player's session token from request headers.
 * Supported headers:
 * - `X-Guest-Session: <token>`
 * - `Authorization: Bearer <token>`
 *
 * Completely independent from administrative JWT authentication.
 */
@Injectable()
export class PlayerSessionGuard implements CanActivate {
  constructor(private readonly playersService: PlayersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No guest player session provided');
    }

    const player = await this.playersService.validateSession(token);
    if (!player) {
      throw new UnauthorizedException('Invalid or expired guest player session');
    }

    // Attach validated player document and raw token to request
    request.player = player;
    request.playerSessionToken = token;

    return true;
  }

  private extractToken(request: any): string | null {
    // 1. Check custom X-Guest-Session header
    const customHeader = request.headers['x-guest-session'];
    if (customHeader && typeof customHeader === 'string') {
      return customHeader.trim();
    }

    // 2. Check Authorization Bearer header
    const authHeader = request.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1].trim();
      }
    }

    return null;
  }
}
