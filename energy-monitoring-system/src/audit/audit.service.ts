import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument, AUDIT_MODULES } from './schemas/audit-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { formatToManilaTime, extractSafeIp } from './utils/audit-ip.utils';

export interface CreateAuditLogDto {
  administratorId: string | Types.ObjectId;
  administratorName: string;
  administratorRole: 'SUPER_ADMIN' | 'SYSTEM_ADMIN' | 'admin' | string;
  action: string;
  event?: string;
  category?: string;
  module?: string;
  target?: string;
  targetType?: string;
  details?: Record<string, any>;
  result: 'SUCCESS' | 'FAILED' | 'DENIED' | 'success' | 'failure' | 'partial' | string;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp?: Date;
}

export interface LogAuditOptions {
  category: 'Authentication' | 'Reports' | 'Milestones' | 'Diagnostics' | string;
  event: string;
  result?: 'SUCCESS' | 'FAILED' | 'DENIED' | 'success' | 'failure' | string;
  details?: Record<string, any>;
  failureReason?: string;
  target?: string;
  targetType?: string;
  admin?: {
    id?: string | Types.ObjectId;
    name?: string;
    role?: string;
  };
}

export interface QueryAuditLogsDto {
  administratorId?: string;
  administratorRole?: string;
  category?: string;
  action?: string;
  event?: string;
  module?: string;
  result?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Deep sanitize details object to ensure passwords, access codes, tokens,
   * or session secrets are never persisted in the audit trail.
   */
  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) return undefined;

    const SENSITIVE_KEYS = [
      'password',
      'accesscode',
      'access_code',
      'token',
      'jwt',
      'secret',
      'authorization',
      'apikey',
      'api_key',
      'cookie',
      'bearer',
    ];

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        sanitized[key] = this.sanitizeDetails(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log an audit event server-side
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    try {
      const sanitizedDetails = this.sanitizeDetails(dto.details);

      let adminId: Types.ObjectId;
      try {
        adminId =
          typeof dto.administratorId === 'string'
            ? new Types.ObjectId(dto.administratorId)
            : dto.administratorId;
      } catch {
        adminId = new Types.ObjectId('000000000000000000000000');
      }

      const rawResult = (dto.result || '').toUpperCase();
      const normalizedResult =
        rawResult === 'SUCCESS'
          ? 'SUCCESS'
          : rawResult === 'DENIED'
            ? 'DENIED'
            : 'FAILED';

      const category = dto.category || dto.module || 'Authentication';
      const eventName = dto.event || dto.action || 'Unknown Event';

      const auditLog = new this.auditLogModel({
        administratorId: adminId,
        administratorName: dto.administratorName || 'Unknown Admin',
        administratorRole: dto.administratorRole || 'SYSTEM_ADMIN',
        category,
        module: category,
        event: eventName,
        action: eventName,
        target: dto.target,
        targetType: dto.targetType,
        details: sanitizedDetails,
        result: normalizedResult,
        failureReason: dto.failureReason,
        ipAddress: dto.ipAddress || '127.0.0.1',
        userAgent: dto.userAgent,
        sessionId: dto.sessionId,
        timestamp: dto.timestamp || new Date(),
      });

      return await auditLog.save();
    } catch (err: any) {
      this.logger.error(`Failed to record audit log for action ${dto.action}: ${err.message}`);
      // Return unpersisted document to avoid taking down caller if DB temporarily errors
      return new this.auditLogModel({ ...dto, timestamp: new Date() });
    }
  }

  /**
   * Universal Audit Logger Helper (as required by prompt)
   * Reads the administrator from req.user (with optional fallback to options.admin).
   * Stores timestamps in UTC, displayed as PHT.
   */
  async logAudit(req: any, options: LogAuditOptions): Promise<AuditLogDocument> {
    const user = req?.user || options.admin;

    let adminIdStr = '000000000000000000000000';
    let adminName = 'Unknown Administrator';
    let adminRole = 'SYSTEM_ADMIN';

    if (user) {
      const rawId = user._id || user.id || user.userId || user.sub;
      if (rawId) adminIdStr = String(rawId);
      adminName = user.name || user.email || adminName;
      adminRole = user.role || adminRole;
    } else if (req?.body?.email) {
      adminName = req.body.email;
    }

    // Normalize category into canonical title case: Authentication, Reports, Milestones, Diagnostics
    let normalizedCategory = options.category || 'Authentication';
    const catLower = normalizedCategory.toLowerCase();
    if (catLower.includes('auth')) normalizedCategory = 'Authentication';
    else if (catLower.includes('report')) normalizedCategory = 'Reports';
    else if (catLower.includes('milestone')) normalizedCategory = 'Milestones';
    else if (catLower.includes('diag') || catLower.includes('health')) normalizedCategory = 'Diagnostics';

    const rawResult = (options.result || 'SUCCESS').toUpperCase();
    const normalizedResult =
      rawResult === 'SUCCESS' ? 'SUCCESS' : rawResult === 'DENIED' ? 'DENIED' : 'FAILED';

    return this.log({
      administratorId: adminIdStr,
      administratorName: adminName,
      administratorRole: adminRole,
      category: normalizedCategory,
      module: normalizedCategory,
      event: options.event,
      action: options.event,
      target: options.target,
      targetType: options.targetType,
      details: options.details,
      result: normalizedResult,
      failureReason: options.failureReason,
      ipAddress: extractSafeIp(req),
      userAgent: req?.headers?.['user-agent'],
      sessionId: req?.user?.jti,
      timestamp: new Date(),
    });
  }

  /**
   * Log a successful action
   */
  async logSuccess(dto: Omit<CreateAuditLogDto, 'result'>): Promise<AuditLogDocument> {
    return this.log({ ...dto, result: 'SUCCESS' });
  }

  /**
   * Log a failed action
   */
  async logFailure(
    dto: Omit<CreateAuditLogDto, 'result' | 'failureReason'>,
    error: Error | string,
  ): Promise<AuditLogDocument> {
    const failureReason =
      typeof error === 'string' ? error : error?.message || 'Unknown error';

    return this.log({
      ...dto,
      result: 'FAILED',
      failureReason,
    });
  }

  /**
   * Log an unauthorized / forbidden action attempt
   */
  async logDenied(
    dto: Omit<CreateAuditLogDto, 'result' | 'failureReason'>,
    reason: string = 'Access denied: insufficient permissions',
  ): Promise<AuditLogDocument> {
    return this.log({
      ...dto,
      result: 'DENIED',
      failureReason: reason,
    });
  }

  /**
  * Construct MongoDB filter object from QueryAuditLogsDto
  */
  private buildFilter(query: QueryAuditLogsDto): any {
    const conditions: any[] = [];

    if (query.administratorId && query.administratorId !== 'all') {
      const adminVal = query.administratorId;
      const orClauses: any[] = [];
      try {
        orClauses.push({ administratorId: new Types.ObjectId(adminVal) });
      } catch {}
      orClauses.push({ administratorId: adminVal });
      orClauses.push({ administratorName: adminVal });
      conditions.push({ $or: orClauses });
    }

    if (query.administratorRole && query.administratorRole !== 'all') {
      conditions.push({ administratorRole: query.administratorRole });
    }

    const targetCategory = query.category || query.module;
    if (targetCategory && targetCategory !== 'all') {
      const lowerCat = targetCategory.toLowerCase();
      if (lowerCat.includes('auth')) {
        conditions.push({
          $or: [
            { category: { $regex: /auth/i } },
            { module: { $regex: /auth/i } },
            { action: { $regex: /login|logout|session|access/i } },
            { event: { $regex: /login|logout|session|access/i } },
          ],
        });
      } else if (lowerCat.includes('report')) {
        conditions.push({
          $or: [
            { category: { $regex: /report/i } },
            { module: { $regex: /report/i } },
            { action: { $regex: /report|csv|excel|word|export/i } },
            { event: { $regex: /report|csv|excel|word|export/i } },
          ],
        });
      } else if (lowerCat.includes('milestone')) {
        conditions.push({
          $or: [
            { category: { $regex: /milestone/i } },
            { module: { $regex: /milestone/i } },
            { action: { $regex: /milestone/i } },
            { event: { $regex: /milestone/i } },
          ],
        });
      } else if (lowerCat.includes('diag') || lowerCat.includes('health')) {
        conditions.push({
          $or: [
            { category: { $regex: /diag/i } },
            { module: { $regex: /diag/i } },
            { action: { $regex: /diagnostic|health|tile|step/i } },
            { event: { $regex: /diagnostic|health|tile|step/i } },
          ],
        });
      } else {
        conditions.push({
          $or: [
            { category: { $regex: new RegExp(targetCategory, 'i') } },
            { module: { $regex: new RegExp(targetCategory, 'i') } },
          ],
        });
      }
    }

    if (query.action && query.action !== 'all') {
      conditions.push({ action: query.action });
    }

    if (query.result && query.result !== 'all') {
      const upper = query.result.toUpperCase();
      if (upper === 'SUCCESS') {
        conditions.push({ result: { $in: ['SUCCESS', 'success'] } });
      } else if (upper === 'FAILED' || upper === 'FAILURE') {
        conditions.push({ result: { $in: ['FAILED', 'failure', 'partial'] } });
      } else if (upper === 'DENIED') {
        conditions.push({ result: { $in: ['DENIED', 'denied'] } });
      } else {
        conditions.push({ result: query.result });
      }
    }

    if (query.startDate || query.endDate) {
      const timeFilter: any = {};
      if (query.startDate) {
        timeFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        timeFilter.$lte = new Date(query.endDate);
      }
      conditions.push({ timestamp: timeFilter });
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      conditions.push({
        $or: [
          { administratorName: regex },
          { action: regex },
          { target: regex },
          { module: regex },
          { ipAddress: regex },
          { failureReason: regex },
        ],
      });
    }

    if (conditions.length === 0) {
      return {};
    }
    if (conditions.length === 1) {
      return conditions[0];
    }
    return { $and: conditions };
  }

  /**
   * Query audit logs with rich filters, full-text search, and pagination
   */
  async query(query: QueryAuditLogsDto): Promise<AuditLogDocument[]> {
    const filter = this.buildFilter(query);

    return this.auditLogModel
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(query.skip || 0)
      .limit(query.limit || 50)
      .exec();
  }

  /**
   * Count audit logs matching filter
   */
  async count(query: QueryAuditLogsDto): Promise<number> {
    const filter = this.buildFilter(query);
    return this.auditLogModel.countDocuments(filter).exec();
  }

  /**
   * Generate CSV export of audit logs formatted with Asia/Manila timestamps
   */
  async exportCsv(query: QueryAuditLogsDto): Promise<string> {
    // For export, return all matching records up to 10,000
    const filter = this.buildFilter(query);
    const logs = await this.auditLogModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(query.limit || 10000)
      .exec();

    const headers = [
      'Event ID',
      'Timestamp (PHT)',
      'Administrator',
      'Role',
      'Module',
      'Action',
      'Target',
      'Target Type',
      'Result',
      'Session ID',
      'Details',
      'Failure Reason',
    ];

    const escapeCsv = (str: any): string => {
      if (str === null || str === undefined) return '""';
      const s = typeof str === 'object' ? JSON.stringify(str) : String(str);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = logs.map((log) => [
      escapeCsv(log._id.toString()),
      escapeCsv(formatToManilaTime(log.timestamp)),
      escapeCsv(log.administratorName),
      escapeCsv(log.administratorRole),
      escapeCsv(log.module || 'SYSTEM'),
      escapeCsv(log.action),
      escapeCsv(log.target || ''),
      escapeCsv(log.targetType || ''),
      escapeCsv(log.result),
      escapeCsv(log.sessionId || ''),
      escapeCsv(log.details ? JSON.stringify(log.details) : ''),
      escapeCsv(log.failureReason || ''),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  /**
   * Get total count and category-wise count for UI pill tabs:
   * All activity, Authentication, Reports, Milestones, Diagnostics
   */
  async getCategoryCounts(): Promise<{
    all: number;
    authentication: number;
    reports: number;
    milestones: number;
    diagnostics: number;
  }> {
    const [all, authentication, reports, milestones, diagnostics] = await Promise.all([
      this.auditLogModel.countDocuments({}).exec(),
      this.auditLogModel.countDocuments({
        $or: [
          { category: /auth/i },
          { module: /auth/i },
          { action: /login|logout|session|access/i },
          { event: /login|logout|session|access/i },
        ],
      }).exec(),
      this.auditLogModel.countDocuments({
        $or: [
          { category: /report/i },
          { module: /report/i },
          { action: /report|csv|excel|word|export/i },
          { event: /report|csv|excel|word|export/i },
        ],
      }).exec(),
      this.auditLogModel.countDocuments({
        $or: [
          { category: /milestone/i },
          { module: /milestone/i },
          { action: /milestone/i },
          { event: /milestone/i },
        ],
      }).exec(),
      this.auditLogModel.countDocuments({
        $or: [
          { category: /diag/i },
          { module: /diag/i },
          { action: /diagnostic|health|tile|step/i },
          { event: /diagnostic|health|tile|step/i },
        ],
      }).exec(),
    ]);

    return { all, authentication, reports, milestones, diagnostics };
  }

  /**
   * Distinct administrators: populated from the Users database collection
   * and supplemented by historical audit logs. Ensures all admins appear in dropdown.
   */
  async getDistinctAdministrators(): Promise<
    Array<{
      id: string;
      administratorId: string;
      name: string;
      administratorName: string;
      role: string;
      administratorRole: string;
    }>
  > {
    const adminMap = new Map<string, { id: string; name: string; role: string }>();

    // 1. Fetch from Users collection
    try {
      const users = await this.userModel.find().select('_id name role email').exec();
      for (const u of users) {
        const id = u._id.toString();
        const role = u.role || 'ADMIN';
        const rawName = (u.name || u.email || 'Administrator').trim();
        const name = role === 'SUPER_ADMIN' ? 'Ecostep Super' : rawName;
        const key = `${name.toLowerCase()}::${role.toUpperCase()}`;
        if (!adminMap.has(key)) {
          adminMap.set(key, { id, name, role });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch users for audit filter: ${err.message}`);
    }

    // 2. Fetch from audit logs aggregate for any historical admins
    try {
      const logAdmins = await this.auditLogModel.aggregate([
        {
          $group: {
            _id: '$administratorName',
            administratorId: { $first: '$administratorId' },
            role: { $first: '$administratorRole' },
          },
        },
      ]).exec();

      for (const a of logAdmins) {
        if (!a._id) continue;
        const role = a.role || 'ADMIN';
        const rawName = a._id.toString().trim();
        const name = role === 'SUPER_ADMIN' ? 'Ecostep Super' : rawName;
        const key = `${name.toLowerCase()}::${role.toUpperCase()}`;
        if (!adminMap.has(key)) {
          const id = a.administratorId ? a.administratorId.toString() : name;
          adminMap.set(key, { id, name, role });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not aggregate audit log admins: ${err.message}`);
    }

    return Array.from(adminMap.values())
      .filter((item) => item.name && item.name.trim() !== '')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        id: item.id,
        administratorId: item.id,
        name: item.name,
        administratorName: item.name,
        role: item.role,
        administratorRole: item.role,
      }));
  }

  /**
   * Distinct modules available in the system and audit log collection
   */
  async getDistinctModules(): Promise<string[]> {
    const modules = await this.auditLogModel.distinct('module').exec();
    const systemModules: string[] = Object.values(AUDIT_MODULES);
    const combined: string[] = Array.from(new Set([...systemModules, ...(modules || []).filter(Boolean)]));
    return combined.sort();
  }

  async getRecent(limit = 100): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getByAdministrator(administratorId: string, limit = 100): Promise<AuditLogDocument[]> {
    return this.query({
      administratorId,
      limit,
    });
  }

  async getFailures(limit = 100): Promise<AuditLogDocument[]> {
    return this.query({
      result: 'FAILED',
      limit,
    });
  }
}
