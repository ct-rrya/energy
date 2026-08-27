import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscriber, SubscriberDocument } from './schemas/subscriber.schema';

/**
 * Subscribers Service
 * 
 * Manages Facebook Messenger subscribers.
 * 
 * Responsibilities:
 * - Subscribe/unsubscribe users
 * - Update user profiles
 * - Track last interaction
 * - Get active subscribers
 * - Manage notification preferences
 * 
 * Used By:
 * - Messenger Module (subscribe/unsubscribe commands)
 * - Notifications Module (get active subscribers)
 */
@Injectable()
export class SubscribersService {
  private readonly logger = new Logger(SubscribersService.name);

  constructor(
    @InjectModel(Subscriber.name)
    private subscriberModel: Model<SubscriberDocument>,
  ) {}

  /**
   * Subscribe User
   * 
   * Creates or updates subscriber record.
   * 
   * @param facebookUserId - Facebook User ID (PSID)
   * @param firstName - User first name (optional)
   * @param lastName - User last name (optional)
   * @returns Subscriber document
   */
  async subscribe(
    facebookUserId: string,
    firstName?: string,
    lastName?: string,
  ): Promise<SubscriberDocument> {
    this.logger.log(`Subscribing user: ${facebookUserId}`);

    // Check if already exists
    let subscriber = await this.subscriberModel.findOne({ facebookUserId });

    if (subscriber) {
      // Re-subscribe if previously unsubscribed
      subscriber.isSubscribed = true;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = undefined;
      if (firstName) subscriber.firstName = firstName;
      if (lastName) subscriber.lastName = lastName;
      await subscriber.save();
    } else {
      // Create new subscriber
      subscriber = await this.subscriberModel.create({
        facebookUserId,
        firstName,
        lastName,
        isSubscribed: true,
        subscribedAt: new Date(),
      });
    }

    return subscriber;
  }

  /**
   * Unsubscribe User
   * 
   * Marks user as unsubscribed (soft delete).
   * 
   * @param facebookUserId - Facebook User ID (PSID)
   * @returns Subscriber document or null if not found
   */
  async unsubscribe(facebookUserId: string): Promise<SubscriberDocument | null> {
    this.logger.log(`Unsubscribing user: ${facebookUserId}`);

    const subscriber = await this.subscriberModel.findOne({ facebookUserId });

    if (!subscriber) {
      return null;
    }

    subscriber.isSubscribed = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return subscriber;
  }

  /**
   * Update Last Interaction
   * 
   * Updates last interaction timestamp.
   * 
   * @param facebookUserId - Facebook User ID (PSID)
   */
  async updateLastInteraction(facebookUserId: string): Promise<void> {
    await this.subscriberModel.updateOne(
      { facebookUserId },
      { lastInteractionAt: new Date() },
    );
  }

  /**
   * Get Subscriber
   * 
   * Retrieves subscriber by Facebook User ID.
   * 
   * @param facebookUserId - Facebook User ID (PSID)
   * @returns Subscriber document or null
   */
  async getSubscriber(facebookUserId: string): Promise<SubscriberDocument | null> {
    return this.subscriberModel.findOne({ facebookUserId });
  }

  /**
   * Get All Active Subscribers
   * 
   * Retrieves all subscribed users.
   * 
   * @returns Array of subscriber documents
   */
  async getActiveSubscribers(): Promise<SubscriberDocument[]> {
    return this.subscriberModel.find({ isSubscribed: true });
  }

  /**
   * Get Subscriber Count
   * 
   * Returns number of active subscribers.
   * 
   * @returns Count of active subscribers
   */
  async getSubscriberCount(): Promise<number> {
    return this.subscriberModel.countDocuments({ isSubscribed: true });
  }

  /**
   * Update Preferences
   * 
   * Updates notification preferences for a user.
   * 
   * @param facebookUserId - Facebook User ID (PSID)
   * @param preferences - Notification preferences
   * @returns Updated subscriber or null
   */
  async updatePreferences(
    facebookUserId: string,
    preferences: Partial<Subscriber['preferences']>,
  ): Promise<SubscriberDocument | null> {
    const subscriber = await this.subscriberModel.findOne({ facebookUserId });

    if (!subscriber) {
      return null;
    }

    subscriber.preferences = {
      ...subscriber.preferences,
      ...preferences,
    };
    await subscriber.save();

    return subscriber;
  }

  // ============================================================
  // PHASE 7: ADMIN MANAGEMENT METHODS
  // ============================================================

