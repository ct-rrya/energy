/**
 * Authentication Context
 * 
 * Provides global authentication state and methods throughout the app.
 * Handles session restoration, login, logout, and token invalidation.
 * 
 * CLIENT-SIDE ROUTE GUARDS ARE FOR UX ONLY.
 * The backend remains the authority for authentication and authorization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import type { AuthContextState, LoginCredentials, AccessCodeCredentials, User } from '../types/auth.types';
import * as authService from '../api/services/auth.service';
import * as secureStorage from '../utils/secureStorage';
import { onUnauthorized } from '../api/client';

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = !!user && !!token;

  /**
   * Restore session on app startup
   * Retrieves token and user from secure storage
   * 
   * If either token or user is missing/corrupted, treats session as invalid.
   * This fail-safe approach ensures the app doesn't remain in a broken state.
   */
  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const [storedToken, storedUser] = await Promise.all([
        secureStorage.getToken(),
        secureStorage.getUser(),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      } else if (storedToken || storedUser) {
        // Partial data found (one is null) - clear everything
        console.warn('Partial auth data found, clearing for consistency');
        await secureStorage.clearAuth();
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      // Clear potentially corrupted data
      await secureStorage.clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with email and password (PUBLIC_USER)
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      const { token: newToken, user: newUser } = response.data;

      // Save to secure storage
      await Promise.all([
        secureStorage.saveToken(newToken),
        secureStorage.saveUser(newUser),
      ]);

      // Update state
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      // Re-throw for UI to display error message
      throw error;
    }
  }, []);

  /**
   * Login with administrator access code (SYSTEM_ADMIN, SUPER_ADMIN)
   */
  const loginWithAccessCode = useCallback(async (credentials: AccessCodeCredentials) => {
    try {
      const response = await authService.loginWithAccessCode(credentials);
      const { token: newToken, user: newUser } = response.data;

      // Save to secure storage
      await Promise.all([
        secureStorage.saveToken(newToken),
        secureStorage.saveUser(newUser),
      ]);

      // Update state
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      // Re-throw for UI to display error message
      throw error;
    }
  }, []);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    try {
      await secureStorage.clearAuth();
      setToken(null);
      setUser(null);
      // Navigate to welcome screen
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force state clear even if storage fails
      setToken(null);
      setUser(null);
      router.replace('/');
    }
  }, [router]);

  /**
   * Handle unauthorized (401) responses from API
   * Triggered by axios response interceptor
   */
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      // Token is invalid - logout user
      setToken(null);
      setUser(null);
      router.replace('/');
    });

    return unsubscribe;
  }, [router]);

  /**
   * Restore session on mount
   */
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * Handle navigation based on authentication state
   * Redirect authenticated users to appropriate screens
   */
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inAdminGroup = segments[0] === '(admin)';
    const inPublicGroup = segments[0] === '(public)';

    if (isAuthenticated && user) {
      // User is authenticated - route based on role
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN';

      if (isAdmin && !inAdminGroup) {
        // Admin user not in admin area - redirect to admin dashboard
        router.replace('/(admin)/dashboard');
      } else if (!isAdmin && inAdminGroup) {
        // Non-admin trying to access admin area - redirect to public
        router.replace('/(public)');
      }
    } else {
      // User is not authenticated
      if (inAdminGroup) {
        // Trying to access admin without auth - redirect to admin login
        router.replace('/auth/admin-login');
      }
    }
  }, [isAuthenticated, user, segments, isLoading, router]);

  const value: AuthContextState = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    loginWithAccessCode,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
