import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DiagnosticResultStatus } from './diagnostic-test.schema';

/**
 * Daily Diagnostic Task Status
 */
export enum DailyDiagnosticTaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue',
  NEEDS_ATTENTION = 'Needs Attention',
  FAILED = 'Failed',
}

export type DailyDiagnosticTaskDocument = DailyDiagnosticTask & Document;

/**
 * Active Diagnostic Session
 *
 * Tracks the admin currently running the physical test on the tile.
 * Includes a lock expiration timestamp to prevent deadlock if an admin
 * disconnects or abandons the test mode.
 */
@Schema({ _id: false })
export class ActiveDiagnosticSession {
  @Prop({ required: true })
  adminEmail: string;

  @Prop({ required: true })
  adminName: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

/**
 * Daily Diagnostic Task Schema
 *
 * Represents the single shared daily task across all system administrators.
 * Prevents duplicate task generation per day and tracks diagnostic lifecycle.
 */
@Schema({ timestamps: true, collection: 'daily_diagnostic_tasks' })
export class DailyDiagnosticTask {
  /**
   * Calendar date string for the daily task (YYYY-MM-DD)
   * Unique index guarantees that only ONE shared task can exist per calendar day.
   */
  @Prop({ required: true, unique: true, index: true })
  taskDate: string;

  /**
   * Overall state of the daily diagnostic task
   */
  @Prop({
    required: true,
    enum: Object.values(DailyDiagnosticTaskStatus),
    default: DailyDiagnosticTaskStatus.PENDING,
    index: true,
  })
  status: DailyDiagnosticTaskStatus;

  /**
   * Active diagnostic session lock details (null if idle/unlocked)
   */
  @Prop({ type: ActiveDiagnosticSession, required: false })
  activeSession?: ActiveDiagnosticSession;

  /**
   * Admin email who finalized the physical step test
   */
  @Prop({ required: false })
  performedBy?: string;

  /**
   * Admin display name who finalized the physical step test
   */
  @Prop({ required: false })
  performedByName?: string;

  /**
   * Timestamp when the daily diagnostic was completed
   */
  @Prop({ required: false })
  completedAt?: Date;

  /**
   * Actual measured footstep energy (mWh)
   */
  @Prop({ required: false })
  actualEnergyMWh?: number;

  /**
   * Expected baseline step energy (mWh)
   */
  @Prop({ required: false })
  expectedEnergyMWh?: number;

  /**
   * Deviation percentage relative to baseline (e.g. -12.4%)
   */
  @Prop({ required: false })
  deviationPercentage?: number;

  /**
   * Performance percentage relative to baseline (e.g. 87.6%)
   */
  @Prop({ required: false })
  performancePercentage?: number;

  /**
   * Categorical test result status
   */
  @Prop({
    required: false,
    enum: Object.values(DiagnosticResultStatus),
  })
  result?: DiagnosticResultStatus;

  /**
   * Human-readable diagnostic verdict message
   */
  @Prop({ required: false })
  statusMessage?: string;

  /**
   * Admin notes or test condition comments
   */
  @Prop({ required: false, maxlength: 500 })
  notes?: string;

  /**
   * Linked diagnostic test record ID
   */
  @Prop({ required: false })
  diagnosticTestId?: string;

  /**
   * Timestamp of last reminder emitted
   */
  @Prop({ required: false })
  reminderSentAt?: Date;

  /**
   * Whether immediate alert was triggered for abnormal/failed readings
   */
  @Prop({ default: false })
  isAbnormalNotificationSent: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DailyDiagnosticTaskSchema =
  SchemaFactory.createForClass(DailyDiagnosticTask);

DailyDiagnosticTaskSchema.index({ taskDate: -1 });
DailyDiagnosticTaskSchema.index({ status: 1 });
