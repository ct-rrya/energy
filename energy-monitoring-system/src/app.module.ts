import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig, databaseConfig, jwtConfig, messengerConfig } from './config';

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

    // Feature modules will be imported here as we build them
    // Example: AuthModule, UsersModule, SensorsModule, etc.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
