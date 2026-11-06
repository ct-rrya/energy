import {
  Controller,
  Get,
  Put,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MilestonesService, MonthlyMilestonesResponse } from './milestones.service';
import { UpdateMilestoneTargetsDto } from './dto/update-milestone-targets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * MilestonesController
 *
 * Public endpoints for viewing monthly and weekly energy milestone progress,
 * and Admin endpoints for configuring milestone targets.
 */
@ApiTags('Milestones')
@Controller('milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  /**
   * Get public milestone progress for a calendar month and its weekly blocks
   */
  @Get()
  @ApiOperation({
    summary: 'Get monthly and weekly milestones progress',
    description: 'Returns real accumulated energy progress, administrator targets, and real-world equivalents for the selected calendar month and its weekly blocks starting from October 1, 2026.',
  })
  @ApiQuery({ name: 'month', required: false, description: 'Calendar month in YYYY-MM format (e.g. 2026-10, 2026-11)', example: '2026-11' })
  @ApiResponse({ status: 200, description: 'Milestones progress data' })
  async getMilestones(@Query('month') month?: string): Promise<MonthlyMilestonesResponse> {
    return this.milestonesService.getMonthlyMilestones(month);
  }

  /**
   * Get configured milestone targets for a calendar month
   */
  @Get('targets')
  @ApiOperation({
    summary: 'Get milestone targets',
    description: 'Returns administrator-configured target thresholds in mWh for the specified month.',
  })
  @ApiQuery({ name: 'month', required: false, description: 'Calendar month in YYYY-MM format', example: '2026-11' })
  @ApiResponse({ status: 200, description: 'Milestone targets' })
  async getTargets(@Query('month') month?: string) {
    return this.milestonesService.getTargetsForMonth(month);
  }

  /**
   * Get configuration policy and overdue status
   */
  @Get('configuration-policy')
  @ApiOperation({
    summary: 'Get monthly milestone configuration policy & overdue status',
    description: 'Returns deadline dates in Asia/Manila, lock status, and any overdue months requiring target configuration.',
  })
  @ApiQuery({ name: 'month', required: false, description: 'Calendar month in YYYY-MM format', example: '2026-11' })
  @ApiResponse({ status: 200, description: 'Configuration policy and overdue status' })
  async getConfigurationPolicy(
    @Query('month') month?: string,
    @Req() req?: any,
  ) {
    const userRole = req?.user?.role;
    return this.milestonesService.getConfigurationPolicy(month, userRole);
  }

  /**
   * Update milestone targets (Admin only)
   */
  @Put('targets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'SUPER_ADMIN', 'admin')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update milestone targets',
    description: 'Allows administrators to configure monthly and weekly target energy values (in mWh) for a specific calendar month.',
  })
  @ApiResponse({ status: 200, description: 'Targets successfully updated' })
  async updateTargets(
    @Body() dto: UpdateMilestoneTargetsDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id || req.user?.email || 'admin';
    const userRole = req.user?.role;
    return this.milestonesService.updateTargets(dto, userId, userRole);
  }
}

