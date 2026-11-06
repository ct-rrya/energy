import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MilestonesService } from './milestones.service';
import { MilestoneTarget } from './schemas/milestone-target.schema';
import { EnergyReading } from '../iot/schemas/energy-reading.schema';

describe('MilestonesService (Calendar Monthly & Weekly)', () => {
  let service: MilestonesService;
  let mockMilestoneTargetModel: any;
  let mockEnergyReadingModel: any;

  const createMockTargetDoc = () => ({
    target1WeekMWh: 0.025,
    target1MonthMWh: 0.1,
    target3MonthsMWh: 0.3,
    target6MonthsMWh: 0.5,
    target1YearMWh: 1.0,
    isSingleton: true,
    monthlyConfigurations: {},
    markModified: jest.fn(),
    save: jest.fn().mockResolvedValue(true),
  });

  let mockTargetDoc: any;

  beforeEach(async () => {
    mockTargetDoc = createMockTargetDoc();

    mockMilestoneTargetModel = {
      findOne: jest.fn().mockResolvedValue(mockTargetDoc),
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      })),
    };

    mockEnergyReadingModel = {
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestonesService,
        {
          provide: getModelToken(MilestoneTarget.name),
          useValue: mockMilestoneTargetModel,
        },
        {
          provide: getModelToken(EnergyReading.name),
          useValue: mockEnergyReadingModel,
        },
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
  });

  describe('Aggregation Pipeline Structure', () => {
    it('uses $setWindowFields with sensor partitioning and receivedAt filtering', async () => {
      mockEnergyReadingModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalEnergyMWh: 12.345678,
          totalSteps: 250,
          readingCount: 10,
        },
      ]);

      const start = new Date('2026-11-01T00:00:00Z');
      const end = new Date('2026-11-07T23:59:59Z');

      const result = await service.getAccumulatedEnergyForPeriod(start, end);

      expect(mockEnergyReadingModel.aggregate).toHaveBeenCalledTimes(1);
      const pipeline = mockEnergyReadingModel.aggregate.mock.calls[0][0];

      // Stage 1: $match using server-authoritative receivedAt with timestamp fallback and excluding mock source
      const matchStage = pipeline[0].$match;
      expect(matchStage.$and).toBeDefined();
      expect(matchStage.$and[0].$or).toEqual([
        { receivedAt: { $gte: start, $lte: end } },
        { receivedAt: { $exists: false }, timestamp: { $gte: start, $lte: end } },
      ]);
      expect(matchStage.$and[1]).toEqual({ source: { $ne: 'mock' } });

      // Stage 2: $sort by sensorId, receivedAt, timestamp
      expect(pipeline[1].$sort).toEqual({ sensorId: 1, receivedAt: 1, timestamp: 1 });

      // Stage 3: $setWindowFields partitioned by sensorId
      expect(pipeline[2].$setWindowFields).toBeDefined();
      expect(pipeline[2].$setWindowFields.partitionBy).toBe('$sensorId');
      expect(pipeline[2].$setWindowFields.output.previousStepCount).toEqual({
        $shift: { output: '$stepCount', by: -1 },
      });

      // Stage 4: $addFields with stepDelta handling resets & initial reading
      expect(pipeline[3].$addFields.stepDelta).toBeDefined();

      // Stage 5: $group summing energy directly without continuous power fallback
      expect(pipeline[4].$group.totalEnergyMWh).toEqual({ $sum: '$energy' });
      expect(pipeline[4].$group.totalSteps).toEqual({ $sum: '$stepDelta' });

      expect(result.energyMWh).toBe(12.345678);
      expect(result.steps).toBe(250);
    });

    it('returns 0 energy and 0 steps when no readings match', async () => {
      mockEnergyReadingModel.aggregate.mockResolvedValue([]);

      const result = await service.getAccumulatedEnergyForPeriod(new Date(), new Date());
      expect(result).toEqual({ energyMWh: 0, steps: 0 });
    });
  });

  describe('Calendar Boundaries and Timezone Handling', () => {
    it('calculates exact Asia/Manila UTC boundaries for start and end of day', () => {
      // 2026-11-01 00:00:00 Manila is 2026-10-31 16:00:00 UTC
      // 2026-11-07 23:59:59.999 Manila is 2026-11-07 15:59:59.999 UTC
      const range = service.getManilaUTCRange(2026, 11, 1, 7);

      expect(range.start.toISOString()).toBe('2026-10-31T16:00:00.000Z');
      expect(range.end.toISOString()).toBe('2026-11-07T15:59:59.999Z');
    });

    it('computes correct Sunday–Saturday calendar rows with month clamping for October 2026', async () => {
      mockEnergyReadingModel.aggregate.mockResolvedValue([
        { _id: null, totalEnergyMWh: 10.0, totalSteps: 100 },
      ]);

      const octMilestones = await service.getMonthlyMilestones('2026-10');

      expect(octMilestones.yearMonth).toBe('2026-10');
      expect(octMilestones.monthLabel).toBe('October 2026');
      expect(octMilestones.weeklyMilestones).toHaveLength(5);

      // Oct 1 is Thursday: Week 1 clamped to Days 1–3 (calendar row Sep 27 – Oct 3)
      expect(octMilestones.weeklyMilestones[0].dayRangeLabel).toBe('Days 1–3');
      expect(octMilestones.weeklyMilestones[0].days).toBe(3);
      expect(octMilestones.weeklyMilestones[0].calendarRowLabel).toBe('Sep 27 – Oct 3');

      // Weeks 2–5
      expect(octMilestones.weeklyMilestones[1].dayRangeLabel).toBe('Days 4–10');
      expect(octMilestones.weeklyMilestones[2].dayRangeLabel).toBe('Days 11–17');
      expect(octMilestones.weeklyMilestones[3].dayRangeLabel).toBe('Days 18–24');
      expect(octMilestones.weeklyMilestones[4].dayRangeLabel).toBe('Days 25–31');
      expect(octMilestones.weeklyMilestones[4].days).toBe(7);

      // Total days partitioned across all weeks equals 31
      const totalDaysSum = octMilestones.weeklyMilestones.reduce((sum, w) => sum + w.days, 0);
      expect(totalDaysSum).toBe(31);
    });

    it('correctly handles months spanning 6 Sunday–Saturday calendar rows (May 2027)', async () => {
      mockEnergyReadingModel.aggregate.mockResolvedValue([
        { _id: null, totalEnergyMWh: 5.0, totalSteps: 50 },
      ]);

      // May 2027: May 1 is Saturday (Week 1 has 1 day), ends Mon May 31 (Week 6 has 2 days)
      const mayMilestones = await service.getMonthlyMilestones('2027-05');

      expect(mayMilestones.yearMonth).toBe('2027-05');
      expect(mayMilestones.weeklyMilestones).toHaveLength(6);
      expect(mayMilestones.weeklyMilestones[0].dayRangeLabel).toBe('Days 1–1');
      expect(mayMilestones.weeklyMilestones[0].days).toBe(1);
      expect(mayMilestones.weeklyMilestones[5].dayRangeLabel).toBe('Days 30–31');
      expect(mayMilestones.weeklyMilestones[5].days).toBe(2);

      const totalDaysSum = mayMilestones.weeklyMilestones.reduce((sum, w) => sum + w.days, 0);
      expect(totalDaysSum).toBe(31);
    });

    it('provides available months starting from October 2026', () => {
      const available = service.getAvailableMonths();
      expect(available[0]).toBe('2026-10');
      expect(available).toContain('2026-11');
    });
  });

  describe('Progress, Rounding, and Equivalents', () => {
    it('accurately evaluates smartphone charging equivalents (~15,853 mWh per charge)', async () => {
      // 31,706 mWh = exactly 2.0 full phone recharges at 15,853 mWh each
      mockEnergyReadingModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalEnergyMWh: 31706.0,
          totalSteps: 50000,
        },
      ]);

      const progress = await service.getMonthlyMilestones('2026-11');
      const monthly = progress.monthlyMilestone;

      expect(monthly.realWorldEquivalents.phoneCharges).toBe(2);
      expect(monthly.realWorldEquivalents.explanation).toContain('15,853 mWh');
    });

    it('never displays 100% completion for an unachieved milestone', async () => {
      // Target is 0.1 mWh. Current is 0.09998 mWh (99.98% progress, but unachieved)
      mockEnergyReadingModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalEnergyMWh: 0.09998,
          totalSteps: 350,
        },
      ]);

      const progress = await service.getMonthlyMilestones('2026-11');
      const monthly = progress.monthlyMilestone;

      expect(monthly.isAchieved).toBe(false);
      expect(monthly.progressPercentage).toBe(99.9); // Capped at 99.9%, never 100%
    });

    it('displays 100% or greater when achieved without arbitrary 999% capping', async () => {
      // Target is 0.025 mWh. Current is 0.3 mWh (1200% progress)
      mockEnergyReadingModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalEnergyMWh: 0.3,
          totalSteps: 1200,
        },
      ]);

      const progress = await service.getMonthlyMilestones('2026-11');
      const week1 = progress.weeklyMilestones[0];

      expect(week1.isAchieved).toBe(true);
      expect(week1.progressPercentage).toBe(1200); // Not capped at 999%
    });

    it('isolates AI commentary errors so milestone data delivery is not interrupted', async () => {
      mockEnergyReadingModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalEnergyMWh: 0.01,
          totalSteps: 40,
        },
      ]);

      // Force generateAIComment to throw an error
      jest.spyOn(service as any, 'generateAIComment').mockImplementation(() => {
        throw new Error('AI Service Quota Exceeded');
      });

      const progress = await service.getMonthlyMilestones('2026-11');

      expect(progress.weeklyMilestones).toHaveLength(5);
      expect(progress.weeklyMilestones[0].currentMWh).toBe(0.01);
      expect(progress.weeklyMilestones[0].aiComment).toContain('Kinetic energy generation in progress');
    });
  });

  describe('Context-Aware Week-Over-Week Telemetry Comparisons & Commentary', () => {
    it('accurately identifies significant week-over-week increase (+40%) with safe percentage and witty observation', () => {
      const comp = (service as any).computeComparison(
        0.035, // currentMWh
        140,   // currentSteps
        0.025, // targetMWh
        true,  // isAchieved
        140,   // rawPct
        'COMPLETED',
        true,  // hasPreviousWeek
        0.025, // prevEnergyMWh
        100,   // prevStepCount
        false, // isRecordHigh
      );

      expect(comp.hasPreviousWeek).toBe(true);
      expect(comp.category).toBe('SIGNIFICANT_INCREASE');
      expect(comp.energyChangePct).toBe(40.0);
      expect(comp.stepChangePct).toBe(40.0);
      expect(comp.energyDiffMWh).toBe(0.01);
      expect(comp.stepDiff).toBe(40);

      const comment = (service as any).generateAIComment(
        'Week 2',
        140,
        true,
        0.035,
        140,
        comp,
        'COMPLETED',
      );
      expect(comment).toMatch(/Kinetic surge|\+40%|midterms/);
    });

    it('accurately identifies week-over-week drop (-30%) and generates observant calm commentary', () => {
      const comp = (service as any).computeComparison(
        0.014, // currentMWh
        70,    // currentSteps
        0.025, // targetMWh
        false, // isAchieved
        56,    // rawPct
        'COMPLETED',
        true,  // hasPreviousWeek
        0.02,  // prevEnergyMWh
        100,   // prevStepCount
        false, // isRecordHigh
      );

      expect(comp.hasPreviousWeek).toBe(true);
      expect(comp.category).toBe('SIGNIFICANT_DROP');
      expect(comp.energyChangePct).toBe(-30.0);
      expect(comp.stepChangePct).toBe(-30.0);

      const comment = (service as any).generateAIComment(
        'Week 3',
        56,
        false,
        0.014,
        70,
        comp,
        'COMPLETED',
      );
      expect(comment).toMatch(/Noticeable drop|30%|quiet/);
    });

    it('accurately identifies consistent generation within ±5%', () => {
      const comp = (service as any).computeComparison(
        0.0202, // currentMWh (+1% vs 0.0200)
        101,    // currentSteps
        0.025,  // targetMWh
        false,  // isAchieved
        80.8,   // rawPct
        'CURRENT',
        true,   // hasPreviousWeek
        0.0200, // prevEnergyMWh
        100,    // prevStepCount
        false,  // isRecordHigh
      );

      expect(comp.category).toBe('CONSISTENT');
      expect(comp.energyChangePct).toBe(1.0);

      const comment = (service as any).generateAIComment(
        'Week 2',
        80.8,
        false,
        0.0202,
        101,
        comp,
        'CURRENT',
      );
      expect(comment).toMatch(/Remarkably steady|Consistent|clockwork/);
    });

    it('protects against division-by-zero when previous week had 0 energy', () => {
      const comp = (service as any).computeComparison(
        0.015,
        75,
        0.025,
        false,
        60,
        'CURRENT',
        true,
        0, // prevEnergyMWh is 0
        0, // prevStepCount is 0
        false,
      );

      expect(comp.hasPreviousWeek).toBe(true);
      expect(comp.energyChangePct).toBeNull(); // Never NaN or Infinity
      expect(comp.stepChangePct).toBeNull();
      expect(comp.category).toBe('ACTIVITY_RESUMED');

      const comment = (service as any).generateAIComment(
        'Week 2',
        60,
        false,
        0.015,
        75,
        comp,
        'CURRENT',
      );
      expect(comment).toMatch(/Signs of life|woke back up|traffic is back/);
    });

    it('correctly handles zero activity without claiming an increase or decrease', () => {
      const comp = (service as any).computeComparison(
        0,
        0,
        0.025,
        false,
        0,
        'CURRENT',
        true,
        0.025,
        100,
        false,
      );

      expect(comp.category).toBe('NO_ACTIVITY');
      const comment = (service as any).generateAIComment(
        'Week 1',
        0,
        false,
        0,
        0,
        comp,
        'CURRENT',
      );
      expect(comment).toMatch(/Zero footsteps|quiet|silence|Not a single step/);
      expect(comment).not.toContain('% of a phone charge');
    });

    it('recognizes record high and target exceeded achievements with witty commentary', () => {
      const comp = (service as any).computeComparison(
        0.05,
        250,
        0.025,
        true,
        200,
        'COMPLETED',
        true,
        0.025,
        100,
        false, // isRecordHigh: false, test TARGET_EXCEEDED
      );

      // Overachiever >= 150%
      expect(comp.category).toBe('TARGET_EXCEEDED');

      const comp2 = (service as any).computeComparison(
        0.03,
        150,
        0.025,
        true,
        120,
        'COMPLETED',
        true,
        0.025,
        100,
        true, // isRecordHigh
      );
      expect(comp2.category).toBe('RECORD_HIGH');

      const comment = (service as any).generateAIComment(
        'Week 4',
        120,
        true,
        0.03,
        150,
        comp2,
        'COMPLETED',
      );
      expect(comment).toMatch(/New weekly record|Highest harvest|Peak performance/);
    });
  });

  describe('Month-Specific Target Configuration', () => {
    it('preserves fractional decimal precision up to 6 decimal places', async () => {
      const updated = await service.updateTargets(
        {
          month: '2026-11',
          monthlyTargetMWh: 0.054321,
          weeklyTargetsMWh: {
            week1MWh: 0.000123,
            week2MWh: 0.000456,
          },
        },
        'admin-user',
      );

      expect(updated.save).toHaveBeenCalled();
      const novConfig = updated.monthlyConfigurations['2026-11'];
      expect(novConfig.monthlyTargetMWh).toBe(0.054321);
      expect(novConfig.weeklyTargetsMWh.week1MWh).toBe(0.000123);
      expect(novConfig.weeklyTargetsMWh.week2MWh).toBe(0.000456);
    });

    it('stores targets per month without overwriting previous months', async () => {
      mockTargetDoc.monthlyConfigurations = {
        '2026-10': {
          monthlyTargetMWh: 50.0,
          weeklyTargetsMWh: {
            week1MWh: 10,
            week2MWh: 10,
            week3MWh: 10,
            week4MWh: 10,
            week5MWh: 10,
          },
          updatedBy: 'admin',
          updatedAt: '2026-10-01T00:00:00Z',
        },
      };

      await service.updateTargets(
        {
          month: '2026-11',
          monthlyTargetMWh: 100.0,
          weeklyTargetsMWh: {
            week1MWh: 20,
            week2MWh: 20,
            week3MWh: 20,
            week4MWh: 20,
            week5MWh: 20,
          },
        },
        'admin-2',
      );

      // October remains intact
      expect(mockTargetDoc.monthlyConfigurations['2026-10'].monthlyTargetMWh).toBe(50.0);
      // November is saved
      expect(mockTargetDoc.monthlyConfigurations['2026-11'].monthlyTargetMWh).toBe(100.0);
    });

    it('automatically applies a single weeklyTargetMWh to all weeks within the selected month', async () => {
      const updated = await service.updateTargets(
        {
          month: '2026-11',
          monthlyTargetMWh: 20000,
          weeklyTargetMWh: 4000,
        },
        'admin-user',
      );

      const novConfig = updated.monthlyConfigurations['2026-11'];
      expect(novConfig.monthlyTargetMWh).toBe(20000);
      expect(novConfig.weeklyTargetsMWh.week1MWh).toBe(4000);
      expect(novConfig.weeklyTargetsMWh.week2MWh).toBe(4000);
      expect(novConfig.weeklyTargetsMWh.week3MWh).toBe(4000);
      expect(novConfig.weeklyTargetsMWh.week4MWh).toBe(4000);
      expect(novConfig.weeklyTargetsMWh.week5MWh).toBe(4000);
    });
  });
});
