import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkEnergyData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const db = connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('energy_readings');

    // Get today's date boundaries (Manila timezone)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    console.log(`\nChecking readings from ${todayStart.toISOString()} to ${todayEnd.toISOString()}`);

    // Query 1: Count total readings
    const totalCount = await collection.countDocuments();
    console.log(`\n📊 Total readings in database: ${totalCount}`);

    // Query 2: Count today's readings using receivedAt
    const todayCount = await collection.countDocuments({
      receivedAt: { $gte: todayStart, $lte: todayEnd },
      source: 'hardware',
    });
    console.log(`📊 Today's readings (receivedAt): ${todayCount}`);

    // Query 3: Get sample readings with energy field
    console.log(`\n🔍 Sample readings from today:`);
    const samples = await collection
      .find({
        receivedAt: { $gte: todayStart, $lte: todayEnd },
        source: 'hardware',
      })
      .sort({ receivedAt: -1 })
      .limit(5)
      .toArray();

    samples.forEach((reading, index) => {
      console.log(`\n  Reading #${index + 1}:`);
      console.log(`    receivedAt: ${reading.receivedAt?.toISOString()}`);
      console.log(`    timestamp: ${reading.timestamp?.toISOString()}`);
      console.log(`    energy: ${reading.energy} mWh`);
      console.log(`    power: ${reading.power} W`);
      console.log(`    voltage: ${reading.voltage} V`);
      console.log(`    stepCount: ${reading.stepCount}`);
    });

    // Query 4: Check energy field statistics
    const energyStats = await collection
      .aggregate([
        {
          $match: {
            receivedAt: { $gte: todayStart, $lte: todayEnd },
            source: 'hardware',
          },
        },
        {
          $group: {
            _id: null,
            minEnergy: { $min: '$energy' },
            maxEnergy: { $max: '$energy' },
            avgEnergy: { $avg: '$energy' },
            countWithEnergy: { $sum: { $cond: [{ $gt: ['$energy', 0] }, 1, 0] } },
            countZeroEnergy: { $sum: { $cond: [{ $eq: ['$energy', 0] }, 1, 0] } },
            countNullEnergy: { $sum: { $cond: [{ $eq: ['$energy', null] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log(`\n⚡ Energy field statistics:`);
    if (energyStats.length > 0) {
      const stats = energyStats[0];
      console.log(`    Total readings: ${stats.total}`);
      console.log(`    Readings with energy > 0: ${stats.countWithEnergy}`);
      console.log(`    Readings with energy = 0: ${stats.countZeroEnergy}`);
      console.log(`    Readings with energy = null: ${stats.countNullEnergy}`);
      console.log(`    Min energy: ${stats.minEnergy} mWh`);
      console.log(`    Max energy: ${stats.maxEnergy} mWh`);
      console.log(`    Avg energy: ${stats.avgEnergy?.toFixed(6)} mWh`);
    } else {
      console.log(`    No readings found`);
    }

    // Query 5: Test the delta calculation logic
    console.log(`\n🧮 Testing delta calculation:`);
    const deltaTest = await collection
      .aggregate([
        {
          $match: {
            receivedAt: { $gte: todayStart, $lte: todayEnd },
            source: 'hardware',
          },
        },
        {
          $sort: { sensorId: 1, receivedAt: 1 },
        },
        {
          $setWindowFields: {
            partitionBy: '$sensorId',
            sortBy: { receivedAt: 1 },
            output: {
              previousEnergy: {
                $shift: { output: '$energy', by: -1 },
              },
            },
          },
        },
        {
          $addFields: {
            energyDelta: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$previousEnergy', null] },
                    { $lt: ['$energy', '$previousEnergy'] },
                  ],
                },
                then: 0,
                else: { $subtract: ['$energy', '$previousEnergy'] },
              },
            },
          },
        },
        {
          $project: {
            receivedAt: 1,
            energy: 1,
            previousEnergy: 1,
            energyDelta: 1,
            power: 1,
          },
        },
        {
          $limit: 10,
        },
      ])
      .toArray();

    deltaTest.forEach((reading, index) => {
      console.log(`\n  Delta #${index + 1}:`);
      console.log(`    receivedAt: ${reading.receivedAt?.toISOString()}`);
      console.log(`    energy: ${reading.energy} mWh`);
      console.log(`    previousEnergy: ${reading.previousEnergy ?? 'null'} mWh`);
      console.log(`    energyDelta: ${reading.energyDelta} mWh`);
      console.log(`    power: ${reading.power} W`);
    });

    // Query 6: Calculate total energy delta
    const totalEnergyDelta = await collection
      .aggregate([
        {
          $match: {
            receivedAt: { $gte: todayStart, $lte: todayEnd },
            source: 'hardware',
          },
        },
        {
          $sort: { sensorId: 1, receivedAt: 1 },
        },
        {
          $setWindowFields: {
            partitionBy: '$sensorId',
            sortBy: { receivedAt: 1 },
            output: {
              previousEnergy: {
                $shift: { output: '$energy', by: -1 },
              },
            },
          },
        },
        {
          $addFields: {
            energyDelta: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$previousEnergy', null] },
                    { $lt: ['$energy', '$previousEnergy'] },
                  ],
                },
                then: 0,
                else: { $subtract: ['$energy', '$previousEnergy'] },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalEnergyDelta: { $sum: '$energyDelta' },
          },
        },
      ])
      .toArray();

    console.log(`\n🎯 Final energy calculation:`);
    if (totalEnergyDelta.length > 0) {
      const totalMWh = totalEnergyDelta[0].totalEnergyDelta;
      const totalKWh = totalMWh / 1000000;
      console.log(`    Total energy delta: ${totalMWh} mWh`);
      console.log(`    Total energy delta: ${totalKWh.toFixed(6)} kWh`);
    } else {
      console.log(`    No energy deltas calculated`);
    }

    await connection.close();
    console.log(`\n✓ Connection closed`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEnergyData();
