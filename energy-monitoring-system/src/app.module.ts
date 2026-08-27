import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
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

/**
 * Root Application Module
 * 
 * This module:
 * 1. Loads environment variables via ConfigModule
 * 2. Establishes MongoDB connection via MongooseModule
 * 3. Registers all configuration files
 * 4. Will import feature modules (auth, users, sensors, etc.)
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

    HealthModule,

    // Feature modules will be imported here as we build them
    // Example: AuthModule, UsersModule, SensorsModule, etc.
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
