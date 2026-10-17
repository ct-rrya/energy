/**
 * Test Analytics API Endpoints
 * 
 * This script tests if the analytics endpoints are working correctly
 * and returning data for the date range where MongoDB has readings.
 * 
 * Usage: node test-analytics-api.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Your data is from Oct 13, 2026
const START_DATE = '2026-10-09'; // Few days before
const END_DATE = '2026-10-16';   // Few days after

const METRICS = ['power', 'voltage', 'current', 'energy', 'steps'];

async function testEndpoint(metric, granularity = 'hour') {
  console.log(`\n📊 Testing ${metric} with ${granularity} granularity...`);
  
  try {
    const url = `${API_BASE_URL}/analytics/time-series`;
    const params = {
      metric,
      granularity,
      startDate: START_DATE,
      endDate: END_DATE,
      source: 'hardware'
    };
    
    console.log(`   URL: ${url}`);
    console.log(`   Params:`, JSON.stringify(params, null, 2));
    
    const response = await axios.get(url, { params });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📈 Data points: ${response.data.dataPoints?.length || 0}`);
    
    if (response.data.dataPoints && response.data.dataPoints.length > 0) {
      const first = response.data.dataPoints[0];
      const last = response.data.dataPoints[response.data.dataPoints.length - 1];
      
      console.log(`   📅 First: ${first.timestamp} - ${first.value} ${response.data.unit}`);
      console.log(`   📅 Last: ${last.timestamp} - ${last.value} ${response.data.unit}`);
      console.log(`   📊 Summary:`, JSON.stringify(response.data.summary, null, 2));
    } else {
      console.log(`   ⚠️  No data points returned!`);
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`   ❌ Error ${error.response.status}: ${error.response.statusText}`);
      console.error(`   Response:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`   ❌ Error: ${error.message}`);
    }
    return null;
  }
}

async function testRawReadings() {
  console.log(`\n📋 Testing raw readings endpoint...`);
  
  try {
    const url = `${API_BASE_URL}/energy/readings`;
    const params = {
      startDate: START_DATE,
      endDate: END_DATE,
      limit: 10
    };
    
    console.log(`   URL: ${url}`);
    console.log(`   Params:`, JSON.stringify(params, null, 2));
    
    const response = await axios.get(url, { params });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📈 Readings: ${response.data.length || 0}`);
    
    if (response.data.length > 0) {
      const reading = response.data[0];
      console.log(`   📅 Sample reading:`);
      console.log(`      Timestamp: ${reading.timestamp}`);
      console.log(`      Voltage: ${reading.voltage} V`);
      console.log(`      Current: ${reading.current} A (${(reading.current * 1000).toFixed(1)} mA)`);
      console.log(`      Power: ${reading.power} W`);
      console.log(`      Energy: ${reading.energy} mWh`);
      console.log(`      Steps: ${reading.stepCount}`);
    } else {
      console.log(`   ⚠️  No readings returned!`);
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`   ❌ Error ${error.response.status}: ${error.response.statusText}`);
    } else {
      console.error(`   ❌ Error: ${error.message}`);
    }
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing EcoStep Analytics API');
  console.log('================================\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Date Range: ${START_DATE} to ${END_DATE}`);
  console.log(`Expected: Data from Oct 13, 2026\n`);
  
  // Test raw readings first
  const rawData = await testRawReadings();
  
  if (!rawData || rawData.length === 0) {
    console.log('\n❌ No raw readings found! Charts will be empty.');
    console.log('\nPossible issues:');
    console.log('  1. MongoDB has no data for this date range');
    console.log('  2. Backend is not running');
    console.log('  3. Date format mismatch');
    console.log('  4. Source filter excluding data');
    return;
  }
  
  console.log('\n✅ Raw readings found! Testing aggregated endpoints...\n');
  
  // Test each metric
  for (const metric of METRICS) {
    await testEndpoint(metric, 'hour');
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between requests
  }
  
  console.log('\n================================');
  console.log('✨ Tests complete!');
  console.log('\nIf you see data points above, the backend is working correctly.');
  console.log('If charts are still empty in browser:');
  console.log('  1. Check browser console for errors');
  console.log('  2. Verify frontend is using correct API_BASE_URL');
  console.log('  3. Check date range selected in UI matches data range');
  console.log('  4. Clear browser cache and reload');
}

runTests().catch(console.error);
