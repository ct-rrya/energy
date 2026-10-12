/**
 * Admin Index (Redirect to Login)
 * 
 * This route redirects unauthenticated users to the admin login screen.
 * Authenticated admin users are redirected to the dashboard by AuthContext.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function AdminIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin login
    router.replace('/auth/admin-login');
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2FBF71" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
