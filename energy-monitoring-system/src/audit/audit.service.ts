import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

/**
 * Interface for creating audit log entries
 */
export interface CreateAuditLogDto {
  administratorId: string | Types.ObjectId;
  administratorName: string;
  administratorRole: 'SUPER_ADMIN' | 'SYSTEM_ADMIN' | 'admin';
  action: string;
  target?: string;
  targetType?: string;
  details?: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Interface for querying audit logs
 */
export interface QueryAuditLogsDto {
  administratorId?: string;
  action?: string;
  result?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

/**
 * AuditService
 *
 * Provides comprehensive audit logging for all administrator actions.
 * Ensures accountability and traceability for security-sensitive operations.
 *
 * Key Features:
 * - Immutable logs (no updates or deletes)
 * - Never logs access codes or passwords
 * - Automatic timestamp and indexing
 * - Efficient querying with pagination
 * - Denormalized data for performance
 *
 * Security Notes:
 * - All administrator actions MUST be logged
 * - Logs should be written synchronously (don't use fire-and-forget)
 * - Failed actions should also be logged
 * - Logs are the source of truth for compliance
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Create a new audit log entry
   *
   * @param dto - Audit log data
   * @returns Created audit log document
   *
   * Usage:
   *   await this.auditService.log({
   *     administratorId: user.id,
   *     administratorName: user.name,
   *     administratorRole: user.role,
   *     action: 'LOGIN',
   *     result: 'success',
   *     ipAddress: req.ip,
   *     userAgent: req.headers['user-agent'],
   *     sessionId: jwtPayload.jti,
   *   });
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    const auditLog = new this.auditLogModel({
      administratorId:
        typeof dto.administratorId === 'string'
          ? new Types.ObjectId(dto.administratorId)
          : dto.administratorId,
      administratorName: dto.administratorName,
      administratorRole: dto.administratorRole,
      action: dto.action,
      target: dto.target,
      targetType: dto.targetType,
      details: dto.details,
      result: dto.result,
      failureReason: dto.failureReason,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      sessionId: dto.sessionId,
      timestamp: new Date(),
    });

    return auditLog.save();
  }

  /**
   * Log a successful action
   *
   * Convenience method for logging successful actions.
   *
   * @param dto - Audit log data (result will be set to 'success')
   */
  async logSuccess(
    dto: Omit<CreateAuditLogDto, 'result'>,
  ): Promise<AuditLogDocument> {
    return this.log({ ...dto, result: 'success' });
  }

  /**
   * Log a failed action
   *
   * Convenience method for logging failed actions.
   *
   * @param dto - Audit log data (result will be set to 'failure')
   * @param error - Error object or message
   */
  async logFailure(
    dto: Omit<CreateAuditLogDto, 'result' | 'failureReason'>,
    error: Error | string,
  ): Promise<AuditLogDocument> {
    const failureReason =
      typeof error === 'string' ? error : error.message || 'Unknown error';

    return this.log({
      ...dto,
      result: 'failure',
      failureReason,
    });
  }

  /**
   * Query audit logs with filters and pagination
   *
   * @param query - Query parameters
   * @returns Array of audit log documents
   *
   * Usage:
   *   const logs = await this.auditService.query({
   *     administratorId: user.id,
   *     action: 'LOGIN',
   *     startDate: new Date('2024-01-01'),
   *     endDate: new Date('2024-01-31'),
   *     limit: 50,
   *     skip: 0,
   *   });
   */
  async query(query: QueryAuditLogsDto): Promise<AuditLogDocument[]> {
    const filter: any = {};

    // Filter by administrator
    if (query.administratorId) {
      filter.administratorId = new Types.ObjectId(query.administratorId);
    }

    // Filter by action
    if (query.action) {
      filter.action = query.action;
    }

    // Filter by result
    if (query.result) {
      filter.result = query.result;
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) {
        filter.timestamp.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.timestamp.$lte = query.endDate;
      }
    }

    return this.auditLogModel
      .find(filter)
      .sort({ timestamp: -1 }) // Most recent first
      .limit(query.limit || 100) // Default limit
      .skip(query.skip || 0)
      .exec();
  }

  /**
   * Count audit logs matching query
   *
   * @param query - Query parameters
   * @returns Total count
   */
  async count(query: QueryAuditLogsDto): Promise<number> {
    const filter: any = {};

    if (query.administratorId) {
      filter.administratorId = new Types.ObjectId(query.administratorId);
    }
    if (query.action) {
      filter.action = query.action;
    }
    if (query.result) {
      filter.result = query.result;
    }
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) {
        filter.timestamp.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.timestamp.$lte = query.endDate;
      }
    }

    return this.auditLogModel.countDocuments(filter).exec();
  }

  /**
   * Get audit logs for a specific administrator
   *
   * @param administratorId - User ID
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log documents
   */
  async getByAdministrator(
    administratorId: string,
    limit = 100,
  ): Promise<AuditLogDocument[]> {
    return this.query({
      administratorId,
      limit,
    });
  }

  /**
   * Get recent audit logs
   *
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log documents (most recent first)
   */
  async getRecent(limit = 100): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get audit logs for a specific action type
   *
   * @param action - Action type (e.g., 'LOGIN', 'CREATE_ADMIN_ACCOUNT')
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log documents
   */
  async getByAction(
    action: string,
    limit = 100,
  ): Promise<AuditLogDocument[]> {
    return this.query({
      action,
      limit,
    });
  }

  /**
   * Get failed actions
   *
   * Useful for security monitoring and debugging.
   *
   * @param limit - Maximum number of logs to return
   * @returns Array of failed audit log documents
   */
  async getFailures(limit = 100): Promise<AuditLogDocument[]> {
    return this.query({
      result: 'failure',
      limit,
    });
  }
}
