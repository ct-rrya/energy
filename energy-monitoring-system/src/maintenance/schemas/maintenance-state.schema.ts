import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MaintenanceStateDocument = MaintenanceState & Document;

@Schema({
  timestamps: true,
  collection: 'system_maintenance',
})
export class MaintenanceState {
  @Prop({ required: true, unique: true, default: 'global' })
  key: string;

  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({
    required: true,
    default: 'Scheduled floor mat wiring inspection and calibration in progress.',
    trim: true,
  })
  message: string;

  @Prop({ type: Date, default: null })
  estimatedResumeAt: Date | null;

  @Prop({ type: String, default: null })
  updatedBy: string | null;
}

export const MaintenanceStateSchema =
  SchemaFactory.createForClass(MaintenanceState);
