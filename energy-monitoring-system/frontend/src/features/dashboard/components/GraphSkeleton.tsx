/**
 * Graph Skeleton Component
 * 
 * Loading skeleton fallback for MiniTrendGraph when using lazy loading.
 * Displays a shimmer animation matching the graph dimensions.
 * 
 * Visual Design:
 * - Matches MiniTrendGraph height (default 100px)
 * - Shimmer animation for loading state
 * - Simple rectangular shape
 * 
 * Usage:
 * - Used as Suspense fallback for lazy-loaded MiniTrendGraph
 * 
 * Requirements: 20.7
 * 
 * @component
 * @example
 * ```tsx
 * <Suspense fallback={<GraphSkeleton height={100} />}>
 *   <MiniTrendGraph data={data} />
 * </Suspense>
 * ```
 */

import React from 'react';

interface GraphSkeletonProps {
  height?: number;
}

/**
 * GraphSkeleton Component
 * 
 * Loading placeholder for MiniTrendGraph.
 */
export const GraphSkeleton: React.FC<GraphSkeletonProps> = ({ 
  height = 100 
}) => {
  return (
    <div
      className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded"
      style={{ 
        height,
        width: '100%'
      }}
      aria-label="Loading graph"
    />
  );
};
