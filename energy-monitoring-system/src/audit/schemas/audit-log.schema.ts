import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Standardized Action Categories & Action Constants
 */
export const AUDIT_MODULES = {
  AUTH: 'AUTH',
  DASHBOARD: 'DASHBOARD',
  ANALYTICS: 'ANALYTICS',
  HISTORICAL_RECORDS: 'HISTORICAL_RECORDS',
  DIAGNOSTICS: 'DIAGNOSTICS',
  MILESTONES: 'MILESTONES',
  ADMIN_MANAGEMENT: 'ADMIN_MANAGEMENT',
  REPORTS: 'REPORTS',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
  CHATBOT: 'CHATBOT',
  SECURITY: 'SECURITY',
  HARDWARE: 'HARDWARE',
} as const;

export const AUDIT_ACTIONS = {
  // Authentication & Session
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_TERMINATION: 'SESSION_TERMINATION',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',

  // Page Access
  PAGE_VIEW: 'PAGE_VIEW',

  // Administrative & Data Operations
  CREATE_ADMIN_ACCOUNT: 'CREATE_ADMIN_ACCOUNT',
  UPDATE_ADMIN_ACCOUNT: 'UPDATE_ADMIN_ACCOUNT',
  DELETE_ADMIN_ACCOUNT: 'DELETE_ADMIN_ACCOUNT',
  ACTIVATE_ADMIN_ACCOUNT: 'ACTIVATE_ADMIN_ACCOUNT',
  DEACTIVATE_ADMIN_ACCOUNT: 'DEACTIVATE_ADMIN_ACCOUNT',
  RESET_ACCESS_CODE: 'RESET_ACCESS_CODE',
  LIST_ADMINISTRATORS: 'LIST_ADMINISTRATORS',

  // Milestones
  UPDATE_MILESTONE_TARGETS: 'UPDATE_MILESTONE_TARGETS',
  LOCK_MILESTONE_TARGETS: 'LOCK_MILESTONE_TARGETS',

  // Diagnostics & Hardware
  HEALTH_CHECK: 'HEALTH_CHECK',
  RUN_DIAGNOSTIC_TEST: 'RUN_DIAGNOSTIC_TEST',
  START_DIAGNOSTIC_TASK: 'START_DIAGNOSTIC_TASK',
  COMPLETE_DIAGNOSTIC_TASK: 'COMPLETE_DIAGNOSTIC_TASK',
  COMPLETE_DAILY_DIAGNOSTIC: 'COMPLETE_DAILY_DIAGNOSTIC',
  UPDATE_REFERENCE_CONFIG: 'UPDATE_REFERENCE_CONFIG',
  CANCEL_DIAGNOSTIC_TASK: 'CANCEL_DIAGNOSTIC_TASK',
  TELEMETRY_SYNC: 'TELEMETRY_SYNC',

  // Reports & Data
  GENERATE_REPORT: 'GENERATE_REPORT',
  EXPORT_REPORT: 'EXPORT_REPORT',
  EXPORT_CSV: 'EXPORT_CSV',
  DELETE_REPORT: 'DELETE_REPORT',
  EXPORT_DATA: 'EXPORT_DATA',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  EXPORT_AUDIT_LOGS: 'EXPORT_AUDIT_LOGS',

  // System & AI
  UPDATE_SYSTEM_PREFERENCES: 'UPDATE_SYSTEM_PREFERENCES',
  CHATBOT_QUERY: 'CHATBOT_QUERY',
} as const;

/**
 * AuditLog Schema
 *
 * Server-side immutable audit logging for all administrator actions.
 * Provides accountability, traceability, and tamper-resistance.
 */
@Schema({
  timestamps: { createdAt: true, updatedAt: false }, // Immutable: only track creation
  collection: 'audit_logs',
  toJSON: {
    virtuals: true,
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      ret.category = ret.category || ret.module || 'Authentication';
      ret.event = ret.event || ret.action || 'Unknown Event';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class AuditLog {
  /**
   * Administrator who performed the action
   * References User._id
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  administratorId: Types.ObjectId;

  /**
   * Cached administrator name for display and historical retention
   */
  @Prop({
    required: true,
    index: true,
  })
  administratorName: string;

  /**
   * Administrator role at the time of the action (SUPER_ADMIN, SYSTEM_ADMIN, admin)
   */
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  administratorRole: string;

  /**
   * Main audit category: Authentication, Reports, Milestones, Diagnostics
   */
  @Prop({
    type: String,
    required: false,
    default: 'Authentication',
    index: true,
  })
  category?: string;

  /**
   * Module or category where action took place (AUTH, DASHBOARD, REPORTS, MILESTONES, etc.)
   */
  @Prop({
    type: String,
    required: false,
    default: 'Authentication',
    index: true,
  })
  module: string;

  /**
   * Human-readable event description (e.g. 'Log In', 'Generated PDF report', 'Set milestone goal')
   */
  @Prop({
    type: String,
    required: false,
    index: true,
  })
  event?: string;

  /**
   * Type of action performed (kept in sync with event)
   */
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  action: string;

  /**
   * Target or affected resource (e.g. user ID, device ID, report ID, milestone month)
   */
  @Prop({
    required: false,
    index: true,
  })
  target?: string;

  /**
   * Type of target (e.g., 'user', 'device', 'report', 'milestone', 'page')
   */
  @Prop({
    required: false,
  })
  targetType?: string;

  /**
   * Contextual metadata and before/after values (sanitized of sensitive secrets)
   */
  @Prop({
    type: Object,
    required: false,
  })
  details?: Record<string, any>;

  /**
   * Outcome of action: SUCCESS, FAILED, or DENIED
   */
  @Prop({
    type: String,
    required: true,
    index: true,
    set: (v: string) => {
      const upper = (v || '').toUpperCase();
      if (upper === 'SUCCESS') return 'SUCCESS';
      if (upper === 'FAILURE' || upper === 'FAILED' || upper === 'PARTIAL') return 'FAILED';
      if (upper === 'DENIED') return 'DENIED';
      return upper || 'SUCCESS';
    },
  })
  result: string;

  /**
   * Error information for failed or denied operations (without exposing credentials)
   */
  @Prop({
    required: false,
  })
  failureReason?: string;

  /**
   * Client IP address (safely obtained)
   */
  @Prop({
    required: false,
    index: true,
  })
  ipAddress?: string;

  /**
   * User agent (browser / operating system client)
   */
  @Prop({
    required: false,
  })
  userAgent?: string;

  /**
   * Session ID linking actions within the same login session
   */
  @Prop({
    required: false,
    index: true,
  })
  sessionId?: string;

  /**
   * Timestamp of event (auto-generated UTC Date)
   */
  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  timestamp: Date;
}

export type AuditLogDocument = AuditLog & Document;

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// High-performance compound indexes for multi-filter queries
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ administratorId: 1, timestamp: -1 });
AuditLogSchema.index({ administratorRole: 1, timestamp: -1 });
AuditLogSchema.index({ module: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ result: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, result: 1, timestamp: -1 });
