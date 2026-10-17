/**
 * Admin Dashboard Screen
 * 
 * Protected administrator dashboard.
 * Only accessible to authenticated SYSTEM_ADMIN and SUPER_ADMIN users.
 * 
 * Phase 2: Authentication and session management implemented.
 * Phase 3: Live energy dashboard integrated with admin user info.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useDashboardData, useRecentReading } from '../../src/hooks';
import { HeroEnergyCard, HeroPowerCard, MetricCard, ErrorCard } from '../../src/components/dashboard';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const dashboardData = useDashboardData();
  const recentReadingData = useRecentReading();

  const [refreshing, setRefreshing] = useState(false);

  if (!user) {
    return null; // AuthContext will handle redirect
  }

  /**
   * Handle pull-to-refresh
   * Refreshes dashboard data only (user info comes from AuthContext)
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

  // Determine if dashboard has an error
  const hasDashboardError = dashboardData.isError || recentReadingData.isError;

  // Error message combining both error sources
  const errorMessage = [
    dashboardData.isError ? 'Failed to load dashboard metrics' : null,
    recentReadingData.isError ? 'Failed to load recent readings' : null,
  ]
    .filter(Boolean)
    .join('. ');

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Administrator Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {user.name}</Text>
        </View>

        {/* User Info Card - Preserved from Phase 2 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Account</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={[styles.infoValue, styles.roleValue]}>{user.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, styles.activeStatus]}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Live Energy Dashboard Section */}
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Energy Monitoring</Text>

          {/* Error State */}
          {hasDashboardError && (
            <ErrorCard message={errorMessage} onRetry={handleRetry} />
          )}

          {/* Dashboard Content */}
          {!hasDashboardError && (
            <>
              {/* Hero Power Card - Primary KPI (Phase 3) */}
              <HeroPowerCard
                powerValue={reading?.power ?? null}
                aiInsight={metrics?.aiInsight}
                isLoading={recentReadingData.isLoading}
                isError={recentReadingData.isError}
                onRetry={recentReadingData.refetch}
              />

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

              {/* Metric Cards - Steps, Voltage, Current, Power (W), Energy */}
              <View style={styles.metricsGrid}>
                <MetricCard
                  label="Steps Today"
                  value={metrics?.todayTotalSteps ?? null}
                  unit=""
                  precision={0}
                  color="green"
                  isLoading={dashboardData.isLoading}
                />

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
        </View>

        {/* Logout Button - Preserved from Phase 2 */}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A2947',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A2947',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#0A2947',
  },
  roleValue: {
    fontWeight: 'bold',
    color: '#2FBF71',
  },
  activeStatus: {
    color: '#2FBF71',
    fontWeight: '600',
  },
  dashboardSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A2947',
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
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
