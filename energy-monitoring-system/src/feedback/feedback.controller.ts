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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto, UpvoteFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackCategory, FeedbackStatus } from './schemas/feedback.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { AuditService } from '../audit/audit.service';
import { extractSafeIp } from '../audit/utils/audit-ip.utils';

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
  @ApiQuery({ name: 'voterId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Feedback list retrieved successfully' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: FeedbackStatus,
    @Query('category') category?: FeedbackCategory,
    @Query('sort') sort?: 'newest' | 'top',
    @Query('voterId') voterId?: string,
  ) {
    const result = await this.feedbackService.findAll({
      page,
      limit,
      status,
      category,
      sort,
      voterId,
    });

    return {
      success: true,
      ...result,
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
    @Req() req: Request,
  ) {
    const voterKey = dto.voterId?.trim() || extractSafeIp(req);
    const updated = await this.feedbackService.toggleUpvote(id, voterKey);
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
