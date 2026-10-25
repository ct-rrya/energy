import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PlayersService } from '../../players/players.service';

/**
 * OptionalPlayerSessionGuard
 *
 * Attaches player to request if a valid session token is provided in headers,
 * but allows unauthenticated public access if no session is present.
 */
@Injectable()
export class OptionalPlayerSessionGuard implements CanActivate {
  constructor(private readonly playersService: PlayersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (token) {
      try {
        const player = await this.playersService.validateSession(token);
        if (player) {
          request.player = player;
          request.playerSessionToken = token;
        }
      } catch {
        // If token fails, continue unauthenticated
        request.player = null;
      }
    } else {
      request.player = null;
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const customHeader = request.headers['x-guest-session'];
    if (customHeader && typeof customHeader === 'string') {
      return customHeader.trim();
    }

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
