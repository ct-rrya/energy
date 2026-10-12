import { Stack } from 'expo-router';

/**
 * Auth Routes Layout
 * 
 * Login and authentication screens for unauthenticated users.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="admin-login" />
    </Stack>
  );
}
