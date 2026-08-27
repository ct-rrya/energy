import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import {
  BroadcastMessageDto,
  BroadcastResultDto,
} from './dto/broadcast-message.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

/**
 * Notifications Controller
 * 
 * Admin endpoints for notification management.
 * 
 * All endpoints require:
 * - JWT authentication
 * - Admin role
 * 
 * Endpoints:
 * - POST /api/notifications/broadcast - Send broadcast message
 * - GET  /api/notifications/logs - Query notification logs
 * - GET  /api/notifications/stats - Get notification statistics
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Broadcast Message
   * 
   * Send message to multiple subscribers.
   * 
   * Admin only.
   * 
   * @param dto - Broadcast message DTO
   * @returns Broadcast result with delivery stats
   */
  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Broadcast message to subscribers',
    description:
      'Send message to all subscribers or filtered by tags. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Broadcast completed',
    type: BroadcastResultDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async broadcastMessage(
    @Body() dto: BroadcastMessageDto,
  ): Promise<BroadcastResultDto> {
    return this.notificationsService.broadcastMessage(dto);
  }

  /**
   * Get Notification Logs
   * 
   * Query notification logs with filters and pagination.
   * 
   * Admin only.
   * 
   * @param query - Query parameters
   * @returns Paginated notification logs
   */
  @Get('logs')
  @ApiOperation({
    summary: 'Get notification logs',
    description:
      'Query notification logs with filters (type, status, date range). Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification logs retrieved',
  })
  async getNotificationLogs(@Query() query: NotificationQueryDto) {
    return this.notificationsService.getNotificationLogs(query);
  }

  /**
   * Get Notification Statistics
   * 
   * Returns aggregated notification statistics.
   * 
   * Admin only.
   * 
   * @returns Notification statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get notification statistics',
    description:
      'Returns aggregated statistics (total sent, delivery rate, breakdown by type/status). Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved',
  })
  async getNotificationStats() {
    return this.notificationsService.getNotificationStats();
  }
}
