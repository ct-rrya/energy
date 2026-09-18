import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DiagnosticResultStatus {
  WITHIN_RANGE = 'Within Range',
  BELOW_EXPECTED = 'Below Expected',
  ABOVE_EXPECTED = 'Above Expected',
}

export type DiagnosticTestDocument = DiagnosticTest & Document;

/**
 * DiagnosticTest Schema
 *
 * Stores individual diagnostic test results and history.
 * Each test is immutable once created.
 *
 * Requirements: 16.1, 16.2, 16.3, 16.5, 15.5
 */
@Schema({ timestamps: true, collection: 'diagnostic_tests' })
export class DiagnosticTest {
  @Prop({ required: true })
  testDate: Date;

  @Prop({ required: true })
  performedBy: string;

  @Prop({ required: true })
  actualEnergy: number;

  @Prop({ required: true })
  expectedEnergy: number;

  @Prop({ required: true })
  difference: number;

  @Prop({ required: true })
  performancePercentage: number;

  @Prop({
    required: true,
    enum: Object.values(DiagnosticResultStatus),
  })
  result: DiagnosticResultStatus;

  @Prop({
    type: {
      appliedWeightKg: Number,
      expectedEnergyWh: Number,
      tolerancePercent: Number,
    },
    required: true,
  })
  referenceConfig: {
    appliedWeightKg: number;
    expectedEnergyWh: number;
    tolerancePercent: number;
  };

  @Prop({ maxlength: 500 })
  notes?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DiagnosticTestSchema =
  SchemaFactory.createForClass(DiagnosticTest);

// Indexes for efficient queries - Requirement 15.4, 15.5
DiagnosticTestSchema.index({ testDate: -1 });
DiagnosticTestSchema.index({ performedBy: 1 });
DiagnosticTestSchema.index({ result: 1 });
