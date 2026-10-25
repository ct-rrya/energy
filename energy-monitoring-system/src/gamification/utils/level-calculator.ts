export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number | null; // null if max level
}

export const LEVEL_TIERS: LevelInfo[] = [
  { level: 1, title: 'Curious Walker', minXp: 0, maxXp: 100 },
  { level: 2, title: 'Energy Harvester', minXp: 100, maxXp: 250 },
  { level: 3, title: 'Kinetic Innovator', minXp: 250, maxXp: 450 },
  { level: 4, title: 'Sustainability Champion', minXp: 450, maxXp: 700 },
  { level: 5, title: 'EcoStep Master', minXp: 700, maxXp: null },
];

export interface PlayerLevelProgress {
  currentXp: number;
  level: number;
  levelTitle: string;
  currentLevelMinXp: number;
  nextLevelXp: number | null;
  xpToNextLevel: number;
  progressPercentage: number;
  isMaxLevel: boolean;
}

export function calculateLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, xp || 0);
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (safeXp >= LEVEL_TIERS[i].minXp) {
      return LEVEL_TIERS[i].level;
    }
  }
  return 1;
}

export function getPlayerLevelProgress(xp: number): PlayerLevelProgress {
  const safeXp = Math.max(0, xp || 0);
  const currentLevelNumber = calculateLevelFromXp(safeXp);
  const tier =
    LEVEL_TIERS.find((t) => t.level === currentLevelNumber) || LEVEL_TIERS[0];

  if (tier.maxXp === null) {
    // Max level reached
    return {
      currentXp: safeXp,
      level: tier.level,
      levelTitle: tier.title,
      currentLevelMinXp: tier.minXp,
      nextLevelXp: null,
      xpToNextLevel: 0,
      progressPercentage: 100,
      isMaxLevel: true,
    };
  }

  const range = tier.maxXp - tier.minXp;
  const progressInLevel = Math.max(0, safeXp - tier.minXp);
  const percentage = Math.min(100, Math.round((progressInLevel / range) * 100));

  return {
    currentXp: safeXp,
    level: tier.level,
    levelTitle: tier.title,
    currentLevelMinXp: tier.minXp,
    nextLevelXp: tier.maxXp,
    xpToNextLevel: Math.max(0, tier.maxXp - safeXp),
    progressPercentage: percentage,
    isMaxLevel: false,
  };
}

export function getLevelTitle(level: number): string {
  const tier = LEVEL_TIERS.find((t) => t.level === level);
  return tier ? tier.title : 'Curious Walker';
}
