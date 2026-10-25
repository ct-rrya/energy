import {
  calculateLevelFromXp,
  getPlayerLevelProgress,
  LEVEL_TIERS,
} from './level-calculator';

describe('LevelCalculator', () => {
  describe('calculateLevelFromXp', () => {
    it('returns Level 1 for 0 - 99 XP', () => {
      expect(calculateLevelFromXp(0)).toBe(1);
      expect(calculateLevelFromXp(50)).toBe(1);
      expect(calculateLevelFromXp(99)).toBe(1);
    });

    it('returns Level 2 for 100 - 249 XP', () => {
      expect(calculateLevelFromXp(100)).toBe(2);
      expect(calculateLevelFromXp(185)).toBe(2);
      expect(calculateLevelFromXp(249)).toBe(2);
    });

    it('returns Level 3 for 250 - 449 XP', () => {
      expect(calculateLevelFromXp(250)).toBe(3);
      expect(calculateLevelFromXp(449)).toBe(3);
    });

    it('returns Level 4 for 450 - 699 XP', () => {
      expect(calculateLevelFromXp(450)).toBe(4);
      expect(calculateLevelFromXp(699)).toBe(4);
    });

    it('returns Level 5 for 700+ XP', () => {
      expect(calculateLevelFromXp(700)).toBe(5);
      expect(calculateLevelFromXp(1200)).toBe(5);
    });
  });

  describe('getPlayerLevelProgress', () => {
    it('calculates progress percentage correctly for Level 1', () => {
      const progress = getPlayerLevelProgress(50);
      expect(progress.level).toBe(1);
      expect(progress.levelTitle).toBe('Curious Walker');
      expect(progress.currentLevelMinXp).toBe(0);
      expect(progress.nextLevelXp).toBe(100);
      expect(progress.xpToNextLevel).toBe(50);
      expect(progress.progressPercentage).toBe(50);
      expect(progress.isMaxLevel).toBe(false);
    });

    it('calculates progress percentage correctly for Level 2', () => {
      // Level 2 range: 100 to 250 (range = 150). 175 XP is 75 XP into level 2 -> 50%
      const progress = getPlayerLevelProgress(175);
      expect(progress.level).toBe(2);
      expect(progress.levelTitle).toBe('Energy Harvester');
      expect(progress.progressPercentage).toBe(50);
      expect(progress.xpToNextLevel).toBe(75);
    });

    it('handles max level gracefully', () => {
      const progress = getPlayerLevelProgress(800);
      expect(progress.level).toBe(5);
      expect(progress.levelTitle).toBe('EcoStep Master');
      expect(progress.nextLevelXp).toBeNull();
      expect(progress.xpToNextLevel).toBe(0);
      expect(progress.progressPercentage).toBe(100);
      expect(progress.isMaxLevel).toBe(true);
    });
  });
});
