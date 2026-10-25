import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { Player, PlayerStatus } from '../players/schemas/player.schema';
import { EDUCATIONAL_MISSIONS } from './data/missions.data';

describe('GamificationService', () => {
  let service: GamificationService;
  let mockPlayerModel: any;

  beforeEach(async () => {
    mockPlayerModel = {
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: getModelToken(Player.name),
          useValue: mockPlayerModel,
        },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  describe('getAllMissions', () => {
    it('returns all active missions without confidential answer keys', () => {
      const missions = service.getAllMissions();
      expect(missions.length).toBe(3);
      for (const m of missions) {
        expect(m.id).toBeDefined();
        expect(m.title).toBeDefined();
        expect(m.sections).toBeDefined();
        expect(m.questions.length).toBe(5);
        for (const q of m.questions) {
          expect((q as any).correctAnswerIndex).toBeUndefined();
          expect((q as any).explanation).toBeUndefined();
        }
      }
    });

    it('marks completed missions for authenticated player', () => {
      const mockPlayer = {
        completedMissions: ['mission_piezo_intro'],
      } as any;

      const missions = service.getAllMissions(mockPlayer);
      const piezo = missions.find((m) => m.id === 'mission_piezo_intro');
      const vipe = missions.find((m) => m.id === 'mission_v_i_p_e');

      expect(piezo?.isCompleted).toBe(true);
      expect(vipe?.isCompleted).toBe(false);
    });
  });

  describe('getMissionById', () => {
    it('returns mission details by valid ID', () => {
      const mission = service.getMissionById('mission_piezo_intro');
      expect(mission.id).toBe('mission_piezo_intro');
      expect(mission.title).toBe('Introduction to Piezoelectricity');
      expect(mission.questions.length).toBe(5);
      expect((mission.questions[0] as any).correctAnswerIndex).toBeUndefined();
    });

    it('throws NotFoundException for non-existent mission', () => {
      expect(() => service.getMissionById('unknown_mission')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitQuiz', () => {
    const piezoMission = EDUCATIONAL_MISSIONS[0];
    const correctAnswers = piezoMission.questions.map((q) => q.correctAnswerIndex);

    it('throws BadRequestException if answers array length is invalid', async () => {
      const mockPlayer = { _id: 'player_123', completedMissions: [] } as any;
      await expect(
        service.submitQuiz(mockPlayer, 'mission_piezo_intro', [1, 2]),
      ).rejects.toThrow(BadRequestException);
    });

    it('calculates passing score (100%), awards XP, and unlocks first_steps badge', async () => {
      const mockPlayerDoc = {
        _id: 'player_123',
        playerId: 'eco_123',
        username: 'StudentA',
        xp: 0,
        level: 1,
        completedMissions: [],
        badges: [],
      };

      const afterXpPlayerDoc = {
        ...mockPlayerDoc,
        xp: 50,
        completedMissions: ['mission_piezo_intro'],
      };

      const afterBadgePlayerDoc = {
        ...afterXpPlayerDoc,
        badges: [{ badgeId: 'first_steps', unlockedAt: new Date() }],
      };

      mockPlayerModel.findById.mockResolvedValue(mockPlayerDoc);
      mockPlayerModel.findOneAndUpdate
        .mockResolvedValueOnce(afterXpPlayerDoc) // first call awards XP
        .mockResolvedValueOnce(afterBadgePlayerDoc); // second call awards badge

      const result = await service.submitQuiz(
        mockPlayerDoc as any,
        'mission_piezo_intro',
        correctAnswers,
      );

      expect(result.passed).toBe(true);
      expect(result.score).toBe(5);
      expect(result.percentage).toBe(100);
      expect(result.earnedXp).toBe(50);
      expect(result.newlyUnlockedBadges.length).toBe(1);
      expect(result.newlyUnlockedBadges[0].id).toBe('first_steps');
      expect(result.feedback.length).toBe(5);
      expect(result.feedback[0].explanation).toBeDefined();
    });

    it('fails quiz if score is below 80% (3/5 = 60%) and awards 0 XP', async () => {
      const mockPlayerDoc = {
        _id: 'player_123',
        xp: 0,
        level: 1,
        completedMissions: [],
        badges: [],
      };
      mockPlayerModel.findById.mockResolvedValue(mockPlayerDoc);

      // Give 3 correct, 2 incorrect (score = 60%)
      const answers = [...correctAnswers];
      answers[0] = (answers[0] + 1) % 4;
      answers[1] = (answers[1] + 1) % 4;

      const result = await service.submitQuiz(
        mockPlayerDoc as any,
        'mission_piezo_intro',
        answers,
      );

      expect(result.passed).toBe(false);
      expect(result.score).toBe(3);
      expect(result.percentage).toBe(60);
      expect(result.earnedXp).toBe(0);
      expect(mockPlayerModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('does NOT award duplicate XP if player previously passed the mission', async () => {
      const mockPlayerDoc = {
        _id: 'player_123',
        xp: 50,
        level: 1,
        completedMissions: ['mission_piezo_intro'],
        badges: [{ badgeId: 'first_steps', unlockedAt: new Date() }],
      };
      mockPlayerModel.findById.mockResolvedValue(mockPlayerDoc);

      const result = await service.submitQuiz(
        mockPlayerDoc as any,
        'mission_piezo_intro',
        correctAnswers,
      );

      expect(result.passed).toBe(true);
      expect(result.score).toBe(5);
      expect(result.alreadyCompleted).toBe(true);
      expect(result.earnedXp).toBe(0);
      expect(mockPlayerModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getPlayerProgress', () => {
    it('returns progress with level progression and badge unlock states', async () => {
      const mockPlayer = {
        _id: 'player_abc',
        playerId: 'eco_player_abc',
        username: 'GreenExplorer',
        xp: 120,
        level: 2,
        completedMissions: ['mission_piezo_intro'],
        badges: [{ badgeId: 'first_steps', unlockedAt: new Date() }],
      };
      mockPlayerModel.findById.mockResolvedValue(mockPlayer);

      const progress = await service.getPlayerProgress(mockPlayer as any);

      expect(progress.xp).toBe(120);
      expect(progress.level).toBe(2);
      expect(progress.levelProgress.levelTitle).toBe('Energy Harvester');
      expect(progress.completedMissions).toContain('mission_piezo_intro');
      const firstStepsBadge = progress.badges.find((b) => b.id === 'first_steps');
      const explorerBadge = progress.badges.find((b) => b.id === 'energy_explorer');
      expect(firstStepsBadge?.isUnlocked).toBe(true);
      expect(explorerBadge?.isUnlocked).toBe(false);
    });
  });

  describe('getLeaderboard', () => {
    it('returns deterministically ranked players and pagination for public visitor', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            playerId: 'p1',
            username: 'TopStep',
            xp: 250,
            level: 3,
            badges: [{ badgeId: 'first_steps' }],
            completedMissions: ['m1', 'm2'],
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            createdAt: new Date('2026-01-01T00:00:00Z'),
          },
          {
            playerId: 'p2',
            username: 'EcoLearner',
            xp: 150,
            level: 2,
            badges: [],
            completedMissions: ['m1'],
            updatedAt: new Date('2026-01-02T00:00:00Z'),
            createdAt: new Date('2026-01-02T00:00:00Z'),
          },
        ]),
      };

      mockPlayerModel.find.mockReturnValue(mockChain);
      mockPlayerModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

      const result = await service.getLeaderboard({ page: 1, limit: 20 });

      expect(mockPlayerModel.find).toHaveBeenCalledWith({
        status: PlayerStatus.ACTIVE,
      });
      expect(mockChain.sort).toHaveBeenCalledWith({
        xp: -1,
        updatedAt: 1,
        playerId: 1,
      });
      expect(mockChain.skip).toHaveBeenCalledWith(0);
      expect(mockChain.limit).toHaveBeenCalledWith(20);
      expect(mockChain.select).toHaveBeenCalledWith(
        'playerId username xp level badges completedMissions updatedAt createdAt',
      );

      expect(result.entries.length).toBe(2);
      expect(result.entries[0].rank).toBe(1);
      expect(result.entries[0].username).toBe('TopStep');
      expect(result.entries[0].levelTitle).toBe('Kinetic Innovator');
      expect(result.entries[0].isCurrentPlayer).toBe(false);
      expect(result.entries[1].rank).toBe(2);
      expect(result.pagination.totalPlayers).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.currentPlayerRank).toBeUndefined();
    });

    it('correctly identifies and ranks authenticated current player', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            playerId: 'player_current',
            username: 'CurrentUser',
            xp: 200,
            level: 3,
            badges: [],
            completedMissions: [],
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            createdAt: new Date('2026-01-01T00:00:00Z'),
          },
        ]),
      };

      mockPlayerModel.find.mockReturnValue(mockChain);
      // First countDocuments for total players, second countDocuments for higherRankedCount
      mockPlayerModel.countDocuments
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(5) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(2) });

      const currentPlayer = {
        _id: 'mongo_id_curr',
        playerId: 'player_current',
        username: 'CurrentUser',
        xp: 200,
        level: 3,
        status: PlayerStatus.ACTIVE,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      } as any;

      mockPlayerModel.findById.mockResolvedValue(currentPlayer);

      const result = await service.getLeaderboard({ page: 1, limit: 10 }, currentPlayer);

      expect(result.entries[0].isCurrentPlayer).toBe(true);
      expect(result.entries[0].rank).toBe(1);
      // Higher ranked count = 2, so rank = 3
      expect(result.currentPlayerRank).toBe(3);
    });

    it('handles empty leaderboard gracefully', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockPlayerModel.find.mockReturnValue(mockChain);
      mockPlayerModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.getLeaderboard({ page: 1, limit: 20 });

      expect(result.entries).toEqual([]);
      expect(result.pagination.totalPlayers).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
    });
  });
});
