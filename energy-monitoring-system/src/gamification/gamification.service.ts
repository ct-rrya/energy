import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument, PlayerStatus } from '../players/schemas/player.schema';
import {
  EDUCATIONAL_MISSIONS,
  sanitizeMissionForPublic,
} from './data/missions.data';
import {
  BADGE_DEFINITIONS,
  evaluateEligibleBadges,
  BadgeDefinition,
} from './data/badges.data';
import {
  calculateLevelFromXp,
  getPlayerLevelProgress,
  getLevelTitle,
  PlayerLevelProgress,
} from './utils/level-calculator';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  xp: number;
  level: number;
  levelTitle: string;
  badgeCount: number;
  completedMissionsCount: number;
  isCurrentPlayer: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  entries: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    totalPlayers: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  currentPlayer: {
    rank: number;
    playerId: string;
    username: string;
    xp: number;
    level: number;
    levelTitle: string;
    badgeCount: number;
    completedMissionsCount: number;
  } | null;
  currentPlayerRank?: number;
}

export interface QuizQuestionFeedback {
  questionId: string;
  question: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmissionResult {
  missionId: string;
  passed: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  passingThreshold: number;
  earnedXp: number;
  alreadyCompleted: boolean;
  currentXp: number;
  level: number;
  levelProgress: PlayerLevelProgress;
  feedback: QuizQuestionFeedback[];
  newlyUnlockedBadges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
}

export interface PlayerProgressSummary {
  playerId: string;
  username: string;
  xp: number;
  level: number;
  levelProgress: PlayerLevelProgress;
  completedMissions: string[];
  totalMissions: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    isUnlocked: boolean;
    unlockedAt: Date | null;
  }>;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);
  public static readonly PASSING_THRESHOLD_PERCENT = 80; // 4 out of 5 required

  constructor(
    @InjectModel(Player.name)
    private readonly playerModel: Model<PlayerDocument>,
  ) {}

  /**
   * Get all active educational missions.
   * Includes completion status if authenticated player is provided.
   */
  getAllMissions(player?: Player) {
    const completedSet = new Set(player?.completedMissions || []);
    return EDUCATIONAL_MISSIONS.filter((m) => m.isActive).map((mission) =>
      sanitizeMissionForPublic(mission, completedSet.has(mission.id)),
    );
  }

  /**
   * Get details for a specific mission without exposing answer keys.
   */
  getMissionById(missionId: string, player?: Player) {
    const mission = EDUCATIONAL_MISSIONS.find((m) => m.id === missionId && m.isActive);
    if (!mission) {
      throw new NotFoundException(`Mission with ID '${missionId}' not found`);
    }

    const isCompleted = (player?.completedMissions || []).includes(mission.id);
    return sanitizeMissionForPublic(mission, isCompleted);
  }

  /**
   * Submit and score quiz answers for a mission.
   * Atomically awards XP and badges on first successful pass (>= 80%).
   */
  async submitQuiz(
    player: Player,
    missionId: string,
    submittedAnswers: number[],
  ): Promise<QuizSubmissionResult> {
    const mission = EDUCATIONAL_MISSIONS.find((m) => m.id === missionId && m.isActive);
    if (!mission) {
      throw new NotFoundException(`Mission with ID '${missionId}' not found`);
    }

    if (
      !Array.isArray(submittedAnswers) ||
      submittedAnswers.length !== mission.questions.length
    ) {
      throw new BadRequestException(
        `Expected answers for all ${mission.questions.length} questions`,
      );
    }

    // 1. Authoritative backend scoring
    let correctCount = 0;
    const feedback: QuizQuestionFeedback[] = [];

    mission.questions.forEach((q, index) => {
      const selected = submittedAnswers[index];
      const isCorrect = selected === q.correctAnswerIndex;
      if (isCorrect) {
        correctCount++;
      }

      feedback.push({
        questionId: q.id,
        question: q.question,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswerIndex,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const totalQuestions = mission.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = percentage >= GamificationService.PASSING_THRESHOLD_PERCENT;

    let earnedXp = 0;
    const alreadyCompleted = (player.completedMissions || []).includes(mission.id);
    const newlyUnlockedBadges: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
    }> = [];

    // Fetch fresh database record of the player
    let freshPlayer = await this.playerModel.findById(player['_id'] || player['id']);
    if (!freshPlayer) {
      throw new NotFoundException('Player record not found');
    }

    // 2. Concurrency-safe reward assignment if passed
    if (passed && !alreadyCompleted) {
      // Atomic update ensuring mission is only awarded ONCE even if submitted concurrently
      const updatedPlayer = await this.playerModel.findOneAndUpdate(
        {
          _id: freshPlayer._id,
          completedMissions: { $ne: mission.id },
        },
        {
          $inc: { xp: mission.xpReward },
          $push: { completedMissions: mission.id },
          $set: { lastActiveAt: new Date() },
        },
        { new: true },
      );

      if (updatedPlayer) {
        earnedXp = mission.xpReward;
        freshPlayer = updatedPlayer;

        // Recalculate level
        const computedLevel = calculateLevelFromXp(freshPlayer.xp);
        if (computedLevel !== freshPlayer.level) {
          freshPlayer.level = computedLevel;
          await this.playerModel.updateOne(
            { _id: freshPlayer._id },
            { $set: { level: computedLevel } },
          );
        }

        // Evaluate eligible badges
        const eligibleBadgeIds = evaluateEligibleBadges(freshPlayer);
        for (const bId of eligibleBadgeIds) {
          const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === bId);
          if (badgeDef && freshPlayer) {
            const playerId = freshPlayer._id;
            // Atomic badge push ensuring no duplicate badge entries
            const badgeUpdated = await this.playerModel.findOneAndUpdate(
              {
                _id: playerId,
                'badges.badgeId': { $ne: bId },
              },
              {
                $push: {
                  badges: { badgeId: bId, unlockedAt: new Date() },
                },
              },
              { new: true },
            );

            if (badgeUpdated) {
              freshPlayer = badgeUpdated;
              newlyUnlockedBadges.push({
                id: badgeDef.id,
                name: badgeDef.name,
                description: badgeDef.description,
                icon: badgeDef.icon,
              });
              this.logger.log(
                `Badge '${badgeDef.name}' unlocked for player ${badgeUpdated.username}`,
              );
            }
          }
        }
      }
    }

    if (!freshPlayer) {
      throw new NotFoundException('Player record not found');
    }

    const currentXp = freshPlayer.xp || 0;
    const currentLevel = freshPlayer.level || 1;
    const levelProgress = getPlayerLevelProgress(currentXp);

    return {
      missionId: mission.id,
      passed,
      score: correctCount,
      totalQuestions,
      percentage,
      passingThreshold: GamificationService.PASSING_THRESHOLD_PERCENT,
      earnedXp,
      alreadyCompleted,
      currentXp,
      level: currentLevel,
      levelProgress,
      feedback,
      newlyUnlockedBadges,
    };
  }

  /**
   * Get player's overall gamification progress, level, and badge showcase.
   */
  async getPlayerProgress(player: Player): Promise<PlayerProgressSummary> {
    const fresh = await this.playerModel.findById(player['_id'] || player['id']);
    const target = fresh || player;

    const currentXp = target.xp || 0;
    const currentLevel = target.level || 1;
    const levelProgress = getPlayerLevelProgress(currentXp);
    const unlockedMap = new Map<string, Date>();

    (target.badges || []).forEach((b) => {
      unlockedMap.set(b.badgeId, b.unlockedAt);
    });

    const badgeShowcase = BADGE_DEFINITIONS.map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      category: def.category,
      isUnlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) || null,
    }));

    return {
      playerId: target.playerId,
      username: target.username,
      xp: currentXp,
      level: currentLevel,
      levelProgress,
      completedMissions: target.completedMissions || [],
      totalMissions: EDUCATIONAL_MISSIONS.length,
      badges: badgeShowcase,
    };
  }

  /**
   * Get all badges with unlock status for current player (or all locked if unauthenticated).
   */
  getAllBadges(player?: Player) {
    const unlockedMap = new Map<string, Date>();
    (player?.badges || []).forEach((b) => {
      unlockedMap.set(b.badgeId, b.unlockedAt);
    });

    return BADGE_DEFINITIONS.map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      category: def.category,
      isUnlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) || null,
    }));
  }

  /**
   * Get paginated leaderboard of active players ranked by authoritative total XP.
   *
   * Tie-breaker rule:
   * 1. Total XP descending (highest XP first).
   * 2. UpdatedAt ascending (earliest achievement of the XP total).
   * 3. PlayerId ascending (stable deterministic unique identifier).
   *
   * Inactive, deleted, or unverified accounts are excluded.
   * Private fields (sessionTokenHash, _id, internal IDs) are never exposed.
   */
  async getLeaderboard(
    dto: LeaderboardQueryDto = {},
    currentPlayer?: Player,
  ): Promise<LeaderboardResponse> {
    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { status: PlayerStatus.ACTIVE };

    // Fetch players and total count in parallel
    const [players, totalPlayers] = await Promise.all([
      this.playerModel
        .find(filter)
        .sort({ xp: -1, updatedAt: 1, playerId: 1 })
        .skip(skip)
        .limit(limit)
        .select('playerId username xp level badges completedMissions updatedAt createdAt')
        .lean()
        .exec(),
      this.playerModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(totalPlayers / limit);

    const leaderboard: LeaderboardEntry[] = players.map((p, idx) => ({
      rank: skip + idx + 1,
      playerId: p.playerId,
      username: p.username,
      xp: p.xp || 0,
      level: p.level || 1,
      levelTitle: getLevelTitle(p.level || 1),
      badgeCount: p.badges?.length || 0,
      completedMissionsCount: p.completedMissions?.length || 0,
      isCurrentPlayer: currentPlayer ? p.playerId === currentPlayer.playerId : false,
    }));

    // If an authenticated player is provided and active, calculate their global rank
    let currentPlayerSummary: LeaderboardResponse['currentPlayer'] = null;
    if (currentPlayer && currentPlayer.status === PlayerStatus.ACTIVE) {
      // Find players ranked ahead based on deterministic tie-breaker
      const higherCount = await this.playerModel
        .countDocuments({
          status: PlayerStatus.ACTIVE,
          $or: [
            { xp: { $gt: currentPlayer.xp || 0 } },
            {
              xp: currentPlayer.xp || 0,
              updatedAt: { $lt: currentPlayer.updatedAt },
            },
            {
              xp: currentPlayer.xp || 0,
              updatedAt: currentPlayer.updatedAt,
              playerId: { $lt: currentPlayer.playerId },
            },
          ],
        })
        .exec();

      currentPlayerSummary = {
        rank: higherCount + 1,
        playerId: currentPlayer.playerId,
        username: currentPlayer.username,
        xp: currentPlayer.xp || 0,
        level: currentPlayer.level || 1,
        levelTitle: getLevelTitle(currentPlayer.level || 1),
        badgeCount: currentPlayer.badges?.length || 0,
        completedMissionsCount: currentPlayer.completedMissions?.length || 0,
      };
    }

    return {
      leaderboard,
      entries: leaderboard,
      pagination: {
        page,
        limit,
        totalPlayers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      currentPlayer: currentPlayerSummary,
      currentPlayerRank: currentPlayerSummary?.rank,
    };
  }
}
