/**
 * Lazy-loaded MiniTrendGraph Example
 * 
 * Demonstrates proper usage of the lazy-loaded MiniTrendGraph component
 * with Suspense boundary and GraphSkeleton fallback.
 * 
 * This example shows the complete pattern for implementing lazy loading
 * as required by Requirement 20.7.
 * 
 * Requirements: 20.7
 */

import { Suspense } from 'react';
import { MiniTrendGraphLazy } from './MiniTrendGraph.lazy';
import { GraphSkeleton } from './GraphSkeleton';
import type { TrendDataPoint } from '../types/hero-dashboard.types';

/**
 * Example component showing lazy-loaded MiniTrendGraph usage
 */
export function MiniTrendGraphLazyExample() {
  // Sample data for demonstration
  const sampleData: TrendDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
    value: Math.random() * 10 + 20
  }));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">
          Lazy-loaded MiniTrendGraph Examples
        </h1>
        <p className="text-gray-600 mb-4">
          Demonstrates React.lazy() with Suspense boundary for performance optimization
        </p>
      </div>

      {/* Example 1: Basic lazy loading */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Basic Lazy Loading</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <Suspense fallback={<GraphSkeleton height={100} />}>
            <MiniTrendGraphLazy
              data={sampleData}
              height={100}
              accentColor="#3ED98A"
            />
          </Suspense>
        </div>
      </div>

      {/* Example 2: Custom height with lazy loading */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Custom Height (150px)</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <Suspense fallback={<GraphSkeleton height={150} />}>
            <MiniTrendGraphLazy
              data={sampleData}
              height={150}
              accentColor="#3ED98A"
            />
          </Suspense>
        </div>
      </div>

      {/* Example 3: Multiple lazy graphs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Multiple Lazy Graphs</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="text-sm font-medium mb-2">Green</h3>
            <Suspense fallback={<GraphSkeleton height={100} />}>
              <MiniTrendGraphLazy
                data={sampleData}
                height={100}
                accentColor="#3ED98A"
              />
            </Suspense>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="text-sm font-medium mb-2">Blue</h3>
            <Suspense fallback={<GraphSkeleton height={100} />}>
              <MiniTrendGraphLazy
                data={sampleData}
                height={100}
                accentColor="#3B82F6"
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Example 4: Inside a card (simulating HeroEnergyCard usage) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          In Hero Card Context (Production Pattern)
        </h2>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border">
          <div className="mb-4">
            <span className="text-sm uppercase text-gray-500">
              Today's Energy Generated
            </span>
          </div>
          <div className="mb-2">
            <span className="text-6xl font-bold" style={{ color: '#3ED98A' }}>
              24.7
            </span>
            <span className="text-2xl text-gray-400 ml-2">kWh</span>
          </div>
          <div className="mb-6 text-sm" style={{ color: '#3ED98A' }}>
            ↑ 12.5% vs yesterday
          </div>
          
          {/* This is where the lazy-loaded graph appears in production */}
          <div className="mt-4">
            <Suspense fallback={<GraphSkeleton height={100} />}>
              <MiniTrendGraphLazy
                data={sampleData}
                height={100}
                accentColor="#3ED98A"
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Technical Notes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h3 className="font-semibold mb-2">Implementation Notes:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>Component is wrapped with React.lazy() for code splitting</li>
          <li>Suspense boundary provides fallback during load</li>
          <li>GraphSkeleton matches graph dimensions for smooth transition</li>
          <li>Improves initial page load performance by deferring graph library</li>
          <li>Recharts library (~100KB) only loads when graph is needed</li>
        </ul>
      </div>
    </div>
  );
}
