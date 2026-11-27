import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { ContentModerationService } from './content-moderation.service';
import { AuditModule } from '../audit/audit.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
    ]),
    AuditModule,
    DashboardModule,
    AiModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, ContentModerationService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
