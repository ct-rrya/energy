import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Public Dashboard Screen
 * 
 * Phase 1: Placeholder screen with navigation structure.
 * 
 * Future implementation:
 * - Real-time energy metrics
 * - Live sensor data
 * - Hero energy card
 * - Metric cards (voltage, power, current, steps)
 */
export default function PublicDashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Placeholder Content */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dashboard</Text>
          <Text style={styles.cardDescription}>
            This screen will display real-time energy monitoring data.
          </Text>
        </View>

        {/* Navigation to other public screens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Public Screens</Text>
          
          <Pressable
            style={styles.navButton}
            onPress={() => router.push('/(public)/analytics')}
          >
            <Text style={styles.navButtonText}>Analytics</Text>
            <Text style={styles.navButtonSubtext}>View energy analytics</Text>
          </Pressable>

          <Pressable
            style={styles.navButton}
            onPress={() => router.push('/(public)/energy')}
          >
            <Text style={styles.navButtonText}>Energy Monitoring</Text>
            <Text style={styles.navButtonSubtext}>View detailed readings</Text>
          </Pressable>
        </View>

        {/* Phase 1 Notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Phase 1: Navigation Shell</Text>
          <Text style={styles.noticeText}>
            This is a placeholder screen. Data integration will be implemented in later phases.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    gap: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2947',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A2947',
    marginBottom: 8,
  },
  navButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A2947',
    marginBottom: 4,
  },
  navButtonSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  notice: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
});
