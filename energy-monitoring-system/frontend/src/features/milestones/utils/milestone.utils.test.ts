import { describe, it, expect } from 'vitest';
import {
  formatMWh,
  formatWhFromMWh,
  formatProgressPercent,
  parsePositiveDecimal,
  formatPeriodDateRange,
} from './milestone.utils';

describe('milestone.utils', () => {
  describe('formatMWh', () => {
    it('formats values up to 6 decimals without trailing zeros', () => {
      expect(formatMWh(0.09)).toBe('0.09');
      expect(formatMWh(0.005)).toBe('0.005');
      expect(formatMWh(0.0001)).toBe('0.0001');
      expect(formatMWh(1.25)).toBe('1.25');
      expect(formatMWh(5000)).toBe('5,000');
      expect(formatMWh(0)).toBe('0');
      expect(formatMWh(null)).toBe('0');
      expect(formatMWh(undefined)).toBe('0');
    });
  });

  describe('formatWhFromMWh', () => {
    it('accurately converts mWh to Wh', () => {
      expect(formatWhFromMWh(5000)).toBe('5');
      expect(formatWhFromMWh(0.09)).toBe('0.00009');
      expect(formatWhFromMWh(1.25)).toBe('0.00125');
      expect(formatWhFromMWh(0)).toBe('0');
    });
  });

  describe('formatProgressPercent', () => {
    it('formats small percentages (< 1%) with up to 2 decimal places', () => {
      expect(formatProgressPercent(0.05)).toBe('0.05%');
      expect(formatProgressPercent(0.75)).toBe('0.75%');
    });

    it('formats normal percentages with 1 decimal place', () => {
      expect(formatProgressPercent(45.23)).toBe('45.2%');
      expect(formatProgressPercent(100)).toBe('100%');
    });

    it('never displays 100% for an unachieved milestone', () => {
      expect(formatProgressPercent(99.98, false)).toBe('99.9%');
      expect(formatProgressPercent(99.95, false)).toBe('99.9%');
      expect(formatProgressPercent(100, false)).toBe('99.9%');
      expect(formatProgressPercent(100, true)).toBe('100%');
    });

    it('handles large percentages (> 999%) without arbitrary cap', () => {
      expect(formatProgressPercent(1250.4)).toBe('1,250.4%');
    });
  });

  describe('parsePositiveDecimal', () => {
    it('parses valid positive decimal numbers up to 6 decimal places', () => {
      expect(parsePositiveDecimal('0.000001')).toBe(0.000001);
      expect(parsePositiveDecimal(1.2345678)).toBe(1.234568);
      expect(parsePositiveDecimal(5000)).toBe(5000);
    });

    it('rejects zero or negative numbers', () => {
      expect(parsePositiveDecimal('0')).toBeNull();
      expect(parsePositiveDecimal('-5')).toBeNull();
      expect(parsePositiveDecimal('abc')).toBeNull();
    });
  });

  describe('formatPeriodDateRange', () => {
    it('formats start and end dates with local time and timezone', () => {
      const start = '2026-10-30T07:55:00.000Z';
      const end = '2026-11-06T07:55:00.000Z';
      const result = formatPeriodDateRange(start, end, 7);

      expect(result.startFormatted).toBeDefined();
      expect(result.endFormatted).toBeDefined();
      expect(result.rangeText).toContain('–');
      expect(result.rangeText).toContain(result.timeZoneName);
    });

    it('falls back to computing start date from days when startDate is omitted', () => {
      const end = '2026-11-06T07:55:00.000Z';
      const result = formatPeriodDateRange(undefined, end, 30);

      expect(result.startFormatted).toBeDefined();
      expect(result.endFormatted).toBeDefined();
      expect(result.rangeText).toContain('–');
    });
  });
});

