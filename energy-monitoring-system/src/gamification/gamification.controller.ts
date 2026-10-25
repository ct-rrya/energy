import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { PlayerSessionGuard } from '../players/guards/player-session.guard';
import { OptionalPlayerSessionGuard } from './guards/optional-player-session.guard';
import { CurrentPlayer } from '../players/decorators/current-player.decorator';
import { Player } from '../players/schemas/player.schema';

@ApiTags('Gamification & Missions')
@Controller()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * GET /api/missions
   * List all educational missions (public, personalized if guest session attached)
   */
  @Get('missions')
  @UseGuards(OptionalPlayerSessionGuard)
  @ApiOperation({
    summary: 'Get all educational missions',
    description:
      'Returns active missions without answer keys. If a valid player session is attached, marks completed missions.',
  })
  async getMissions(@CurrentPlayer() player?: Player) {
    return this.gamificationService.getAllMissions(player);
  }

  /**
   * GET /api/missions/:id
   * Get mission details and quiz questions
   */
  @Get('missions/:id')
  @UseGuards(OptionalPlayerSessionGuard)
  @ApiOperation({
    summary: 'Get mission details and quiz',
    description: 'Returns educational content and questions without answer keys.',
  })
  async getMission(
    @Param('id') id: string,
    @CurrentPlayer() player?: Player,
  ) {
    return this.gamificationService.getMissionById(id, player);
  }

  /**
   * POST /api/missions/:id/submit
   * Submit quiz answers, score, and atomically award XP and badges
   */
  @Post('missions/:id/submit')
  @UseGuards(PlayerSessionGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit quiz answers',
    description:
      'Authoritatively calculates score, passing status (>=80%), and awards XP and eligible badges once.',
  })
  @ApiHeader({
    name: 'X-Guest-Session',
    description: 'Active player session token',
    required: true,
  })
  async submitQuiz(
    @Param('id') missionId: string,
    @Body() dto: SubmitQuizDto,
    @CurrentPlayer() player: Player,
  ) {
    return this.gamificationService.submitQuiz(
      player,
      missionId,
      dto.answers,
    );
  }

  /**
   * GET /api/gamification/progress
   * Retrieve current player XP, level, level progress bar, and badges
   */
  @Get('gamification/progress')
  @UseGuards(PlayerSessionGuard)
  @ApiOperation({
    summary: 'Get current player gamification progress',
    description: 'Returns total XP, level title, progress percentage, completed missions, and badges.',
  })
  async getProgress(@CurrentPlayer() player: Player) {
    return this.gamificationService.getPlayerProgress(player);
  }

  /**
   * GET /api/gamification/badges
   * List all badges with unlock status
   */
  @Get('gamification/badges')
  @UseGuards(OptionalPlayerSessionGuard)
  @ApiOperation({
    summary: 'Get all achievement badges',
    description: 'Lists all available badges and marks unlocked ones for current player.',
  })
  async getBadges(@CurrentPlayer() player?: Player) {
    return this.gamificationService.getAllBadges(player);
  }

  /**
   * GET /api/leaderboard
   * Retrieve authoritative XP leaderboard with pagination and current player ranking
   */
  @Get('leaderboard')
  @UseGuards(OptionalPlayerSessionGuard)
  @ApiOperation({
    summary: 'Get global player leaderboard',
    description:
      'Returns paginated players ranked deterministically by total XP, level, and badge counts. If a guest session is present, includes current player ranking.',
  })
  async getLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @CurrentPlayer() player?: Player,
  ) {
    return this.gamificationService.getLeaderboard(query, player);
  }

  /**
   * GET /api/gamification/leaderboard
   * Alias for /api/leaderboard
   */
  @Get('gamification/leaderboard')
  @UseGuards(OptionalPlayerSessionGuard)
  @ApiOperation({
    summary: 'Get global player leaderboard (gamification namespace)',
    description: 'Alias for /api/leaderboard.',
  })
  async getGamificationLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @CurrentPlayer() player?: Player,
  ) {
    return this.gamificationService.getLeaderboard(query, player);
  }
}
