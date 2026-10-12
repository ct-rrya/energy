import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/contexts/AuthContext';

/**
 * Welcome Screen
 * 
 * Entry point for the mobile app.
 * Allows users to choose between public access or admin login.
 * 
 * Phase 2: Authentication-aware navigation.
 * Authenticated users are automatically routed based on role.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoading } = useAuth();

  // Show loading indicator while auth state is being restored
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#2FBF71" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* App Logo/Title */}
      <View style={styles.header}>
        <Text style={styles.title}>EcoStep</Text>
        <Text style={styles.subtitle}>Energy Monitoring</Text>
      </View>

      {/* Navigation Options */}
      <View style={styles.content}>
        <Text style={styles.description}>
          Monitor real-time energy generation from piezoelectric tiles
        </Text>

        {/* Public Access Button */}
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(public)')}
        >
          <Text style={styles.primaryButtonText}>View Public Dashboard</Text>
        </Pressable>

        {/* Admin Login Button */}
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/admin-login')}
        >
          <Text style={styles.secondaryButtonText}>
            Administrator Login
          </Text>
        </Pressable>

        {/* User Login Link */}
        <Pressable
          style={styles.linkButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.linkText}>User Login</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Phase 2: Authentication & Authorization</Text>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A2947',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#0A2947', // EcoStep dark blue
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#2FBF71', // EcoStep green
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#2FBF71',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2FBF71',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2FBF71',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: '#94A3B8',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
