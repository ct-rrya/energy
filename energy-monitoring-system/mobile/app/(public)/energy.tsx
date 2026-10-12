import { View, Text, StyleSheet } from 'react-native';

/**
 * Energy Monitoring Screen (Public)
 * 
 * Phase 1: Placeholder screen.
 * 
 * Future implementation:
 * - Recent energy readings
 * - Sensor status
 * - Real-time updates via Firestore
 */
export default function EnergyMonitoringScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Energy Monitoring</Text>
        <Text style={styles.description}>
          This screen will display detailed energy readings and sensor data.
        </Text>
        <Text style={styles.note}>
          Phase 1: Placeholder only. Real-time data integration will be implemented in later phases.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2947',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 16,
  },
  note: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
