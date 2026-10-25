import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerDocument = Player & Document;

export enum PlayerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Player Schema
 *
 * Represents an anonymous / guest player in the EcoStep gamification system.
 * Public users can create a guest profile with just a username without email or password.
 *
 * Security Features:
 * - Session token is stored as a SHA-256 hash (never plain text)
 * - Session token hash is excluded from JSON serialization (select: false)
 * - Username uniqueness is enforced at database level via unique index on normalizedUsername
 * - Normalized username prevents collisions with case/whitespace variations
 *
 * Future Gamification Extensibility:
 * - Prepared for future additions (XP, level, badges, missions, virtual plants)
 *   without activating them in Phase 2.
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.sessionTokenHash;
      return ret;
    },
  },
})
export class Player {
  /**
   * Unique public player ID (e.g., eco_player_xxxxxxxx)
   */
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  playerId: string;

  /**
   * Display username (preserving user casing, e.g. "EcoExplorer99")
   */
  @Prop({
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  })
  username: string;

  /**
   * Normalized username for unique collision check (lowercase, trimmed)
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  normalizedUsername: string;

  /**
   * SHA-256 hash of the currently active guest session token
   * Excluded from default queries for security
   */
  @Prop({
    required: false,
    select: false,
    index: true,
  })
  sessionTokenHash?: string;

  /**
   * Account status
   */
  @Prop({
    required: true,
    enum: Object.values(PlayerStatus),
    default: PlayerStatus.ACTIVE,
  })
  status: PlayerStatus;

  /**
   * Timestamp of last active interaction
   */
  @Prop({
    required: true,
    default: Date.now,
  })
  lastActiveAt: Date;

  /**
   * Authoritative player experience points (XP)
   */
  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  xp: number;

  /**
   * Authoritative player level calculated from total XP
   */
  @Prop({
    required: true,
    default: 1,
    min: 1,
  })
  level: number;

  /**
   * Completed mission IDs
   */
  @Prop({
    type: [String],
    default: [],
  })
  completedMissions: string[];

  /**
   * Unlocked badge records
   */
  @Prop({
    type: [
      {
        badgeId: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  badges: Array<{ badgeId: string; unlockedAt: Date }>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);

// Compound index for deterministic, high-performance leaderboard queries
PlayerSchema.index({ status: 1, xp: -1, updatedAt: 1, playerId: 1 });
