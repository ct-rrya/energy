import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MaintenanceState,
  MaintenanceStateDocument,
} from './schemas/maintenance-state.schema';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

export interface PublicMaintenanceState {
  enabled: boolean;
  message: string;
  estimatedResumeAt: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

const DEFAULT_MAINTENANCE_MESSAGE =
  'Scheduled floor mat wiring inspection and calibration in progress.';

@Injectable()
export class MaintenanceService implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceService.name);
  private cachedState: PublicMaintenanceState | null = null;

  constructor(
    @InjectModel(MaintenanceState.name)
    private readonly maintenanceModel: Model<MaintenanceStateDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.loadFromDb();
    } catch (error) {
      this.logger.warn(
        `Could not preload maintenance state on startup: ${(error as Error).message}`,
      );
    }
  }

  private formatDoc(doc: MaintenanceStateDocument): PublicMaintenanceState {
    const updatedAtRaw = (doc as any).updatedAt || new Date();
    return {
      enabled: Boolean(doc.enabled),
      message: doc.message?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
      estimatedResumeAt: doc.estimatedResumeAt
        ? new Date(doc.estimatedResumeAt).toISOString()
        : null,
      updatedBy: doc.updatedBy || null,
      updatedAt: new Date(updatedAtRaw).toISOString(),
    };
  }

  private async loadFromDb(): Promise<PublicMaintenanceState> {
    let doc = await this.maintenanceModel.findOne({ key: 'global' }).exec();
    if (!doc) {
      doc = await this.maintenanceModel.create({
        key: 'global',
        enabled: false,
        message: DEFAULT_MAINTENANCE_MESSAGE,
        estimatedResumeAt: null,
        updatedBy: null,
      });
    }
    const formatted = this.formatDoc(doc);
    this.cachedState = formatted;
    return formatted;
  }

  async getState(): Promise<PublicMaintenanceState> {
    if (this.cachedState) {
      return this.cachedState;
    }
    return this.loadFromDb();
  }

  async isEnabled(): Promise<boolean> {
    const state = await this.getState();
    return state.enabled;
  }

  async updateState(
    dto: UpdateMaintenanceDto,
    adminName: string,
  ): Promise<PublicMaintenanceState> {
    const current = await this.getState();
    const cleanMessage =
      dto.message !== undefined
        ? dto.message.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').trim()
        : current.message;

    let nextEstimatedResumeAt: Date | null = current.estimatedResumeAt
      ? new Date(current.estimatedResumeAt)
      : null;

    if (!dto.enabled) {
      // Clear estimated resume timestamp when returning to normal operation
      nextEstimatedResumeAt = null;
    } else if (dto.estimatedResumeAt !== undefined) {
      nextEstimatedResumeAt =
        dto.estimatedResumeAt && dto.estimatedResumeAt.trim()
          ? new Date(dto.estimatedResumeAt)
          : null;
    }

    const updated = await this.maintenanceModel
      .findOneAndUpdate(
        { key: 'global' },
        {
          $set: {
            enabled: dto.enabled,
            message: cleanMessage || DEFAULT_MAINTENANCE_MESSAGE,
            estimatedResumeAt: nextEstimatedResumeAt,
            updatedBy: adminName || 'Admin',
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    const formatted = this.formatDoc(updated);
    this.cachedState = formatted;

    this.logger.log(
      `Maintenance mode ${formatted.enabled ? 'ENABLED' : 'DISABLED'} by ${adminName}`,
    );

    return formatted;
  }
}
