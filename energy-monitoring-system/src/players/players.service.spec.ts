import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { Player, PlayerStatus } from './schemas/player.schema';

describe('PlayersService', () => {
  let service: PlayersService;
  let mockPlayerModel: any;
  let mockSaveFn: jest.Mock;

  beforeEach(async () => {
    mockSaveFn = jest.fn().mockImplementation(async function () {
      return this;
    });

    function MockModel(data: any) {
      this.data = data;
      this.playerId = data.playerId;
      this.username = data.username;
      this.normalizedUsername = data.normalizedUsername;
      this.sessionTokenHash = data.sessionTokenHash;
      this.status = data.status;
      this.lastActiveAt = data.lastActiveAt;
      this.save = (...args: any[]) => mockSaveFn.apply(this, args);
    }
    MockModel.findOne = jest.fn();
    MockModel.updateOne = jest.fn();

    mockPlayerModel = MockModel;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: getModelToken(Player.name),
          useValue: mockPlayerModel,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  describe('createGuestPlayer', () => {
    it('should successfully create a new guest player and return a raw session token', async () => {
      mockPlayerModel.findOne.mockResolvedValue(null);

      const result = await service.createGuestPlayer({ username: 'GreenPioneer' });

      expect(result).toBeDefined();
      expect(result.player.username).toBe('GreenPioneer');
      expect(result.player.playerId).toMatch(/^eco_player_[a-f0-9]{16}$/);
      expect(result.sessionToken).toHaveLength(64); // 32 bytes hex
    });

    it('should throw ConflictException if username is already taken', async () => {
      mockPlayerModel.findOne.mockResolvedValue({
        username: 'GreenPioneer',
        normalizedUsername: 'greenpioneer',
      });

      await expect(
        service.createGuestPlayer({ username: 'greenpioneer' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if username is invalid', async () => {
      await expect(
        service.createGuestPlayer({ username: 'ab' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should catch MongoDB duplicate key error (code 11000) and throw ConflictException', async () => {
      mockPlayerModel.findOne.mockResolvedValue(null);
      mockSaveFn.mockRejectedValue({ code: 11000 });

      await expect(
        service.createGuestPlayer({ username: 'UniqueName' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateSession', () => {
    it('should return null if session token is missing or invalid', async () => {
      const res = await service.validateSession('');
      expect(res).toBeNull();
    });

    it('should return player document and touch lastActiveAt if valid session', async () => {
      const mockPlayer = {
        playerId: 'eco_player_123',
        username: 'EcoUser',
        status: PlayerStatus.ACTIVE,
        lastActiveAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      const selectMock = jest.fn().mockResolvedValue(mockPlayer);
      mockPlayerModel.findOne.mockReturnValue({
        select: selectMock,
      });

      const player = await service.validateSession('dummy_token_123');
      expect(player).toBeDefined();
      expect(player?.username).toBe('EcoUser');
      expect(mockPlayer.save).toHaveBeenCalled();
    });

    it('should return null if player is not found or inactive', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      mockPlayerModel.findOne.mockReturnValue({
        select: selectMock,
      });

      const player = await service.validateSession('invalid_token');
      expect(player).toBeNull();
    });
  });

  describe('logout', () => {
    it('should invalidate sessionTokenHash in MongoDB', async () => {
      mockPlayerModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const res = await service.logout('active_session_token');
      expect(res.success).toBe(true);
      expect(mockPlayerModel.updateOne).toHaveBeenCalledWith(
        expect.any(Object),
        { $unset: { sessionTokenHash: 1 } },
      );
    });
  });
});
