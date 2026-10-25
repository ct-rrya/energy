import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { PlayerSessionGuard } from './guards/player-session.guard';

describe('PlayersController', () => {
  let controller: PlayersController;
  let service: PlayersService;

  const mockPlayersService = {
    createGuestPlayer: jest.fn(),
    getProfile: jest.fn(),
    logout: jest.fn(),
    validateSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [
        {
          provide: PlayersService,
          useValue: mockPlayersService,
        },
      ],
    })
      .overrideGuard(PlayerSessionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PlayersController>(PlayersController);
    service = module.get<PlayersService>(PlayersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createGuestPlayer', () => {
    it('should call service.createGuestPlayer and return result', async () => {
      const expectedResponse = {
        player: {
          playerId: 'eco_player_123',
          username: 'EcoChampion',
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
        sessionToken: 'token_abc',
      };
      mockPlayersService.createGuestPlayer.mockResolvedValue(expectedResponse);

      const result = await controller.createGuestPlayer({ username: 'EcoChampion' });
      expect(result).toEqual(expectedResponse);
      expect(mockPlayersService.createGuestPlayer).toHaveBeenCalledWith({
        username: 'EcoChampion',
      });
    });
  });

  describe('getProfile', () => {
    it('should return profile for current player', async () => {
      const mockPlayer = {
        playerId: 'eco_player_123',
        username: 'EcoChampion',
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };
      mockPlayersService.getProfile.mockReturnValue(mockPlayer);

      const result = await controller.getProfile(mockPlayer as any);
      expect(result).toEqual(mockPlayer);
      expect(mockPlayersService.getProfile).toHaveBeenCalledWith(mockPlayer);
    });
  });

  describe('logout', () => {
    it('should call service.logout with the token extracted from req', async () => {
      mockPlayersService.logout.mockResolvedValue({
        success: true,
        message: 'Guest session terminated successfully',
      });

      const req = { playerSessionToken: 'test_token_xyz' };
      const res = await controller.logout(req);

      expect(res.success).toBe(true);
      expect(mockPlayersService.logout).toHaveBeenCalledWith('test_token_xyz');
    });
  });
});
