/**
 * HeroEnergyCard Component
 * 
 * Large hero card displaying daily energy generation with optional AI insight.
 * This is the primary dashboard card highlighting the main metric.
 * 
 * Key behaviors:
 * - Displays daily energy in kWh with large, prominent typography
 * - Shows AI-generated insight when available
 * - Handles loading, error, and null states
 * - Provides retry mechanism for errors
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface HeroEnergyCardProps {
  energyValue: number | null | undefined;
  aiInsight?: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const HeroEnergyCard: React.FC<HeroEnergyCardProps> = ({
  energyValue,
  aiInsight,
  isLoading,
  isError,
  onRetry,
}) => {
  // Error state
  if (isError) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.errorTitle}>Failed to Load Energy Data</Text>
        <Text style={styles.errorMessage}>
          Unable to fetch today's energy information
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Daily Energy</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2FBF71" />
          <Text style={styles.loadingText}>Loading energy data...</Text>
        </View>
      </View>
    );
  }

  // Format energy value
  const formattedEnergy = formatEnergyValue(energyValue);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Daily Energy</Text>
      
      <View style={styles.energyContainer}>
        <Text style={styles.energyValue}>{formattedEnergy}</Text>
        <Text style={styles.energyUnit}>kWh</Text>
      </View>

      {aiInsight && (
        <View style={styles.insightContainer}>
          <Text style={styles.insightLabel}>AI Insight</Text>
          <Text style={styles.insightText}>{aiInsight}</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Format energy value, distinguishing null from zero
 */
function formatEnergyValue(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '--';
  }
  return value.toFixed(2);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 180,
  },
  errorCard: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A2947',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  energyContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  energyValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2FBF71',
    marginRight: 8,
  },
  energyUnit: {
    fontSize: 20,
    fontWeight: '500',
    color: '#6B7280',
  },
  insightContainer: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#2FBF71',
    padding: 12,
    borderRadius: 6,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#065F46',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#2FBF71',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HeroEnergyCard;
