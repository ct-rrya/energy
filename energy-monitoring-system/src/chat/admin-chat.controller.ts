import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Optional,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminChatService } from './admin-chat.service';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

@ApiTags('Admin Direct Chat')
@Controller('chat/admin')
export class AdminChatController {
  constructor(
    private readonly adminChatService: AdminChatService,
    @Optional() private readonly dashboardGateway?: DashboardGateway,
  ) {}

  // ======================== PUBLIC VISITOR ENDPOINTS ========================

  @Get('thread/:visitorId')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get visitor direct-to-admin chat thread' })
  getVisitorThread(@Param('visitorId') visitorId: string) {
    return this.adminChatService.getVisitorThread(visitorId);
  }

  @Post('thread/:visitorId/messages')
  @ApiOperation({ summary: 'Send a message from a visitor to the admin' })
  async sendVisitorMessage(
    @Param('visitorId') visitorId: string,
    @Body() body: { message: string; visitorName?: string },
  ) {
    const thread = await this.adminChatService.sendVisitorMessage(
      visitorId,
      body?.message,
      body?.visitorName,
    );
    this.dashboardGateway?.broadcastAdminChatUpdated({
      action: 'visitor_message',
      visitorId: thread.visitorId,
      senderName: thread.visitorName || 'Campus Visitor',
      preview: (body?.message || '').trim().slice(0, 80),
    });
    return thread;
  }

  @Patch('thread/:visitorId/read')
  @SkipThrottle()
  @ApiOperation({ summary: 'Mark admin replies as read by visitor' })
  async markVisitorRead(@Param('visitorId') visitorId: string) {
    const result = await this.adminChatService.markVisitorRead(visitorId);
    this.dashboardGateway?.broadcastAdminChatUpdated({
      action: 'visitor_read',
      visitorId: result.visitorId,
      readAt: result.visitorLastReadAt,
    });
    return result;
  }

  // ======================== ADMIN INBOX ENDPOINTS ========================

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get admin direct-chat auto-reply & quick canned replies settings' })
  getSettings() {
    return this.adminChatService.getSettings();
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update admin direct-chat auto-reply & quick canned replies settings' })
  updateSettings(
    @Body()
    body: {
      autoReplyEnabled?: boolean;
      autoReplyMessage?: string;
      autoReplyCooldownMinutes?: number;
      cannedReplies?: Array<{ id?: string; label: string; text: string }>;
    },
    @Req() req: any,
  ) {
    const adminName = req?.user?.name || 'EcoStep Admin';
    return this.adminChatService.updateSettings(body || {}, adminName);
  }

  @Get('threads')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'List all visitor direct-to-admin chat threads' })
  listThreads() {
    return this.adminChatService.listThreadsForAdmin();
  }

  @Post('threads/:visitorId/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a visitor chat thread as admin' })
  async replyAsAdmin(
    @Param('visitorId') visitorId: string,
    @Body() body: { message: string },
    @Req() req: any,
  ) {
    const adminName = req?.user?.name || 'EcoStep Admin';
    const thread = await this.adminChatService.replyAsAdmin(
      visitorId,
      body?.message,
      adminName,
    );
    this.dashboardGateway?.broadcastAdminChatUpdated({
      action: 'admin_reply',
      visitorId: thread.visitorId,
      senderName: adminName,
      preview: (body?.message || '').trim().slice(0, 80),
    });
    return thread;
  }

  @Patch('threads/:visitorId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Mark visitor messages as read by admin' })
  async markAdminRead(@Param('visitorId') visitorId: string) {
    const result = await this.adminChatService.markAdminRead(visitorId);
    this.dashboardGateway?.broadcastAdminChatUpdated({
      action: 'admin_read',
      visitorId: result.visitorId,
      readAt: result.adminLastReadAt,
    });
    return result;
  }

  @Patch('threads/:visitorId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update thread status (open | resolved)' })
  async updateStatus(
    @Param('visitorId') visitorId: string,
    @Body() body: { status: 'open' | 'resolved' },
  ) {
    const thread = await this.adminChatService.updateThreadStatus(
      visitorId,
      body?.status,
    );
    this.dashboardGateway?.broadcastAdminChatUpdated({
      action: 'status_updated',
      visitorId: thread.visitorId,
    });
    return thread;
  }
}
