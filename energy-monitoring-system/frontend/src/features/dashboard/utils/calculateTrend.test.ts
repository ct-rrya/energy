import { describe, it, expect } from 'vitest';
import { calculateTrend } from './calculateTrend';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

describe('calculateTrend', () => {
  describe('positive trends', () => {
    it('should calculate positive percentage change correctly', () => {
      const result = calculateTrend(24.7, 22.0);

      expect(result.direction).toBe('up');
      expect(result.percentage).toBeCloseTo(12.3, 1);
      expect(result.color).toBe('#3ED98A');
      expect(result.icon).toBe(TrendingUp);
      expect(result.label).toContain('↑');
      expect(result.label).toContain('12.3%');
      expect(result.label).toContain('vs yesterday');
    });

    it('should handle large positive changes', () => {
      const result = calculateTrend(100, 50);

      expect(result.direction).toBe('up');
      expect(result.percentage).toBe(100);
      expect(result.color).toBe('#3ED98A');
      expect(result.label).toContain('↑ 100.0%');
    });

    it('should handle small positive changes', () => {
      const result = calculateTrend(10.1, 10.0);

      expect(result.direction).toBe('up');
      expect(result.percentage).toBeCloseTo(1.0, 1);
      expect(result.color).toBe('#3ED98A');
      expect(result.label).toContain('↑ 1.0%');
    });
  });

  describe('negative trends', () => {
    it('should calculate negative percentage change correctly', () => {
      const result = calculateTrend(20.0, 25.0);

      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(20);
      expect(result.color).toBe('#F59E0B');
      expect(result.icon).toBe(TrendingDown);
      expect(result.label).toContain('↓');
      expect(result.label).toContain('20.0%');
      expect(result.label).toContain('vs yesterday');
    });

    it('should handle large negative changes', () => {
      const result = calculateTrend(25, 100);

      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(75);
      expect(result.color).toBe('#F59E0B');
      expect(result.label).toContain('↓ 75.0%');
    });

    it('should handle small negative changes', () => {
      const result = calculateTrend(9.9, 10.0);

      expect(result.direction).toBe('down');
      expect(result.percentage).toBeCloseTo(1.0, 1);
      expect(result.color).toBe('#F59E0B');
      expect(result.label).toContain('↓ 1.0%');
    });
  });

  describe('neutral trends', () => {
    it('should handle equal values', () => {
      const result = calculateTrend(25.0, 25.0);

      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF');
      expect(result.icon).toBe(Minus);
      expect(result.label).toBe('No change');
    });

    it('should handle zero values that are equal', () => {
      const result = calculateTrend(0, 0);

      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
      expect(result.label).toBe('No change');
    });
  });

  describe('no data scenarios', () => {
    it('should handle undefined current value', () => {
      const result = calculateTrend(undefined, 25.0);

      expect(result.direction).toBe('no-data');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF');
      expect(result.icon).toBe(HelpCircle);
      expect(result.label).toBe('No comparison data');
    });

    it('should handle undefined previous value', () => {
      const result = calculateTrend(25.0, undefined);

      expect(result.direction).toBe('no-data');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF');
      expect(result.icon).toBe(HelpCircle);
      expect(result.label).toBe('No comparison data');
    });

    it('should handle both values undefined', () => {
      const result = calculateTrend(undefined, undefined);

      expect(result.direction).toBe('no-data');
      expect(result.percentage).toBe(0);
      expect(result.label).toBe('No comparison data');
    });
  });

  describe('edge cases', () => {
    it('should handle percentage formatting to one decimal place', () => {
      const result = calculateTrend(10.333, 10.0);

      expect(result.label).toContain('3.3%'); // Should be rounded to 1 decimal
      expect(result.label).not.toContain('3.33%');
    });

    it('should handle very small percentage changes', () => {
      const result = calculateTrend(10.001, 10.0);

      expect(result.direction).toBe('up');
      expect(result.percentage).toBeCloseTo(0.01, 2);
      expect(result.label).toContain('0.0%'); // Rounds to 0.0
    });

    it('should handle changes from zero', () => {
      const result = calculateTrend(10, 0);

      // This should result in Infinity percentage, but the function handles it
      expect(result.direction).toBe('up');
      expect(result.percentage).toBe(Infinity);
    });

    it('should handle negative to positive transition', () => {
      const result = calculateTrend(10, -5);

      // (10 - (-5)) / (-5) * 100 = 15 / -5 * 100 = -300%
      // Since percentChange is negative, direction is 'down', but this is transitioning from negative to positive
      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(300);
    });

    it('should handle positive to negative transition', () => {
      const result = calculateTrend(-5, 10);

      // (-5 - 10) / 10 * 100 = -15 / 10 * 100 = -150%
      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(150);
    });
  });

  describe('color assignments', () => {
    it('should use green (#3ED98A) for positive trends', () => {
      const result = calculateTrend(30, 20);
      expect(result.color).toBe('#3ED98A');
    });

    it('should use amber (#F59E0B) for negative trends', () => {
      const result = calculateTrend(20, 30);
      expect(result.color).toBe('#F59E0B');
    });

    it('should use gray (#9CA3AF) for neutral trends', () => {
      const result = calculateTrend(25, 25);
      expect(result.color).toBe('#9CA3AF');
    });

    it('should use gray (#9CA3AF) for no data', () => {
      const result = calculateTrend(undefined, 25);
      expect(result.color).toBe('#9CA3AF');
    });
  });
});
