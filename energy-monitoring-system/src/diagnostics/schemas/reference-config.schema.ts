import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReferenceConfigDocument = ReferenceConfig & Document;

/**
 * ReferenceConfig Schema
 *
 * Stores baseline values for diagnostic tests (singleton pattern).
 * Only one configuration document exists at any time.
 *
 * Requirements: 16.4, 16.5, 15.4
 */
@Schema({ timestamps: true, collection: 'reference_configs' })
export class ReferenceConfig {
  @Prop({ required: true, min: 0.1, max: 500 })
  appliedWeightKg: number;

  @Prop({ required: true, min: 0.001, max: 100 })
  expectedEnergyWh: number;

  @Prop({ required: true, min: 0, max: 50 })
  tolerancePercent: number;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ReferenceConfigSchema =
  SchemaFactory.createForClass(ReferenceConfig);

// Ensure only one config exists (singleton pattern)
// Using a dummy unique index on an always-true condition
ReferenceConfigSchema.index({ _id: 1 }, { unique: true });
