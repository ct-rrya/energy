import { Stack } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

/**
 * Public Routes Layout
 * 
 * Navigation structure for public-access screens.
 * No authentication required - public monitoring must remain accessible.
 * 
 * Phase 2: Shows conditional logout button if user is authenticated.
 * 
 * Routes:
 * - (public)/index - Dashboard
 * - (public)/analytics - Analytics (placeholder)
 * - (public)/energy - Energy monitoring (placeholder)
 */
export default function PublicLayout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0A2947',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: isAuthenticated
          ? () => (
              <Pressable onPress={logout} style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </Pressable>
            )
          : undefined,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="energy"
        options={{
          title: 'Energy Monitoring',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
