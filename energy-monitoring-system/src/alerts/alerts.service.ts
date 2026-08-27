import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Alert, AlertDocument, AlertStatus, AlertSeverity } from './schemas/alert.schema';
import {
  CreateAlertDto,
  AlertQueryDto,
} from './dto';

/**
 * Alerts Service
 * 
 * Manages system alerts independently from notification delivery.
 * 
 * Responsibilities:
 * - Create alerts from system events
 * - Query alerts with filters and pagination
 * - Acknowledge alerts
 * - Resolve alerts
 * - Get alert statistics
 * - Emit events for WebSocket broadcasting
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create Alert
   * 
   * Creates a new alert and emits event for real-time broadcasting.
   * 
   * @param createAlertDto - Alert creation data
   * @returns Created alert
   */
  async createAlert(createAlertDto: CreateAlertDto): Promise<Alert> {
    this.logger.log(`Creating alert: ${createAlertDto.type}`);

    const alert = new this.alertModel({
      ...createAlertDto,
      status: AlertStatus.ACTIVE,
    });

    const savedAlert = await alert.save();
    const alertJson = savedAlert.toJSON();

    // Emit event for WebSocket broadcasting
    this.eventEmitter.emit('alert.created', alertJson);

    this.logger.log(`Alert created: ${savedAlert._id.toString()}`);

    return alertJson;
  }

  /**
   * Get Alerts
   * 
   * Query alerts with filters, pagination, and sorting.
   * 
   * @param query - Query parameters
   * @returns Paginated alerts
   */
  async getAlerts(query: AlertQueryDto) {
    this.logger.log('Fetching alerts with filters');

    const {
      status,
      severity,
      type,
      sensorId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (type) {
      filter.type = type;
    }

    if (sensorId) {
      filter.sensorId = new Types.ObjectId(sensorId);
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [alerts, total] = await Promise.all([
      this.alertModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('acknowledgedBy', 'name email')
        .populate('resolvedBy', 'name email')
        .lean()
        .exec(),
      this.alertModel.countDocuments(filter).exec(),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: alerts.map((alert: any) => ({
        ...alert,
        id: alert._id.toString(),
        _id: undefined,
        __v: undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  /**
   * Get Alert by ID
   * 
   * @param id - Alert ID
   * @returns Alert
   */
  async getAlertById(id: string): Promise<Alert> {
    this.logger.log(`Fetching alert: ${id}`);

    const alert = await this.alertModel
      .findById(id)
      .populate('acknowledgedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .lean()
      .exec();

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return {
      ...alert,
      id: alert._id.toString(),
      _id: undefined,
      __v: undefined,
    } as any;
  }

  /**
   * Acknowledge Alert
   * 
   * Marks an alert as acknowledged by a user.
   * 
   * @param id - Alert ID
   * @param userId - User ID who acknowledged
   * @returns Updated alert
   */
  async acknowledgeAlert(id: string, userId: string): Promise<Alert> {
    this.logger.log(`Acknowledging alert: ${id} by user: ${userId}`);

    const alert = await this.alertModel.findById(id);

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    if (alert.status !== AlertStatus.ACTIVE) {
      throw new Error('Only active alerts can be acknowledged');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = new Types.ObjectId(userId);
    alert.acknowledgedAt = new Date();

    const updatedAlert = await alert.save();
    const alertJson = updatedAlert.toJSON();

    // Emit event for WebSocket broadcasting
    this.eventEmitter.emit('alert.acknowledged', alertJson);

    return alertJson;
  }

  /**
   * Resolve Alert
   * 
   * Marks an alert as resolved by a user.
   * 
   * @param id - Alert ID
   * @param userId - User ID who resolved
   * @returns Updated alert
   */
  async resolveAlert(id: string, userId: string): Promise<Alert> {
    this.logger.log(`Resolving alert: ${id} by user: ${userId}`);

    const alert = await this.alertModel.findById(id);

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    if (alert.status === AlertStatus.RESOLVED) {
      throw new Error('Alert is already resolved');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedBy = new Types.ObjectId(userId);
    alert.resolvedAt = new Date();

    // Auto-acknowledge if not already acknowledged
    if (!alert.acknowledgedBy) {
      alert.acknowledgedBy = new Types.ObjectId(userId);
      alert.acknowledgedAt = new Date();
    }

    const updatedAlert = await alert.save();
    const alertJson = updatedAlert.toJSON();

    // Emit event for WebSocket broadcasting
    this.eventEmitter.emit('alert.resolved', alertJson);

    return alertJson;
  }

  /**
   * Get Alert Statistics
   * 
   * Returns aggregate statistics about alerts.
   * 
   * @returns Alert statistics
   */
  async getAlertStats() {
    this.logger.log('Fetching alert statistics');

    const [
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      bySeverity,
      byType,
      recentAlerts,
    ] = await Promise.all([
      this.alertModel.countDocuments().exec(),
      this.alertModel.countDocuments({ status: AlertStatus.ACTIVE }).exec(),
      this.alertModel
        .countDocuments({
          status: AlertStatus.ACTIVE,
          severity: AlertSeverity.CRITICAL,
        })
        .exec(),
      this.alertModel.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
          },
        },
      ]),
      this.alertModel.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]),
      this.alertModel
        .find({ status: AlertStatus.ACTIVE })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
    ]);

    return {
      total: totalAlerts,
      active: activeAlerts,
      critical: criticalAlerts,
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recent: recentAlerts.map((alert: any) => ({
        ...alert,
        id: alert._id.toString(),
        _id: undefined,
        __v: undefined,
      })),
    };
  }

  /**
   * Delete Old Resolved Alerts
   * 
   * Cleanup utility to delete resolved alerts older than specified days.
   * 
   * @param days - Number of days to retain
   * @returns Number of deleted alerts
   */
  async deleteOldResolvedAlerts(days: number = 90): Promise<number> {
    this.logger.log(`Deleting resolved alerts older than ${days} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.alertModel
      .deleteMany({
        status: AlertStatus.RESOLVED,
        resolvedAt: { $lt: cutoffDate },
      })
      .exec();

    this.logger.log(`Deleted ${result.deletedCount} old resolved alerts`);

    return result.deletedCount;
  }
}
