import { Stack } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

/**
 * Admin Routes Layout
 * 
 * Navigation structure for administrator screens.
 * 
 * Phase 2: Route protection implemented.
 * Only authenticated SYSTEM_ADMIN and SUPER_ADMIN users can access.
 */
export default function AdminLayout() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  // Show nothing while loading (AuthContext will handle redirect)
  if (isLoading) {
    return null;
  }

  // If not authenticated or not admin, AuthContext will redirect
  // This is just a safety check for UI consistency
  const isAdmin = user && (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN');

  if (!isAdmin) {
    return null;
  }

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
        headerRight: () => (
          <Pressable onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Admin Dashboard',
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
