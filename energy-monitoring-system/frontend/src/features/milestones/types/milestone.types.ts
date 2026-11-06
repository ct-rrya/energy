/**
 * Milestone Lifecycle State
 */
export type MilestoneLifecycleState = 'COMPLETED' | 'CURRENT' | 'UPCOMING';

/**
 * Period identifier key (e.g. 'monthly', 'week_1', 'week_2', or legacy '1_week', etc.)
 */
export type MilestonePeriodKey = string;

/**
 * Weekly targets configuration in mWh
 */
export interface WeeklyTargetsMWh {
  week1MWh?: number;
  week2MWh?: number;
  week3MWh?: number;
  week4MWh?: number;
  week5MWh?: number;
  week6MWh?: number;
}

/**
 * Month-specific targets configuration
 */
export interface MonthTargetConfig {
  month: string; // YYYY-MM
  monthlyTargetMWh: number;
  weeklyTargetsMWh: WeeklyTargetsMWh;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * Administrator-configured milestone targets in milliwatt-hours (mWh)
 */
export interface MilestoneTargetConfig {
  target1WeekMWh?: number;
  target1MonthMWh?: number;
  target3MonthsMWh?: number;
  target6MonthsMWh?: number;
  target1YearMWh?: number;
  month?: string;
  monthlyTargetMWh?: number;
  weeklyTargetsMWh?: WeeklyTargetsMWh;
  monthlyConfigurations?: Record<string, MonthTargetConfig>;
}

/**
 * Real-world physical energy equivalents (scientifically calculated)
 */
export interface RealWorldEquivalents {
  phoneCharges: number;
  phoneChargePercent: number;
  ledHours: number;
  iotBeaconDays: number;
  comparisonText: string;
  explanation: string;
}

/**
 * Week-over-week telemetry comparison category
 */
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

/**
 * Week-over-week telemetry comparison metrics
 */
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

/**
 * Individual Milestone Progress item
 */
export interface MilestoneItem {
  id: string; // 'monthly' | 'week_1' | 'week_2' | 'week_3' | 'week_4' | 'week_5' | 'week_6'
  periodKey: string;
  label: string;
  weekNumber?: number; // 1 to 6 (undefined for monthly)
  dayRangeLabel: string; // e.g. "Days 1–7", "Days 29–31", "Days 1–3"
  calendarRowLabel?: string; // e.g. "Sep 27 – Oct 3", "Nov 1 – Nov 7"
  days: number;
  startDate?: string;
  endDate?: string;
  state: MilestoneLifecycleState;
  targetWh: number;
  targetMWh: number;
  currentWh: number;
  currentMWh: number;
  progressPercentage: number;
  isAchieved: boolean;
  stepCount: number;
  realWorldEquivalents: RealWorldEquivalents;
  comparison?: MilestoneComparison;
  aiComment: string;
}

/**
 * Complete Milestones API response
 */
export interface MilestonesResponse {
  yearMonth?: string;
  monthLabel?: string;
  monthlyMilestone?: MilestoneItem;
  weeklyMilestones?: MilestoneItem[];
  milestones: MilestoneItem[];
  availableMonths?: string[];
  currentMonth?: string;
  allTimeEnergyMWh: number;
  allTimeEnergyWh: number;
  allTimeSteps: number;
  lastUpdated: string;
}

/**
 * Payload for updating month-specific targets or legacy targets
 */
export interface UpdateMonthTargetsPayload {
  month?: string;
  monthlyTargetMWh?: number;
  weeklyTargetMWh?: number;
  weeklyTargetsMWh?: WeeklyTargetsMWh;
  target1WeekMWh?: number;
  target1MonthMWh?: number;
  target3MonthsMWh?: number;
  target6MonthsMWh?: number;
  target1YearMWh?: number;
}
