import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminManagementService } from '../admin-management/admin-management.service';
import { Logger } from '@nestjs/common';
import * as readline from 'readline';

/**
 * Database Seed Script - Initial SUPER_ADMIN Account
 *
 * Purpose:
 * Creates the initial SUPER_ADMIN account with access code.
 * This is the bootstrap account that can create other administrators.
 *
 * Environment Variables Optional:
 * - SUPER_ADMIN_NAME: Full name (default: "System Administrator")
 * - SUPER_ADMIN_EMAIL: Email (default: "superadmin@ecostep.local")
 *
 * Usage:
 *   npm run seed:super-admin
 *
 * Security:
 * - Access code is cryptographically random (12 characters)
 * - Access code is shown only once (save it immediately!)
 * - Checks for existing SUPER_ADMIN before creating
 * - Never creates duplicate accounts
 *
 * Process:
 * 1. Check if SUPER_ADMIN already exists
 * 2. Get name and email (from env or defaults)
 * 3. Create SUPER_ADMIN account
 * 4. Display access code (SAVE IT!)
 * 5. Wait for user confirmation
 * 6. Close application
 *
 * Exit Codes:
 * - 0: Success (SUPER_ADMIN created or already exists)
 * - 1: Error (database error or validation failure)
 */

/**
 * Prompt user to confirm they saved the access code
 */
function promptUserConfirmation(accessCode: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🔐 SUPER_ADMIN ACCESS CODE (SAVE THIS IMMEDIATELY!)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`     ${accessCode}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  ⚠️  IMPORTANT SECURITY NOTES:');
    console.log('');
    console.log('  • This access code will NEVER be shown again');
    console.log('  • Save it in a secure location immediately');
    console.log('  • Do NOT share this code with anyone');
    console.log('  • Use it to login and create other administrators');
    console.log('  • You can reset it later if needed');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    rl.question('Have you saved the access code? (yes/no): ', (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('');
        console.log('✅ Confirmed. Continuing...');
        rl.close();
        resolve();
      } else {
        console.log('');
        console.log('⚠️  Please save the access code before continuing!');
        console.log(`   Access Code: ${accessCode}`);
        console.log('');
        rl.question('Ready to continue? (yes/no): ', () => {
          rl.close();
          resolve();
        });
      }
    });
  });
}

async function bootstrap() {
  const logger = new Logger('SuperAdminSeeder');

  try {
    // Step 1: Get configuration
    logger.log('🔍 Reading configuration...');

    const superAdminName =
      process.env.SUPER_ADMIN_NAME || 'System Administrator';
    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || 'superadmin@ecostep.local';

    logger.log('✅ Configuration loaded');
    logger.log(`   Name: ${superAdminName}`);
    logger.log(`   Email: ${superAdminEmail}`);

    // Step 2: Bootstrap NestJS application
    logger.log('🚀 Bootstrapping application...');
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    });
    logger.log('✅ Application bootstrapped');

    // Get required service
    const adminManagementService = app.get(AdminManagementService);

    // Step 3: Check if SUPER_ADMIN already exists
    logger.log('🔍 Checking for existing SUPER_ADMIN accounts...');
    const counts = await adminManagementService.countByRole();

    if (counts.SUPER_ADMIN > 0) {
      logger.warn('⚠️  SUPER_ADMIN account(s) already exist');
      logger.warn(`   Count: ${counts.SUPER_ADMIN}`);
      logger.warn('   Skipping creation to prevent duplicates');
      logger.log('');
      logger.log('💡 To create additional administrators:');
      logger.log('   1. Login with existing SUPER_ADMIN access code');
      logger.log('   2. Navigate to Admin Management');
      logger.log('   3. Create new administrators');
      logger.log('');
      logger.log('💡 If you lost the access code:');
      logger.log('   1. Contact your database administrator');
      logger.log('   2. Manually reset the accessCodeHash in MongoDB');
      logger.log('   3. Or delete the SUPER_ADMIN and run this script again');
      logger.log('');
      logger.log('✨ Seed script completed');
      await app.close();
      process.exit(0);
    }

    logger.log('✅ No existing SUPER_ADMIN found');

    // Step 4: Create SUPER_ADMIN account
    logger.log('👤 Creating SUPER_ADMIN account...');
    const result = await adminManagementService.createAdminWithCode({
      email: superAdminEmail,
      name: superAdminName,
      role: 'SUPER_ADMIN',
    });

    logger.log('✅ SUPER_ADMIN account created successfully');
    logger.log(`   ID: ${result.admin._id}`);
    logger.log(`   Email: ${result.admin.email}`);
    logger.log(`   Name: ${result.admin.name}`);
    logger.log(`   Role: ${result.admin.role}`);
    logger.log(`   Active: ${result.admin.isActive}`);

    // Step 5: Display access code and wait for confirmation
    await promptUserConfirmation(result.accessCode);

    // Step 6: Final instructions
    console.log('');
    logger.log('✨ SUPER_ADMIN account setup complete!');
    logger.log('');
    logger.log('📋 Next Steps:');
    logger.log('   1. Start the application: npm run start:dev');
    logger.log('   2. Navigate to: http://localhost:3000/admin/login');
    logger.log('   3. Enter your access code to login');
    logger.log('   4. Create additional administrator accounts');
    logger.log('');
    logger.log('🔐 Security Reminders:');
    logger.log('   • Store the access code securely');
    logger.log('   • Do NOT commit it to version control');
    logger.log('   • Consider using a password manager');
    logger.log('   • Share it only with authorized personnel');
    logger.log('');

    // Step 7: Close application
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed script failed');
    logger.error(`   Error: ${error.message}`);

    if (error.code === 11000) {
      logger.error('   Reason: Email address already exists in database');
      logger.error('   Action: Use a different email or remove existing user');
    }

    process.exit(1);
  }
}

// Run the seed script
bootstrap();
