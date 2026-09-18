import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface CleanupStats {
  demoCountBefore: number;
  realCountBefore: number;
  demoCountDeleted: number;
  realCountAfter: number;
}

/**
 * Clean up demo data from MongoDB
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8
 */
async function cleanupDemoData(options: {
  dryRun: boolean;
  confirm: boolean;
}): Promise<CleanupStats> {
  // Requirement 25.1: Connect using MONGODB_URI environment variable
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable not set');
  }

  console.log('Connecting to MongoDB...');
  await connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  console.log('✓ Connected to MongoDB');

  const energyReadings = connection.collection('energy_readings');

  // Requirement 25.2: Count demo records before deletion
  const demoCountBefore = await energyReadings.countDocuments({
    source: 'mock',
  });

  // Requirement 25.3: Count real records before deletion
  const realCountBefore = await energyReadings.countDocuments({
    source: 'hardware',
  });

  // Requirement 7.3, 7.4: Log counts
  console.log(`\nFound ${demoCountBefore} demo records and ${realCountBefore} real records`);

  // Requirement 25.4: If dry-run, log and exit without deletion
  if (options.dryRun) {
    console.log('\n--dry-run mode: No deletion performed');
    console.log(`Would delete ${demoCountBefore} demo records`);
    await connection.close();
    return {
      demoCountBefore,
      realCountBefore,
      demoCountDeleted: 0,
      realCountAfter: realCountBefore,
    };
  }

  // Requirement 25.5: Execute deletion with --confirm flag
  if (!options.confirm) {
    throw new Error('--confirm flag required for actual deletion');
  }

  // Execute deletion (Requirements 7.1, 7.6)
  console.log('\nDeleting demo data...');
  const deleteResult = await energyReadings.deleteMany({ source: 'mock' });
  const demoCountDeleted = deleteResult.deletedCount || 0;

  // Requirement 25.6: Verify real data count is unchanged
  const realCountAfter = await energyReadings.countDocuments({
    source: 'hardware',
  });

  // Requirement 7.5, 19.8: Throw error if real data count changes
  if (realCountAfter !== realCountBefore) {
    throw new Error(
      `Real data count changed during deletion! Before: ${realCountBefore}, After: ${realCountAfter}`,
    );
  }

  // Requirement 25.7: Log summary
  console.log(`\n✓ Deleted ${demoCountDeleted} demo records, preserved ${realCountAfter} real records`);

  await connection.close();

  return {
    demoCountBefore,
    realCountBefore,
    demoCountDeleted,
    realCountAfter,
  };
}

// CLI parsing
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  confirm: args.includes('--confirm'),
};

// Validate options
if (!options.dryRun && !options.confirm) {
  console.error('\nError: Must specify either --dry-run or --confirm flag');
  console.error('\nUsage:');
  console.error('  npm run cleanup:demo -- --dry-run    # Preview changes without deleting');
  console.error('  npm run cleanup:demo -- --confirm    # Execute deletion');
  process.exit(1);
}

if (options.dryRun && options.confirm) {
  console.error('\nError: Cannot use both --dry-run and --confirm flags together');
  process.exit(1);
}

// Execute cleanup
cleanupDemoData(options)
  .then((stats) => {
    console.log('\n✓ Cleanup completed successfully');
    console.log('\nSummary:');
    console.log(`  Demo records before: ${stats.demoCountBefore}`);
    console.log(`  Demo records deleted: ${stats.demoCountDeleted}`);
    console.log(`  Real records preserved: ${stats.realCountAfter}`);
    // Requirement 25.8: Exit with code 0 on success
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Cleanup failed:', error.message);
    // Requirement 25.8: Exit with code 1 on failure
    process.exit(1);
  });
