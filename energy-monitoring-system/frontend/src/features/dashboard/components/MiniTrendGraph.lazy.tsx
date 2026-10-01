/**
 * Lazy-loaded MiniTrendGraph Component
 * 
 * This file provides a lazy-loaded version of the MiniTrendGraph component
 * using React.lazy() for code splitting and improved performance.
 * 
 * Usage:
 * Import this instead of the regular MiniTrendGraph when lazy loading is desired.
 * Must be wrapped in a Suspense boundary with GraphSkeleton as fallback.
 * 
 * Requirements: 20.7
 * 
 * @example
 * ```tsx
 * import { Suspense } from 'react';
 * import { MiniTrendGraphLazy } from './MiniTrendGraph.lazy';
 * import { GraphSkeleton } from './GraphSkeleton';
 * 
 * function MyComponent() {
 *   return (
 *     <Suspense fallback={<GraphSkeleton height={100} />}>
 *       <MiniTrendGraphLazy data={data} height={100} />
 *     </Suspense>
 *   );
 * }
 * ```
 */

import { lazy } from 'react';

/**
 * Lazy-loaded MiniTrendGraph component
 * 
 * Dynamically imports the MiniTrendGraph component for code splitting.
 * Requires Suspense boundary in parent component.
 */
export const MiniTrendGraphLazy = lazy(() =>
  import('./MiniTrendGraph').then(module => ({
    default: module.MiniTrendGraph
  }))
);
