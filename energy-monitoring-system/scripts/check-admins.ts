import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function checkAdmins() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('\n=== Checking ALL User Accounts ===\n');

  try {
    // Find ALL users
    const allUsers = await usersService['userModel']
      .find({})
      .select('email name role isActive createdAt')
      .exec();

    console.log(`Found ${allUsers.length} total account(s):\n`);

    // Group by role
    const admins = allUsers.filter(
      (u: any) => u.role === 'SUPER_ADMIN' || u.role === 'SYSTEM_ADMIN',
    );
    const publicUsers = allUsers.filter((u: any) => u.role === 'PUBLIC_USER');

    console.log(`=== ADMIN ACCOUNTS (${admins.length}) ===\n`);
    admins.forEach((admin: any, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log('');
    });

    console.log(`\n=== PUBLIC USER ACCOUNTS (${publicUsers.length}) ===\n`);
    publicUsers.forEach((user: any, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log('');
    });

    // Check for the specific email that's causing the conflict
    const conflictEmail = 'liam@lianofficesolution.com';
    const conflictUser = allUsers.find((u: any) => u.email === conflictEmail);
    if (conflictUser) {
      console.log(`\n⚠️  FOUND CONFLICTING EMAIL: ${conflictEmail}`);
      console.log(`    Name: ${conflictUser.name}`);
      console.log(`    Role: ${conflictUser.role}`);
      console.log(`    Active: ${conflictUser.isActive}`);
      console.log('');
    }
  } catch (error) {
    console.error('Error checking admins:', error);
  }

  await app.close();
}

checkAdmins();
