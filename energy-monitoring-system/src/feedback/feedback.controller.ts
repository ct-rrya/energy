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

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
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
  @ApiResponse({ status: 200, description: 'Feedback list retrieved successfully' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: FeedbackStatus,
    @Query('category') category?: FeedbackCategory,
    @Query('sort') sort?: 'newest' | 'top',
    @Query('tab') tab?: FeedbackTab,
    @Query('voterId') voterId?: string,
  ) {
    const result = await this.feedbackService.findAll({
      page,
      limit,
      status,
      category,
      sort,
      tab,
      voterId,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single feedback post with full details and answers',
    description: 'Returns full post details, votes, and all community/admin answers. Increments view count.',
  })
  async findOne(
    @Param('id') id: string,
    @Query('voterId') voterId?: string,
    @Query('noCount') noCount?: string,
  ) {
    const item = await this.feedbackService.findOne(
      id,
      voterId,
      noCount !== 'true',
    );
    return {
      success: true,
      data: item,
    };
  }

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit public feedback or review',
    description:
      'Allows any visitor to post a review, suggestion, or tile/bug issue to the public board.',
  })
  @ApiResponse({ status: 201, description: 'Feedback posted successfully' })
  async create(@Body() dto: CreateFeedbackDto) {
    const item = await this.feedbackService.create(dto);
    return {
      success: true,
      message: 'Feedback posted successfully',
      data: item,
    };
  }

  @Post(':id/vote')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upvote or downvote a feedback post',
    description: 'Toggles or switches upvote/downvote for a feedback post.',
  })
  async votePost(
    @Param('id') id: string,
    @Body() dto: VoteFeedbackDto,
  ) {
    const voterKey = dto.voterId?.trim() || 'anonymous';
    const updated = await this.feedbackService.votePost(id, dto.direction, voterKey);
    return {
      success: true,
      data: updated,
    };
  }

  @Post(':id/upvote')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle upvote on a feedback post',
    description: 'Upvotes or removes upvote for a public feedback post.',
  })
  async toggleUpvote(
    @Param('id') id: string,
    @Body() dto: UpvoteFeedbackDto,
  ) {
    const voterKey = dto.voterId?.trim() || 'anonymous';
    const updated = await this.feedbackService.toggleUpvote(id, voterKey);
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
    const updated = await this.feedbackService.addAnswer(
      id,
      dto,
      isAdmin,
      user?.name,
      voterId,
    );
    return {
      success: true,
      message: 'Answer posted successfully',
      data: updated,
    };
  }

  @Post(':id/answers/:answerId/vote')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upvote or downvote an answer',
  })
  async voteAnswer(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
    @Body() dto: VoteFeedbackDto,
  ) {
    const voterKey = dto.voterId?.trim() || 'anonymous';
    const updated = await this.feedbackService.voteAnswer(
      id,
      answerId,
      dto.direction,
      voterKey,
    );
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

    return {
      success: true,
      message: 'Feedback deleted successfully',
      data: deleted,
    };
  }
}
