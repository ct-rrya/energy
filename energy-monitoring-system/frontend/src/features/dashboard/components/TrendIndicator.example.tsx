/**
 * TrendIndicator Component Example
 * 
 * Demonstrates usage of the TrendIndicator component
 * with different scenarios.
 */

import { TrendIndicator } from './TrendIndicator';

export function TrendIndicatorExample() {
  return (
    <div className="space-y-6 p-8 bg-white dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-4">TrendIndicator Examples</h2>
      
      {/* Positive trend */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Positive Trend (12.3% increase)</h3>
        <TrendIndicator
          currentValue={24.7}
          previousValue={22.0}
          format="percentage"
          showIcon={true}
        />
      </div>

      {/* Negative trend */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Negative Trend (8.5% decrease)</h3>
        <TrendIndicator
          currentValue={20.5}
          previousValue={22.4}
          format="percentage"
          showIcon={true}
        />
      </div>

      {/* Neutral trend */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Neutral Trend (no change)</h3>
        <TrendIndicator
          currentValue={25.0}
          previousValue={25.0}
          format="percentage"
          showIcon={true}
        />
      </div>

      {/* No data */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">No Comparison Data</h3>
        <TrendIndicator
          currentValue={24.7}
          previousValue={undefined}
          format="percentage"
          showIcon={true}
        />
      </div>

      {/* Absolute format */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Absolute Difference Format</h3>
        <TrendIndicator
          currentValue={24.7}
          previousValue={22.0}
          format="absolute"
          showIcon={true}
        />
      </div>

      {/* Without icon */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Without Icon</h3>
        <TrendIndicator
          currentValue={24.7}
          previousValue={22.0}
          format="percentage"
          showIcon={false}
        />
      </div>
    </div>
  );
}
