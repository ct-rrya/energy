/**
 * Database Cleanup Script
 * 
 * Removes ALL data from the database EXCEPT the administrator account.
 * 
 * Purpose: Prepare system for real hardware testing with clean slate.
 * 
 * WARNING: This will DELETE all energy readings, sensor data, reports, alerts, etc.
 * Only the administrator account will remain.
 * 
 * Usage:
 *   node clean-database.js
 * 
 * Prerequisites:
 *   - MongoDB connection string configured in .env
 *   - Administrator account exists (will be preserved)
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

async function cleanDatabase() {
  console.log('🧹 Database Cleanup Script');
  console.log('==========================\n');
  console.log('⚠️  WARNING: This will DELETE all data except the administrator account!\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const db = client.db();

    // Collections to clean
    const collectionsToClean = [
      'energyreadings',
      'sensors',
      'alerts',
      'reports',
      'subscribers',
      'notifications',
      'notificationlogs',
    ];

    console.log('🗑️  Cleaning collections...\n');

    let totalDeleted = 0;

    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const countBefore = await collection.countDocuments();

        if (countBefore === 0) {
          console.log(`   ⏭️  ${collectionName}: Already empty`);
          continue;
        }

        // Delete all documents
        const result = await collection.deleteMany({});
        totalDeleted += result.deletedCount;

        console.log(`   ✅ ${collectionName}: Deleted ${result.deletedCount} documents`);
      } catch (error) {
        console.log(`   ⚠️  ${collectionName}: ${error.message}`);
      }
    }

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   Total documents deleted: ${totalDeleted}`);

    // Verify administrator account still exists
    console.log('\n👤 Verifying administrator account...');
    const usersCollection = db.collection('users');
    const adminCount = await usersCollection.countDocuments({ role: 'admin' });

    if (adminCount > 0) {
      console.log(`   ✅ Administrator account preserved (${adminCount} admin user(s) found)`);
    } else {
      console.log('   ⚠️  WARNING: No administrator account found!');
      console.log('   Run: npm run seed');
    }

    // Show final database state
    console.log('\n📦 Final Database State:');
    const userCount = await usersCollection.countDocuments();
    console.log(`   Users: ${userCount}`);

    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`   ${collectionName}: ${count}`);
      } catch (error) {
        console.log(`   ${collectionName}: N/A`);
      }
    }

    console.log('\n✨ Database cleanup complete!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the application: npm run start:dev');
    console.log('   2. Login with admin credentials');
    console.log('   3. Create a sensor via dashboard or API');
    console.log('   4. Configure ESP32 with sensor API key');
    console.log('   5. ESP32 will send first real reading\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run cleanup
cleanDatabase().catch(console.error);
