import { describe, it, expect } from 'vitest';
import { hasMeaningfulActivity } from '@/components/dashboard/chartUtils';

describe('Zero-Activity Record Filtering Strategy', () => {
  describe('Filtering Rule Verification', () => {
    it('excludes records where all 5 measurements are zero', () => {
      const allZeroRecord = {
        voltage: 0,
        current: 0,
        power: 0,
        energy: 0,
        steps: 0,
      };
      expect(hasMeaningfulActivity(allZeroRecord)).toBe(false);
    });

    it('excludes records with stepCount field instead of steps when all are zero', () => {
      const allZeroWithStepCount = {
        voltage: 0,
        current: 0,
        power: 0,
        energy: 0,
        stepCount: 0,
      };
      expect(hasMeaningfulActivity(allZeroWithStepCount)).toBe(false);
    });

    it('excludes records where optional steps are undefined and all electrical values are zero', () => {
      const zeroWithoutSteps = {
        voltage: 0,
        current: 0,
        power: 0,
        energy: 0,
      };
      expect(hasMeaningfulActivity(zeroWithoutSteps)).toBe(false);
    });

    it('preserves records with nonzero voltage even when current, power, energy, and steps are zero', () => {
      const voltageActiveRecord = {
        voltage: 3.3,
        current: 0,
        power: 0,
        energy: 0,
        steps: 0,
      };
      expect(hasMeaningfulActivity(voltageActiveRecord)).toBe(true);
    });

    it('preserves records with nonzero current even when voltage, power, energy, and steps are zero', () => {
      const currentActiveRecord = {
        voltage: 0,
        current: 0.005,
        power: 0,
        energy: 0,
        steps: 0,
      };
      expect(hasMeaningfulActivity(currentActiveRecord)).toBe(true);
    });

    it('preserves records with nonzero power even when voltage, current, energy, and steps are zero', () => {
      const powerActiveRecord = {
        voltage: 0,
        current: 0,
        power: 0.015,
        energy: 0,
        steps: 0,
      };
      expect(hasMeaningfulActivity(powerActiveRecord)).toBe(true);
    });

    it('preserves records with nonzero energy even when voltage, current, power, and steps are zero', () => {
      const energyActiveRecord = {
        voltage: 0,
        current: 0,
        power: 0,
        energy: 0.001,
        steps: 0,
      };
      expect(hasMeaningfulActivity(energyActiveRecord)).toBe(true);
    });

    it('preserves records with nonzero step count even when all electrical values are zero', () => {
      const stepActiveRecord = {
        voltage: 0,
        current: 0,
        power: 0,
        energy: 0,
        steps: 1,
      };
      expect(hasMeaningfulActivity(stepActiveRecord)).toBe(true);
    });

    it('preserves records with full nonzero activity', () => {
      const activeRecord = {
        voltage: 4.5,
        current: 0.002,
        power: 0.009,
        energy: 0.045,
        steps: 12,
      };
      expect(hasMeaningfulActivity(activeRecord)).toBe(true);
    });
  });

  describe('Data Handling & Type Discrimination', () => {
    it('distinguishes zero from null and undefined without generic truthiness failure', () => {
      // In JavaScript truthiness: 0 is falsy, null is falsy, undefined is falsy.
      // But 0 is a valid measurement! hasMeaningfulActivity requires val > 0.
      expect(hasMeaningfulActivity({ voltage: 0, current: 0, power: 0, energy: 0, steps: 0 })).toBe(false);
      expect(hasMeaningfulActivity({ voltage: null, current: undefined, power: null, energy: undefined, steps: null })).toBe(false);
    });

    it('preserves legitimate zero values in individual fields when another field is active', () => {
      const record = {
        voltage: 5.0,
        current: 0, // Legitimate 0
        power: 0,   // Legitimate 0
        energy: 0,  // Legitimate 0
        steps: 0,   // Legitimate 0
      };

      expect(hasMeaningfulActivity(record)).toBe(true);
      // Verify individual 0 fields remain accessible numbers and not converted to undefined
      expect(record.current).toBe(0);
      expect(record.power).toBe(0);
      expect(record.energy).toBe(0);
      expect(record.steps).toBe(0);
    });

    it('handles negative or NaN values safely', () => {
      expect(hasMeaningfulActivity({ voltage: -1, current: 0, power: 0, energy: 0, steps: 0 })).toBe(false);
      expect(hasMeaningfulActivity({ voltage: NaN, current: 0, power: 0, energy: 0, steps: 0 })).toBe(false);
    });
  });
});

