/**
 * MetricCard Component
 * 
 * Displays a single metric (voltage, current, power, or energy) in a card format.
 * Handles loading, error, null, and zero states distinctly.
 * 
 * Key behaviors:
 * - Null/undefined: displays '--' (data not available)
 * - Zero: displays '0.0' (genuine zero reading)
 * - Loading: shows skeleton placeholder
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface MetricCardProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  precision?: number;
  color?: 'green' | 'blue' | 'amber';
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  precision = 1,
  color = 'green',
  isLoading = false,
}) => {
  const accentColor = getAccentColor(color);

  const formattedValue = formatValue(value, precision);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : (
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: accentColor }]}>
            {formattedValue}
          </Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Format value based on whether it's null, zero, or a number
 */
function formatValue(value: number | null | undefined, precision: number): string {
  // Null or undefined: data not available
  if (value === null || value === undefined) {
    return '--';
  }
  
  // Zero or any number: format with precision
  return value.toFixed(precision);
}

/**
 * Get accent color based on color prop
 */
function getAccentColor(color: 'green' | 'blue' | 'amber'): string {
  switch (color) {
    case 'green':
      return '#2FBF71'; // EcoStep primary green
    case 'blue':
      return '#3B82F6'; // Blue
    case 'amber':
      return '#F59E0B'; // Amber
    default:
      return '#2FBF71';
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 8,
  },
  unit: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
});

export default MetricCard;
