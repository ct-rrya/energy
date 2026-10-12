/**
 * Administrator Login Screen
 * 
 * Access code authentication for SYSTEM_ADMIN and SUPER_ADMIN roles.
 * Access code must be exactly 12 alphanumeric characters (case-sensitive).
 * 
 * SECURITY: Never log access codes or display them in error messages.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { loginWithAccessCode } = useAuth();

  const [accessCode, setAccessCode] = useState('');
  const [isSecure, setIsSecure] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation: exactly 12 alphanumeric characters
  const isValid = /^[A-Za-z0-9]{12}$/.test(accessCode);
  const showValidationError = accessCode.length > 0 && !isValid;

  const handleLogin = async () => {
    if (!isValid) {
      setError('Access code must be exactly 12 alphanumeric characters');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await loginWithAccessCode({ accessCode });
      // AuthContext will handle navigation after successful login
    } catch (err: any) {
      // Never expose the access code in error messages
      setError(err.message || 'Invalid access code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>EcoStep</Text>
            <Text style={styles.title}>Administrator Login</Text>
            <Text style={styles.subtitle}>Enter your 12-character access code</Text>
          </View>

          {/* Access Code Input */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Access Code</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter access code"
                  placeholderTextColor="#94A3B8"
                  value={accessCode}
                  onChangeText={(text) => {
                    setAccessCode(text);
                    setError('');
                  }}
                  secureTextEntry={isSecure}
                  maxLength={12}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  accessibilityLabel="Access code input"
                  accessibilityHint="Enter your 12-character administrator access code"
                />
                <Pressable
                  style={styles.toggleButton}
                  onPress={() => setIsSecure(!isSecure)}
                  disabled={isSubmitting}
                  accessibilityLabel={isSecure ? 'Show access code' : 'Hide access code'}
                >
                  <Text style={styles.toggleButtonText}>
                    {isSecure ? 'Show' : 'Hide'}
                  </Text>
                </Pressable>
              </View>
              {showValidationError && (
                <Text style={styles.validationError}>
                  Must be exactly 12 alphanumeric characters
                </Text>
              )}
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <Pressable
              style={[
                styles.loginButton,
                (!isValid || isSubmitting) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isValid || isSubmitting}
              accessibilityLabel="Login button"
              accessibilityHint="Tap to login with your access code"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </Pressable>

            {/* Back Link */}
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A2947',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2FBF71',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0A2947',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleButtonText: {
    color: '#2FBF71',
    fontSize: 14,
    fontWeight: '600',
  },
  validationError: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#2FBF71',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#2FBF71',
    fontSize: 16,
    fontWeight: '600',
  },
});
