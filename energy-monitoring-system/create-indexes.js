/**
 * Database Index Creation Script
 * 
 * Creates indexes to improve query performance for chatbot responses.
 * Run this once to optimize database queries.
 * 
 * Usage: node create-indexes.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function createIndexes() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('Creating indexes for performance optimization...\n');
    
    // Energy readings indexes
    console.log('[1/3] Creating index on energyreadings collection...');
    try {
      await db.collection('energyreadings').createIndex(
        { timestamp: -1, source: 1 },
        { background: true, name: 'timestamp_source_idx' }
      );
      console.log('  ✅ Created compound index: timestamp (desc) + source');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠️  Index already exists, skipping');
      } else {
        throw error;
      }
    }
    
    // Additional timestamp-only index for date range queries
    try {
      await db.collection('energyreadings').createIndex(
        { timestamp: -1 },
        { background: true, name: 'timestamp_idx' }
      );
      console.log('  ✅ Created index: timestamp (desc)');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠️  Index already exists, skipping');
      } else {
        throw error;
      }
    }
    
    // Analytics daily indexes
    console.log('\n[2/3] Creating index on analyticsdailies collection...');
    try {
      await db.collection('analyticsdailies').createIndex(
        { date: -1 },
        { background: true, name: 'date_idx' }
      );
      console.log('  ✅ Created index: date (desc)');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠️  Index already exists, skipping');
      } else {
        throw error;
      }
    }
    
    // IoT readings indexes
    console.log('\n[3/3] Creating index on iotreadings collection...');
    try {
      await db.collection('iotreadings').createIndex(
        { timestamp: -1 },
        { background: true, name: 'timestamp_idx' }
      );
      console.log('  ✅ Created index: timestamp (desc)');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠️  Index already exists, skipping');
      } else {
        throw error;
      }
    }
    
    // Also create device_id index for IoT readings if not exists
    try {
      await db.collection('iotreadings').createIndex(
        { deviceId: 1, timestamp: -1 },
        { background: true, name: 'device_timestamp_idx' }
      );
      console.log('  ✅ Created compound index: deviceId + timestamp (desc)');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ⚠️  Index already exists, skipping');
      } else {
        throw error;
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Index creation complete!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Show existing indexes
    console.log('Current indexes:\n');
    
    const collections = ['energyreadings', 'analyticsdailies', 'iotreadings'];
    for (const collectionName of collections) {
      console.log(`📊 ${collectionName}:`);
      const indexes = await db.collection(collectionName).indexes();
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
      console.log('');
    }
    
    console.log('🚀 Database is now optimized for fast queries!');
    console.log('   Restart your server to see improved chatbot response times.\n');
    
  } catch (error) {
    console.error('\n❌ Error creating indexes:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createIndexes().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
