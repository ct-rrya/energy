import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotCoreService } from './chatbot-core.service';
import { KnowledgeRagService } from './knowledge-rag.service';
import {
  KnowledgeChunk,
  KnowledgeChunkSchema,
} from './schemas/knowledge-chunk.schema';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EnergyModule } from '../energy/energy.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { AiModule } from '../ai/ai.module';
import { MilestonesModule } from '../milestones/milestones.module';

/**
 * ChatbotModule
 *
 * Provides shared chatbot core logic for all channels (Messenger, Web)
 *
 * Architecture:
 * - Imports service modules (Analytics, Energy, Subscribers, Milestones)
 * - Uses AiModule for Gemini/Groq AI services
 * - Registers KnowledgeRagService for vector-embedding RAG over website & project docs
 * - Exports ChatbotCoreService for use by MessengerService and ChatController
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
    AnalyticsModule,
    EnergyModule,
    SubscribersModule,
    AiModule, // Centralized AI services (Gemini with Groq fallback)
    MilestonesModule, // EcoStep Milestones: Weekly and monthly kinetic energy goals
  ],
  providers: [ChatbotCoreService, KnowledgeRagService],
  exports: [ChatbotCoreService, KnowledgeRagService],
})
export class ChatbotModule {}
