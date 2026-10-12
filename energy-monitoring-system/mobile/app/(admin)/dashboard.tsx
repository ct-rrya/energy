/**
 * Admin Dashboard Screen
 * 
 * Protected administrator dashboard.
 * Only accessible to authenticated SYSTEM_ADMIN and SUPER_ADMIN users.
 * 
 * Phase 2: Authentication and session management implemented.
 * Phase 3 will add admin features (sensors, alerts, reports).
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return null; // AuthContext will handle redirect
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Administrator Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {user.name}</Text>
        </View>

        {/* User Info Card */}
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

        {/* Coming Soon Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phase 3 Features (Coming Soon)</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Sensor management (CRUD operations)</Text>
            <Text style={styles.featureItem}>• Real-time energy monitoring dashboard</Text>
            <Text style={styles.featureItem}>• Alert configuration and management</Text>
            <Text style={styles.featureItem}>• Report generation and export</Text>
            <Text style={styles.featureItem}>• System diagnostics and health checks</Text>
            <Text style={styles.featureItem}>• User account management</Text>
            <Text style={styles.featureItem}>• Push notifications</Text>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Phase 2: Authentication & Authorization Complete
          </Text>
          <Text style={styles.footerText}>
            CLIENT-SIDE ROUTE GUARDS ARE FOR UX ONLY.
          </Text>
          <Text style={styles.footerText}>
            Backend remains authority for authentication and authorization.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
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
    marginBottom: 16,
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
  featureList: {
    gap: 12,
  },
  featureItem: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
});
