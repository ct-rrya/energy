# ESP32 Data Not Saving - Troubleshooting

## ✅ What's Working:
- ESP32 uploads successfully (HTTP 201)
- Backend accepts request
- Returns reading ID: `6ac9b598a5e387ee8e716da1`

## ❌ What's NOT Working:
- Data not in MongoDB (`iotreadings` collection: 0 documents)
- Data not in MongoDB (`energyreadings` collection: 0 documents)
- Dashboard shows no data

## 🔍 Diagnosis Needed:

### Check Backend Logs

**Look for errors in the terminal running `npm run start:dev`**

Look for lines like:
```
[IoT] Received piezo reading...
Error: ...
MongoError: ...
ValidationError: ...
```

### Possible Causes:

1. **MongoDB Write Error** (most likely)
   - Schema validation failed
   - Missing required fields
   - Type mismatch
   - Database connection lost

2. **Reading saved to wrong collection**
   - Check all collections in MongoDB

3. **Silent error in async code**
   - Error caught but not logged

---

## 🧪 Test #1: Check All MongoDB Collections

Run this to see all collections:

```javascript
// In MongoDB Compass or mongosh
db.getCollectionNames()

// Check each collection:
db.iotreadings.countDocuments()
db.energyreadings.countDocuments()  
db.readings.countDocuments()
db.energy_readings.countDocuments()
```

---

## 🧪 Test #2: Test Database Write Directly

Create `test-database-write.js`:

```javascript
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function testWrite() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Try to insert the exact ESP32 reading format
    const testReading = {
      _id: new ObjectId(),
      sensorId: new ObjectId('6ac9b0c0dece79637e85f430'), // Your ESP32 sensor ID
      voltage: 2.335496902,
      current: 0,
      power: 0.000377406,
      capacitorVoltage: 30,
      stepCount: 6,
      frequency: 1.07296133,
      timestamp: new Date('2026-10-10T03:48:38.221Z'),
      receivedAt: new Date(),
      source: 'hardware',
      energy: 0,
      batteryPercentage: 100,
      wifiConnected: true,
      bluetoothConnected: false
    };
    
    console.log('Attempting to insert test reading...');
    
    // Try energyreadings collection
    const result = await db.collection('energyreadings').insertOne(testReading);
    console.log('✅ Insert successful!');
    console.log('Inserted ID:', result.insertedId);
    
    // Verify
    const count = await db.collection('energyreadings').countDocuments();
    console.log('Total documents now:', count);
    
  } catch (error) {
    console.error('❌ Insert failed:', error.message);
    console.error(error);
  } finally {
    await client.close();
  }
}

testWrite();
```

---

## 🧪 Test #3: Check Backend Logs for Errors

**In the terminal running your backend**, watch for:

```
POST /api/iot/piezo/readings 201 ...
```

**If you see errors after that line**, that's your problem!

---

## 📋 Next Steps:

1. **Check backend terminal logs** - Look for errors after ESP32 upload
2. **Run Test #1** - Check all MongoDB collections
3. **Run Test #2** - Test direct database write
4. **Share backend logs** - Show me any errors you see

---

## 🎯 Most Likely Issue:

**Schema Validation Error** - The data format doesn't match what Mongoose expects.

**Check if backend logs show:**
```
ValidationError: ...
```

That would tell us exactly which field is causing the problem.
