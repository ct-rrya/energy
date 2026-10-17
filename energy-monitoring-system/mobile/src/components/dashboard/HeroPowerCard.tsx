/**
 * HeroPowerCard Component
 * 
 * Large hero card displaying current power output in milliwatts (mW).
 * This is the primary dashboard card highlighting instantaneous power generation.
 * 
 * Key behaviors:
 * - Displays power in milliwatts (mW) with 4 decimal precision for small values
 * - Shows AI-generated insight when available
 * - Handles loading, error, and null states
 * - Provides retry mechanism for errors
 * - Converts power from Watts (backend) to milliwatts (display)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface HeroPowerCardProps {
  powerValue: number | null | undefined; // Power in Watts from backend
  aiInsight?: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const HeroPowerCard: React.FC<HeroPowerCardProps> = ({
  powerValue,
  aiInsight,
  isLoading,
  isError,
  onRetry,
}) => {
  // Error state
  if (isError) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.errorTitle}>Failed to Load Power Data</Text>
        <Text style={styles.errorMessage}>
          Unable to fetch current power information
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
        <Text style={styles.title}>Power Output</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading power data...</Text>
        </View>
      </View>
    );
  }

  // Convert power from Watts to milliwatts
  // Backend returns power in W, we display in mW for better precision
  const powerInMilliwatts = powerValue !== null && powerValue !== undefined 
    ? powerValue * 1000 
    : null;

  // Format power value
  const formattedPower = formatPowerValue(powerInMilliwatts);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Power Output</Text>
      
      <View style={styles.powerContainer}>
        <Text style={styles.powerValue}>{formattedPower}</Text>
        <Text style={styles.powerUnit}>mW</Text>
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
 * Format power value in milliwatts, distinguishing null from zero
 * Uses 4 decimal precision to show small mW values clearly
 */
function formatPowerValue(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '--';
  }
  return value.toFixed(4);
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
  powerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  powerValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F59E0B', // Amber color for power
    marginRight: 8,
  },
  powerUnit: {
    fontSize: 20,
    fontWeight: '500',
    color: '#6B7280',
  },
  insightContainer: {
    backgroundColor: '#FFF7ED', // Light amber tint
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B', // Amber border
    padding: 12,
    borderRadius: 6,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706', // Dark amber
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#92400E', // Darker amber for text
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
    backgroundColor: '#F59E0B',
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

export default HeroPowerCard;
