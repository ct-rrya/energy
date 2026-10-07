import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * AuditLog Schema
 *
 * Comprehensive audit logging for all administrator actions.
 * Provides accountability and traceability for security-sensitive operations.
 *
 * Security Requirements:
 * - Every administrator action must be logged
 * - Logs must be associated with specific administrator
 * - Access codes must NEVER be logged (even in hashed form)
 * - Logs are immutable (no updates or deletes)
 * - Retention: Indefinite (compliance requirement)
 *
 * Fields:
 * - administratorId: Reference to User who performed the action
 * - administratorName: Cached name for display (denormalized for performance)
 * - administratorRole: Role at time of action (SUPER_ADMIN or SYSTEM_ADMIN)
 * - action: Type of action performed (enum for consistency)
 * - target: What was affected (e.g., user ID, device ID, setting name)
 * - targetType: Type of target (e.g., 'user', 'device', 'setting')
 * - details: Additional context (JSON object)
 * - result: Outcome of action ('success', 'failure', 'partial')
 * - failureReason: Error message if result is 'failure'
 * - ipAddress: Client IP address
 * - userAgent: Client browser/device info
 * - sessionId: JWT session identifier
 * - timestamp: When action occurred (auto-generated)
 */
@Schema({
  timestamps: { createdAt: true, updatedAt: false }, // Only track creation, no updates
  collection: 'audit_logs',
  toJSON: {
    virtuals: true,
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class AuditLog {
  /**
   * Administrator who performed the action
   * - References User._id
   * - Required for accountability
   * - Indexed for fast lookups
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  administratorId: Types.ObjectId;

  /**
   * Administrator name (cached)
   * - Denormalized for performance
   * - Preserves name even if user is deleted
   */
  @Prop({
    required: true,
  })
  administratorName: string;

  /**
   * Administrator role at time of action
   * - Captures role changes over time
   * - SUPER_ADMIN: Account management actions
   * - SYSTEM_ADMIN: Operational actions
   */
  @Prop({
    type: String,
    enum: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    required: true,
  })
  administratorRole: string;

  /**
   * Type of action performed
   * - Standardized action names for reporting
   * - Indexed for filtering audit reports
   */
  @Prop({
    type: String,
    enum: [
      // Authentication actions
      'LOGIN',
      'LOGOUT',
      'SESSION_TIMEOUT',
      'SWITCH_ADMINISTRATOR',
      
      // Account management (SUPER_ADMIN only)
      'CREATE_ADMIN_ACCOUNT',
      'LIST_ADMINISTRATORS',
      'RESET_ACCESS_CODE',
      'ACTIVATE_ADMIN_ACCOUNT',
      'DEACTIVATE_ADMIN_ACCOUNT',
      'DELETE_ADMIN_ACCOUNT',
      
      // System configuration (SYSTEM_ADMIN)
      'UPDATE_REFERENCE_CONFIG',
      'UPDATE_ALERT_SETTINGS',
      'UPDATE_SYSTEM_SETTINGS',
      
      // Device management (SYSTEM_ADMIN)
      'CREATE_DEVICE',
      'UPDATE_DEVICE',
      'DELETE_DEVICE',
      'CALIBRATE_DEVICE',
      
      // Data operations (SYSTEM_ADMIN)
      'EXPORT_DATA',
      'DELETE_DATA',
      'IMPORT_DATA',
      
      // Audit access (both roles)
      'VIEW_AUDIT_LOGS',
      'EXPORT_AUDIT_LOGS',
    ],
    required: true,
    index: true,
  })
  action: string;

  /**
   * Target of the action
   * - User ID, device ID, setting name, etc.
   * - Optional (e.g., LOGIN has no target)
   */
  @Prop({
    required: false,
  })
  target?: string;

  /**
   * Type of target
   * - 'user', 'device', 'setting', 'data', etc.
   * - Helps categorize audit logs
   */
  @Prop({
    required: false,
  })
  targetType?: string;

  /**
   * Additional context
   * - JSON object with action-specific details
   * - Examples:
   *   - CREATE_ADMIN_ACCOUNT: { role: 'SYSTEM_ADMIN', email: 'admin@example.com' }
   *   - UPDATE_REFERENCE_CONFIG: { field: 'voltage', oldValue: 220, newValue: 230 }
   *   - EXPORT_DATA: { format: 'csv', dateRange: '2024-01-01 to 2024-01-31' }
   */
  @Prop({
    type: Object,
    required: false,
  })
  details?: Record<string, any>;

  /**
   * Result of the action
   * - success: Action completed successfully
   * - failure: Action failed
   * - partial: Action partially completed (e.g., bulk operation with some failures)
   */
  @Prop({
    type: String,
    enum: ['success', 'failure', 'partial'],
    required: true,
    index: true,
  })
  result: string;

  /**
   * Failure reason
   * - Error message if result is 'failure' or 'partial'
   * - Optional (only for failures)
   */
  @Prop({
    required: false,
  })
  failureReason?: string;

  /**
   * Client IP address
   * - For security tracking
   * - IPv4 or IPv6
   */
  @Prop({
    required: false,
  })
  ipAddress?: string;

  /**
   * User agent string
   * - Browser and OS information
   * - Helps identify unauthorized access patterns
   */
  @Prop({
    required: false,
  })
  userAgent?: string;

  /**
   * JWT session identifier
   * - Links multiple actions to same session
   * - Helps track session hijacking
   */
  @Prop({
    required: false,
  })
  sessionId?: string;

  /**
   * Timestamp (auto-generated)
   * - Indexed for time-based queries
   */
  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  timestamp: Date;
}

/**
 * AuditLog Document Type
 */
export type AuditLogDocument = AuditLog & Document;

/**
 * AuditLog Schema Factory
 */
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

/**
 * Indexes for performance
 * - Compound index for filtering by admin + date range
 * - Compound index for filtering by action + result
 */
AuditLogSchema.index({ administratorId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, result: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 }); // For general time-based queries
