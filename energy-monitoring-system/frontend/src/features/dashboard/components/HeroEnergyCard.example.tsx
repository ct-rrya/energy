/**
 * HeroEnergyCard Example
 * 
 * Visual examples demonstrating HeroEnergyCard component states.
 * 
 * Usage: Import and render in Storybook or example page
 */

import { HeroEnergyCard } from './HeroEnergyCard';
import { ThemeProvider } from '@/contexts/ThemeContext';
import type { TrendDataPoint } from '../types/hero-dashboard.types';

// Sample trend data for 24 hours
const generateMockTrendData = (): TrendDataPoint[] => {
  const data: TrendDataPoint[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (24 - i) * 60 * 60 * 1000);
    const baseValue = 20;
    const variation = Math.sin(i / 24 * Math.PI * 2) * 5; // Simulate daily pattern
    const randomNoise = (Math.random() - 0.5) * 2;
    
    data.push({
      timestamp: timestamp.toISOString(),
      value: baseValue + variation + randomNoise,
    });
  }
  
  return data;
};

const mockTrendData = generateMockTrendData();

/**
 * Example 1: Normal state with all data
 */
export function HeroEnergyCardNormalExample() {
  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Normal State</h2>
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation at 2pm today, 15% above average"
          isLoading={false}
          isError={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 2: Loading state
 */
export function HeroEnergyCardLoadingExample() {
  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Loading State</h2>
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={true}
          isError={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 3: Empty state (no data)
 */
export function HeroEnergyCardEmptyExample() {
  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Empty State</h2>
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={false}
          isError={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 4: Error state with retry
 */
export function HeroEnergyCardErrorExample() {
  const handleRetry = () => {
    console.log('Retry clicked');
    alert('Retry functionality triggered!');
  };

  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Error State</h2>
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={false}
          isError={true}
          onRetry={handleRetry}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 5: High energy value
 */
export function HeroEnergyCardHighValueExample() {
  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">High Energy Value</h2>
        <HeroEnergyCard
          energyValue={156.8}
          previousDayEnergy={145.2}
          trendData={mockTrendData}
          aiInsight="Exceptional performance today with record-breaking generation"
          isLoading={false}
          isError={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 6: Decreased energy (negative trend)
 */
export function HeroEnergyCardDecreasedExample() {
  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Decreased Energy</h2>
        <HeroEnergyCard
          energyValue={18.3}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Lower output due to reduced foot traffic during morning hours"
          isLoading={false}
          isError={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 7: No previous day data (no comparison)
 */
export function HeroEnergyCardNoComparisonExample() {
  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">No Comparison Data</h2>
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={undefined}
          trendData={mockTrendData}
          aiInsight="First day of operation - baseline data being established"
          isLoading={false}
          isError={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 8: Minimal trend data
 */
export function HeroEnergyCardMinimalTrendExample() {
  const minimalTrend: TrendDataPoint[] = [
    { timestamp: '2025-01-15T00:00:00Z', value: 20.5 },
  ];

  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Minimal Trend Data (Graph Hidden)</h2>
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={minimalTrend}
          aiInsight="Limited historical data available"
          isLoading={false}
          isError={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * All Examples in One View
 */
export function HeroEnergyCardAllExamples() {
  return (
    <ThemeProvider>
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold mb-8">HeroEnergyCard Examples</h1>
        
        <HeroEnergyCardNormalExample />
        <HeroEnergyCardLoadingExample />
        <HeroEnergyCardEmptyExample />
        <HeroEnergyCardErrorExample />
        <HeroEnergyCardHighValueExample />
        <HeroEnergyCardDecreasedExample />
        <HeroEnergyCardNoComparisonExample />
        <HeroEnergyCardMinimalTrendExample />
      </div>
    </ThemeProvider>
  );
}
