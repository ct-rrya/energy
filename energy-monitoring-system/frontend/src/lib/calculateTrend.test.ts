import { describe, it, expect } from 'vitest';
import { calculateTrend, type TrendDirection } from './calculateTrend';

describe('calculateTrend', () => {
  describe('Positive Trend (Increase)', () => {
    it('should return positive trend for increase from 80 to 100', () => {
      const result = calculateTrend(100, 80);
      
      expect(result.direction).toBe('up');
      expect(result.percentage).toBe(25.0);
      expect(result.color).toBe('#3ED98A'); // Green
      expect(result.label).toBe('↑ 25.0% vs yesterday');
    });

    it('should return positive trend for increase from 22.0 to 24.7', () => {
      const result = calculateTrend(24.7, 22.0);
      
      expect(result.direction).toBe('up');
      expect(result.percentage).toBeCloseTo(12.27, 1);
      expect(result.color).toBe('#3ED98A');
      expect(result.label).toContain('↑');
      expect(result.label).toContain('vs yesterday');
    });

    it('should return positive trend for small increase', () => {
      const result = calculateTrend(100.5, 100);
      
      expect(result.direction).toBe('up');
      expect(result.percentage).toBe(0.5);
      expect(result.color).toBe('#3ED98A');
    });

    it('should return positive trend for large increase', () => {
      const result = calculateTrend(200, 100);
      
      expect(result.direction).toBe('up');
      expect(result.percentage).toBe(100.0);
      expect(result.color).toBe('#3ED98A');
    });
  });

  describe('Negative Trend (Decrease)', () => {
    it('should return negative trend for decrease from 100 to 80', () => {
      const result = calculateTrend(80, 100);
      
      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(20.0);
      expect(result.color).toBe('#F59E0B'); // Amber
      expect(result.label).toBe('↓ 20.0% vs yesterday');
    });

    it('should return negative trend for decrease from 24.7 to 22.0', () => {
      const result = calculateTrend(22.0, 24.7);
      
      expect(result.direction).toBe('down');
      expect(result.percentage).toBeCloseTo(10.93, 1);
      expect(result.color).toBe('#F59E0B');
      expect(result.label).toContain('↓');
      expect(result.label).toContain('vs yesterday');
    });

    it('should return negative trend for small decrease', () => {
      const result = calculateTrend(99.5, 100);
      
      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(0.5);
      expect(result.color).toBe('#F59E0B');
    });

    it('should return negative trend for large decrease', () => {
      const result = calculateTrend(50, 100);
      
      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(50.0);
      expect(result.color).toBe('#F59E0B');
    });
  });

  describe('Neutral Trend (No Change)', () => {
    it('should return neutral trend when values are equal', () => {
      const result = calculateTrend(100, 100);
      
      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF'); // Gray
      expect(result.label).toBe('No change');
    });

    it('should return neutral trend for equal decimal values', () => {
      const result = calculateTrend(24.7, 24.7);
      
      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF');
      expect(result.label).toBe('No change');
    });

    it('should return neutral trend for zero values', () => {
      const result = calculateTrend(0, 0);
      
      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF');
    });
  });

  describe('No Data Scenarios', () => {
    it('should return no-data when current value is undefined', () => {
      const result = calculateTrend(undefined, 100);
      
      expect(result.direction).toBe('no-data');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF'); // Gray
      expect(result.label).toBe('No comparison data');
    });

    it('should return no-data when previous value is undefined', () => {
      const result = calculateTrend(100, undefined);
      
      expect(result.direction).toBe('no-data');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF');
      expect(result.label).toBe('No comparison data');
    });

    it('should return no-data when both values are undefined', () => {
      const result = calculateTrend(undefined, undefined);
      
      expect(result.direction).toBe('no-data');
      expect(result.percentage).toBe(0);
      expect(result.color).toBe('#9CA3AF');
      expect(result.label).toBe('No comparison data');
    });
  });

  describe('Edge Cases', () => {
    it('should handle increase from zero', () => {
      const result = calculateTrend(10, 0);
      
      expect(result.direction).toBe('up');
      expect(result.percentage).toBe(Infinity);
      expect(result.color).toBe('#3ED98A');
    });

    it('should handle decrease to zero', () => {
      const result = calculateTrend(0, 10);
      
      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(100);
      expect(result.color).toBe('#F59E0B');
    });

    it('should handle very small differences', () => {
      const result = calculateTrend(100.001, 100);
      
      expect(result.direction).toBe('up');
      expect(result.percentage).toBeCloseTo(0.001, 3);
      expect(result.color).toBe('#3ED98A');
    });

    it('should handle negative values', () => {
      const result = calculateTrend(-50, -100);
      
      // When going from -100 to -50, the percentage change is:
      // ((-50) - (-100)) / (-100) * 100 = 50 / -100 * 100 = -50%
      // This is a negative percentage change, so direction is 'down'
      expect(result.direction).toBe('down');
      expect(result.percentage).toBe(50);
      expect(result.color).toBe('#F59E0B');
    });

    it('should format percentage to 1 decimal place in label', () => {
      const result = calculateTrend(105.555, 100);
      
      expect(result.label).toContain('5.6%'); // 5.555 rounded to 1 decimal
    });
  });

  describe('Return Object Structure', () => {
    it('should return object with all required properties', () => {
      const result = calculateTrend(100, 80);
      
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('percentage');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('label');
    });

    it('should have correct TypeScript types', () => {
      const result = calculateTrend(100, 80);
      
      const validDirections: TrendDirection[] = ['up', 'down', 'neutral', 'no-data'];
      expect(validDirections).toContain(result.direction);
      expect(typeof result.percentage).toBe('number');
      expect(typeof result.color).toBe('string');
      expect(typeof result.label).toBe('string');
      expect(result.icon).toBeDefined();
    });
  });

  describe('Color Specifications', () => {
    it('should use correct green color for positive trend', () => {
      const result = calculateTrend(100, 80);
      expect(result.color).toBe('#3ED98A');
    });

    it('should use correct amber color for negative trend', () => {
      const result = calculateTrend(80, 100);
      expect(result.color).toBe('#F59E0B');
    });

    it('should use correct gray color for neutral trend', () => {
      const result = calculateTrend(100, 100);
      expect(result.color).toBe('#9CA3AF');
    });

    it('should use correct gray color for no-data', () => {
      const result = calculateTrend(undefined, 100);
      expect(result.color).toBe('#9CA3AF');
    });
  });

  describe('Label Format', () => {
    it('should include arrow and percentage for positive trend', () => {
      const result = calculateTrend(100, 80);
      expect(result.label).toMatch(/↑ \d+\.\d% vs yesterday/);
    });

    it('should include arrow and percentage for negative trend', () => {
      const result = calculateTrend(80, 100);
      expect(result.label).toMatch(/↓ \d+\.\d% vs yesterday/);
    });

    it('should show "No change" for neutral trend', () => {
      const result = calculateTrend(100, 100);
      expect(result.label).toBe('No change');
    });

    it('should show "No comparison data" for no-data', () => {
      const result = calculateTrend(undefined, 100);
      expect(result.label).toBe('No comparison data');
    });
  });
});
