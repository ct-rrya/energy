import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { Logger } from '@nestjs/common';

/**
 * Database Seed Script - Initial Administrator Account
 *
 * Purpose:
 * Creates the initial administrator account for the system.
 * This script is idempotent and can be run multiple times safely.
 *
 * Environment Variables Required:
 * - ADMIN_NAME: Full name of the administrator
 * - ADMIN_EMAIL: Email address (must be unique)
 * - ADMIN_PASSWORD: Password (will be hashed before storage)
 *
 * Usage:
 *   npm run seed
 *
 * Security:
 * - Password is hashed using bcrypt (10 salt rounds)
 * - Checks for existing admin before creating
 * - Never creates duplicate accounts
 * - Validates environment variables
 * - Provides clear error messages
 *
 * Process:
 * 1. Validate environment variables
 * 2. Bootstrap NestJS application
 * 3. Check if admin already exists
 * 4. Hash password
 * 5. Create admin user
 * 6. Close application
 *
 * Exit Codes:
 * - 0: Success (admin created or already exists)
 * - 1: Error (missing env vars or database error)
 */

async function bootstrap() {
  const logger = new Logger('AdminSeeder');

  try {
    // Step 1: Validate environment variables
    logger.log('🔍 Validating environment variables...');

    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminName || !adminEmail || !adminPassword) {
      logger.error('❌ Missing required environment variables');
      logger.error('   Required: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD');
      logger.error('   Please configure these in your .env file');
      process.exit(1);
    }

    logger.log('✅ Environment variables validated');
    logger.log(`   Name: ${adminName}`);
    logger.log(`   Email: ${adminEmail}`);

    // Step 2: Bootstrap NestJS application
    logger.log('🚀 Bootstrapping application...');
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'], // Reduce noise during seeding
    });
    logger.log('✅ Application bootstrapped');

    // Get required services
    const usersService = app.get(UsersService);
    const authService = app.get(AuthService);

    // Step 3: Check if admin already exists
    logger.log('🔍 Checking for existing administrators...');
    const hasAdmin = await usersService.hasAdminUsers();

    if (hasAdmin) {
      logger.warn('⚠️  Administrator account already exists');
      logger.warn('   Skipping creation to prevent duplicates');
      logger.log('✨ Seed script completed successfully');
      await app.close();
      process.exit(0);
    }

    logger.log('✅ No existing administrators found');

    // Step 4: Hash password
    logger.log('🔐 Hashing password...');
    const hashedPassword = await authService.hashPassword(adminPassword);
    logger.log('✅ Password hashed successfully');

    // Step 5: Create admin user
    logger.log('👤 Creating administrator account...');
    const admin = await usersService.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'admin',
      isActive: true,
    });

    logger.log('✅ Administrator account created successfully');
    logger.log(`   ID: ${admin._id}`);
    logger.log(`   Email: ${admin.email}`);
    logger.log(`   Name: ${admin.name}`);
    logger.log(`   Role: ${admin.role}`);
    logger.log(`   Active: ${admin.isActive}`);

    // Step 6: Close application
    logger.log('✨ Seed script completed successfully');
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed script failed');
    logger.error(`   Error: ${error.message}`);

    if (error.code === 11000) {
      // MongoDB duplicate key error
      logger.error('   Reason: Email address already exists in database');
      logger.error('   Action: Use a different email or remove existing user');
    }

    process.exit(1);
  }
}

// Run the seed script
bootstrap();
