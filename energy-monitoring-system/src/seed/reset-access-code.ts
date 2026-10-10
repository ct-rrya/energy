import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import * as readline from 'readline';

/**
 * Reset Access Code Script
 * 
 * Allows you to reset a lost access code for any administrator.
 * 
 * Usage:
 *   npm run reset-access-code
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function bootstrap() {
  console.log('\n==============================================');
  console.log('   Access Code Reset Tool');
  console.log('==============================================\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);

  try {
    // Find all administrators
    const admins = await usersService.findAllAdmins();

    if (!admins || admins.length === 0) {
      console.log('❌ No administrators found in database.');
      console.log('\nRun the super-admin seeder first:');
      console.log('   npm run seed:super-admin\n');
      process.exit(0);
    }

    // Display all administrators
    console.log('Available Administrators:\n');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.isActive ? '✓ Active' : '✗ Inactive'}`);
      console.log(`   ID: ${admin._id.toString()}`);
      console.log('');
    });

    // Prompt user to select administrator
    const selection = await question('Enter the number of the administrator to reset (or "q" to quit): ');

    if (selection.toLowerCase() === 'q') {
      console.log('\nAborted.\n');
      process.exit(0);
    }

    const selectedIndex = parseInt(selection) - 1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= admins.length) {
      console.log('\n❌ Invalid selection.\n');
      process.exit(1);
    }

    const selectedAdmin = admins[selectedIndex];

    // Confirm
    console.log(`\nYou selected: ${selectedAdmin.name} (${selectedAdmin.email})`);
    const confirm = await question('Do you want to reset this administrator\'s access code? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('\nAborted.\n');
      process.exit(0);
    }

    // Generate new access code
    console.log('\nGenerating new access code...');
    
    // Generate 12-character alphanumeric code
    const crypto = require('crypto');
    
    // Keep generating until we get exactly 12 alphanumeric characters
    let newAccessCode = '';
    while (newAccessCode.length < 12) {
      const chunk = crypto
        .randomBytes(12) // Generate more bytes to ensure we get enough
        .toString('base64')
        .replace(/[^A-Za-z0-9]/g, '') // Remove non-alphanumeric
        .toUpperCase();
      newAccessCode += chunk;
    }
    newAccessCode = newAccessCode.slice(0, 12); // Take exactly 12 characters

    // Hash the new access code
    const hashedAccessCode = await authService.hashAccessCode(newAccessCode);

    // Update in database
    await usersService.updateAccessCode(selectedAdmin._id.toString(), hashedAccessCode);

    // Success
    console.log('\n==============================================');
    console.log('   ✓ Access Code Reset Successful!');
    console.log('==============================================\n');
    console.log(`Administrator: ${selectedAdmin.name}`);
    console.log(`Email: ${selectedAdmin.email}`);
    console.log(`Role: ${selectedAdmin.role}\n`);
    console.log('📋 NEW ACCESS CODE (save this securely):');
    console.log('\n┌────────────────────────────────────┐');
    console.log(`│  ${newAccessCode.slice(0, 3)}-${newAccessCode.slice(3, 6)}-${newAccessCode.slice(6, 9)}-${newAccessCode.slice(9, 12)}  │`);
    console.log('└────────────────────────────────────┘\n');
    console.log('⚠️  IMPORTANT:');
    console.log('   - This code will NOT be shown again');
    console.log('   - Save it in a secure location');
    console.log('   - Use it to login at /admin/login');
    console.log('   - The old access code is now invalid\n');

    const understood = await question('Type "done" to confirm you have saved the code: ');

    if (understood.toLowerCase() === 'done') {
      console.log('\n✓ Access code reset complete!\n');
    } else {
      console.log('\n⚠️  Make sure you have saved the code above!\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await app.close();
  }
}

bootstrap();
