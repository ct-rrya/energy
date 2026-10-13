import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardData, useRecentReading } from '@/hooks';
import { HeroEnergyCard, MetricCard, ErrorCard } from '@/components/dashboard';

/**
 * Public Dashboard Screen
 * 
 * Live energy monitoring dashboard accessible without authentication.
 * Displays daily energy in hero card and latest sensor readings in metric cards.
 * 
 * Features:
 * - Pull-to-refresh for manual data updates
 * - Loading states with skeleton cards
 * - Error states with retry functionality
 * - Empty state when no readings exist
 * - Safe handling of null/missing values
 */
export default function PublicDashboardScreen() {
  const dashboardData = useDashboardData();
  const recentReadingData = useRecentReading();

  const [refreshing, setRefreshing] = useState(false);

  /**
   * Handle pull-to-refresh
   * Refetches both dashboard metrics and recent reading
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dashboardData.refetch(),
        recentReadingData.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [dashboardData, recentReadingData]);

  /**
   * Combined retry function for error state
   */
  const handleRetry = useCallback(async () => {
    await Promise.all([
      dashboardData.refetch(),
      recentReadingData.refetch(),
    ]);
  }, [dashboardData, recentReadingData]);

  // Determine overall loading state (initial load only)
  const isInitialLoading = dashboardData.isLoading && recentReadingData.isLoading;

  // Determine if either has an error
  const hasError = dashboardData.isError || recentReadingData.isError;

  // Error message combining both error sources
  const errorMessage = [
    dashboardData.isError ? 'Failed to load dashboard metrics' : null,
    recentReadingData.isError ? 'Failed to load recent readings' : null,
  ]
    .filter(Boolean)
    .join('. ');

  // Empty state: no readings at all
  const isEmpty = dashboardData.data?.totalReadings === 0;

  // Extract data
  const metrics = dashboardData.data;
  const reading = recentReadingData.reading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2FBF71"
            colors={['#2FBF71']}
          />
        }
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Energy Dashboard</Text>
          <Text style={styles.subtitle}>Real-time monitoring</Text>
        </View>

        {/* Error State */}
        {hasError && !isInitialLoading && (
          <ErrorCard message={errorMessage} onRetry={handleRetry} />
        )}

        {/* Empty State */}
        {isEmpty && !hasError && !isInitialLoading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Sensor Data Available Yet</Text>
            <Text style={styles.emptyMessage}>
              Energy readings will appear here once sensors start transmitting data.
            </Text>
          </View>
        )}

        {/* Dashboard Content */}
        {!hasError && !isEmpty && (
          <>
            {/* Hero Energy Card */}
            <HeroEnergyCard
              energyValue={metrics?.dailyEnergy ?? null}
              aiInsight={metrics?.aiInsight}
              isLoading={dashboardData.isLoading}
              isError={dashboardData.isError}
              onRetry={dashboardData.refetch}
            />

            {/* Last Updated Timestamp */}
            {metrics?.lastReadingAt && (
              <View style={styles.timestampContainer}>
                <Text style={styles.timestampText}>
                  Updated {formatRelativeTime(metrics.lastReadingAt)}
                </Text>
              </View>
            )}

            {/* Metric Cards - Voltage, Current, Power, Energy */}
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Voltage"
                value={reading?.voltage ?? null}
                unit="V"
                precision={1}
                color="blue"
                isLoading={recentReadingData.isLoading}
              />

              <MetricCard
                label="Current"
                value={reading?.current ?? null}
                unit="A"
                precision={2}
                color="amber"
                isLoading={recentReadingData.isLoading}
              />

              <MetricCard
                label="Power"
                value={reading?.power ?? null}
                unit="W"
                precision={1}
                color="green"
                isLoading={recentReadingData.isLoading}
              />

              <MetricCard
                label="Energy (Latest)"
                value={reading?.energy ?? null}
                unit="kWh"
                precision={3}
                color="green"
                isLoading={recentReadingData.isLoading}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Format timestamp as relative time
 * Simple implementation without external libraries
 */
function formatRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes === 1) {
      return '1 minute ago';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 120) {
      return '1 hour ago';
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
  } catch {
    return 'Unknown';
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2947',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  timestampContainer: {
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  metricsGrid: {
    gap: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2947',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
