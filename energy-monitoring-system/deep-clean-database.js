/**
 * Deep Database Cleanup Script
 * 
 * Removes ABSOLUTELY ALL data except the administrator account.
 * This is more thorough than clean-database.js
 * 
 * Cleans:
 * - All collections (not just predefined list)
 * - System collections
 * - Any remaining test/mock data
 * 
 * Preserves:
 * - Administrator account ONLY
 * 
 * Usage:
 *   node deep-clean-database.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

async function deepCleanDatabase() {
  console.log('🧹 DEEP Database Cleanup');
  console.log('========================\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA except administrator account!\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // Get ALL collections in the database
    const collections = await db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections\n`);

    let totalDeleted = 0;
    const deletionReport = [];

    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = db.collection(collName);

      try {
        const countBefore = await collection.countDocuments();

        if (countBefore === 0) {
          console.log(`   ⏭️  ${collName}: Already empty`);
          deletionReport.push({ collection: collName, deleted: 0, status: 'empty' });
          continue;
        }

        // Special handling for users collection - preserve admin only
        if (collName === 'users') {
          const nonAdminCount = await collection.countDocuments({ role: { $ne: 'admin' } });
          
          if (nonAdminCount > 0) {
            const result = await collection.deleteMany({ role: { $ne: 'admin' } });
            totalDeleted += result.deletedCount;
            console.log(`   🔧 ${collName}: Deleted ${result.deletedCount} non-admin users (preserved admin)`);
            deletionReport.push({ collection: collName, deleted: result.deletedCount, status: 'partial' });
          } else {
            console.log(`   ✅ ${collName}: Admin account preserved (no cleanup needed)`);
            deletionReport.push({ collection: collName, deleted: 0, status: 'preserved' });
          }
          continue;
        }

        // For all other collections - delete EVERYTHING
        const result = await collection.deleteMany({});
        totalDeleted += result.deletedCount;
        console.log(`   ✅ ${collName}: Deleted ${result.deletedCount} documents`);
        deletionReport.push({ collection: collName, deleted: result.deletedCount, status: 'cleaned' });

      } catch (error) {
        console.log(`   ❌ ${collName}: Error - ${error.message}`);
        deletionReport.push({ collection: collName, deleted: 0, status: 'error', error: error.message });
      }
    }

    console.log('\n========================================');
    console.log('📊 Cleanup Summary:');
    console.log('========================================\n');
    console.log(`   Total documents deleted: ${totalDeleted}\n`);

    // Show detailed report
    console.log('📋 Detailed Report:\n');
    deletionReport.forEach(item => {
      const icon = item.status === 'empty' ? '⏭️ ' :
                   item.status === 'preserved' ? '✅' :
                   item.status === 'partial' ? '🔧' :
                   item.status === 'cleaned' ? '✅' : '❌';
      console.log(`   ${icon} ${item.collection}: ${item.deleted} deleted (${item.status})`);
    });

    // Verify administrator account
    console.log('\n========================================');
    console.log('👤 Verifying Administrator Account:');
    console.log('========================================\n');

    const usersCollection = db.collection('users');
    const adminCount = await usersCollection.countDocuments({ role: 'admin' });
    const totalUsers = await usersCollection.countDocuments();

    if (adminCount > 0) {
      console.log(`   ✅ Administrator: ${adminCount} admin account(s) preserved`);
      console.log(`   ✅ Total users: ${totalUsers}`);
      
      if (totalUsers === adminCount) {
        console.log(`   ✅ Perfect: Only admin account(s) remain`);
      } else {
        console.log(`   ⚠️  Warning: ${totalUsers - adminCount} non-admin user(s) remain`);
      }
    } else {
      console.log('   ❌ ERROR: No administrator account found!');
      console.log('   Action required: Run "npm run seed" to create admin');
    }

    // Final verification - count documents in all collections
    console.log('\n========================================');
    console.log('📦 Final Database State:');
    console.log('========================================\n');

    let totalRemaining = 0;
    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      totalRemaining += count;

      const icon = count === 0 ? '✅' : collName === 'users' ? '👤' : '⚠️ ';
      console.log(`   ${icon} ${collName}: ${count} documents`);
    }

    console.log(`\n   Total documents remaining: ${totalRemaining}`);

    if (totalRemaining === 1) {
      console.log('\n✨ SUCCESS: Database is completely clean!');
      console.log('   Only 1 document remains (administrator account)');
    } else if (totalRemaining === adminCount) {
      console.log('\n✨ SUCCESS: Database is clean!');
      console.log(`   Only ${totalRemaining} admin account(s) remain`);
    } else {
      console.log(`\n⚠️  WARNING: ${totalRemaining} documents remain`);
      console.log('   Expected: Only administrator account');
    }

    console.log('\n========================================');
    console.log('🚀 Next Steps:');
    console.log('========================================\n');
    console.log('   1. Restart application: npm run start:dev');
    console.log('   2. Login with admin credentials from .env');
    console.log('   3. Create first sensor via dashboard or API');
    console.log('   4. Configure ESP32 with sensor API key');
    console.log('   5. ESP32 sends first real reading');
    console.log('   6. Dashboard and Messenger update with real data\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run deep cleanup
deepCleanDatabase().catch(console.error);
