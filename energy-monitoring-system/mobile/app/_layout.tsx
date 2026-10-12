import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';

/**
 * Root Layout
 * 
 * Provides the base navigation structure for the entire app.
 * Uses Expo Router's file-based routing system.
 * 
 * Phase 2: Wrapped with AuthProvider for global authentication state.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="auth" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
