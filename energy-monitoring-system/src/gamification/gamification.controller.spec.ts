import { Test, TestingModule } from '@nestjs/testing';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { PlayerSessionGuard } from '../players/guards/player-session.guard';
import { OptionalPlayerSessionGuard } from './guards/optional-player-session.guard';

describe('GamificationController', () => {
  let controller: GamificationController;
  let service: GamificationService;

  const mockGamificationService = {
    getAllMissions: jest.fn(),
    getMissionById: jest.fn(),
    submitQuiz: jest.fn(),
    getPlayerProgress: jest.fn(),
    getAllBadges: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
      ],
    })
      .overrideGuard(PlayerSessionGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalPlayerSessionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GamificationController>(GamificationController);
    service = module.get<GamificationService>(GamificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('calls service.getAllMissions on getMissions', async () => {
    mockGamificationService.getAllMissions.mockReturnValue([{ id: 'm1' }]);
    const res = await controller.getMissions();
    expect(res).toEqual([{ id: 'm1' }]);
    expect(mockGamificationService.getAllMissions).toHaveBeenCalled();
  });

  it('calls service.getMissionById on getMission', async () => {
    mockGamificationService.getMissionById.mockReturnValue({ id: 'm1', title: 'Piezo' });
    const res = await controller.getMission('m1');
    expect(res.id).toBe('m1');
    expect(mockGamificationService.getMissionById).toHaveBeenCalledWith('m1', undefined);
  });

  it('calls service.submitQuiz on submitQuiz', async () => {
    const mockPlayer = { id: 'p1', username: 'Hero' } as any;
    const mockResult = { passed: true, score: 5, earnedXp: 50 };
    mockGamificationService.submitQuiz.mockResolvedValue(mockResult);

    const res = await controller.submitQuiz(
      'mission_piezo_intro',
      { answers: [1, 2, 1, 1, 2] },
      mockPlayer,
    );
    expect(res).toEqual(mockResult);
    expect(mockGamificationService.submitQuiz).toHaveBeenCalledWith(
      mockPlayer,
      'mission_piezo_intro',
      [1, 2, 1, 1, 2],
    );
  });

  it('calls service.getPlayerProgress on getProgress', async () => {
    const mockPlayer = { id: 'p1', xp: 50 } as any;
    mockGamificationService.getPlayerProgress.mockResolvedValue({ xp: 50, level: 1 });

    const res = await controller.getProgress(mockPlayer);
    expect(res.xp).toBe(50);
    expect(mockGamificationService.getPlayerProgress).toHaveBeenCalledWith(mockPlayer);
  });

  it('calls service.getAllBadges on getBadges', async () => {
    mockGamificationService.getAllBadges.mockReturnValue([{ id: 'first_steps' }]);
    const res = await controller.getBadges();
    expect(res).toEqual([{ id: 'first_steps' }]);
  });

  it('calls service.getLeaderboard on getLeaderboard with query params', async () => {
    const mockLeaderboard = {
      entries: [
        {
          rank: 1,
          playerId: 'p1',
          username: 'EcoChampion',
          xp: 300,
          level: 4,
          levelTitle: 'Kinetic Master',
          badgesCount: 3,
          completedMissionsCount: 3,
          isCurrentPlayer: true,
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        totalPlayers: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      currentPlayerRank: 1,
    };
    mockGamificationService.getLeaderboard = jest.fn().mockResolvedValue(mockLeaderboard);

    const query = { page: 1, limit: 20 };
    const mockPlayer = { playerId: 'p1' } as any;
    const res = await controller.getLeaderboard(query, mockPlayer);

    expect(res).toEqual(mockLeaderboard);
    expect(mockGamificationService.getLeaderboard).toHaveBeenCalledWith(query, mockPlayer);
  });
});
