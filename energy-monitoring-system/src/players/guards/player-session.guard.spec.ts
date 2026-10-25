import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PlayerSessionGuard } from './player-session.guard';
import { PlayerStatus } from '../schemas/player.schema';

describe('PlayerSessionGuard', () => {
  let guard: PlayerSessionGuard;
  let mockPlayersService: any;

  beforeEach(() => {
    mockPlayersService = {
      validateSession: jest.fn(),
    };
    guard = new PlayerSessionGuard(mockPlayersService);
  });

  const createMockContext = (headers: Record<string, string>): ExecutionContext => {
    const request = {
      headers,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  it('should throw UnauthorizedException if no session token is provided', async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should extract token from X-Guest-Session and validate', async () => {
    const mockPlayer = {
      playerId: 'eco_123',
      username: 'EcoStepUser',
      status: PlayerStatus.ACTIVE,
    };
    mockPlayersService.validateSession.mockResolvedValue(mockPlayer);

    const context = createMockContext({
      'x-guest-session': 'valid_token_123',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPlayersService.validateSession).toHaveBeenCalledWith('valid_token_123');
    const req = context.switchToHttp().getRequest() as any;
    expect(req.player).toEqual(mockPlayer);
    expect(req.playerSessionToken).toBe('valid_token_123');
  });

  it('should extract token from Authorization: Bearer <token>', async () => {
    const mockPlayer = {
      playerId: 'eco_123',
      username: 'EcoStepUser',
      status: PlayerStatus.ACTIVE,
    };
    mockPlayersService.validateSession.mockResolvedValue(mockPlayer);

    const context = createMockContext({
      authorization: 'Bearer bearer_token_xyz',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPlayersService.validateSession).toHaveBeenCalledWith('bearer_token_xyz');
  });

  it('should throw UnauthorizedException if session is invalid or expired', async () => {
    mockPlayersService.validateSession.mockResolvedValue(null);

    const context = createMockContext({
      'x-guest-session': 'expired_token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
