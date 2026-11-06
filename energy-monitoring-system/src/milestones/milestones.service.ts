import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  MilestoneTarget,
  MilestoneTargetDocument,
  MonthTargetConfig,
  MonthConfigurationStatus,
  MilestoneCorrectionLog,
} from './schemas/milestone-target.schema';
import {
  EnergyReading,
  EnergyReadingDocument,
} from '../iot/schemas/energy-reading.schema';
import { UpdateMilestoneTargetsDto } from './dto/update-milestone-targets.dto';

const TIMEZONE_MANILA = 'Asia/Manila';

export type MilestoneLifecycleState = 'COMPLETED' | 'CURRENT' | 'UPCOMING';

export type MilestoneComparisonCategory =
  | 'NO_ACTIVITY'
  | 'FIRST_GENERATION'
  | 'BASELINE'
  | 'RECORD_HIGH'
  | 'TARGET_EXCEEDED'
  | 'TARGET_ACHIEVED'
  | 'SIGNIFICANT_INCREASE'
  | 'MODERATE_INCREASE'
  | 'CONSISTENT'
  | 'MODERATE_DROP'
  | 'SIGNIFICANT_DROP'
  | 'ACTIVITY_RESUMED'
  | 'UPCOMING';

export interface MilestoneComparison {
  hasPreviousWeek: boolean;
  prevEnergyMWh: number;
  prevStepCount: number;
  energyDiffMWh: number;
  stepDiff: number;
  energyChangePct: number | null; // e.g. +38.5 or -14.2, null if prevEnergyMWh === 0 or no prior baseline
  stepChangePct: number | null;   // e.g. +22.0 or -10.5, null if prevStepCount === 0 or no prior baseline
  category: MilestoneComparisonCategory;
  isRecordHigh?: boolean;
}

export interface MilestoneProgressItem {
  id: string; // 'monthly' | 'week_1' | 'week_2' | 'week_3' | 'week_4' | 'week_5' | 'week_6'
  periodKey: string;
  label: string;
  weekNumber?: number;
  dayRangeLabel: string;
  calendarRowLabel?: string;
  days: number;
  startDate: string;
  endDate: string;
  state: MilestoneLifecycleState;
  targetMWh: number;
  currentMWh: number;
  targetWh: number;
  currentWh: number;
  progressPercentage: number;
  isAchieved: boolean;
  stepCount: number;
  realWorldEquivalents: {
    phoneCharges: number;
    phoneChargePercent: number;
    ledHours: number;
    iotBeaconDays: number;
    comparisonText: string;
    explanation: string;
  };
  comparison?: MilestoneComparison;
  aiComment: string;
}

export interface MonthlyConfigurationPolicy {
  yearMonth: string;
  status: MonthConfigurationStatus;
  isConfigured: boolean;
  isLocked: boolean;
  deadlineDate: string; // ISO string in UTC
  deadlineLabel: string; // e.g. "Nov 2, 2026, 11:59 PM (Asia/Manila)"
  configuredBy?: string;
  configuredAt?: string;
  canEdit: boolean;
  requiresSuperAdmin: boolean;
  overdueMonths: string[];
  hasOverdue: boolean;
  correctionCount: number;
  correctionLogs?: MilestoneCorrectionLog[];
}

export interface MonthlyMilestonesResponse {
  yearMonth: string; // e.g. "2026-11"
  monthLabel: string; // e.g. "November 2026"
  monthlyMilestone: MilestoneProgressItem;
  weeklyMilestones: MilestoneProgressItem[];
  milestones: MilestoneProgressItem[]; // Full array for backwards compatibility
  availableMonths: string[]; // ['2026-10', '2026-11', ...]
  currentMonth: string;
  allTimeEnergyMWh: number;
  allTimeEnergyWh: number;
  allTimeSteps: number;
  lastUpdated: string;
  configurationPolicy?: MonthlyConfigurationPolicy;
  isConfigured?: boolean;
  overdueMonths?: string[];
  hasOverdue?: boolean;
}

// Precision rounding helper to preserve up to 6 decimal places without IEEE 754 float drift
const round6 = (val: number): number => {
  return Math.round(val * 1000000) / 1000000;
};

@Injectable()
export class MilestonesService {
  private readonly logger = new Logger(MilestonesService.name);

  // Modern smartphone battery: ~3,500 mAh @ 3.85V = 13,475 mWh (13.475 Wh).
  // With 85% PMIC charging efficiency (13,475 / 0.85): ~15,853 mWh per full 0-100% recharge.
  private readonly MWH_PER_PHONE_CHARGE = 15853.0;
  private readonly MW_LED_BULB = 5000.0; // 5W LED bulb = 5000 mW
  private readonly MW_IOT_BEACON = 5.0; // 5mW ultra-low-power BLE beacon

  constructor(
    @InjectModel(MilestoneTarget.name)
    private readonly milestoneTargetModel: Model<MilestoneTargetDocument>,
    @InjectModel(EnergyReading.name)
    private readonly energyReadingModel: Model<EnergyReadingDocument>,
  ) {}

  /**
   * Helper to get current date/time in Asia/Manila (UTC+8)
   */
  getManilaNow(): { year: number; month: number; day: number; date: Date } {
    const nowUtc = new Date();
    // Offset +8 hours (480 minutes)
    const manilaTime = new Date(nowUtc.getTime() + 8 * 60 * 60 * 1000);
    return {
      year: manilaTime.getUTCFullYear(),
      month: manilaTime.getUTCMonth() + 1, // 1-12
      day: manilaTime.getUTCDate(),
      date: nowUtc,
    };
  }

  /**
   * Get days in a calendar month
   */
  getDaysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  /**
   * Convert day range in Asia/Manila to authoritative UTC Date range.
   * Manila 00:00:00 = UTC previous day 16:00:00.
   * Manila 23:59:59.999 = UTC current day 15:59:59.999.
   */
  getManilaUTCRange(year: number, month: number, startDay: number, endDay: number): { start: Date; end: Date } {
    const start = new Date(Date.UTC(year, month - 1, startDay, 0, 0, 0, 0) - 8 * 3600000);
    const end = new Date(Date.UTC(year, month - 1, endDay, 23, 59, 59, 999) - 8 * 3600000);
    return { start, end };
  }

