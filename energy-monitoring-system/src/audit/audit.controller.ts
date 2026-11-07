import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { extractSafeIp } from './utils/audit-ip.utils';

export interface PageViewDto {
  page: string;
  path?: string;
}

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/logs
   * Query comprehensive audit history with multi-field filtering and pagination.
   * Access: SUPER_ADMIN only
   */
  @Get('logs')
  @Roles('SUPER_ADMIN')
  async queryLogs(
    @Query('administratorId') administratorId?: string,
    @Query('adminId') adminId?: string,
    @Query('administratorRole') administratorRole?: string,
    @Query('role') role?: string,
    @Query('action') action?: string,
    @Query('event') event?: string,
    @Query('module') module?: string,
    @Query('category') category?: string,
    @Query('result') result?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Req() req?: any,
  ) {
    const query: any = {};

    const effectiveAdminId = adminId || administratorId;
    if (effectiveAdminId && effectiveAdminId !== 'all') {
      query.administratorId = effectiveAdminId;
    }

    const effectiveRole = role || administratorRole;
    if (effectiveRole && effectiveRole !== 'all') {
      query.administratorRole = effectiveRole;
    }

    const effectiveAction = event || action;
    if (effectiveAction && effectiveAction !== 'all') {
      query.action = effectiveAction;
    }

    const effectiveCategory = category || module;
    if (effectiveCategory && effectiveCategory !== 'all') {
      query.category = effectiveCategory;
      query.module = effectiveCategory;
    }

    if (result && result !== 'all') {
      query.result = result;
    }

    if (search && search.trim()) {
      query.search = search.trim();
    }

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) {
        query.startDate = parsedStart;
      }
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!isNaN(parsedEnd.getTime())) {
        query.endDate = parsedEnd;
      }
    }

    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10), 1), 1000) : 50;
    const parsedSkip = skip ? Math.max(parseInt(skip, 10), 0) : 0;

    query.limit = parsedLimit;
    query.skip = parsedSkip;

    const [logs, total, counts] = await Promise.all([
      this.auditService.query(query),
      this.auditService.count(query),
      this.auditService.getCategoryCounts(),
    ]);

    return {
      logs,
      total,
      limit: parsedLimit,
      skip: parsedSkip,
      counts,
    };
  }

  /**
   * GET /audit/export
   * Export filtered audit records as a CSV download with timestamps in Asia/Manila.
   * Access: SUPER_ADMIN only
   */
  @Get('export')
  @Roles('SUPER_ADMIN')
  async exportCsv(
    @Query('administratorId') administratorId?: string,
    @Query('administratorRole') administratorRole?: string,
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('result') result?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: any,
    @Res() res?: Response,
  ) {
    const query: any = {};

    if (administratorId && administratorId !== 'all') query.administratorId = administratorId;
    if (administratorRole && administratorRole !== 'all') query.administratorRole = administratorRole;
    if (action && action !== 'all') query.action = action;
    if (module && module !== 'all') query.module = module;
    if (result && result !== 'all') query.result = result;
    if (search && search.trim()) query.search = search.trim();
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const csvContent = await this.auditService.exportCsv(query);

    // Audit the export action
    if (req?.user) {
      await this.auditService.logSuccess({
        administratorId: req.user.userId || req.user._id,
        administratorName: req.user.name || 'Super Admin',
        administratorRole: req.user.role || 'SUPER_ADMIN',
        module: 'AUDIT_LOGS',
        action: 'EXPORT_AUDIT_LOGS',
        details: { filters: query },
        ipAddress: extractSafeIp(req),
        userAgent: req.headers?.['user-agent'],
        sessionId: req.user.jti,
      });
    }

    if (res) {
      const filename = `ecostep-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(HttpStatus.OK).send(csvContent);
    }

    return { csv: csvContent };
  }

  /**
   * POST /audit/page-view
   * Record authenticated page & resource navigation events from administrators.
   * Access: SUPER_ADMIN and SYSTEM_ADMIN
   */
  @Post('page-view')
  @Roles('SUPER_ADMIN', 'SYSTEM_ADMIN', 'admin')
  async recordPageView(@Body() body: PageViewDto, @Req() req: any) {
    if (!req.user) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const pageModule = (body.page || 'PORTAL').toUpperCase();
    const pagePath = body.path || `/${pageModule.toLowerCase()}`;

    await this.auditService.logSuccess({
      administratorId: req.user.userId || req.user._id,
      administratorName: req.user.name || 'Administrator',
      administratorRole: req.user.role || 'SYSTEM_ADMIN',
      module: pageModule,
      action: 'PAGE_VIEW',
      target: pagePath,
      targetType: 'page',
      details: {
        page: pageModule,
        path: pagePath,
      },
      ipAddress: extractSafeIp(req),
      userAgent: req.headers?.['user-agent'],
      sessionId: req.user.jti,
    });

    return { success: true };
  }

  /**
   * GET /audit/meta
   * Returns metadata for UI filters: distinct administrators, categories, and counts
   */
  @Get('meta')
  @Roles('SUPER_ADMIN')
  async getAuditMetadata() {
    const [administrators, modules, counts] = await Promise.all([
      this.auditService.getDistinctAdministrators(),
      this.auditService.getDistinctModules(),
      this.auditService.getCategoryCounts(),
    ]);

    const categories = [
      'Authentication',
      'Reports',
      'Milestones',
      'Diagnostics',
    ];

    return {
      administrators,
      modules,
      categories,
      counts,
    };
  }

  /**
   * GET /audit/logs/failures
   * Get failed actions for immediate security inspection
   */
  @Get('logs/failures')
  @Roles('SUPER_ADMIN')
  async getFailures(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10), 1), 1000) : 50;
    const logs = await this.auditService.getFailures(parsedLimit);
    return { logs };
  }

  /**
   * GET /audit/logs/my-activity
   * Get current administrator's own activity history
   */
  @Get('logs/my-activity')
  @Roles('SUPER_ADMIN', 'SYSTEM_ADMIN', 'admin')
  async getMyActivity(@Query('limit') limit?: string, @Req() req?: any) {
    if (!req?.user?.userId && !req?.user?._id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const userId = req.user.userId || req.user._id;
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10), 1), 1000) : 50;
    const logs = await this.auditService.getByAdministrator(userId.toString(), parsedLimit);

    return { logs };
  }
}

/**
 * LogsController
 * Provides standard route endpoint GET /api/logs for SUPER_ADMIN
 * No update or delete routes exist.
 */
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  async getLogs(
    @Query('administratorId') administratorId?: string,
    @Query('adminId') adminId?: string,
    @Query('administratorRole') administratorRole?: string,
    @Query('role') role?: string,
    @Query('action') action?: string,
    @Query('event') event?: string,
    @Query('module') module?: string,
    @Query('category') category?: string,
    @Query('result') result?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const query: any = {};

    const effectiveAdminId = adminId || administratorId;
    if (effectiveAdminId && effectiveAdminId !== 'all') {
      query.administratorId = effectiveAdminId;
    }

    const effectiveRole = role || administratorRole;
    if (effectiveRole && effectiveRole !== 'all') {
      query.administratorRole = effectiveRole;
    }

    const effectiveAction = event || action;
    if (effectiveAction && effectiveAction !== 'all') {
      query.action = effectiveAction;
    }

    const effectiveCategory = category || module;
    if (effectiveCategory && effectiveCategory !== 'all') {
      query.category = effectiveCategory;
      query.module = effectiveCategory;
    }

    if (result && result !== 'all') {
      query.result = result;
    }

    if (search && search.trim()) {
      query.search = search.trim();
    }

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) {
        query.startDate = parsedStart;
      }
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!isNaN(parsedEnd.getTime())) {
        query.endDate = parsedEnd;
      }
    }

    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10), 1), 1000) : 50;
    const parsedSkip = skip ? Math.max(parseInt(skip, 10), 0) : 0;

    query.limit = parsedLimit;
    query.skip = parsedSkip;

    const [logs, total, counts] = await Promise.all([
      this.auditService.query(query),
      this.auditService.count(query),
      this.auditService.getCategoryCounts(),
    ]);

    return {
      logs,
      total,
      limit: parsedLimit,
      skip: parsedSkip,
      counts,
    };
  }
}
