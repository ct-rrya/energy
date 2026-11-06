import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MilestoneTargetDocument = MilestoneTarget & Document;

export type MilestonePeriodKey = '1_week' | '1_month' | '3_months' | '6_months' | '1_year';

export interface WeeklyTargetsConfig {
  week1MWh: number;
  week2MWh: number;
  week3MWh: number;
  week4MWh: number;
  week5MWh?: number;
  week6MWh?: number;
}

export type MonthConfigurationStatus = 'CONFIGURED' | 'OVERDUE' | 'PENDING';

export interface MilestoneCorrectionLog {
  correctedBy: string;
  correctedAt: string;
  previousTargets: {
    monthlyTargetMWh: number;
    weeklyTargetsMWh: WeeklyTargetsConfig;
  };
  newTargets: {
    monthlyTargetMWh: number;
    weeklyTargetsMWh: WeeklyTargetsConfig;
  };
  reason?: string;
}

export interface MonthTargetConfig {
  monthlyTargetMWh: number;
  weeklyTargetsMWh: WeeklyTargetsConfig;
  status?: MonthConfigurationStatus;
  isLocked?: boolean;
  configuredBy?: string;
  configuredAt?: string;
  deadlineDate?: string;
  updatedBy?: string;
  updatedAt?: string;
  correctionLogs?: MilestoneCorrectionLog[];
}

/**
 * MilestoneTarget Schema
 *
 * Stores administrator-configured energy-generation targets (in milliwatt-hours, mWh).
 * Reuses the singleton document pattern to store both global defaults and monthly configurations.
 */
@Schema({ timestamps: true, collection: 'milestone_targets' })
export class MilestoneTarget {
  @Prop({ required: false, default: 0.025, min: 0.000001 })
  target1WeekMWh: number;

  @Prop({ required: false, default: 0.1, min: 0.000001 })
  target1MonthMWh: number;

  @Prop({ required: false, default: 0.3, min: 0.000001 })
  target3MonthsMWh: number;

  @Prop({ required: false, default: 0.5, min: 0.000001 })
  target6MonthsMWh: number;

  @Prop({ required: false, default: 1.0, min: 0.000001 })
  target1YearMWh: number;

  /**
   * Calendar month targets stored by year-month key ("YYYY-MM", e.g. "2026-10", "2026-11")
   * Allows monthly and weekly targets without overwriting past months.
   */
  @Prop({ type: Object, default: {} })
  monthlyConfigurations?: Record<string, MonthTargetConfig>;

  @Prop({ required: false })
  updatedBy?: string;

  @Prop({ default: true, select: false })
  isSingleton: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MilestoneTargetSchema = SchemaFactory.createForClass(MilestoneTarget);

MilestoneTargetSchema.index({ isSingleton: 1 }, { unique: true, sparse: false });

