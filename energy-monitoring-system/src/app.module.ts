import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  messengerConfig,
  envValidationSchema,
} from './config';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SensorsModule } from './sensors/sensors.module';
import { IotModule } from './iot/iot.module';
import { EnergyModule } from './energy/energy.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessengerModule } from './messenger/messenger.module';
import { ReportsModule } from './reports/reports.module';
import { AlertsModule } from './alerts/alerts.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ChatModule } from './chat/chat.module';
import { PublicModule } from './public/public.module';

/**
 * Root Application Module
 * 
 * This module:
 * 1. Loads environment variables via ConfigModule
 * 2. Establishes MongoDB connection via MongooseModule
 * 3. Registers all configuration files
 * 4. Configures caching and rate limiting for public APIs
 * 5. Imports feature modules (auth, users, sensors, chat, etc.)
 */
@Module({
  imports: [
    // Load environment variables and configuration files
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available throughout the app
      load: [appConfig, databaseConfig, jwtConfig, messengerConfig],
      envFilePath: '.env',
      cache: true, // Cache environment variables for performance
      validationSchema: envValidationSchema, // Validate environment variables on startup
      validationOptions: {
        allowUnknown: true, // Allow extra variables not in schema
        abortEarly: false, // Show all validation errors, not just the first one
      },
    }),

    // Connect to MongoDB using configuration
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        ...configService.get('database.options'),
      }),
      inject: [ConfigService],
    }),

    // Enable event emitter for event-driven notifications (Phase 7)
    EventEmitterModule.forRoot(),

    // Enable scheduling for session cleanup and other cron jobs
    ScheduleModule.forRoot(),

    // Configure caching for public API (telemetry)
    CacheModule.register({
      isGlobal: true,
      ttl: 5, // 5 seconds default
      max: 100, // Max 100 cached items
    }),

    // Configure rate limiting for public APIs
    ThrottlerModule.forRoot([
      {
        name: 'chat',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
      {
        name: 'telemetry',
        ttl: 60000, // 1 minute
        limit: 120, // 120 requests per minute (every 0.5s)
      },
    ]),

    HealthModule,

    // Feature modules
    UsersModule,
    AuthModule,
    SensorsModule,
    IotModule,
    EnergyModule,
    DashboardModule,
    AnalyticsModule,
    SubscribersModule,
    MessengerModule,
    NotificationsModule, // Phase 7: Notification Platform
    ReportsModule,
    AlertsModule, // Phase 8: Alert Management System
    
    // Chat feature modules
    ChatbotModule, // Shared chatbot core logic
    ChatModule, // Public chat API
    PublicModule, // Public telemetry API
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
