import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';
import {
  MilestoneTarget,
  MilestoneTargetSchema,
} from './schemas/milestone-target.schema';
import {
  EnergyReading,
  EnergyReadingSchema,
} from '../iot/schemas/energy-reading.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MilestoneTarget.name, schema: MilestoneTargetSchema },
      { name: EnergyReading.name, schema: EnergyReadingSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MilestonesController],
  providers: [MilestonesService],
  exports: [MilestonesService],
})
export class MilestonesModule {}

