import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminChatService } from './admin-chat.service';

@ApiTags('Admin Direct Chat')
@Controller('chat/admin')
export class AdminChatController {
  constructor(private readonly adminChatService: AdminChatService) {}

  // ======================== PUBLIC VISITOR ENDPOINTS ========================

  @Get('thread/:visitorId')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get visitor direct-to-admin chat thread' })
  getVisitorThread(@Param('visitorId') visitorId: string) {
    return this.adminChatService.getVisitorThread(visitorId);
  }

  @Post('thread/:visitorId/messages')
  @ApiOperation({ summary: 'Send a message from a visitor to the admin' })
  sendVisitorMessage(
    @Param('visitorId') visitorId: string,
    @Body() body: { message: string; visitorName?: string },
  ) {
    return this.adminChatService.sendVisitorMessage(
      visitorId,
      body?.message,
      body?.visitorName,
    );
  }

  @Patch('thread/:visitorId/read')
  @SkipThrottle()
  @ApiOperation({ summary: 'Mark admin replies as read by visitor' })
  markVisitorRead(@Param('visitorId') visitorId: string) {
    return this.adminChatService.markVisitorRead(visitorId);
  }

  // ======================== ADMIN INBOX ENDPOINTS ========================

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
  replyAsAdmin(
    @Param('visitorId') visitorId: string,
    @Body() body: { message: string },
    @Req() req: any,
  ) {
    const adminName = req?.user?.name || 'EcoStep Admin';
    return this.adminChatService.replyAsAdmin(visitorId, body?.message, adminName);
  }

  @Patch('threads/:visitorId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Mark visitor messages as read by admin' })
  markAdminRead(@Param('visitorId') visitorId: string) {
    return this.adminChatService.markAdminRead(visitorId);
  }

  @Patch('threads/:visitorId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update thread status (open | resolved)' })
  updateStatus(
    @Param('visitorId') visitorId: string,
    @Body() body: { status: 'open' | 'resolved' },
  ) {
    return this.adminChatService.updateThreadStatus(visitorId, body?.status);
  }
}
