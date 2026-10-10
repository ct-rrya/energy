/**
 * Migration Script: Fix ReferenceConfig Index
 * 
 * This script:
 * 1. Drops the invalid _id index on ReferenceConfig collection
 * 2. Adds the isSingleton field to existing documents
 * 3. Creates the correct unique index on isSingleton field
 * 
 * Run with: node scripts/migrate-reference-config-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecostep';

async function migrate() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('reference_configs');

    // Check if collection exists
    const collections = await db.listCollections({ name: 'reference_configs' }).toArray();
    if (collections.length === 0) {
      console.log('ℹ️  Collection "reference_configs" does not exist yet. Nothing to migrate.');
      await mongoose.disconnect();
      return;
    }

    console.log('\n📋 Step 1: Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the problematic _id index if it exists (besides the default one)
    const problematicIndex = indexes.find(idx => 
      idx.key._id === 1 && idx.name !== '_id_'
    );
    
    if (problematicIndex) {
      console.log(`\n🗑️  Dropping problematic index: ${problematicIndex.name}`);
      try {
        await collection.dropIndex(problematicIndex.name);
        console.log('✅ Index dropped successfully');
      } catch (error) {
        console.log('⚠️  Could not drop index (it may not exist):', error.message);
      }
    } else {
      console.log('✅ No problematic _id index found');
    }

    console.log('\n📋 Step 2: Adding isSingleton field to existing documents...');
    const updateResult = await collection.updateMany(
      { isSingleton: { $exists: false } },
      { $set: { isSingleton: true } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} documents`);

    console.log('\n📋 Step 3: Creating unique index on isSingleton...');
    try {
      await collection.createIndex(
        { isSingleton: 1 }, 
        { unique: true, sparse: false, name: 'isSingleton_unique' }
      );
      console.log('✅ Unique index created on isSingleton field');
    } catch (error) {
      if (error.code === 11000 || error.message.includes('already exists')) {
        console.log('✅ Index already exists');
      } else {
        throw error;
      }
    }

    console.log('\n📋 Step 4: Verifying final indexes...');
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', JSON.stringify(finalIndexes, null, 2));

    console.log('\n✅ Migration completed successfully!');
    console.log('🔧 The Mongoose warning should no longer appear on server start.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

migrate();
