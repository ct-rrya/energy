import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  Optional,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { MaintenanceService } from './maintenance.service';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { AuditService } from '../audit/audit.service';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

@ApiTags('Maintenance')
@Controller('maintenance')
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly auditService: AuditService,
    @Optional() private readonly dashboardGateway?: DashboardGateway,
  ) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get current Maintenance Mode & Hardware Pause state',
    description:
      'Public endpoint used by visitors and admins to check whether Maintenance Mode is currently active.',
  })
  @ApiResponse({ status: 200, description: 'Current maintenance state returned' })
  async getState() {
    const state = await this.maintenanceService.getState();
    return {
      success: true,
      data: state,
    };
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enable or disable Maintenance Mode & Hardware Pause (Admin only)',
    description:
      'Toggles Maintenance Mode, pauses/resumes physical hardware ingestion, updates the public notice, and broadcasts the change in real time.',
  })
  @ApiResponse({ status: 200, description: 'Maintenance mode state updated' })
  async updateState(
    @Body() dto: UpdateMaintenanceDto,
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    const updated = await this.maintenanceService.updateState(
      dto,
      user.name || 'Admin',
    );

    await this.auditService.logAudit(req, {
      category: 'System',
      event: updated.enabled
        ? 'Enabled Maintenance Mode & Hardware Pause'
        : 'Resumed Normal Operation (Maintenance Ended)',
      result: 'SUCCESS',
      details: {
        enabled: updated.enabled,
        message: updated.message,
        estimatedResumeAt: updated.estimatedResumeAt,
      },
      admin: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    });

    this.dashboardGateway?.broadcastMaintenanceUpdated(updated);

    return {
      success: true,
      message: updated.enabled
        ? 'Maintenance Mode enabled and hardware ingestion paused'
        : 'Normal operation resumed and hardware ingestion active',
      data: updated,
    };
  }
}
