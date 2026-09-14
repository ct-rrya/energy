import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscribersService } from './subscribers.service';
import {
  UpdateSubscriberDto,
  BlockSubscriberDto,
  SubscriberQueryDto,
} from './dto';

/**
 * Subscribers Controller
 *
 * Admin endpoints for subscriber management.
 *
 * All endpoints require:
 * - JWT authentication
 * - Admin role
 *
 * Features:
 * - List subscribers with pagination and filters
 * - View subscriber details
 * - Update subscriber (tags, preferences, status)
 * - Block/unblock subscribers
 * - Delete subscribers (soft delete)
 * - Subscriber statistics
 */
@ApiTags('Subscribers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  /**
   * List All Subscribers
   *
   * Returns paginated list of subscribers with filters.
   * Admin only.
   */
  @Get()
  @ApiOperation({
    summary: 'List all subscribers',
    description:
      'Returns paginated list of subscribers with optional filters (status, tags, search). Admin only.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results per page',
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    enum: ['active', 'inactive', 'blocked'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or Facebook User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscribers retrieved successfully',
  })
  async listSubscribers(@Query() query: SubscriberQueryDto) {
    return this.subscribersService.listSubscribers(query);
  }

  /**
   * Get Subscriber Details
   *
   * Returns detailed information about a specific subscriber.
   * Admin only.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get subscriber details',
    description:
      'Returns detailed information about a specific subscriber. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subscriber ID (MongoDB ObjectId or Facebook PSID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber details retrieved',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscriber not found',
  })
  async getSubscriber(@Param('id') id: string) {
    return this.subscribersService.getSubscriberDetails(id);
  }

  /**
   * Update Subscriber
   *
   * Update subscriber information (tags, preferences, status).
   * Admin only.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update subscriber',
    description:
      'Update subscriber information including tags, preferences, and status. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subscriber ID (MongoDB ObjectId or Facebook PSID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscriber not found',
  })
  async updateSubscriber(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriberDto,
  ) {
    return this.subscribersService.updateSubscriberDetails(id, dto);
  }

  /**
   * Block Subscriber
   *
   * Block subscriber from receiving notifications.
   * Admin only.
   */
  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Block subscriber',
    description: 'Block subscriber from receiving notifications. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subscriber ID (MongoDB ObjectId or Facebook PSID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber blocked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscriber not found',
  })
  async blockSubscriber(
    @Param('id') id: string,
    @Body() dto: BlockSubscriberDto,
  ) {
    return this.subscribersService.blockSubscriber(id, dto.reason);
  }

  /**
   * Unblock Subscriber
   *
   * Unblock previously blocked subscriber.
   * Admin only.
   */
  @Post(':id/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unblock subscriber',
    description: 'Unblock previously blocked subscriber. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subscriber ID (MongoDB ObjectId or Facebook PSID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber unblocked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscriber not found',
  })
  async unblockSubscriber(@Param('id') id: string) {
    return this.subscribersService.unblockSubscriber(id);
  }

  /**
   * Delete Subscriber
   *
   * Soft delete subscriber (marks as deleted but keeps record).
   * Admin only.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete subscriber',
    description:
      'Soft delete subscriber (unsubscribes and marks as inactive). Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subscriber ID (MongoDB ObjectId or Facebook PSID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscriber not found',
  })
  async deleteSubscriber(@Param('id') id: string) {
    return this.subscribersService.deleteSubscriber(id);
  }

  /**
   * Get Subscriber Statistics
   *
   * Returns aggregated statistics about subscribers.
   * Admin only.
   */
  @Get('stats/summary')
  @ApiOperation({
    summary: 'Get subscriber statistics',
    description:
      'Returns aggregated statistics (total, active, growth, etc.). Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getSubscriberStats() {
    return this.subscribersService.getSubscriberStatistics();
  }
}
