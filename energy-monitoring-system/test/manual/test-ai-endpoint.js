/**
 * Test Script for AI Insight Endpoint
 * 
 * This script tests the /api/dashboard/metrics endpoint
 * to verify AI insights are being generated.
 */

const axios = require('axios');

async function testAIInsight() {
  try {
    console.log('Testing /api/dashboard/metrics endpoint...\n');
    
    const response = await axios.get('http://localhost:3000/api/dashboard/metrics');
    
    console.log('✅ Response received');
    console.log('Status:', response.status);
    console.log('\nResponse data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data?.data?.aiInsight) {
      console.log('\n✅ AI Insight found:');
      console.log('"' + response.data.data.aiInsight + '"');
    } else {
      console.log('\n❌ No AI insight in response');
      console.log('aiInsight value:', response.data?.data?.aiInsight);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAIInsight();
