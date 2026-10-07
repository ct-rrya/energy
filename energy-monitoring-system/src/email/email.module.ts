import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';

/**
 * EmailModule
 *
 * Provides email sending functionality for the EcoStep system.
 *
 * Features:
 * - Email service for sending administrator access codes
 * - Configurable via environment variables
 * - Graceful fallback when not configured
 *
 * Usage:
 *   @Module({
 *     imports: [EmailModule],
 *   })
 *   export class SomeModule {}
 *
 * Then inject EmailService:
 *   constructor(private emailService: EmailService) {}
 */
@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