  /**
   * Generates Sunday–Saturday calendar week blocks using date-fns in Asia/Manila (UTC+8).
   * - weekStartsOn: 0 (Sunday)
   * - Automatically handles partial weeks at month start/end clamped to within the month
   */
  generateCalendarWeekBlocks(year: number, month: number) {
    const monthStr = String(month).padStart(2, '0');
    const monthStartUtc = fromZonedTime(`${year}-${monthStr}-01 00:00:00.000`, TIMEZONE_MANILA);
    const zonedStart = toZonedTime(monthStartUtc, TIMEZONE_MANILA);

    const mStart = startOfMonth(zonedStart);
    const mEnd = endOfMonth(zonedStart);

    const weekStarts = eachWeekOfInterval({ start: mStart, end: mEnd }, { weekStartsOn: 0 });

    return weekStarts.map((w, index) => {
      const rawStart = startOfWeek(w, { weekStartsOn: 0 });
      const rawEnd = endOfWeek(w, { weekStartsOn: 0 });

      // Restrict energy and step aggregation to dates within the selected month
      const effectiveStart = rawStart < mStart ? mStart : rawStart;
      const effectiveEnd = rawEnd > mEnd ? mEnd : rawEnd;

      const startUtc = fromZonedTime(effectiveStart, TIMEZONE_MANILA);
      const endUtc = fromZonedTime(effectiveEnd, TIMEZONE_MANILA);

      const startDay = effectiveStart.getDate();
      const endDay = effectiveEnd.getDate();
      const daysCount = endDay - startDay + 1;

      return {
        weekNumber: index + 1,
        startDay,
        endDay,
        startDate: startUtc,
        endDate: endUtc,
        calendarRowLabel: `${format(rawStart, 'MMM d')} – ${format(rawEnd, 'MMM d')}`,
        dayRangeLabel: `Days ${startDay}–${endDay}`,
        daysCount,
      };
    });
  }

