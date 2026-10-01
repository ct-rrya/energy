/**
 * Hero Card Skeleton Component
 * 
 * Loading skeleton for HeroEnergyCard component.
 * Displays animated placeholder during initial data fetch.
 * 
 * Visual Design:
 * - Shimmer animation with gradient
 * - Matches HeroEnergyCard dimensions and layout
 * - Gray placeholder blocks for all sections:
 *   - Label (200px width, 16px height)
 *   - Value (300px width, 72px height)
 *   - Trend (150px width, 20px height)
 *   - Graph (100% width, 100px height)
 *   - Insight (100% width, 40px height)
 * - Border radius: 4-8px per element
 * - Animation: 1.5s infinite shimmer
 * 
 * Animation:
 * ```css
 * @keyframes shimmer {
 *   0% { background-position: 200% 0; }
 *   100% { background-position: -200% 0; }
 * }
 * ```
 * 
 * Requirements: 17.3, 20.1
 * 
 * @component
 * @example
 * ```tsx
 * {isLoading ? (
 *   <HeroCardSkeleton />
 * ) : (
 *   <HeroEnergyCard {...props} />
 * )}
 * ```
 */

import React from 'react';

/**
 * HeroCardSkeleton Component
 * 
 * Loading placeholder for hero energy card.
 * 
 * Requirements:
 * - 17.3: Loading skeleton with shimmer animation
 * - 20.1: React.memo optimization
 */
export const HeroCardSkeleton = React.memo(function HeroCardSkeleton() {
  return (
    <div
      className="rounded-[12px] border animate-pulse"
      style={{
        minHeight: '350px',
        padding: '20px',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderColor: 'rgba(156, 163, 175, 0.2)',
      }}
    >
      <style>
        {`
          @media (min-width: 768px) {
            .hero-skeleton-container {
              padding: 24px !important;
              min-height: 400px !important;
            }
          }
          @media (min-width: 1024px) {
            .hero-skeleton-container {
              padding: 32px !important;
              min-height: 400px !important;
            }
          }
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .shimmer-effect {
            background: linear-gradient(
              90deg,
              rgba(156, 163, 175, 0.1) 0%,
              rgba(156, 163, 175, 0.2) 50%,
              rgba(156, 163, 175, 0.1) 100%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
        `}
      </style>
      <div className="hero-skeleton-container" style={{ padding: '20px', minHeight: '350px' }}>
        {/* Label skeleton - 200px width, 16px height */}
        <div
          className="shimmer-effect rounded mb-3"
          style={{
            width: '200px',
            height: '16px',
            backgroundColor: 'rgba(156, 163, 175, 0.2)',
          }}
        />

        {/* Value skeleton - 300px width, 72px height */}
        <div
          className="shimmer-effect rounded mb-3"
          style={{
            width: '300px',
            height: '72px',
            backgroundColor: 'rgba(156, 163, 175, 0.2)',
          }}
        />

        {/* Trend skeleton - 150px width, 20px height */}
        <div
          className="shimmer-effect rounded mb-4"
          style={{
            width: '150px',
            height: '20px',
            backgroundColor: 'rgba(156, 163, 175, 0.2)',
          }}
        />

        {/* Graph skeleton - 100% width, 100px height */}
        <div
          className="shimmer-effect rounded mb-4"
          style={{
            width: '100%',
            height: '100px',
            backgroundColor: 'rgba(156, 163, 175, 0.2)',
          }}
        />

        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid rgba(156, 163, 175, 0.2)',
            marginTop: '16px',
            paddingTop: '16px',
          }}
        >
          {/* Insight skeleton - 100% width, 40px height */}
          <div
            className="shimmer-effect rounded"
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: 'rgba(156, 163, 175, 0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
});
