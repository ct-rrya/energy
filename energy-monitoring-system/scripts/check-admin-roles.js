/**
 * Diagnostic Script - Check Admin User Roles
 * 
 * This script checks what role values are actually stored in the database
 * to identify any capitalization or value mismatches.
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function checkAdminRoles() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get ALL users with their roles
    console.log('📊 Fetching all users...\n');
    const allUsers = await usersCollection
      .find({})
      .project({ email: 1, name: 1, role: 1, isActive: 1, accessCodeHash: 1 })
      .toArray();

    console.log(`Found ${allUsers.length} total users\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: "${user.role}" (type: ${typeof user.role})`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Has accessCodeHash: ${!!user.accessCodeHash}`);
      if (user.accessCodeHash) {
        console.log(`  AccessCodeHash length: ${user.accessCodeHash.length}`);
      }
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');

    // Check specific role queries
    console.log('🔍 Testing role queries:\n');

    const queryTests = [
      { name: 'SUPER_ADMIN (exact)', query: { role: 'SUPER_ADMIN' } },
      { name: 'SYSTEM_ADMIN (exact)', query: { role: 'SYSTEM_ADMIN' } },
      { name: 'admin (lowercase)', query: { role: 'admin' } },
      { name: 'SUPER_ADMIN or SYSTEM_ADMIN', query: { role: { $in: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] } } },
      { name: 'admin (lowercase) in array', query: { role: { $in: ['admin'] } } },
    ];

    for (const test of queryTests) {
      const count = await usersCollection.countDocuments(test.query);
      console.log(`  ${test.name}: ${count} users found`);
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Show distinct role values
    console.log('📋 Distinct role values in database:\n');
    const distinctRoles = await usersCollection.distinct('role');
    distinctRoles.forEach(role => {
      console.log(`  - "${role}"`);
    });

    console.log('\n✨ Diagnostic complete!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdminRoles();
