/**
 * ESP32 Sensor Registration Script
 * 
 * Registers an ESP32 sensor in the database and returns the API key.
 * Run this to get your API key for ESP32 authentication.
 * 
 * Usage: node register-esp32-sensor.js
 */

const http = require('http');

// Configuration
const API_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'applesixtawsan@gmail.com';
const ADMIN_ACCESS_CODE = 'MAN-VJ1-CSS-4RO';

console.log('════════════════════════════════════════════════════════');
console.log('ESP32 Sensor Registration');
console.log('════════════════════════════════════════════════════════\n');

// Step 1: Login to get JWT token
function login() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      email: ADMIN_EMAIL,
      accessCode: ADMIN_ACCESS_CODE
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('[1/2] Logging in as admin...');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const response = JSON.parse(data);
          console.log('  ✅ Login successful\n');
          resolve(response.accessToken);
        } else {
          console.error(`  ❌ Login failed (${res.statusCode})`);
          console.error('  Response:', data);
          reject(new Error('Login failed'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('  ❌ Login request failed:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Step 2: Create sensor
function createSensor(token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      name: 'ESP32 Piezo Sensor',
      deviceId: 'ESP32_PIEZO_001',
      type: 'piezoelectric',
      location: 'Lab Testing',
      description: 'Piezoelectric footstep energy harvesting sensor for development and testing',
      isActive: true
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sensors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('[2/2] Creating ESP32 sensor...');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const sensor = JSON.parse(data);
          console.log('  ✅ Sensor created successfully!\n');
          resolve(sensor);
        } else if (res.statusCode === 409) {
          console.log('  ⚠️  Sensor already exists, fetching existing sensor...\n');
          // Sensor already exists, try to get it
          getSensorByDeviceId(token, 'ESP32_PIEZO_001')
            .then(resolve)
            .catch(reject);
        } else {
          console.error(`  ❌ Sensor creation failed (${res.statusCode})`);
          console.error('  Response:', data);
          reject(new Error('Sensor creation failed'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('  ❌ Create sensor request failed:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Helper: Get sensor by device ID
function getSensorByDeviceId(token, deviceId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/sensors?deviceId=${deviceId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          if (response.data && response.data.length > 0) {
            console.log('  ✅ Found existing sensor\n');
            resolve(response.data[0]);
          } else {
            reject(new Error('Sensor not found'));
          }
        } else {
          reject(new Error('Failed to fetch sensor'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Main execution
async function main() {
  try {
    // Step 1: Login
    const token = await login();

    // Step 2: Create sensor
    const sensor = await createSensor(token);

    // Display results
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ SUCCESS! ESP32 Sensor Registered');
    console.log('════════════════════════════════════════════════════════\n');

    console.log('Sensor Details:');
    console.log(`  Name:      ${sensor.name}`);
    console.log(`  Device ID: ${sensor.deviceId}`);
    console.log(`  Type:      ${sensor.type}`);
    console.log(`  Location:  ${sensor.location}`);
    console.log(`  Active:    ${sensor.isActive ? 'Yes' : 'No'}`);
    console.log('');

    console.log('════════════════════════════════════════════════════════');
    console.log('🔑 YOUR API KEY (Copy this!)');
    console.log('════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  ${sensor.apiKey}`);
    console.log('');
    console.log('════════════════════════════════════════════════════════\n');

    console.log('Update your ESP32 code:');
    console.log('');
    console.log('const char* API_KEY = "' + sensor.apiKey + '";');
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('Next Steps:');
    console.log('════════════════════════════════════════════════════════');
    console.log('1. Copy the API key above');
    console.log('2. Update ESP32 code with the API key');
    console.log('3. Update API URL to: http://192.168.101.20:3000/api/iot/piezo/readings');
    console.log('4. Upload code to ESP32');
    console.log('5. Test connection - should get HTTP 201 Created\n');

  } catch (error) {
    console.error('\n════════════════════════════════════════════════════════');
    console.error('❌ ERROR');
    console.error('════════════════════════════════════════════════════════\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Backend server is not running!\n');
      console.error('Start the backend first:');
      console.error('  cd energy-monitoring-system');
      console.error('  npm run start:dev\n');
    } else {
      console.error('Error:', error.message);
      console.error('');
      console.error('Troubleshooting:');
      console.error('1. Make sure backend is running (npm run start:dev)');
      console.error('2. Check admin credentials are correct');
      console.error('3. Verify MongoDB is connected\n');
    }
    
    process.exit(1);
  }
}

// Run the script
main();
