/**
 * Generate Access Code Helper
 * 
 * This script generates a new access code and its bcrypt hash.
 * You can then manually update MongoDB with the hash.
 * 
 * Usage:
 *   node generate-access-code.js
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

async function generateAccessCode() {
  console.log('\n==============================================');
  console.log('   Access Code Generator');
  console.log('==============================================\n');

  // Generate 12-character alphanumeric code
  // Keep generating until we get exactly 12 alphanumeric characters
  let accessCode = '';
  while (accessCode.length < 12) {
    const chunk = crypto
      .randomBytes(12) // Generate more bytes to ensure we get enough
      .toString('base64')
      .replace(/[^A-Za-z0-9]/g, '') // Remove non-alphanumeric
      .toUpperCase();
    accessCode += chunk;
  }
  accessCode = accessCode.slice(0, 12); // Take exactly 12 characters

  // Hash the access code
  const salt = await bcrypt.genSalt(10);
  const hashedAccessCode = await bcrypt.hash(accessCode, salt);

  console.log('📋 NEW ACCESS CODE (save this):');
  console.log('\n┌────────────────────────────────────┐');
  console.log(`│  ${accessCode.slice(0, 3)}-${accessCode.slice(3, 6)}-${accessCode.slice(6, 9)}-${accessCode.slice(9, 12)}  │`);
  console.log('└────────────────────────────────────┘\n');
  console.log('Raw code (12 characters):');
  console.log(`  ${accessCode}\n`);
  console.log('Hashed code (copy this to MongoDB):');
  console.log(`  ${hashedAccessCode}\n`);
  console.log('To update in MongoDB:');
  console.log('  1. Open MongoDB Compass or mongosh');
  console.log('  2. Connect to your database');
  console.log('  3. Find the users collection');
  console.log('  4. Find your admin user (by email or name)');
  console.log('  5. Update the accessCodeHash field with the hash above\n');
  console.log('MongoDB Update Command:');
  console.log('  db.users.updateOne(');
  console.log('    { email: "YOUR_EMAIL@example.com" },');
  console.log(`    { $set: { accessCodeHash: "${hashedAccessCode}" } }`);
  console.log('  )\n');
}

generateAccessCode().catch(console.error);
