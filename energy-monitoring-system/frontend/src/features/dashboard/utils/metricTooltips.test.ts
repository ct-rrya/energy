import { describe, it, expect } from 'vitest';
import {
  getStepsTooltip,
  getPowerTooltip,
  getEnergyTodayTooltip,
  getVoltageTooltip,
  getCurrentTooltip,
  getGlanceTooltip,
} from './metricTooltips';

describe('metricTooltips utility', () => {
  describe('getStepsTooltip', () => {
    it('handles zero or undefined gracefully without awkward jokes', () => {
      expect(getStepsTooltip(0)).toContain('Zero footsteps so far today');
      expect(getStepsTooltip(undefined)).toContain('Zero footsteps so far today');
    });

    it('formats single step correctly', () => {
      expect(getStepsTooltip(1)).toContain('1 footstep recorded');
    });

    it('formats moderate step counts with relatable observations', () => {
      const tooltip = getStepsTooltip(450);
      expect(tooltip).toContain('450 footsteps!');
      expect(tooltip).toContain('crosswalk');
    });

    it('formats busy campus traffic with subtle wit', () => {
      const tooltip = getStepsTooltip(1248);
      expect(tooltip).toContain('1,248 footsteps!');
      expect(tooltip).toContain('hallway between lectures');
    });

    it('formats high marathon counts', () => {
      const tooltip = getStepsTooltip(8500);
      expect(tooltip).toContain('8,500 footsteps!');
      expect(tooltip).toContain('marathon');
    });
  });

  describe('getPowerTooltip', () => {
    it('handles zero or inactive state gracefully', () => {
      expect(getPowerTooltip(0, false)).toContain('0.0 mW right now');
      expect(getPowerTooltip(undefined, false)).toContain('0.0 mW right now');
    });

    it('provides relatable phrasing for low power generation', () => {
      const tooltip = getPowerTooltip(12.4, true);
      expect(tooltip).toContain('12.4 mW');
      expect(tooltip).toContain('Small power, big potential');
    });

    it('reflects active pace and peak spikes', () => {
      const moderate = getPowerTooltip(65.0, true);
      expect(moderate).toContain('65.0 mW');

      const peak = getPowerTooltip(150.2, true);
      expect(peak).toContain('150.2 mW peak!');
    });
  });

  describe('getEnergyTodayTooltip', () => {
    it('handles zero energy gracefully without phone comparisons', () => {
      const tooltip = getEnergyTodayTooltip(0);
      expect(tooltip).toContain('0 mWh accumulated');
      expect(tooltip).not.toContain('smartphone');
    });

    it('handles micro-energy (< 10 mWh) with IoT beacon comparison', () => {
      const tooltip = getEnergyTodayTooltip(0.005); // 5 mWh
      expect(tooltip).toContain('5.0 mWh');
      expect(tooltip).toContain('IoT beacon');
      expect(tooltip).not.toContain('smartphone');
    });

    it('handles moderate energy (10 - 500 mWh) with digital watch comparison', () => {
      const tooltip = getEnergyTodayTooltip(0.12); // 120 mWh
      expect(tooltip).toContain('120 mWh');
      expect(tooltip).toContain('digital watch');
      expect(tooltip).not.toContain('smartphone');
    });

    it('calculates theoretical smartphone battery charge accurately for >= 0.5 Wh', () => {
      // 1.2 Wh on 12 Wh battery with 85% efficiency = (1.2 / 12) * 100 * 0.85 = 8.5%
      const tooltip = getEnergyTodayTooltip(1.2);
      expect(tooltip).toContain('1.20 Wh');
      expect(tooltip).toContain('Theoretically enough energy to trickle-charge about 8.5% of a standard 12 Wh smartphone battery');
    });
  });

  describe('getVoltageTooltip', () => {
    it('handles resting voltage', () => {
      expect(getVoltageTooltip(0)).toContain('0.0 V at rest');
    });

    it('recognizes standard and high impact voltages', () => {
      expect(getVoltageTooltip(3.3)).toContain('3.30 V');
      expect(getVoltageTooltip(3.3)).toContain('standard USB power rail');

      expect(getVoltageTooltip(8.5)).toContain('8.50 V peak!');
    });
  });

  describe('getCurrentTooltip', () => {
    it('handles resting current', () => {
      expect(getCurrentTooltip(0)).toContain('0.0 mA at rest');
    });

    it('reports charge flow accurately', () => {
      expect(getCurrentTooltip(2.4)).toContain('2.4 mA flowing');
      expect(getCurrentTooltip(12.0)).toContain('12.0 mA discharge rate');
    });
  });

  describe('getGlanceTooltip', () => {
    it('summarizes resting and active states concisely', () => {
      expect(getGlanceTooltip(0, 0)).toContain('A quiet day so far');
      expect(getGlanceTooltip(250, 0.05)).toContain('250 steps translated into clean energy');
    });
  });
});

