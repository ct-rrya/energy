import { describe, it, expect } from 'vitest';
import { getCompanionCommentary } from './companionCommentary';

describe('EcoStep Campus Companion Commentary Engine', () => {
  it('uses authoritative comparison-driven AI commentary when provided by backend', () => {
    const obs = getCompanionCommentary({
      id: 'week_2',
      label: 'Week 2',
      weekNumber: 2,
      state: 'COMPLETED',
      isAchieved: true,
      progressPercentage: 140,
      currentMWh: 0.035,
      targetMWh: 0.025,
      stepCount: 140,
      aiComment: 'Kinetic surge! Energy leaped +40% over last week (140 steps vs 100). The campus hustle is unmistakable.',
      comparison: {
        hasPreviousWeek: true,
        prevEnergyMWh: 0.025,
        prevStepCount: 100,
        energyDiffMWh: 0.01,
        stepDiff: 40,
        energyChangePct: 40.0,
        stepChangePct: 40.0,
        category: 'SIGNIFICANT_INCREASE',
      },
    });

    expect(obs.headline).toContain('Kinetic surge!');
    expect(obs.headline).toContain('+40% over last week');
    expect(obs.subtext).toBe('+40% vs previous week (+40 steps) · 140 footsteps');
  });

  it('formats drop comparison accurately in subtext', () => {
    const obs = getCompanionCommentary({
      id: 'week_3',
      label: 'Week 3',
      weekNumber: 3,
      state: 'COMPLETED',
      isAchieved: false,
      progressPercentage: 56,
      currentMWh: 0.014,
      targetMWh: 0.025,
      stepCount: 70,
      aiComment: 'Noticeable drop: energy fell 30% from last week. Hallways were noticeably quieter.',
      comparison: {
        hasPreviousWeek: true,
        prevEnergyMWh: 0.02,
        prevStepCount: 100,
        energyDiffMWh: -0.006,
        stepDiff: -30,
        energyChangePct: -30.0,
        stepChangePct: -30.0,
        category: 'SIGNIFICANT_DROP',
      },
    });

    expect(obs.headline).toContain('Noticeable drop');
    expect(obs.subtext).toBe('-30% vs previous week (-30 steps) · 70 footsteps');
  });

  it('handles zero activity without claiming an increase or decrease', () => {
    const obs = getCompanionCommentary({
      id: 'week_1',
      label: 'Week 1',
      weekNumber: 1,
      state: 'CURRENT',
      isAchieved: false,
      progressPercentage: 0,
      currentMWh: 0,
      targetMWh: 0.025,
      stepCount: 0,
      comparison: {
        hasPreviousWeek: false,
        prevEnergyMWh: 0,
        prevStepCount: 0,
        energyDiffMWh: 0,
        stepDiff: 0,
        energyChangePct: null,
        stepChangePct: null,
        category: 'NO_ACTIVITY',
      },
    });

    expect(obs.subtext).toBe('Tile in standby · Waiting for pedestrian steps');
    expect(obs.headline).not.toContain('% of a phone charge');
  });

  it('handles record high category accurately in subtext', () => {
    const obs = getCompanionCommentary({
      id: 'week_4',
      label: 'Week 4',
      weekNumber: 4,
      state: 'COMPLETED',
      isAchieved: true,
      progressPercentage: 120,
      currentMWh: 0.03,
      targetMWh: 0.025,
      stepCount: 150,
      aiComment: 'New weekly record! Pounded out 0.03 mWh across 150 steps—campus traffic hasn\'t moved like this all month.',
      comparison: {
        hasPreviousWeek: true,
        prevEnergyMWh: 0.025,
        prevStepCount: 100,
        energyDiffMWh: 0.005,
        stepDiff: 50,
        energyChangePct: 20.0,
        stepChangePct: 50.0,
        category: 'RECORD_HIGH',
        isRecordHigh: true,
      },
    });

    expect(obs.subtext).toBe('New weekly record (+20%) · 150 footsteps recorded');
  });
});

