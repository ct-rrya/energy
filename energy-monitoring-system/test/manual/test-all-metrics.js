const axios = require('axios');

async function testAllMetrics() {
  const metrics = ['power', 'voltage', 'current', 'energy', 'steps'];
  
  for (const metric of metrics) {
    try {
      const response = await axios.get('http://localhost:3000/api/analytics/time-series', {
        params: {
          metric,
          granularity: 'hour',
          startDate: '2026-10-09',
          endDate: '2026-10-16',
          source: 'hardware'
        }
      });
      
      const dp = response.data.dataPoints[0];
      if (dp) {
        console.log(`✅ ${metric.toUpperCase()}: ${dp.value} ${response.data.unit}`);
      } else {
        console.log(`❌ ${metric.toUpperCase()}: No data`);
      }
    } catch (error) {
      console.error(`❌ ${metric.toUpperCase()}: ${error.message}`);
    }
  }
}

testAllMetrics();
