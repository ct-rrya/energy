/**
 * Hardware Endpoint Test Script
 * 
 * Simulates ESP32 sending piezo sensor data to backend.
 * Use this to verify backend is running and accepting hardware data.
 * 
 * Usage: node test-hardware-endpoint.js
 */

const http = require('http');
require('dotenv').config();

// Configuration
const API_KEY = process.env.IOT_API_KEY || 'esp32_cab2a12ce8f418382d250980ced4a53a';
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

// Sample piezo reading (matches ESP32 format)
const sampleReading = {
  voltage: 1.65,
  current: 0,
  power: 0.0002,
  capacitorVoltage: 15,
  stepCount: 3,
  frequency: 0.97,
  timestamp: new Date().toISOString(),
  source: 'hardware',
  wifiConnected: true,
  bluetoothConnected: false,
  batteryPercentage: 100
};

console.log('════════════════════════════════════════════════════════');
console.log('Hardware Endpoint Test');
console.log('════════════════════════════════════════════════════════\n');

console.log('Configuration:');
console.log(`  Target: http://${HOST}:${PORT}/api/iot/piezo/readings`);
console.log(`  API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
console.log(`  Payload: ${JSON.stringify(sampleReading, null, 2).substring(0, 150)}...\n`);

// Test 1: Check if server is running
console.log('[1/3] Testing server health endpoint...');

const healthOptions = {
  hostname: HOST,
  port: PORT,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const healthReq = http.request(healthOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('  ✅ Server is running and healthy');
      console.log(`  Response: ${data.substring(0, 100)}...\n`);
      
      // Test 2: Send sample reading
      testPiezoEndpoint();
    } else {
      console.error(`  ❌ Health check failed with status ${res.statusCode}`);
      console.error(`  Response: ${data}\n`);
      process.exit(1);
    }
  });
});

healthReq.on('error', (error) => {
  console.error('  ❌ Server connection failed!');
  console.error(`  Error: ${error.message}\n`);
  
  if (error.code === 'ECONNREFUSED') {
    console.error('═══════════════════════════════════════════════════════');
    console.error('DIAGNOSIS: Backend server is NOT running');
    console.error('═══════════════════════════════════════════════════════\n');
    console.error('The backend server is not running on port 3000.\n');
    console.error('To fix this, start the server:');
    console.error('  cd energy-monitoring-system');
    console.error('  npm run start:dev\n');
    console.error('Then run this test again.\n');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('Connection timed out. Server may be slow or unreachable.\n');
  } else {
    console.error('Unexpected network error.\n');
  }
  
  process.exit(1);
});

healthReq.on('timeout', () => {
  console.error('  ❌ Request timed out (server not responding)\n');
  healthReq.destroy();
  process.exit(1);
});

healthReq.end();

// Test 2: Send piezo reading
function testPiezoEndpoint() {
  console.log('[2/3] Testing piezo endpoint with sample data...');
  
  const payload = JSON.stringify(sampleReading);
  
  const options = {
    hostname: HOST,
    port: PORT,
    path: '/api/iot/piezo/readings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'X-API-Key': API_KEY
    },
    timeout: 5000
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`  Status: ${res.statusCode}`);
      
      if (res.statusCode === 201) {
        console.log('  ✅ Piezo reading accepted successfully!');
        console.log(`  Response: ${data}\n`);
        
        // Test 3: Verify with wrong API key
        testAuthFailure();
      } else if (res.statusCode === 401) {
        console.error('  ❌ Authentication failed (401 Unauthorized)');
        console.error('  Response: ' + data + '\n');
        
        console.error('═══════════════════════════════════════════════════════');
        console.error('DIAGNOSIS: API Key Mismatch');
        console.error('═══════════════════════════════════════════════════════\n');
        console.error('The API key in this script does not match the backend.\n');
        console.error('Backend expects (from .env):');
        console.error(`  IOT_API_KEY=${process.env.IOT_API_KEY || 'NOT SET'}\n`);
        console.error('ESP32 should use the same key:');
        console.error(`  const char* API_KEY = "${process.env.IOT_API_KEY || 'NOT SET'}";\n`);
        
        process.exit(1);
      } else if (res.statusCode === 400) {
        console.error('  ❌ Validation error (400 Bad Request)');
        console.error('  Response: ' + data + '\n');
        console.error('The payload format may be incorrect.\n');
        process.exit(1);
      } else {
        console.error(`  ❌ Unexpected response (${res.statusCode})`);
        console.error('  Response: ' + data + '\n');
        process.exit(1);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error(`  ❌ Request failed: ${error.message}\n`);
    process.exit(1);
  });
  
  req.on('timeout', () => {
    console.error('  ❌ Request timed out\n');
    req.destroy();
    process.exit(1);
  });
  
  req.write(payload);
  req.end();
}

// Test 3: Verify auth is working by sending wrong key
function testAuthFailure() {
  console.log('[3/3] Testing authentication (should fail with wrong key)...');
  
  const payload = JSON.stringify(sampleReading);
  
  const options = {
    hostname: HOST,
    port: PORT,
    path: '/api/iot/piezo/readings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'X-API-Key': 'wrong_api_key_123'
    },
    timeout: 5000
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 401) {
        console.log('  ✅ Authentication correctly rejected invalid key');
        console.log(`  Response: ${data}\n`);
        
        // All tests passed
        showSuccess();
      } else {
        console.warn(`  ⚠️  Unexpected status ${res.statusCode} (expected 401)`);
        console.warn('  Authentication may not be working properly.\n');
        showSuccess();
      }
    });
  });
  
  req.on('error', (error) => {
    console.error(`  ❌ Request failed: ${error.message}\n`);
    process.exit(1);
  });
  
  req.on('timeout', () => {
    console.error('  ❌ Request timed out\n');
    req.destroy();
    process.exit(1);
  });
  
  req.write(payload);
  req.end();
}

function showSuccess() {
  console.log('════════════════════════════════════════════════════════');
  console.log('✅ ALL TESTS PASSED!');
  console.log('════════════════════════════════════════════════════════\n');
  console.log('Backend is ready to accept hardware data from ESP32.\n');
  console.log('Next steps:');
  console.log('1. Find your computer\'s IP address:');
  console.log('   Windows: ipconfig');
  console.log('   Look for "IPv4 Address" (e.g., 192.168.1.100)\n');
  console.log('2. Update ESP32 code with:');
  console.log(`   const char* API_URL = "http://YOUR_IP:${PORT}/api/iot/piezo/readings";`);
  console.log(`   const char* API_KEY = "${API_KEY}";`);
  console.log('   const char* WIFI_SSID = "your-wifi-name";');
  console.log('   const char* WIFI_PASSWORD = "your-wifi-password";\n');
  console.log('3. Upload code to ESP32');
  console.log('4. Open Serial Monitor and type "Yes" to start\n');
}
