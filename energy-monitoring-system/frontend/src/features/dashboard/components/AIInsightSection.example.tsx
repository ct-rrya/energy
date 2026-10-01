/**
 * AIInsightSection Component Examples
 * 
 * This file demonstrates various usage patterns for the AIInsightSection component.
 * These examples show different states and configurations.
 */

import { AIInsightSection } from './AIInsightSection';
import { ThemeProvider } from '@/contexts/ThemeContext';

/**
 * Example 1: Basic Usage with Professional Insight
 */
export function BasicInsightExample() {
  return (
    <ThemeProvider>
      <div className="w-full max-w-2xl p-6 bg-white dark:bg-[#1C1F28] rounded-lg">
        <AIInsightSection
          insight="Peak generation at 2pm today, 15% above average"
          isLoading={false}
          maxLength={150}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 2: Loading State
 */
export function LoadingStateExample() {
  return (
    <ThemeProvider>
      <div className="w-full max-w-2xl p-6 bg-white dark:bg-[#1C1F28] rounded-lg">
        <AIInsightSection
          insight={undefined}
          isLoading={true}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 3: No Data State
 */
export function NoDataExample() {
  return (
    <ThemeProvider>
      <div className="w-full max-w-2xl p-6 bg-white dark:bg-[#1C1F28] rounded-lg">
        <AIInsightSection
          insight={undefined}
          isLoading={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 4: Long Insight with Truncation
 */
export function TruncatedInsightExample() {
  const longInsight = 
    'Energy output has been exceptionally stable throughout the day with ' +
    'consistent generation patterns observed across all monitoring points. ' +
    'This indicates optimal system performance.';

  return (
    <ThemeProvider>
      <div className="w-full max-w-2xl p-6 bg-white dark:bg-[#1C1F28] rounded-lg">
        <AIInsightSection
          insight={longInsight}
          isLoading={false}
          maxLength={80}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 5: Various Professional Insights
 */
export function VariousInsightsExample() {
  const insights = [
    'Peak generation at 2pm today, 15% above average',
    'Energy output steady across morning hours',
    'Voltage levels optimal throughout the day',
    'Current readings within normal operating range',
    'Step activity increased 23% compared to yesterday',
  ];

  return (
    <ThemeProvider>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className="w-full max-w-2xl p-6 bg-white dark:bg-[#1C1F28] rounded-lg"
          >
            <AIInsightSection
              insight={insight}
              isLoading={false}
            />
          </div>
        ))}
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 6: Integration with Hero Energy Card Context
 */
export function HeroCardIntegrationExample() {
  return (
    <ThemeProvider>
      <div className="w-full max-w-4xl p-8 bg-white dark:bg-[#1C1F28] rounded-xl">
        {/* Energy Value Display */}
        <div className="mb-4">
          <p className="text-[13px] uppercase tracking-wide text-gray-500">
            Today's Energy Generated
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span 
              className="text-[56px] sm:text-[64px] lg:text-[72px]" 
              style={{ color: '#3ED98A', fontVariantNumeric: 'tabular-nums' }}
            >
              24.7
            </span>
            <span className="text-[24px] sm:text-[28px] lg:text-[32px] text-gray-500">
              kWh
            </span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: '#3ED98A' }}>↑</span>
          <span className="text-[15px] font-medium" style={{ color: '#3ED98A' }}>
            12.5% vs yesterday
          </span>
        </div>

        {/* Mini Trend Graph Placeholder */}
        <div className="h-24 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-sm text-gray-400">Mini Trend Graph</span>
        </div>

        {/* AI Insight Section */}
        <AIInsightSection
          insight="Peak generation at 2pm today, 15% above average"
          isLoading={false}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Example 7: Dark Mode Comparison
 */
export function DarkModeComparisonExample() {
  const insight = "Energy output steady across morning hours";

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Light Mode */}
      <ThemeProvider>
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Light Mode</h3>
          <AIInsightSection
            insight={insight}
            isLoading={false}
          />
        </div>
      </ThemeProvider>

      {/* Dark Mode */}
      <ThemeProvider>
        <div className="p-6 bg-[#1C1F28] rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Dark Mode</h3>
          <div className="dark">
            <AIInsightSection
              insight={insight}
              isLoading={false}
            />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}

/**
 * Example 8: Responsive Typography Demonstration
 */
export function ResponsiveTypographyExample() {
  return (
    <ThemeProvider>
      <div className="space-y-8">
        {/* Mobile */}
        <div className="w-[375px] p-6 bg-white dark:bg-[#1C1F28] rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Mobile (375px)</p>
          <AIInsightSection
            insight="Peak generation at 2pm today, 15% above average"
            isLoading={false}
          />
        </div>

        {/* Tablet */}
        <div className="w-[768px] p-6 bg-white dark:bg-[#1C1F28] rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Tablet (768px)</p>
          <AIInsightSection
            insight="Peak generation at 2pm today, 15% above average"
            isLoading={false}
          />
        </div>

        {/* Desktop */}
        <div className="w-[1024px] p-6 bg-white dark:bg-[#1C1F28] rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Desktop (1024px+)</p>
          <AIInsightSection
            insight="Peak generation at 2pm today, 15% above average"
            isLoading={false}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