  /**
   * List Subscribers (Admin)
   * 
   * Returns paginated list of subscribers with filters.
   * 
   * @param query - Query parameters (pagination, filters)
   * @returns Paginated subscribers list
   */
  async listSubscribers(query: any): Promise<{
    subscribers: SubscriberDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Build filter
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.isSubscribed !== undefined) filter.isSubscribed = query.isSubscribed;
    if (query.tag) filter.tags = query.tag;
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { facebookUserId: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      this.subscriberModel
        .find(filter)
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.subscriberModel.countDocuments(filter).exec(),
    ]);

    return {
      subscribers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Subscriber Details (Admin)
   * 
   * Returns detailed information about a subscriber.
   * 
   * @param id - Subscriber ID (MongoDB ObjectId or Facebook PSID)
   * @returns Subscriber document
   */
  async getSubscriberDetails(id: string): Promise<SubscriberDocument | null> {
    // Try to find by MongoDB ID first, then by Facebook PSID
    const subscriber = await this.subscriberModel.findById(id).catch(() => null);
    
    if (subscriber) return subscriber;
    
    return this.subscriberModel.findOne({ facebookUserId: id });
  }

  /**
   * Update Subscriber Details (Admin)
   * 
   * Updates subscriber information.
   * 
   * @param id - Subscriber ID (MongoDB ObjectId or Facebook PSID)
   * @param updateData - Data to update
   * @returns Updated subscriber document
   */
  async updateSubscriberDetails(
    id: string,
    updateData: any,
  ): Promise<SubscriberDocument | null> {
    // Find subscriber
    let subscriber = await this.subscriberModel.findById(id).catch(() => null);
    
    if (!subscriber) {
      subscriber = await this.subscriberModel.findOne({ facebookUserId: id });
    }

    if (!subscriber) return null;

    // Update fields
    if (updateData.status) subscriber.status = updateData.status;
    if (updateData.tags) subscriber.tags = updateData.tags;
    if (updateData.firstName) subscriber.firstName = updateData.firstName;
    if (updateData.lastName) subscriber.lastName = updateData.lastName;
    if (updateData.notificationPreferences) {
      subscriber.notificationPreferences = {
        ...subscriber.notificationPreferences,
        ...updateData.notificationPreferences,
      };
    }

    await subscriber.save();
    return subscriber;
  }

  /**
   * Block Subscriber (Admin)
   * 
   * Blocks subscriber from receiving notifications.
   * 
   * @param id - Subscriber ID
   * @param reason - Reason for blocking
   * @returns Updated subscriber document
   */
  async blockSubscriber(
    id: string,
    reason?: string,
  ): Promise<SubscriberDocument | null> {
    // Find subscriber
    let subscriber = await this.subscriberModel.findById(id).catch(() => null);
    
    if (!subscriber) {
      subscriber = await this.subscriberModel.findOne({ facebookUserId: id });
    }

    if (!subscriber) return null;

    // Block subscriber
    subscriber.status = 'blocked';
    subscriber.blockedReason = reason || 'Blocked by admin';
    subscriber.blockedAt = new Date();
    subscriber.isSubscribed = false;

    await subscriber.save();
    return subscriber;
  }

  /**
   * Unblock Subscriber (Admin)
   * 
   * Unblocks previously blocked subscriber.
   * 
   * @param id - Subscriber ID
   * @returns Updated subscriber document
   */
  async unblockSubscriber(id: string): Promise<SubscriberDocument | null> {
    // Find subscriber
    let subscriber = await this.subscriberModel.findById(id).catch(() => null);
    
    if (!subscriber) {
      subscriber = await this.subscriberModel.findOne({ facebookUserId: id });
    }

    if (!subscriber) return null;

    // Unblock subscriber
    subscriber.status = 'active';
    subscriber.blockedReason = undefined;
    subscriber.blockedAt = undefined;
    // Note: isSubscribed remains unchanged

    await subscriber.save();
    return subscriber;
  }

  /**
   * Delete Subscriber (Admin)
   * 
   * Soft delete - unsubscribes and marks as inactive.
   * 
   * @param id - Subscriber ID
   * @returns Updated subscriber document
   */
  async deleteSubscriber(id: string): Promise<SubscriberDocument | null> {
    // Find subscriber
    let subscriber = await this.subscriberModel.findById(id).catch(() => null);
    
    if (!subscriber) {
      subscriber = await this.subscriberModel.findOne({ facebookUserId: id });
    }

    if (!subscriber) return null;

    // Soft delete
    subscriber.isSubscribed = false;
    subscriber.status = 'inactive';
    subscriber.unsubscribedAt = new Date();

    await subscriber.save();
    return subscriber;
  }

  /**
   * Get Subscriber Statistics (Admin)
   * 
   * Returns aggregated statistics about subscribers.
   * 
   * @returns Subscriber statistics
   */
  async getSubscriberStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    subscribed: number;
    unsubscribed: number;
    newThisWeek: number;
    newThisMonth: number;
    tagDistribution: Record<string, number>;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      active,
      inactive,
      blocked,
      subscribed,
      unsubscribed,
      newThisWeek,
      newThisMonth,
      tagAggregation,
    ] = await Promise.all([
      this.subscriberModel.countDocuments().exec(),
      this.subscriberModel.countDocuments({ status: 'active' }).exec(),
      this.subscriberModel.countDocuments({ status: 'inactive' }).exec(),
      this.subscriberModel.countDocuments({ status: 'blocked' }).exec(),
      this.subscriberModel.countDocuments({ isSubscribed: true }).exec(),
      this.subscriberModel.countDocuments({ isSubscribed: false }).exec(),
      this.subscriberModel.countDocuments({ subscribedAt: { $gte: weekAgo } }).exec(),
      this.subscriberModel.countDocuments({ subscribedAt: { $gte: monthAgo } }).exec(),
      this.subscriberModel.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
      ]),
    ]);

    const tagDistribution: Record<string, number> = {};
    tagAggregation.forEach((item: any) => {
      tagDistribution[item._id] = item.count;
    });

    return {
      total,
      active,
      inactive,
      blocked,
      subscribed,
      unsubscribed,
      newThisWeek,
      newThisMonth,
      tagDistribution,
    };
  }
}
