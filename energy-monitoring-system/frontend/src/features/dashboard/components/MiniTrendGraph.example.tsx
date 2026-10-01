/**
 * MiniTrendGraph Example
 * 
 * Example usage of the MiniTrendGraph component showing different states.
 */

import { MiniTrendGraph } from './MiniTrendGraph';
import type { TrendDataPoint } from '../types/hero-dashboard.types';

// Sample data for the last 24 hours
const generateSampleData = (): TrendDataPoint[] => {
  const now = new Date();
  const data: TrendDataPoint[] = [];
  
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    // Simulate energy values with some variance
    const value = 2.5 + Math.sin(i / 4) * 1.2 + Math.random() * 0.3;
    data.push({
      timestamp: timestamp.toISOString(),
      value: parseFloat(value.toFixed(2))
    });
  }
  
  return data;
};

export function MiniTrendGraphExamples() {
  const sampleData = generateSampleData();
  const insufficientData: TrendDataPoint[] = [
    { timestamp: new Date().toISOString(), value: 2.3 }
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Normal Graph (24 hours of data)</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <MiniTrendGraph
            data={sampleData}
            height={100}
            showAxes={false}
            accentColor="#3ED98A"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Insufficient Data</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <MiniTrendGraph
            data={insufficientData}
            height={100}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Custom Height (150px)</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <MiniTrendGraph
            data={sampleData}
            height={150}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Custom Accent Color (Blue)</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <MiniTrendGraph
            data={sampleData}
            height={100}
            accentColor="#3B82F6"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Empty Data</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <MiniTrendGraph
            data={[]}
            height={100}
          />
        </div>
      </div>
    </div>
  );
}
