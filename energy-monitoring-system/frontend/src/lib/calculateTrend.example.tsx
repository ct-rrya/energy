/**
 * Example usage of calculateTrend utility
 * This file demonstrates how to use the calculateTrend function in React components
 */

import React from 'react';
import { calculateTrend } from './calculateTrend';

/**
 * Example 1: Basic usage in a component
 */
export function EnergyTrendExample() {
  const currentEnergy = 24.7; // kWh today
  const previousEnergy = 22.0; // kWh yesterday
  
  const trend = calculateTrend(currentEnergy, previousEnergy);
  
  return (
    <div className="energy-trend">
      <div 
        className="trend-indicator"
        style={{ color: trend.color }}
      >
        <span className="trend-icon">{trend.icon}</span>
        <span className="trend-label">{trend.label}</span>
      </div>
    </div>
  );
}

/**
 * Example 2: Handling undefined values
 */
export function SafeTrendExample() {
  const currentValue: number | undefined = undefined;
  const previousValue = 100;
  
  const trend = calculateTrend(currentValue, previousValue);
  
  // trend.direction will be 'no-data'
  // trend.label will be 'No comparison data'
  
  return (
    <div style={{ color: trend.color }}>
      {trend.label}
    </div>
  );
}

/**
 * Example 3: Using with useMemo for performance
 */
export function OptimizedTrendExample({ 
  current, 
  previous 
}: { 
  current: number | undefined; 
  previous: number | undefined;
}) {
  // Memoize the trend calculation to prevent recalculation on every render
  const trend = React.useMemo(() => {
    return calculateTrend(current, previous);
  }, [current, previous]);
  
  return (
    <div className="trend" style={{ color: trend.color }}>
      {trend.label}
    </div>
  );
}

/**
 * Example 4: Complete hero card usage
 */
export function HeroCardTrendExample() {
  const energyValue = 24.7;
  const previousDayEnergy = 22.0;
  
  const trend = calculateTrend(energyValue, previousDayEnergy);
  
  return (
    <div className="hero-card">
      <h3>Today's Energy Generated</h3>
      <div className="energy-value">
        <span className="value">{energyValue.toFixed(1)}</span>
        <span className="unit">kWh</span>
      </div>
      
      <div 
        className="trend-indicator"
        style={{ 
          color: trend.color,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px'
        }}
      >
        {trend.icon}
        <span className="trend-label">{trend.label}</span>
      </div>
    </div>
  );
}

/**
 * Example 5: Conditional styling based on trend direction
 */
export function ConditionalTrendExample({ 
  current, 
  previous 
}: { 
  current: number | undefined; 
  previous: number | undefined;
}) {
  const trend = calculateTrend(current, previous);
  
  // Apply different styles based on trend direction
  const getBackgroundColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'rgba(62, 217, 138, 0.1)'; // Light green
      case 'down':
        return 'rgba(245, 158, 11, 0.1)'; // Light amber
      case 'neutral':
        return 'rgba(156, 163, 175, 0.1)'; // Light gray
      case 'no-data':
        return 'transparent';
      default:
        return 'transparent';
    }
  };
  
  return (
    <div 
      className="trend-badge"
      style={{
        backgroundColor: getBackgroundColor(),
        color: trend.color,
        padding: '8px 16px',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {trend.icon}
      <span>{trend.percentage.toFixed(1)}%</span>
    </div>
  );
}
