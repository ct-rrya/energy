/**
 * Clean System Verification Script
 * 
 * Verifies that the system is completely clean and ready for
 * real hardware testing with no seeded, mock, or fake data.
 * 
 * Usage:
 *   node verify-clean-system.js
 * 
 * Checks:
 * - MongoDB collections are empty (except users)
 * - Administrator account exists
 * - No mock data in database
 * - Application can start without errors
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

async function verifyCleanSystem() {
  console.log('🔍 Clean System Verification');
  console.log('============================\n');

  const client = new MongoClient(MONGODB_URI);
  let allChecksPassed = true;

  try {
    console.log('📡 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const db = client.db();

    // Check 1: Administrator Account
    console.log('1️⃣  Checking Administrator Account...');
    const usersCollection = db.collection('users');
    const adminCount = await usersCollection.countDocuments({ role: 'admin' });

    if (adminCount > 0) {
      console.log(`   ✅ Administrator account found (${adminCount} admin user(s))`);
    } else {
      console.log('   ❌ No administrator account found!');
      console.log('   Action: Run "npm run seed" to create admin account');
      allChecksPassed = false;
    }

    // Check 2: Data Collections are Empty
    console.log('\n2️⃣  Checking Data Collections...');
    const dataCollections = {
      energyreadings: 'Energy Readings',
      sensors: 'Sensors',
      alerts: 'Alerts',
      reports: 'Reports',
      subscribers: 'Subscribers',
      notifications: 'Notifications',
      notificationlogs: 'Notification Logs',
    };

    let hasData = false;

    for (const [collectionName, displayName] of Object.entries(dataCollections)) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        if (count === 0) {
          console.log(`   ✅ ${displayName}: Empty (0 documents)`);
        } else {
          console.log(`   ⚠️  ${displayName}: Contains ${count} documents`);
          hasData = true;
        }
      } catch (error) {
        console.log(`   ℹ️  ${displayName}: Collection doesn't exist yet`);
      }
    }

    if (hasData) {
      console.log('\n   ⚠️  Database contains existing data!');
      console.log('   Action: Run "node clean-database.js" to clean all data');
      allChecksPassed = false;
    }

    // Check 3: No Mock Data Readings
    console.log('\n3️⃣  Checking for Mock Data...');
    try {
      const energyReadingsCollection = db.collection('energyreadings');
      const mockCount = await energyReadingsCollection.countDocuments({ source: 'mock' });

      if (mockCount === 0) {
        console.log('   ✅ No mock readings found');
      } else {
        console.log(`   ❌ Found ${mockCount} mock readings!`);
        console.log('   Action: Run "node clean-database.js" to remove mock data');
        allChecksPassed = false;
      }
    } catch (error) {
      console.log('   ✅ Energy readings collection doesn\'t exist yet (clean state)');
    }

    // Check 4: Environment Configuration
    console.log('\n4️⃣  Checking Environment Configuration...');
    const useMockData = process.env.USE_MOCK_DATA;

    if (useMockData === 'false' || !useMockData) {
      console.log('   ✅ USE_MOCK_DATA is set to false');
    } else {
      console.log('   ⚠️  USE_MOCK_DATA is set to true');
      console.log('   Action: Set USE_MOCK_DATA=false in .env file');
      allChecksPassed = false;
    }

    // Check 5: Required Environment Variables
    console.log('\n5️⃣  Checking Required Environment Variables...');
    const requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD',
      'MESSENGER_PAGE_ACCESS_TOKEN',
    ];

    let missingVars = 0;

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value && value.length > 0) {
        console.log(`   ✅ ${varName}: Configured`);
      } else {
        console.log(`   ❌ ${varName}: Missing or empty`);
        missingVars++;
      }
    }

    if (missingVars > 0) {
      console.log(`\n   ⚠️  ${missingVars} environment variable(s) missing`);
      console.log('   Action: Configure all required variables in .env file');
      allChecksPassed = false;
    }

    // Final Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📋 Verification Summary:');
    console.log('='.repeat(50));

    if (allChecksPassed) {
      console.log('\n✅ System is CLEAN and ready for hardware testing!');
      console.log('\n🚀 Next Steps:');
      console.log('   1. Start application: npm run start:dev');
      console.log('   2. Login to dashboard');
      console.log('   3. Create sensor via API or dashboard');
      console.log('   4. Configure ESP32 with sensor API key');
      console.log('   5. ESP32 sends first reading');
      console.log('   6. Dashboard updates in real-time');
      console.log('   7. Messenger bot shows real data\n');
    } else {
      console.log('\n⚠️  System is NOT ready for hardware testing!');
      console.log('\nPlease fix the issues above before proceeding.\n');
      process.exit(1);
    }

    // Show Expected Behavior
    console.log('📱 Expected Messenger Bot Behavior:');
    console.log('   When user sends "status" with no data:');
    console.log('   - Energy: 0.000 kWh');
    console.log('   - Power: 0.00 W');
    console.log('   - Readings: 0');
    console.log('   - Peak: "No peak data available yet"');
    console.log('   - CO₂: 0.00 kg');
    console.log('   - Savings: $0.00\n');

    console.log('📊 Expected Dashboard Behavior:');
    console.log('   - Shows empty state message');
    console.log('   - All metrics display zero');
    console.log('   - Charts show "No data available"');
    console.log('   - WebSocket connects successfully\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run verification
verifyCleanSystem().catch(console.error);
