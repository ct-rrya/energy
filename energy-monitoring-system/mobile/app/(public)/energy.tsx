import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRecentReadings } from '../../src/api/services/energy.service';
import type { EnergyReading } from '../../src/types';

/**
 * Energy Monitoring Screen (Public)
 * 
 * Displays historical sensor data and raw readings fetched directly from MongoDB.
 */
export default function EnergyMonitoringScreen() {
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReadings = useCallback(async () => {
    try {
      setError(null);
      // Fetch up to 100 recent raw data readings from MongoDB
      const data = await getRecentReadings(100);
      setReadings(data || []);
    } catch (err: any) {
      console.error('Failed to fetch energy readings:', err);
      setError(err.message || 'Failed to load readings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReadings();
  }, [fetchReadings]);

  const renderReadingItem = ({ item }: { item: EnergyReading }) => {
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const powerMW = item.power !== undefined ? (item.power * 1000).toFixed(3) : '0.000';
    const currentMA = item.current !== undefined ? (item.current * 1000).toFixed(1) : '0.0';
    const voltageV = item.voltage !== undefined ? item.voltage.toFixed(2) : '0.00';
    const energyKWh = item.energy !== undefined ? item.energy.toFixed(4) : '0.0000';
    const steps = item.stepCount !== undefined ? item.stepCount : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.timestampText}>
            {dateStr} • {timeStr}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{energyKWh} kWh</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>VOLTAGE</Text>
            <Text style={styles.metricValue}>{voltageV} V</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>CURRENT</Text>
            <Text style={styles.metricValue}>{currentMA} mA</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>POWER</Text>
            <Text style={styles.metricValue}>{powerMW} mW</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>STEPS</Text>
            <Text style={styles.metricValue}>{steps}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Raw Sensor Readings</Text>
        <Text style={styles.subtitle}>
          {readings.length} raw readings from MongoDB
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2FBF71" />
          <Text style={styles.loadingText}>Fetching historical data from MongoDB...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : readings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No readings found in database</Text>
        </View>
      ) : (
        <FlatList
          data={readings}
          keyExtractor={(item, index) => item.id || (item as any)._id || `reading-${index}`}
          renderItem={renderReadingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2FBF71"
              colors={['#2FBF71']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2947',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timestampText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  badge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  metricItem: {
    width: '50%',
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
});
