import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FeedbackService, type FeedbackTab } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import {
  CreateAnswerDto,
  UpdateFeedbackDto,
  UpvoteFeedbackDto,
  VoteFeedbackDto,
} from './dto/update-feedback.dto';
import { FeedbackCategory, FeedbackStatus } from './schemas/feedback.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { AuditService } from '../audit/audit.service';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly auditService: AuditService,
    @Optional() private readonly dashboardGateway?: DashboardGateway,
  ) {}

  private resolveVoterKey(
    user: UserDocument | null | undefined,
    rawVoterId?: string,
  ): string {
    if (user?._id) {
      return `user:${user._id.toString()}`;
    }
    return rawVoterId?.trim() || 'anonymous';
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'List public feedback & reviews',
    description:
      'Returns paginated public feedback posts, star rating summary, and official admin replies.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: FeedbackStatus })
  @ApiQuery({ name: 'category', required: false, enum: FeedbackCategory })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'top'] })
  @ApiQuery({ name: 'tab', required: false, enum: ['newest', 'top', 'unanswered', 'resolved'] })
  @ApiQuery({ name: 'voterId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Feedback list retrieved successfully' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: FeedbackStatus,
    @Query('category') category?: FeedbackCategory,
    @Query('sort') sort?: 'newest' | 'top',
    @Query('tab') tab?: FeedbackTab,
    @Query('voterId') voterId?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: UserDocument | null,
  ) {
    const resolvedVoterId = user?._id
      ? `user:${user._id.toString()}`
      : voterId?.trim() || undefined;
    const result = await this.feedbackService.findAll({
      page,
      limit,
      status,
      category,
      sort,
      tab,
      voterId: resolvedVoterId,
      search,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('quota')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get remaining daily ECommunity posting & reply quota',
  })
  async getQuota(
    @Query('voterId') voterId: string | undefined,
    @Req() req: Request,
    @CurrentUser() user?: UserDocument | null,
  ) {
    const headerVisitor = req.headers['x-visitor-id'];
    const rawVisitor =
      (Array.isArray(headerVisitor) ? headerVisitor[0] : headerVisitor) ||
      voterId;
    const quota = await this.feedbackService.getQuotaStatus(
      rawVisitor,
      Boolean(user),
    );
    return {
      success: true,
      data: quota,
    };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get single feedback post with full details and answers',
    description: 'Returns full post details, votes, and all community/admin answers. Increments view count.',
  })
  async findOne(
    @Param('id') id: string,
    @Query('voterId') voterId?: string,
    @Query('noCount') noCount?: string,
    @CurrentUser() user?: UserDocument | null,
  ) {
    const resolvedVoterId = user?._id
      ? `user:${user._id.toString()}`
      : voterId?.trim() || undefined;
    const item = await this.feedbackService.findOne(
      id,
      resolvedVoterId,
      noCount !== 'true',
    );
    return {
      success: true,
      data: item,
    };
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit public feedback or review',
    description:
      'Allows any visitor to post a review, suggestion, or tile/bug issue to the public board.',
  })
  @ApiResponse({ status: 201, description: 'Feedback posted successfully' })
  async create(
    @Body() dto: CreateFeedbackDto,
    @Query('voterId') voterId: string | undefined,
    @Req() req: Request,
    @CurrentUser() user?: UserDocument | null,
  ) {
    const headerVisitor = req.headers['x-visitor-id'];
    const rawVisitor =
      (Array.isArray(headerVisitor) ? headerVisitor[0] : headerVisitor) ||
      voterId;
    const item = await this.feedbackService.create(
      dto,
      rawVisitor,
      Boolean(user),
    );
    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'created',
      feedbackId: item?.id || item?._id?.toString(),
    });
    return {
      success: true,
      message: 'Feedback posted successfully',
      data: item,
    };
  }

  @Post(':id/vote')
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upvote or downvote a feedback post',
    description: 'Toggles or switches upvote/downvote for a feedback post.',
  })
  async votePost(
    @Param('id') id: string,
    @Body() dto: VoteFeedbackDto,
    @CurrentUser() user: UserDocument | null,
  ) {
    const voterKey = this.resolveVoterKey(user, dto.voterId);
    const updated = await this.feedbackService.votePost(id, dto.direction, voterKey);
    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'voted',
      feedbackId: id,
    });
    return {
      success: true,
      data: updated,
    };
  }

  @Post(':id/upvote')
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle upvote on a feedback post',
    description: 'Upvotes or removes upvote for a public feedback post.',
  })
  async toggleUpvote(
    @Param('id') id: string,
    @Body() dto: UpvoteFeedbackDto,
    @CurrentUser() user: UserDocument | null,
  ) {
    const voterKey = this.resolveVoterKey(user, dto.voterId);
    const updated = await this.feedbackService.toggleUpvote(id, voterKey);
    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'voted',
      feedbackId: id,
    });
    return {
      success: true,
      data: updated,
    };
  }

  @Post(':id/answers')
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Post an answer or comment on a feedback thread',
    description:
      'Allows public visitors (with browser nickname) or authenticated admins (badged as Official Admin) to answer a post.',
  })
  async addAnswer(
    @Param('id') id: string,
    @Body() dto: CreateAnswerDto,
    @Query('voterId') voterId: string | undefined,
    @CurrentUser() user: UserDocument | null,
  ) {
    const isAdmin = Boolean(user);
    const resolvedVoterId = this.resolveVoterKey(user, voterId);
    const updated = await this.feedbackService.addAnswer(
      id,
      dto,
      isAdmin,
      user?.name,
      resolvedVoterId,
    );
    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'answered',
      feedbackId: id,
    });
    return {
      success: true,
      message: 'Answer posted successfully',
      data: updated,
    };
  }

  @Post(':id/answers/:answerId/vote')
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upvote or downvote an answer',
  })
  async voteAnswer(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
    @Body() dto: VoteFeedbackDto,
    @CurrentUser() user: UserDocument | null,
  ) {
    const voterKey = this.resolveVoterKey(user, dto.voterId);
    const updated = await this.feedbackService.voteAnswer(
      id,
      answerId,
      dto.direction,
      voterKey,
    );
    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'answer_voted',
      feedbackId: id,
    });
    return {
      success: true,
      data: updated,
    };
  }

  @Patch(':id/answers/:answerId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark or unmark an answer as Accepted (Admin only)',
  })
  async toggleAcceptAnswer(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: UserDocument,
  ) {
    const updated = await this.feedbackService.toggleAcceptAnswer(
      id,
      answerId,
      user.name || 'Admin',
    );
    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'answer_accepted',
      feedbackId: id,
    });
    return {
      success: true,
      data: updated,
    };
  }

  @Delete(':id/answers/:answerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an answer (Admin only)',
  })
  async deleteAnswer(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
  ) {
    const updated = await this.feedbackService.deleteAnswer(id, answerId);
    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'answer_deleted',
      feedbackId: id,
    });
    return {
      success: true,
      data: updated,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update feedback status or post official admin reply',
    description: 'Admin-only endpoint to mark feedback resolved/open and post official replies.',
  })
  async adminUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    const updated = await this.feedbackService.adminUpdate(
      id,
      dto,
      user.name || 'Admin',
    );

    const eventLabel =
      dto.status === FeedbackStatus.RESOLVED
        ? 'Marked feedback resolved'
        : dto.status === FeedbackStatus.OPEN
        ? 'Reopened feedback'
        : 'Replied to feedback';

    await this.auditService.logAudit(req, {
      category: 'Feedback',
      event: eventLabel,
      result: 'SUCCESS',
      details: {
        feedbackId: id,
        status: dto.status,
        hasReply: Boolean(dto.adminReply?.trim()),
      },
      admin: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    });

    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'updated',
      feedbackId: id,
    });

    return {
      success: true,
      message: 'Feedback updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a feedback post (Admin only)',
    description: 'Permanently removes spam or inappropriate feedback posts.',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    const deleted = await this.feedbackService.delete(id);

    await this.auditService.logAudit(req, {
      category: 'Feedback',
      event: 'Deleted feedback post',
      result: 'SUCCESS',
      details: {
        feedbackId: id,
        authorName: deleted.authorName,
        category: deleted.category,
      },
      admin: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    });

    this.dashboardGateway?.broadcastFeedbackUpdated({
      action: 'deleted',
      feedbackId: id,
    });

    return {
      success: true,
      message: 'Feedback deleted successfully',
      data: deleted,
    };
  }
}
