/**
 * Unit Tests for validateSensorData Utility
 * 
 * Tests validation logic for sensor data ranges.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateSensorData } from './validateSensorData';

describe('validateSensorData', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console.warn to verify warnings are logged
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.warn after each test
    consoleWarnSpy.mockRestore();
  });

  describe('valid data', () => {
    it('should validate correct voltage, current, and power values', () => {
      const result = validateSensorData({
        voltage: 250,
        current: 50,
        power: 12500,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should validate data with stepCount', () => {
      const result = validateSensorData({
        voltage: 230,
        current: 10.5,
        power: 2415,
        stepCount: 50000,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should validate minimum boundary values', () => {
      const result = validateSensorData({
        voltage: 0,
        current: 0,
        power: 0,
        stepCount: 0,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should validate maximum boundary values', () => {
      const result = validateSensorData({
        voltage: 500,
        current: 100,
        power: 50000,
        stepCount: 1000000,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should validate partial data (only some fields present)', () => {
      const result = validateSensorData({
        voltage: 240,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should validate empty data object', () => {
      const result = validateSensorData({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('out-of-range voltage', () => {
    it('should reject voltage above maximum (500V)', () => {
      const result = validateSensorData({
        voltage: 501,
        current: 50,
        power: 12500,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('voltage');
      expect(result.errors[0]).toContain('501V');
      expect(result.errors[0]).toContain('0-500V');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] voltage')
      );
    });

    it('should reject negative voltage', () => {
      const result = validateSensorData({
        voltage: -10,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('voltage');
      expect(result.errors[0]).toContain('-10V');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] voltage')
      );
    });
  });

  describe('out-of-range current', () => {
    it('should reject current above maximum (100A)', () => {
      const result = validateSensorData({
        current: 150,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('current');
      expect(result.errors[0]).toContain('150A');
      expect(result.errors[0]).toContain('0-100A');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] current')
      );
    });

    it('should reject negative current', () => {
      const result = validateSensorData({
        current: -5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('current');
      expect(result.errors[0]).toContain('-5A');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] current')
      );
    });
  });

  describe('out-of-range power', () => {
    it('should reject power above maximum (50000W)', () => {
      const result = validateSensorData({
        power: 60000,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('power');
      expect(result.errors[0]).toContain('60000W');
      expect(result.errors[0]).toContain('0-50000W');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] power')
      );
    });

    it('should reject negative power', () => {
      const result = validateSensorData({
        power: -1000,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('power');
      expect(result.errors[0]).toContain('-1000W');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] power')
      );
    });
  });

  describe('out-of-range stepCount', () => {
    it('should reject stepCount above maximum (1000000)', () => {
      const result = validateSensorData({
        stepCount: 1500000,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('stepCount');
      expect(result.errors[0]).toContain('1500000');
      expect(result.errors[0]).toContain('0-1000000');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] stepCount')
      );
    });

    it('should reject negative stepCount', () => {
      const result = validateSensorData({
        stepCount: -100,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('stepCount');
      expect(result.errors[0]).toContain('-100');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] stepCount')
      );
    });
  });

  describe('multiple validation errors', () => {
    it('should report all validation errors when multiple fields are invalid', () => {
      const result = validateSensorData({
        voltage: 600,
        current: 150,
        power: -500,
        stepCount: 2000000,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors[0]).toContain('voltage');
      expect(result.errors[1]).toContain('current');
      expect(result.errors[2]).toContain('power');
      expect(result.errors[3]).toContain('stepCount');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(4);
    });

    it('should report only invalid fields when some are valid', () => {
      const result = validateSensorData({
        voltage: 240, // valid
        current: 150, // invalid
        power: 12000, // valid
        stepCount: -50, // invalid
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('current');
      expect(result.errors[1]).toContain('stepCount');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalid data types', () => {
    it('should reject non-numeric voltage', () => {
      const result = validateSensorData({
        voltage: 'invalid' as any,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('voltage');
      expect(result.errors[0]).toContain('not a valid number');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] voltage')
      );
    });

    it('should reject NaN values', () => {
      const result = validateSensorData({
        current: NaN,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('current');
      expect(result.errors[0]).toContain('not a valid number');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Validation] current')
      );
    });
  });

  describe('decimal precision', () => {
    it('should validate decimal values for voltage', () => {
      const result = validateSensorData({
        voltage: 240.5,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate decimal values for current', () => {
      const result = validateSensorData({
        current: 10.25,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate decimal values for power', () => {
      const result = validateSensorData({
        power: 2500.75,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