  /**
   * Get list of trackable months starting from October 2026 up to current Manila month + future preview
   */
  getAvailableMonths(includeFutureMonths: number = 2): string[] {
    const manila = this.getManilaNow();
    const months: string[] = [];
    let curYear = 2026;
    let curMonth = 10; // Tracking starts October 2026

    let endYear = manila.year;
    let endMonth = manila.month + includeFutureMonths;
    while (endMonth > 12) {
      endMonth -= 12;
      endYear += 1;
    }

    while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
      const ym = `${curYear}-${String(curMonth).padStart(2, '0')}`;
      months.push(ym);
      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }
    return months;
  }

  /**
   * Get active milestone targets document (creates singleton if missing)
   */
  async getTargets(): Promise<MilestoneTargetDocument> {
    let targets = await this.milestoneTargetModel.findOne({ isSingleton: true });
    if (!targets) {
      targets = await this.milestoneTargetModel.create({
        target1WeekMWh: 0.025,
        target1MonthMWh: 0.1,
        target3MonthsMWh: 0.3,
        target6MonthsMWh: 0.5,
        target1YearMWh: 1.0,
        monthlyConfigurations: {},
        isSingleton: true,
      });
    }

    if (!targets.monthlyConfigurations) {
      targets.monthlyConfigurations = {};
    }

    return targets;
  }

  /**
   * Calculate deadline for configuring monthly targets in Asia/Manila (UTC+8).
   * Deadline is Day 2 of the month at 23:59:59.999 Asia/Manila.
   */
  getManilaMonthDeadline(yearMonth: string): { deadlineUtc: Date; deadlineLabel: string } {
    const [yStr, mStr] = yearMonth.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    // 2nd day of each month at 23:59:59.999 Asia/Manila (UTC+8) -> 15:59:59.999 UTC
    const deadlineUtc = new Date(Date.UTC(year, month - 1, 2, 15, 59, 59, 999));
    const deadlineZoned = toZonedTime(deadlineUtc, TIMEZONE_MANILA);
    const deadlineLabel = `${format(deadlineZoned, 'MMMM d, yyyy, h:mm a')} (Asia/Manila)`;
    return { deadlineUtc, deadlineLabel };
  }

  /**
   * Returns a list of past and current months (from Oct 2026 to current Manila month)
   * that have passed their configuration deadline without targets being submitted.
   */
  async getOverdueMonths(targetsDoc?: MilestoneTargetDocument): Promise<string[]> {
    const doc = targetsDoc || (await this.getTargets());
    const manila = this.getManilaNow();
    const nowUtc = manila.date;
    const overdue: string[] = [];

    let curY = 2026;
    let curM = 10;
    while (curY < manila.year || (curY === manila.year && curM <= manila.month)) {
      const ym = `${curY}-${String(curM).padStart(2, '0')}`;
      const isConfigured = Boolean(doc.monthlyConfigurations?.[ym]);
      if (!isConfigured) {
        const { deadlineUtc } = this.getManilaMonthDeadline(ym);
        if (nowUtc > deadlineUtc) {
          overdue.push(ym);
        }
      }
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }
    return overdue;
  }

  /**
   * Returns the configuration policy, deadline, locking status, and overdue months.
   */
  async getConfigurationPolicy(yearMonth?: string, userRole?: string): Promise<MonthlyConfigurationPolicy> {
    const targets = await this.getTargets();
    const manila = this.getManilaNow();
    const nowUtc = manila.date;
    const targetMonth = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
      ? yearMonth
      : `${manila.year}-${String(manila.month).padStart(2, '0')}`;

    const { deadlineUtc, deadlineLabel } = this.getManilaMonthDeadline(targetMonth);
    const existingConfig = targets.monthlyConfigurations?.[targetMonth];
    const isConfigured = Boolean(existingConfig);
    const isLocked = Boolean(existingConfig?.isLocked ?? isConfigured);

    let status: MonthConfigurationStatus = 'PENDING';
    if (isConfigured) {
      status = 'CONFIGURED';
    } else if (nowUtc > deadlineUtc) {
      status = 'OVERDUE';
    } else {
      status = 'PENDING';
    }

    const overdueMonths = await this.getOverdueMonths(targets);
    const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'super_admin';
    const canEdit = !isLocked || isSuperAdmin;

    return {
      yearMonth: targetMonth,
      status,
      isConfigured,
      isLocked,
      deadlineDate: deadlineUtc.toISOString(),
      deadlineLabel,
      configuredBy: existingConfig?.configuredBy || existingConfig?.updatedBy,
      configuredAt: existingConfig?.configuredAt || existingConfig?.updatedAt,
      canEdit,
      requiresSuperAdmin: isLocked,
      overdueMonths,
      hasOverdue: overdueMonths.length > 0,
      correctionCount: existingConfig?.correctionLogs?.length || 0,
      correctionLogs: existingConfig?.correctionLogs || [],
    };
  }

  /**
   * Get targets for a specific month (falls back to defaults if not customized)
   */
  async getTargetsForMonth(yearMonth?: string): Promise<{
    yearMonth: string;
    monthlyTargetMWh: number;
    weeklyTargetsMWh: {
      week1MWh: number;
      week2MWh: number;
      week3MWh: number;
      week4MWh: number;
      week5MWh?: number;
      week6MWh?: number;
    };
    isConfigured: boolean;
    status: MonthConfigurationStatus;
    isLocked: boolean;
    deadlineDate: string;
    deadlineLabel: string;
    configuredBy?: string;
    configuredAt?: string;
    correctionLogs?: MilestoneCorrectionLog[];
  }> {
    const manila = this.getManilaNow();
    const nowUtc = manila.date;
    const effectiveMonth = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
      ? yearMonth
      : `${manila.year}-${String(manila.month).padStart(2, '0')}`;

    const { deadlineUtc, deadlineLabel } = this.getManilaMonthDeadline(effectiveMonth);
    const targets = await this.getTargets();
    const stored = targets.monthlyConfigurations?.[effectiveMonth];

    if (stored) {
      return {
        yearMonth: effectiveMonth,
        monthlyTargetMWh: stored.monthlyTargetMWh,
        weeklyTargetsMWh: { ...stored.weeklyTargetsMWh },
        isConfigured: true,
        status: stored.status || 'CONFIGURED',
        isLocked: stored.isLocked ?? true,
        deadlineDate: stored.deadlineDate || deadlineUtc.toISOString(),
        deadlineLabel,
        configuredBy: stored.configuredBy || stored.updatedBy,
        configuredAt: stored.configuredAt || stored.updatedAt,
        correctionLogs: stored.correctionLogs || [],
      };
    }

    // Default configuration based on piezoelectric prototype telemetry (Pilot preset default)
    const baseMonth = targets.target1MonthMWh || 0.1;
    const baseWeek = targets.target1WeekMWh || 0.025;
    const status: MonthConfigurationStatus = nowUtc > deadlineUtc ? 'OVERDUE' : 'PENDING';

    return {
      yearMonth: effectiveMonth,
      monthlyTargetMWh: baseMonth,
      weeklyTargetsMWh: {
        week1MWh: baseWeek,
        week2MWh: baseWeek,
        week3MWh: baseWeek,
        week4MWh: baseWeek,
        week5MWh: baseWeek,
        week6MWh: baseWeek,
      },
      isConfigured: false,
      status,
      isLocked: false,
      deadlineDate: deadlineUtc.toISOString(),
      deadlineLabel,
      correctionLogs: [],
    };
  }

  /**
   * Update milestone targets for a calendar month.
   * Enforces the Monthly Goal Configuration Policy:
   * - One normal configuration submission per month by administrators, which locks targets.
   * - Once locked, ordinary modifications are prevented.
   * - Authorized Super Administrators can make exceptional corrections with audit logging.
   */
  async updateTargets(
    dto: UpdateMilestoneTargetsDto,
    userId?: string,
    userRole?: string,
  ): Promise<MilestoneTargetDocument> {
    const existing = await this.getTargets();
    const manila = this.getManilaNow();
    const targetMonth = dto.month || `${manila.year}-${String(manila.month).padStart(2, '0')}`;
    const { deadlineUtc } = this.getManilaMonthDeadline(targetMonth);

    if (!existing.monthlyConfigurations) {
      existing.monthlyConfigurations = {};
    }

    const existingConfig = existing.monthlyConfigurations[targetMonth];
    const isAlreadyLocked = Boolean(existingConfig && (existingConfig.isLocked || existingConfig.status === 'CONFIGURED'));
    const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'super_admin';

    // Enforcement: If already locked, only Super Administrator can perform exceptional correction
    if (isAlreadyLocked && !isSuperAdmin) {
      throw new ForbiddenException(
        `Milestone targets for ${targetMonth} are locked against ordinary modifications. Exceptional corrections require Super Administrator authorization.`
      );
    }

    const currentMonthConfig = await this.getTargetsForMonth(targetMonth);

    const updatedMonthMWh = dto.monthlyTargetMWh !== undefined
      ? round6(dto.monthlyTargetMWh)
      : currentMonthConfig.monthlyTargetMWh;

    const weeklyConfig = { ...currentMonthConfig.weeklyTargetsMWh };

    // Shared weekly target automatically applies to all weeks of the month
    if (dto.weeklyTargetMWh !== undefined) {
      const val = round6(dto.weeklyTargetMWh);
      weeklyConfig.week1MWh = val;
      weeklyConfig.week2MWh = val;
      weeklyConfig.week3MWh = val;
      weeklyConfig.week4MWh = val;
      weeklyConfig.week5MWh = val;
      weeklyConfig.week6MWh = val;
    } else if (dto.weeklyTargetsMWh) {
      if (dto.weeklyTargetsMWh.week1MWh !== undefined) weeklyConfig.week1MWh = round6(dto.weeklyTargetsMWh.week1MWh);
      if (dto.weeklyTargetsMWh.week2MWh !== undefined) weeklyConfig.week2MWh = round6(dto.weeklyTargetsMWh.week2MWh);
      if (dto.weeklyTargetsMWh.week3MWh !== undefined) weeklyConfig.week3MWh = round6(dto.weeklyTargetsMWh.week3MWh);
      if (dto.weeklyTargetsMWh.week4MWh !== undefined) weeklyConfig.week4MWh = round6(dto.weeklyTargetsMWh.week4MWh);
      if (dto.weeklyTargetsMWh.week5MWh !== undefined) weeklyConfig.week5MWh = round6(dto.weeklyTargetsMWh.week5MWh);
      if (dto.weeklyTargetsMWh.week6MWh !== undefined) weeklyConfig.week6MWh = round6(dto.weeklyTargetsMWh.week6MWh);
    }

    // Support legacy properties for backwards compatibility
    if (dto.target1WeekMWh !== undefined) {
      const val = round6(dto.target1WeekMWh);
      existing.target1WeekMWh = val;
      if (dto.weeklyTargetMWh === undefined && !dto.weeklyTargetsMWh) {
        weeklyConfig.week1MWh = val;
        weeklyConfig.week2MWh = val;
        weeklyConfig.week3MWh = val;
        weeklyConfig.week4MWh = val;
        weeklyConfig.week5MWh = val;
        weeklyConfig.week6MWh = val;
      }
    }
    if (dto.target1MonthMWh !== undefined) {
      existing.target1MonthMWh = round6(dto.target1MonthMWh);
    }

    const nowIso = new Date().toISOString();

    if (isAlreadyLocked && isSuperAdmin) {
      // Exceptional Super Administrator correction: audit logging
      const correctionLogEntry: MilestoneCorrectionLog = {
        correctedBy: userId || 'super_admin',
        correctedAt: nowIso,
        previousTargets: {
          monthlyTargetMWh: existingConfig.monthlyTargetMWh,
          weeklyTargetsMWh: { ...existingConfig.weeklyTargetsMWh },
        },
        newTargets: {
          monthlyTargetMWh: updatedMonthMWh,
          weeklyTargetsMWh: weeklyConfig,
        },
        reason: dto.reason || 'Super Administrator exceptional target adjustment',
      };

      existingConfig.monthlyTargetMWh = updatedMonthMWh;
      existingConfig.weeklyTargetsMWh = weeklyConfig;
      existingConfig.updatedBy = userId || 'super_admin';
      existingConfig.updatedAt = nowIso;
      existingConfig.isLocked = true;
      existingConfig.status = 'CONFIGURED';
      existingConfig.correctionLogs = [...(existingConfig.correctionLogs || []), correctionLogEntry];

      this.logger.warn(
        `[AUDIT] Milestone targets exceptionally corrected for ${targetMonth} by Super Admin ${userId}. Reason: ${correctionLogEntry.reason}`
      );
    } else {
      // First normal configuration submission for this month (locks targets)
      existing.monthlyConfigurations[targetMonth] = {
        monthlyTargetMWh: updatedMonthMWh,
        weeklyTargetsMWh: weeklyConfig,
        status: 'CONFIGURED',
        isLocked: true,
        configuredBy: userId || 'admin',
        configuredAt: nowIso,
        deadlineDate: deadlineUtc.toISOString(),
        updatedBy: userId || 'admin',
        updatedAt: nowIso,
        correctionLogs: [],
      };
      this.logger.log(`Milestone targets configured and locked for ${targetMonth} by ${userId || 'admin'}`);
    }

    if (typeof existing.markModified === 'function') {
      existing.markModified('monthlyConfigurations');
    }
    if (userId) existing.updatedBy = userId;

    await existing.save();
    return existing;
  }

  /**
   * Aggregate accumulated energy and step count for a given time window.
   *
   * Energy: Incremental hardware energy (mWh) summed directly without continuous-power extrapolation.
   * Steps: Reuses the sensor-partitioned delta pipeline ($setWindowFields) from energy.service.ts
   * to accurately handle counter resets, multiple sensors, and the initial reading within the window.
   */
  async getAccumulatedEnergyForPeriod(startDate: Date, endDate: Date): Promise<{ energyMWh: number; steps: number }> {
    try {
      const matchStage: any = {
        $and: [
          {
            $or: [
              { receivedAt: { $gte: startDate, $lte: endDate } },
              { receivedAt: { $exists: false }, timestamp: { $gte: startDate, $lte: endDate } },
            ],
          },
          {
            source: { $ne: 'mock' },
          },
        ],
      };

      const result = await this.energyReadingModel.aggregate([
        { $match: matchStage },
        {
          $sort: { sensorId: 1, receivedAt: 1, timestamp: 1 },
        },
        {
          // Calculate previous stepCount for delta calculation partitioned by sensor
          $setWindowFields: {
            partitionBy: '$sensorId',
            sortBy: { receivedAt: 1, timestamp: 1 },
            output: {
              previousStepCount: {
                $shift: {
                  output: '$stepCount',
                  by: -1,
                },
              },
            },
          },
        },
        {
          $addFields: {
            stepDelta: {
              $cond: {
                if: { $eq: ['$previousStepCount', null] },
                then: { $ifNull: ['$stepCount', 0] },
                else: {
                  $cond: {
                    if: { $lt: ['$stepCount', '$previousStepCount'] },
                    then: { $ifNull: ['$stepCount', 0] },
                    else: {
                      $subtract: [
                        { $ifNull: ['$stepCount', 0] },
                        { $ifNull: ['$previousStepCount', 0] },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalEnergyMWh: { $sum: '$energy' },
            totalSteps: { $sum: '$stepDelta' },
            readingCount: { $sum: 1 },
          },
        },
      ]);

      if (!result || result.length === 0) {
        return { energyMWh: 0, steps: 0 };
      }

      const row = result[0];
      const energyMWh = round6(row.totalEnergyMWh || 0);
      const steps = Math.max(0, Math.round(row.totalSteps || 0));

      return {
        energyMWh,
        steps,
      };
    } catch (error) {
      this.logger.error(`Error aggregating energy for period: ${error.message}`);
      return { energyMWh: 0, steps: 0 };
    }
  }

  /**
   * Helper to compute progress percentage safely:
   * - Unachieved milestones never display 100% (caps at 99.9%)
   * - Achieved milestones are not arbitrarily capped at 999%
   */
  private calculateProgressPercentage(rawPct: number, isAchieved: boolean): number {
    if (isAchieved) {
      return Math.round(rawPct * 10) / 10;
    }
    if (rawPct > 0 && rawPct < 1) {
      return Math.round(rawPct * 100) / 100;
    }
    const rounded = Math.round(rawPct * 10) / 10;
    return rounded >= 100 ? 99.9 : rounded;
  }

  /**
   * Helper to compute real-world equivalents based on 15,853 mWh per full phone charge
   */
  private computeRealWorldEquivalents(energyMWh: number) {
    const phoneCharges = Math.round((energyMWh / this.MWH_PER_PHONE_CHARGE) * 10) / 10;
    const phoneChargePercent = Math.round(((energyMWh / this.MWH_PER_PHONE_CHARGE) * 100) * 10) / 10;
    const ledHours = Math.round((energyMWh / this.MW_LED_BULB) * 10) / 10;
    const iotBeaconDays = Math.round((energyMWh / (this.MW_IOT_BEACON * 24)) * 10) / 10;

    let comparisonText = '';
    if (phoneCharges >= 1) {
      comparisonText = `Enough clean kinetic power to fully recharge a smartphone ${phoneCharges}x.`;
    } else if (phoneChargePercent >= 1) {
      comparisonText = `Harvested enough energy to charge ~${phoneChargePercent}% of a smartphone battery.`;
    } else {
      const formattedMWh = energyMWh.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      });
      comparisonText = `Harvested ${formattedMWh} mWh of kinetic power—every footstep counts toward the first charge!`;
    }

    const explanation = `Estimate based on a 13,475 mWh (~3,500 mAh @ 3.85V) smartphone battery capacity with 85% charging circuit efficiency (~15,853 mWh per full charge).`;

    return {
      phoneCharges,
      phoneChargePercent,
      ledHours,
      iotBeaconDays,
      comparisonText,
      explanation,
    };
  }

  /**
   * Helper to format mWh values cleanly in commentary
   */
  private formatMWhVal(mwh: number): string {
    if (mwh < 0.001 && mwh > 0) return mwh.toFixed(4);
    if (mwh < 1) return mwh.toFixed(3);
    return mwh.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  /**
   * Evaluates week-over-week telemetry comparisons with safe zero handling
   */
  private computeComparison(
    currentMWh: number,
    stepCount: number,
    targetMWh: number,
    isAchieved: boolean,
    rawPct: number,
    state: MilestoneLifecycleState,
    hasPreviousWeek: boolean,
    prevEnergyMWh: number,
    prevStepCount: number,
    isRecordHigh: boolean,
  ): MilestoneComparison {
    if (state === 'UPCOMING') {
      return {
        hasPreviousWeek: false,
        prevEnergyMWh: 0,
        prevStepCount: 0,
        energyDiffMWh: 0,
        stepDiff: 0,
        energyChangePct: null,
        stepChangePct: null,
        category: 'UPCOMING',
        isRecordHigh: false,
      };
    }

    if (currentMWh === 0 && stepCount === 0) {
      return {
        hasPreviousWeek,
        prevEnergyMWh,
        prevStepCount,
        energyDiffMWh: round6(0 - prevEnergyMWh),
        stepDiff: 0 - prevStepCount,
        energyChangePct: prevEnergyMWh > 0 ? -100 : null,
        stepChangePct: prevStepCount > 0 ? -100 : null,
        category: 'NO_ACTIVITY',
        isRecordHigh: false,
      };
    }

    // Baseline (no prior week historical data)
    if (!hasPreviousWeek) {
      let category: MilestoneComparisonCategory = 'BASELINE';
      if (isAchieved && rawPct >= 150) category = 'TARGET_EXCEEDED';
      else if (isAchieved) category = 'TARGET_ACHIEVED';
      else if (currentMWh > 0) category = 'FIRST_GENERATION';

      return {
        hasPreviousWeek: false,
        prevEnergyMWh: 0,
        prevStepCount: 0,
        energyDiffMWh: currentMWh,
        stepDiff: stepCount,
        energyChangePct: null,
        stepChangePct: null,
        category,
        isRecordHigh,
      };
    }

    const energyDiffMWh = round6(currentMWh - prevEnergyMWh);
    const stepDiff = stepCount - prevStepCount;
    // Division-by-zero protection: percentage change is only defined if prevEnergyMWh > 0
    const energyChangePct =
      prevEnergyMWh > 0
        ? Math.round(((currentMWh - prevEnergyMWh) / prevEnergyMWh) * 1000) / 10
        : null;
    const stepChangePct =
      prevStepCount > 0
        ? Math.round(((stepCount - prevStepCount) / prevStepCount) * 1000) / 10
        : null;

    let category: MilestoneComparisonCategory;

    if (prevEnergyMWh === 0 && currentMWh > 0) {
      category = 'ACTIVITY_RESUMED';
    } else if (isRecordHigh && currentMWh > 0 && currentMWh > prevEnergyMWh) {
      category = 'RECORD_HIGH';
    } else if (isAchieved && rawPct >= 150) {
      category = 'TARGET_EXCEEDED';
    } else if (energyChangePct !== null && energyChangePct >= 25) {
      category = 'SIGNIFICANT_INCREASE';
    } else if (energyChangePct !== null && energyChangePct <= -25) {
      category = 'SIGNIFICANT_DROP';
    } else if (isAchieved) {
      category = 'TARGET_ACHIEVED';
    } else if (energyChangePct !== null) {
      if (energyChangePct >= 5) {
        category = 'MODERATE_INCREASE';
      } else if (energyChangePct > -5) {
        category = 'CONSISTENT';
      } else {
        category = 'MODERATE_DROP';
      }
    } else {
      category = 'BASELINE';
    }

    return {
      hasPreviousWeek: true,
      prevEnergyMWh,
      prevStepCount,
      energyDiffMWh,
      stepDiff,
      energyChangePct,
      stepChangePct,
      category,
      isRecordHigh,
    };
  }

  /**
   * Safe AI comment generation wrapper
   */
  private safeGenerateAIComment(
    label: string,
    percentage: number,
    isAchieved: boolean,
    currentMWh: number,
    stepCount: number = 0,
    comparison?: MilestoneComparison,
    state: MilestoneLifecycleState = 'CURRENT',
  ): string {
    try {
      return this.generateAIComment(label, percentage, isAchieved, currentMWh, stepCount, comparison, state);
    } catch (err) {
      this.logger.warn(`Failed to generate AI comment for ${label}: ${err?.message}`);
      return isAchieved
        ? `Milestone reached for ${label}! Clean kinetic energy harvested.`
        : `Kinetic energy generation in progress for ${label}. Keep walking!`;
    }
  }

  /**
   * Generates dynamic, witty, context-aware companion observations based on verified telemetry
   */
  private generateAIComment(
    label: string,
    percentage: number,
    isAchieved: boolean,
    currentMWh: number,
    stepCount: number = 0,
    comparison?: MilestoneComparison,
    state: MilestoneLifecycleState = 'CURRENT',
  ): string {
    const seed = `${label}-${percentage}-${currentMWh}-${stepCount}-${comparison?.category ?? 'none'}`;
    const formattedEnergy = this.formatMWhVal(currentMWh);
    const stepsFormatted = stepCount.toLocaleString();

    // Deterministic rotating variation helper
    const getVariantIndex = (seedStr: string, count: number): number => {
      let hash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) % count;
    };

    // 1. Upcoming Milestone
    if (state === 'UPCOMING' || comparison?.category === 'UPCOMING') {
      const variants = [
        `Scheduled for later on the calendar. The piezoelectric crystals are resting up before campus stomps all over them.`,
        `Upcoming stretch. No footsteps expected yet, unless someone discovered campus time travel.`,
        `On standby in the calendar. Crystals off-duty until the campus arrives.`,
        `Waiting for this week to arrive. The tile is conserving its energy for the rush.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 2. No activity
    if ((currentMWh === 0 && stepCount === 0) || comparison?.category === 'NO_ACTIVITY') {
      const variants = [
        `Zero footsteps registered so far. Did someone cancel morning lectures, or is everyone mastering levitation?`,
        `The floor tile is awake and alert, but the hallway seems suspiciously quiet. Waiting on campus feet.`,
        `Pure silence on the sensors. The piezoelectric crystals are getting plenty of beauty sleep.`,
        `Not a single step yet. The tile is ready whenever campus decides to get moving.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 3. Target Exceeded (>= 150%)
    if (comparison?.category === 'TARGET_EXCEEDED' || (isAchieved && percentage >= 150)) {
      const excessPct = Math.round(percentage - 100);
      const variants = [
        `Goal crushed at ${percentage}% (${formattedEnergy} mWh). At this rate, campus facilities might need to start cutting you a dividend check.`,
        `Overachiever alert: +${excessPct}% beyond target. Save some kinetic energy for next week!`,
        `150%+ beyond target? Somebody clearly took the scenic, high-stride route across campus today.`,
        `Unapologetic overachiever mode. The tile is thoroughly exercised, but in a very proud way.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 4. Record High
    if (comparison?.category === 'RECORD_HIGH') {
      const variants = [
        `New weekly record! Pounded out ${formattedEnergy} mWh across ${stepsFormatted} steps—campus traffic hasn't moved like this all month.`,
        `Highest harvest yet this month: ${formattedEnergy} mWh. Whatever lecture let out, they were definitely walking with urgency.`,
        `Peak performance unlocked! ${formattedEnergy} mWh generated (${stepsFormatted} steps)—the busiest week on record.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 5. Significant Increase (>= +25%)
    if (comparison?.category === 'SIGNIFICANT_INCREASE') {
      const delta = comparison.energyChangePct !== null ? `+${comparison.energyChangePct}%` : 'sharply';
      const prevSteps = comparison.prevStepCount ? ` (${stepsFormatted} steps vs ${comparison.prevStepCount.toLocaleString()})` : '';
      const variants = [
        `Kinetic surge! Energy leaped ${delta} over last week${prevSteps}. The campus hustle is unmistakable.`,
        `Up ${delta} from last week. Foot traffic spiked hard—midterms rush or free pizza in the atrium?`,
        `Huge bounce: energy output surged ${delta} week-over-week. Those purposeful strides are paying off in spades.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 6. Significant Drop (<= -25%)
    if (comparison?.category === 'SIGNIFICANT_DROP') {
      const dropPct = Math.abs(comparison.energyChangePct ?? 0);
      const prevEnergy = comparison.prevEnergyMWh ? ` from last week's ${this.formatMWhVal(comparison.prevEnergyMWh)} mWh` : '';
      const variants = [
        `Noticeable drop: energy fell ${dropPct}%${prevEnergy}. Hallways were noticeably quieter.`,
        `Down ${dropPct}% vs last week. Either classes went remote or everyone found a shortcut around the tile.`,
        `Substantial dip: ${dropPct}% decline from the prior week. The sensors noticed the calm immediately.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 7. Target Achieved
    if (comparison?.category === 'TARGET_ACHIEVED' || isAchieved) {
      const variants = [
        `Milestone cleared right on cue (${percentage}%) with ${stepsFormatted} footsteps. Take a victory lap (it only adds more energy anyway).`,
        `Target in the bag! ${formattedEnergy} mWh harvested and stored—physics thanks you for your service.`,
        `Done and dusted. The crystals did their job, and campus feet delivered right on schedule.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 7. Moderate Increase (+5% to +24%)
    if (comparison?.category === 'MODERATE_INCREASE') {
      const delta = comparison.energyChangePct !== null ? `+${comparison.energyChangePct}%` : 'steadily';
      const variants = [
        `Up ${delta} compared to last week. Steady upward momentum with ${stepsFormatted} steps adding to the storage bank.`,
        `Building steam: ${delta} more energy than last week. Consistent strides are doing the trick.`,
        `Gaining ground: up ${delta} week-over-week. Campus foot traffic is finding a solid groove.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 8. Consistent Generation (within ±5%)
    if (comparison?.category === 'CONSISTENT') {
      const diffAbs = Math.abs(comparison.energyChangePct ?? 0);
      const variants = [
        `Remarkably steady: within ${diffAbs}% of last week's output (${formattedEnergy} mWh). Campus routines are running like clockwork.`,
        `Consistent pace. Generated ${formattedEnergy} mWh—almost an exact carbon copy of last week's foot traffic rhythm.`,
        `Predictable as clockwork. Output held nearly identical to last week, holding steady at ${formattedEnergy} mWh.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 9. Moderate Drop (-5% to -24%)
    if (comparison?.category === 'MODERATE_DROP') {
      const dropPct = Math.abs(comparison.energyChangePct ?? 0);
      const prevSteps = comparison.prevStepCount ? ` (${stepsFormatted} steps vs ${comparison.prevStepCount.toLocaleString()})` : '';
      const variants = [
        `Down ${dropPct}% from last week${prevSteps}. A slightly calmer week on the hallway floor.`,
        `Energy dipped ${dropPct}% compared to last week. Foot traffic took a mild breather.`,
        `A bit of a lull: output slipped ${dropPct}% week-over-week. Maybe everyone's studying in place today.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 10. Activity Resumed (after a 0 MWh week)
    if (comparison?.category === 'ACTIVITY_RESUMED') {
      const variants = [
        `Signs of life! Foot traffic returned with ${stepsFormatted} steps (${formattedEnergy} mWh) after last week's quiet lull.`,
        `The campus woke back up: ${formattedEnergy} mWh harvested after a dormant stretch—nice to see feet on the tile again.`,
        `Hallway traffic is back in business. Generated ${formattedEnergy} mWh with ${stepsFormatted} footsteps registered.`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 12. First Generation
    if (comparison?.category === 'FIRST_GENERATION') {
      const variants = [
        `The crystals have officially clocked in! Harvested ${formattedEnergy} mWh across ${stepsFormatted} footsteps—proof of life on the floor.`,
        `We have kinetic liftoff. First ${stepsFormatted} footsteps registered, turning campus commutes into real stored energy.`,
        `Initial footsteps captured: ${stepsFormatted} strides generated ${formattedEnergy} mWh. The harvest begins!`,
      ];
      return variants[getVariantIndex(seed, variants.length)];
    }

    // 13. Baseline (First week of tracking)
    if (comparison?.category === 'BASELINE') {
      if (stepCount > 0) {
        const variants = [
          `${label} baseline set at ${formattedEnergy} mWh across ${stepsFormatted} footsteps. Setting the benchmark for the month.`,
          `Initial pace established: ${formattedEnergy} mWh logged for ${label}. Now we see how next week compares!`,
          `Benchmark locked in: ${stepsFormatted} steps recorded. The standard for the month has been set.`,
        ];
        return variants[getVariantIndex(seed, variants.length)];
      }
      return `${label} baseline underway. Waiting for the first footsteps to set the pace.`;
    }

    // Fallback for general progress
    if (percentage >= 75) {
      return `Within striking distance! ${label} is at ${percentage}%. A brisk hallway stroll should easily seal the deal.`;
    }
    if (percentage >= 35) {
      return `Solid rhythm! ${label} is ${percentage}% charged. Those campus commute footsteps are paying actual energy dividends.`;
    }
    return `Active generation for ${label} (${percentage}%). ${stepsFormatted} steps logged so far.`;
  }

  /**
   * Calendar-based Monthly and Weekly Milestones System
   * - Tracking begins October 1, 2026
   * - Non-overlapping calendar blocks evaluated in Asia/Manila (UTC+8)
   * - Adheres to Monthly Goal Configuration Policy: unconfigured months never fabricate achievements
   */
  async getMonthlyMilestones(requestedMonth?: string, userRole?: string): Promise<MonthlyMilestonesResponse> {
    const manila = this.getManilaNow();
    const currentMonthStr = `${manila.year}-${String(manila.month).padStart(2, '0')}`;
    const targetMonth = requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)
      ? requestedMonth
      : currentMonthStr;

    // Minimum trackable month is October 2026
    const effectiveMonth = targetMonth < '2026-10' ? '2026-10' : targetMonth;
    const [yearStr, monthStr] = effectiveMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalDays = this.getDaysInMonth(year, month);
    const targetsConfig = await this.getTargetsForMonth(effectiveMonth);
    const configurationPolicy = await this.getConfigurationPolicy(effectiveMonth, userRole);
    const isConfigured = configurationPolicy.isConfigured;
    const nowUtc = manila.date;

    // 1. Generate Sunday–Saturday calendar week blocks using date-fns in Asia/Manila (UTC+8)
    const weekBlocks = this.generateCalendarWeekBlocks(year, month);

    // Full month boundary in UTC
    const monthStartUtc = weekBlocks.length > 0 ? weekBlocks[0].startDate : this.getManilaUTCRange(year, month, 1, totalDays).start;
    const monthEndUtc = weekBlocks.length > 0 ? weekBlocks[weekBlocks.length - 1].endDate : this.getManilaUTCRange(year, month, 1, totalDays).end;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthLabel = `${monthNames[month - 1]} ${year}`;

    // 2. Calculate Monthly Milestone (full calendar month)
    const { energyMWh: monthEnergyMWh, steps: monthSteps } = await this.getAccumulatedEnergyForPeriod(monthStartUtc, monthEndUtc);
    const monthTargetMWh = targetsConfig.monthlyTargetMWh;
    // Policy: Unconfigured targets must NEVER silently fabricate milestone achievements
    const monthAchieved = isConfigured && monthTargetMWh > 0 ? monthEnergyMWh >= monthTargetMWh : false;
    const monthRawPct = monthTargetMWh > 0 ? (monthEnergyMWh / monthTargetMWh) * 100 : 0;
    const monthProgress = this.calculateProgressPercentage(monthRawPct, monthAchieved);

    const monthState: MilestoneLifecycleState =
      nowUtc > monthEndUtc ? 'COMPLETED' : nowUtc < monthStartUtc ? 'UPCOMING' : 'CURRENT';

    const monthComment = !isConfigured
      ? configurationPolicy.status === 'OVERDUE'
        ? `Goal targets for ${monthLabel} are overdue (deadline was ${configurationPolicy.deadlineLabel}). EcoStep will evaluate milestone achievements once targets are configured.`
        : `Target configuration is pending for ${monthLabel} (due ${configurationPolicy.deadlineLabel}). Telemetry is actively recording.`
      : this.safeGenerateAIComment(monthLabel, monthRawPct, monthAchieved, monthEnergyMWh, monthSteps, undefined, monthState);

    const monthlyMilestone: MilestoneProgressItem = {
      id: 'monthly',
      periodKey: effectiveMonth,
      label: `${monthLabel} Milestone`,
      dayRangeLabel: `Days 1–${totalDays}`,
      days: totalDays,
      startDate: monthStartUtc.toISOString(),
      endDate: monthEndUtc.toISOString(),
      state: monthState,
      targetMWh: monthTargetMWh,
      currentMWh: monthEnergyMWh,
      targetWh: round6(monthTargetMWh / 1000),
      currentWh: round6(monthEnergyMWh / 1000),
      progressPercentage: monthProgress,
      isAchieved: monthAchieved,
      stepCount: monthSteps,
      realWorldEquivalents: this.computeRealWorldEquivalents(monthEnergyMWh),
      aiComment: monthComment,
    };

    // 3. Pre-fetch weekly telemetry concurrently using Sunday–Saturday calendar rows
    const rawWeekly = await Promise.all(
      weekBlocks.map(async (block) => {
        const telemetry = await this.getAccumulatedEnergyForPeriod(block.startDate, block.endDate);
        const targetMWh = (targetsConfig.weeklyTargetsMWh as any)[`week${block.weekNumber}MWh`] ?? targetsConfig.weeklyTargetsMWh.week1MWh;
        // Policy: Unconfigured targets must NEVER silently fabricate achievements
        const isAchieved = isConfigured && targetMWh > 0 ? telemetry.energyMWh >= targetMWh : false;
        const rawPct = targetMWh > 0 ? (telemetry.energyMWh / targetMWh) * 100 : 0;
        const progressPercentage = this.calculateProgressPercentage(rawPct, isAchieved);
        const state: MilestoneLifecycleState =
          nowUtc > block.endDate ? 'COMPLETED' : nowUtc < block.startDate ? 'UPCOMING' : 'CURRENT';

        return {
          block,
          telemetry,
          targetMWh,
          isAchieved,
          rawPct,
          progressPercentage,
          state,
        };
      }),
    );

    // Evaluate prior week telemetry for Week 1 (7 calendar days before Week 1 start)
    const priorWeekEndUtc = new Date(weekBlocks[0].startDate.getTime() - 1);
    const priorWeekStartUtc = new Date(weekBlocks[0].startDate.getTime() - 7 * 86400000);
    const priorWeekData = await this.getAccumulatedEnergyForPeriod(priorWeekStartUtc, priorWeekEndUtc);
    const lifetimeBeforeMonth = await this.getAccumulatedEnergyForPeriod(new Date(0), priorWeekEndUtc);
    const hasPriorHistory =
      lifetimeBeforeMonth.energyMWh > 0 ||
      lifetimeBeforeMonth.steps > 0 ||
      priorWeekData.energyMWh > 0 ||
      priorWeekData.steps > 0;

    const weeklyMilestones: MilestoneProgressItem[] = rawWeekly.map((item, index) => {
      let hasPreviousWeek = false;
      let prevEnergyMWh = 0;
      let prevStepCount = 0;

      if (index === 0) {
        if (hasPriorHistory) {
          hasPreviousWeek = true;
          prevEnergyMWh = priorWeekData.energyMWh;
          prevStepCount = priorWeekData.steps;
        }
      } else {
        hasPreviousWeek = true;
        prevEnergyMWh = rawWeekly[index - 1].telemetry.energyMWh;
        prevStepCount = rawWeekly[index - 1].telemetry.steps;
      }

      // Record high: higher than prior baseline and all previous weeks this month
      const priorWeeklyEnergies = [
        ...(hasPreviousWeek ? [prevEnergyMWh] : []),
        ...rawWeekly.slice(0, index).map((w) => w.telemetry.energyMWh),
      ];
      const maxPriorWeekly = priorWeeklyEnergies.length > 0 ? Math.max(...priorWeeklyEnergies) : 0;
      const isRecordHigh =
        hasPreviousWeek &&
        item.telemetry.energyMWh > maxPriorWeekly &&
        item.telemetry.energyMWh > 0 &&
        item.state !== 'UPCOMING';

      const comparison = this.computeComparison(
        item.telemetry.energyMWh,
        item.telemetry.steps,
        item.targetMWh,
        item.isAchieved,
        item.rawPct,
        item.state,
        hasPreviousWeek,
        prevEnergyMWh,
        prevStepCount,
        isRecordHigh,
      );

      const label = `Week ${item.block.weekNumber}`;
      const aiComment = this.safeGenerateAIComment(
        label,
        item.rawPct,
        item.isAchieved,
        item.telemetry.energyMWh,
        item.telemetry.steps,
        comparison,
        item.state,
      );

      const weekComment = !isConfigured
        ? configurationPolicy.status === 'OVERDUE'
          ? `${label} milestone evaluation is on hold pending overdue monthly target configuration.`
          : `${label} target configuration is pending. Footsteps and energy are actively logging.`
        : aiComment;

      const progressItem: MilestoneProgressItem = {
        id: `week_${item.block.weekNumber}`,
        periodKey: `${effectiveMonth}_w${item.block.weekNumber}`,
        label,
        weekNumber: item.block.weekNumber,
        dayRangeLabel: item.block.dayRangeLabel,
        calendarRowLabel: item.block.calendarRowLabel,
        days: item.block.daysCount,
        startDate: item.block.startDate.toISOString(),
        endDate: item.block.endDate.toISOString(),
        state: item.state,
        targetMWh: item.targetMWh,
        currentMWh: item.telemetry.energyMWh,
        targetWh: round6(item.targetMWh / 1000),
        currentWh: round6(item.telemetry.energyMWh / 1000),
        progressPercentage: item.progressPercentage,
        isAchieved: item.isAchieved,
        stepCount: item.telemetry.steps,
        realWorldEquivalents: this.computeRealWorldEquivalents(item.telemetry.energyMWh),
        comparison,
        aiComment: weekComment,
      };
      return progressItem;
    });

    // 4. Lifetime totals (epoch to now)
    const { energyMWh: allTimeEnergyMWh, steps: allTimeSteps } = await this.getAccumulatedEnergyForPeriod(new Date(0), nowUtc);

    const availableMonths = this.getAvailableMonths();
    if (!availableMonths.includes(effectiveMonth)) {
      availableMonths.push(effectiveMonth);
      availableMonths.sort();
    }

    return {
      yearMonth: effectiveMonth,
      monthLabel,
      monthlyMilestone,
      weeklyMilestones,
      milestones: [monthlyMilestone, ...weeklyMilestones],
      availableMonths,
      currentMonth: currentMonthStr,
      allTimeEnergyMWh: round6(allTimeEnergyMWh),
      allTimeEnergyWh: round6(allTimeEnergyMWh / 1000),
      allTimeSteps,
      lastUpdated: nowUtc.toISOString(),
      configurationPolicy,
      isConfigured,
      overdueMonths: configurationPolicy.overdueMonths,
      hasOverdue: configurationPolicy.hasOverdue,
    };
  }

  /**
   * Backwards-compatible alias for getMonthlyMilestones()
   */
  async getMilestonesProgress(month?: string): Promise<MonthlyMilestonesResponse> {
    return this.getMonthlyMilestones(month);
  }
}
