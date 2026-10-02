import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * AuditController
 *
 * Provides API endpoints for querying audit logs.
 *
 * Security:
 * - All endpoints require authentication (JwtAuthGuard)
 * - All endpoints require admin role (SUPER_ADMIN or SYSTEM_ADMIN)
 * - Audit log access is itself audited
 *
 * Endpoints:
 * - GET /audit/logs - Query audit logs with filters and pagination
 * - GET /audit/logs/recent - Get recent audit logs
 * - GET /audit/logs/failures - Get failed actions
 * - GET /audit/logs/my-activity - Get current administrator's activity
 */
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Query audit logs with filters and pagination
   *
   * GET /audit/logs?administratorId=xxx&action=LOGIN&result=success&startDate=2024-01-01&endDate=2024-01-31&limit=50&skip=0
   *
   * Access: SUPER_ADMIN and SYSTEM_ADMIN
   *
   * Query Parameters:
   * - administratorId (optional): Filter by administrator
   * - action (optional): Filter by action type
   * - result (optional): Filter by result (success, failure, partial)
   * - startDate (optional): Filter by start date (ISO 8601)
   * - endDate (optional): Filter by end date (ISO 8601)
   * - limit (optional): Maximum results (default: 100, max: 1000)
   * - skip (optional): Skip results for pagination (default: 0)
   *
   * Response:
   * {
   *   "logs": [...],
   *   "total": 123,
   *   "limit": 50,
   *   "skip": 0
   * }
   */
  @Get('logs')
  @Roles('SUPER_ADMIN', 'SYSTEM_ADMIN')
  async queryLogs(
    @Query('administratorId') administratorId?: string,
    @Query('action') action?: string,
    @Query('result') result?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Req() req?: any,
  ) {
    // Parse and validate query parameters
    const query: any = {};

    if (administratorId) {
      query.administratorId = administratorId;
    }

    if (action) {
      query.action = action;
    }

    if (result) {
      if (!['success', 'failure', 'partial'].includes(result)) {
        throw new HttpException(
          'Invalid result value. Must be: success, failure, or partial',
          HttpStatus.BAD_REQUEST,
        );
      }
      query.result = result;
    }

    if (startDate) {
      query.startDate = new Date(startDate);
      if (isNaN(query.startDate.getTime())) {
        throw new HttpException(
          'Invalid startDate format. Use ISO 8601 format.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (endDate) {
      query.endDate = new Date(endDate);
      if (isNaN(query.endDate.getTime())) {
        throw new HttpException(
          'Invalid endDate format. Use ISO 8601 format.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validate and apply limits
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      throw new HttpException(
        'Invalid limit value. Must be a positive integer.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (parsedLimit > 1000) {
      throw new HttpException(
        'Limit exceeds maximum allowed value (1000).',
        HttpStatus.BAD_REQUEST,
      );
    }
    query.limit = parsedLimit;

    const parsedSkip = skip ? parseInt(skip, 10) : 0;
    if (isNaN(parsedSkip) || parsedSkip < 0) {
      throw new HttpException(
        'Invalid skip value. Must be a non-negative integer.',
        HttpStatus.BAD_REQUEST,
      );
    }
    query.skip = parsedSkip;

    // Query logs
    const [logs, total] = await Promise.all([
      this.auditService.query(query),
      this.auditService.count(query),
    ]);

    // Log the audit access itself
    if (req && req.user) {
      await this.auditService.logSuccess({
        administratorId: req.user.userId,
        administratorName: req.user.name || 'Unknown',
        administratorRole: req.user.role,
        action: 'VIEW_AUDIT_LOGS',
        details: {
          filters: query,
          resultCount: logs.length,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.user.jti,
      });
    }

    return {
      logs,
      total,
      limit: query.limit,
      skip: query.skip,
    };
  }

  /**
   * Get recent audit logs
   *
   * GET /audit/logs/recent?limit=50
   *
   * Access: SUPER_ADMIN and SYSTEM_ADMIN
   *
   * Query Parameters:
   * - limit (optional): Maximum results (default: 100, max: 1000)
   *
   * Response:
   * {
   *   "logs": [...]
   * }
   */
  @Get('logs/recent')
  @Roles('SUPER_ADMIN', 'SYSTEM_ADMIN')
  async getRecentLogs(
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      throw new HttpException(
        'Invalid limit value. Must be between 1 and 1000.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const logs = await this.auditService.getRecent(parsedLimit);

    // Log the access
    if (req && req.user) {
      await this.auditService.logSuccess({
        administratorId: req.user.userId,
        administratorName: req.user.name || 'Unknown',
        administratorRole: req.user.role,
        action: 'VIEW_AUDIT_LOGS',
        details: {
          view: 'recent',
          limit: parsedLimit,
          resultCount: logs.length,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.user.jti,
      });
    }

    return { logs };
  }

  /**
   * Get failed actions
   *
   * GET /audit/logs/failures?limit=50
   *
   * Access: SUPER_ADMIN and SYSTEM_ADMIN
   *
   * Query Parameters:
   * - limit (optional): Maximum results (default: 100, max: 1000)
   *
   * Response:
   * {
   *   "logs": [...]
   * }
   */
  @Get('logs/failures')
  @Roles('SUPER_ADMIN', 'SYSTEM_ADMIN')
  async getFailures(
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      throw new HttpException(
        'Invalid limit value. Must be between 1 and 1000.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const logs = await this.auditService.getFailures(parsedLimit);

    // Log the access
    if (req && req.user) {
      await this.auditService.logSuccess({
        administratorId: req.user.userId,
        administratorName: req.user.name || 'Unknown',
        administratorRole: req.user.role,
        action: 'VIEW_AUDIT_LOGS',
        details: {
          view: 'failures',
          limit: parsedLimit,
          resultCount: logs.length,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.user.jti,
      });
    }

    return { logs };
  }

  /**
   * Get current administrator's activity
   *
   * GET /audit/logs/my-activity?limit=50
   *
   * Access: SUPER_ADMIN and SYSTEM_ADMIN
   *
   * Query Parameters:
   * - limit (optional): Maximum results (default: 100, max: 1000)
   *
   * Response:
   * {
   *   "logs": [...]
   * }
   */
  @Get('logs/my-activity')
  @Roles('SUPER_ADMIN', 'SYSTEM_ADMIN')
  async getMyActivity(
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    if (!req || !req.user || !req.user.userId) {
      throw new HttpException(
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      throw new HttpException(
        'Invalid limit value. Must be between 1 and 1000.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const logs = await this.auditService.getByAdministrator(
      req.user.userId,
      parsedLimit,
    );

    return { logs };
  }
}
