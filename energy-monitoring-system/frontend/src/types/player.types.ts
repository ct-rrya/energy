/**
 * Types for EcoStep Gamification & Guest Players
 */

export interface PlayerProfile {
  playerId: string;
  username: string;
  createdAt: string;
  lastActiveAt: string;
  xp?: number;
  level?: number;
  completedMissions?: string[];
  badges?: Array<{
    badgeId: string;
    unlockedAt: string;
  }>;
}

export interface GuestPlayerSessionResponse {
  player: PlayerProfile;
  sessionToken: string;
}

export interface StoredPlayerSession {
  playerId: string;
  username: string;
  sessionToken: string;
}
