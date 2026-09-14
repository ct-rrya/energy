import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Authentication Module
 *
 * Handles all authentication-related functionality:
 * - User login
 * - JWT token generation and validation
 * - Password verification
 * - Protected route guards
 *
 * Dependencies:
 * - JwtModule: JWT token generation and validation
 * - UsersModule: Access to user data
 * - ConfigModule: Load JWT configuration from environment
 *
 * Architecture:
 * - Service: Business logic (validation, login, token generation)
 * - Controller: HTTP endpoints (/login, /profile) - will add next
 * - Strategy: Passport JWT strategy - will add next
 * - Guards: Protect routes - will add next
 *
 * Configuration:
 * - JWT secret from environment variable
 * - JWT expiration from environment variable
 * - Configured globally for the module
 */
@Module({
  imports: [
    // Import UsersModule to access UsersService
    UsersModule,

    // Register Passport module
    PassportModule,

    // Configure JWT module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '7d',
        } as any,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // Export for use in seed script and other modules
})
export class AuthModule {}
