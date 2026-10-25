import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { Player, PlayerDocument, PlayerStatus } from './schemas/player.schema';
import { CreateGuestPlayerDto } from './dto/create-guest-player.dto';
import { validateUsername } from './utils/username-validator';
import {
  GuestPlayerSessionResponseDto,
  PlayerProfileDto,
} from './dto/player-response.dto';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    @InjectModel(Player.name)
    private readonly playerModel: Model<PlayerDocument>,
  ) {}

  /**
   * Hashes a raw session token using SHA-256 for secure storage.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a cryptographically strong random session token.
   */
  private generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates a friendly, unique public player ID.
   */
  private generatePlayerId(): string {
    return `eco_player_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Format a Player document to a safe public DTO.
   */
  private toProfileDto(player: PlayerDocument | Player): PlayerProfileDto {
    return {
      playerId: player.playerId,
      username: player.username,
      createdAt: (player as any).createdAt || new Date(),
      lastActiveAt: player.lastActiveAt,
      xp: player.xp || 0,
      level: player.level || 1,
      completedMissions: player.completedMissions || [],
      badges: player.badges || [],
    };
  }

  /**
   * Create a new guest player with username validation and unique enforcement.
   */
  async createGuestPlayer(
    dto: CreateGuestPlayerDto,
  ): Promise<GuestPlayerSessionResponseDto> {
    const validation = validateUsername(dto.username);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    // Check pre-emptively for duplicate normalized username
    const existing = await this.playerModel.findOne({
      normalizedUsername: validation.normalized,
    });
    if (existing) {
      throw new ConflictException('Username is already taken');
    }

    const playerId = this.generatePlayerId();
    const rawSessionToken = this.generateRawToken();
    const sessionTokenHash = this.hashToken(rawSessionToken);

    try {
      const newPlayer = new this.playerModel({
        playerId,
        username: dto.username.trim(),
        normalizedUsername: validation.normalized,
        sessionTokenHash,
        status: PlayerStatus.ACTIVE,
        lastActiveAt: new Date(),
      });

      const savedPlayer = await newPlayer.save();
      this.logger.log(`Guest player created: ${savedPlayer.username} (${savedPlayer.playerId})`);

      return {
        player: this.toProfileDto(savedPlayer),
        sessionToken: rawSessionToken,
      };
    } catch (error: any) {
      // Catch MongoDB unique constraint error (code 11000) for concurrency safety
      if (error.code === 11000 || error.name === 'MongoServerError') {
        throw new ConflictException('Username is already taken');
      }
      this.logger.error(`Error creating guest player: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate a session token presented by a client.
   * Updates lastActiveAt timestamp if valid.
   */
  async validateSession(rawToken: string): Promise<PlayerDocument | null> {
    if (!rawToken || typeof rawToken !== 'string') {
      return null;
    }

    const tokenHash = this.hashToken(rawToken.trim());

    // Include sessionTokenHash in query because it has select: false on the schema
    const player = await this.playerModel
      .findOne({
        sessionTokenHash: tokenHash,
        status: PlayerStatus.ACTIVE,
      })
      .select('+sessionTokenHash');

    if (!player) {
      return null;
    }

    // Touch last active time asynchronously
    player.lastActiveAt = new Date();
    await player.save();

    return player;
  }

  /**
   * Retrieve the current player's profile from the validated Player document.
   */
  getProfile(player: PlayerDocument | Player): PlayerProfileDto {
    return this.toProfileDto(player);
  }

  /**
   * End a guest session by invalidating the stored sessionTokenHash.
   */
  async logout(rawToken: string): Promise<{ success: boolean; message: string }> {
    if (!rawToken) {
      return { success: true, message: 'Session ended' };
    }

    const tokenHash = this.hashToken(rawToken.trim());
    await this.playerModel.updateOne(
      { sessionTokenHash: tokenHash },
      { $unset: { sessionTokenHash: 1 } },
    );

    return {
      success: true,
      message: 'Guest session terminated successfully',
    };
  }
}
