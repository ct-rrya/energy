/**
 * Database Inspection Script
 * 
 * Thoroughly inspects all collections to find any remaining mock/test data.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

async function inspectDatabase() {
  console.log('🔍 Database Inspection - Finding All Data');
  console.log('==========================================\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections:\n`);

    let totalDocuments = 0;
    const mockDataFound = [];

    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      totalDocuments += count;

      console.log(`📂 ${collName}: ${count} documents`);

      if (count > 0) {
        // Show sample documents
        const samples = await collection.find({}).limit(3).toArray();
        
        console.log(`   Sample data:`);
        samples.forEach((doc, idx) => {
          console.log(`   ${idx + 1}. ${JSON.stringify(doc, null, 2).substring(0, 200)}...`);
        });

        // Check for mock/test indicators
        const mockCount = await collection.countDocuments({
          $or: [
            { source: 'mock' },
            { name: /test|demo|mock/i },
            { email: /test|demo|mock/i },
            { location: /test|demo|mock/i },
            { description: /test|demo|mock/i }
          ]
        });

        if (mockCount > 0) {
          mockDataFound.push({
            collection: collName,
            count: mockCount,
            total: count
          });
          console.log(`   ⚠️  MOCK DATA FOUND: ${mockCount} documents`);
        }

        console.log('');
      }
    }

    console.log('\n==========================================');
    console.log(`📊 Total documents across all collections: ${totalDocuments}`);
    
    if (mockDataFound.length > 0) {
      console.log('\n⚠️  MOCK DATA DETECTED:\n');
      mockDataFound.forEach(item => {
        console.log(`   ${item.collection}: ${item.count}/${item.total} documents`);
      });
    } else if (totalDocuments > 1) {
      console.log('\n⚠️  Collections with data (excluding admin):');
      for (const collInfo of collections) {
        const collName = collInfo.name;
        const collection = db.collection(collName);
        const count = await collection.countDocuments();
        
        if (count > 0 && collName !== 'users') {
          console.log(`   ${collName}: ${count} documents`);
        }
      }
    } else {
      console.log('\n✅ Database is clean - only admin account exists');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

inspectDatabase().catch(console.error);
