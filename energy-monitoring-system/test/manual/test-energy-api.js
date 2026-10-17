const axios = require('axios');

async function testEnergy() {
  try {
    const response = await axios.get('http://localhost:3000/api/analytics/time-series', {
      params: {
        metric: 'energy',
        granularity: 'hour',
        startDate: '2026-10-09',
        endDate: '2026-10-16',
        source: 'hardware'
      }
    });
    
    console.log('\n📊 Energy Time Series Response:\n');
    console.log('Data Points:', response.data.dataPoints.length);
    console.log('\nFirst 3 data points:');
    response.data.dataPoints.slice(0, 3).forEach(dp => {
      console.log(`  ${dp.timestamp}: ${dp.value} ${response.data.unit}`);
      console.log(`    Min/Max: ${dp.min} / ${dp.max}`);
      console.log(`    Count: ${dp.count}`);
    });
    console.log('\nSummary:', JSON.stringify(response.data.summary, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEnergy();
