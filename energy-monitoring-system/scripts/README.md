# Scripts Documentation

## Demo Data Cleanup Script

The `cleanup-demo-data.ts` script removes demo/mock data from the MongoDB database while preserving real hardware data.

### Usage

**Preview changes (dry-run mode)**:
```bash
npm run cleanup:demo -- --dry-run
```
Shows what would be deleted without actually deleting any data.

**Execute deletion**:
```bash
npm run cleanup:demo -- --confirm
```
Actually deletes demo data from the database. Requires explicit confirmation flag for safety.

### Safety Features

- **Requires explicit flag**: Must use either `--dry-run` or `--confirm`
- **Preserves real data**: Only deletes records with `source='mock'`
- **Verification**: Checks that real data count remains unchanged
- **Error handling**: Exits with error if real data is accidentally affected

### What Gets Deleted

The script removes all documents from the `energy_readings` collection where `source='mock'`.

### Requirements

- MongoDB connection via `MONGODB_URI` environment variable
- Node.js and ts-node installed
