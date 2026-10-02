/**
 * Test Access Code Script
 * 
 * Tests if an access code is valid and can be used to login.
 * This helps diagnose access code issues.
 * 
 * Usage:
 *   node test-access-code.js YOUR_ACCESS_CODE
 * 
 * Example:
 *   node test-access-code.js ABC123DEF456
 */

const axios = require('axios');

const accessCode = process.argv[2];
const apiUrl = process.env.API_URL || 'http://localhost:3000';

if (!accessCode) {
  console.error('\n❌ Error: Please provide an access code');
  console.log('\nUsage:');
  console.log('  node test-access-code.js YOUR_ACCESS_CODE');
  console.log('\nExample:');
  console.log('  node test-access-code.js ABC123DEF456\n');
  process.exit(1);
}

if (accessCode.length !== 12) {
  console.error('\n⚠️  Warning: Access code should be exactly 12 characters');
  console.log(`   You provided: ${accessCode.length} characters\n`);
}

async function testAccessCode() {
  console.log('\n==============================================');
  console.log('   Access Code Validation Test');
  console.log('==============================================\n');
  console.log(`Testing access code: ${accessCode}`);
  console.log(`API URL: ${apiUrl}/api/auth/admin/access-code\n`);

  try {
    // Test 1: Check backend health
    console.log('Step 1: Checking backend health...');
    try {
      const healthResponse = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
      console.log('✓ Backend is running\n');
    } catch (healthError) {
      console.error('✗ Backend not accessible');
      console.error(`  Error: ${healthError.message}`);
      console.error('\n  Make sure the backend is running:');
      console.error('    cd energy-monitoring-system');
      console.error('    npm run start:dev\n');
      process.exit(1);
    }

    // Test 2: Attempt login with access code
    console.log('Step 2: Testing access code login...');
    const response = await axios.post(
      `${apiUrl}/api/auth/admin/access-code`,
      { accessCode },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        validateStatus: () => true // Don't throw on error status
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log('\n✅ SUCCESS! Access code is VALID and working!\n');
      console.log('Response:');
      console.log('  Status:', response.status);
      console.log('  User:', response.data.data.user.name);
      console.log('  Email:', response.data.data.user.email);
      console.log('  Role:', response.data.data.user.role);
      console.log('  Active:', response.data.data.user.isActive);
      console.log('  Token:', response.data.data.token.substring(0, 50) + '...');
      console.log('\n✓ You can use this access code to login!');
      console.log('  Login URL: http://localhost:5173/admin/login\n');
    } else {
      console.log('\n❌ FAILED! Access code is INVALID\n');
      console.log('Response:');
      console.log('  Status:', response.status);
      console.log('  Message:', response.data.message || 'Unknown error');
      
      if (response.data.message) {
        console.log('\nReason:');
        if (response.data.message.includes('Invalid access code')) {
          console.log('  ✗ Access code does not match any administrator');
          console.log('  ✗ OR administrator account is inactive');
          console.log('\nSolutions:');
          console.log('  1. Generate a new access code:');
          console.log('     npm run reset-access-code');
          console.log('  2. Check if account is active in MongoDB');
          console.log('  3. Verify you copied the access code correctly (12 chars)');
        } else if (response.data.message.includes('validation')) {
          console.log('  ✗ Access code format is invalid');
          console.log('  ✗ Must be exactly 12 alphanumeric characters');
        } else {
          console.log(' ', response.data.message);
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error occurred during test:\n');
    if (error.code === 'ECONNREFUSED') {
      console.error('  Backend is not running');
      console.error('\n  Start the backend with:');
      console.error('    cd energy-monitoring-system');
      console.error('    npm run start:dev\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('  Request timed out');
      console.error('  Backend might be slow or not responding\n');
    } else {
      console.error('  ' + error.message);
      if (error.response) {
        console.error('\n  Response:');
        console.error('    Status:', error.response.status);
        console.error('    Data:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('');
    }
    process.exit(1);
  }
}

testAccessCode();
