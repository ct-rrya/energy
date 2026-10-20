import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRecentReadings, getReadingsRange } from '../../src/api/services/energy.service';
import type { EnergyReading } from '../../src/types';

/**
 * Analytics Screen (Public)
 * 
 * Displays historical analytics and data points fetched from MongoDB.
 */
export default function AnalyticsScreen() {
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'raw'>('summary');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setError(null);
      // Fetch historical readings across all time from MongoDB
      const data = await getRecentReadings(100);
      setReadings(data || []);
    } catch (err: any) {
      console.error('Failed to load analytics readings:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Aggregate stats from the historical raw data
  const stats = useMemo(() => {
    if (!readings.length) {
      return {
        totalReadings: 0,
        totalEnergyKWh: '0.000',
        totalSteps: 0,
        peakPowerMW: '0.000',
        peakVoltageV: '0.00',
        avgCurrentMA: '0.0',
      };
    }

    let sumEnergy = 0;
    let sumSteps = 0;
    let maxPower = 0;
    let maxVoltage = 0;
    let sumCurrent = 0;

    for (const r of readings) {
      if (r.energy) sumEnergy += r.energy;
      if (r.stepCount) sumSteps += r.stepCount;
      if (r.power && r.power > maxPower) maxPower = r.power;
      if (r.voltage && r.voltage > maxVoltage) maxVoltage = r.voltage;
      if (r.current) sumCurrent += r.current;
    }

    const avgCurrent = readings.length > 0 ? (sumCurrent / readings.length) * 1000 : 0;

    return {
      totalReadings: readings.length,
      totalEnergyKWh: (sumEnergy).toFixed(4),
      totalSteps: sumSteps,
      peakPowerMW: (maxPower * 1000).toFixed(3),
      peakVoltageV: maxVoltage.toFixed(2),
      avgCurrentMA: avgCurrent.toFixed(1),
    };
  }, [readings]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2FBF71"
            colors={['#2FBF71']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Historical Analytics</Text>
          <Text style={styles.subtitle}>
            Data aggregated from {stats.totalReadings} MongoDB records
          </Text>
        </View>

        {/* View mode toggle */}
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'summary' && styles.toggleBtnActive]}
            onPress={() => setViewMode('summary')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === 'summary' && styles.toggleBtnTextActive,
              ]}
            >
              Summary Metrics
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'raw' && styles.toggleBtnActive]}
            onPress={() => setViewMode('raw')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === 'raw' && styles.toggleBtnTextActive,
              ]}
            >
              Raw Data ({readings.length})
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2FBF71" />
            <Text style={styles.loadingText}>Fetching historical MongoDB records...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        ) : viewMode === 'summary' ? (
          <View style={styles.summaryGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL GENERATED</Text>
              <Text style={[styles.statValue, { color: '#059669' }]}>
                {stats.totalEnergyKWh}
              </Text>
              <Text style={styles.statUnit}>kWh</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL STEPS</Text>
              <Text style={[styles.statValue, { color: '#2563EB' }]}>
                {stats.totalSteps}
              </Text>
              <Text style={styles.statUnit}>steps</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PEAK POWER</Text>
              <Text style={[styles.statValue, { color: '#D97706' }]}>
                {stats.peakPowerMW}
              </Text>
              <Text style={styles.statUnit}>mW</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PEAK VOLTAGE</Text>
              <Text style={[styles.statValue, { color: '#7C3AED' }]}>
                {stats.peakVoltageV}
              </Text>
              <Text style={styles.statUnit}>V</Text>
            </View>

            <View style={[styles.statCard, { width: '100%' }]}>
              <Text style={styles.statLabel}>AVERAGE CURRENT</Text>
              <Text style={[styles.statValue, { color: '#0284C7' }]}>
                {stats.avgCurrentMA} mA
              </Text>
              <Text style={styles.statUnit}>Average discharge current</Text>
            </View>
          </View>
        ) : (
          <View style={styles.rawListContainer}>
            {readings.map((item, index) => {
              const d = new Date(item.timestamp);
              const dateStr = d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <View key={item.id || (item as any)._id || index} style={styles.rawRow}>
                  <View>
                    <Text style={styles.rawTimestamp}>{dateStr} {timeStr}</Text>
                    <Text style={styles.rawSub}>
                      {item.stepCount || 0} steps • {item.voltage?.toFixed(2) || '0'} V
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.rawEnergy}>
                      {item.energy?.toFixed(4) || '0.0000'} kWh
                    </Text>
                    <Text style={styles.rawPower}>
                      {(item.power ? item.power * 1000 : 0).toFixed(3)} mW
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#0F172A',
  },
  centerBox: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  statUnit: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rawListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rawRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rawTimestamp: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  rawSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rawEnergy: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  rawPower: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
