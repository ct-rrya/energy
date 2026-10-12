/**
 * Secure Storage Utility
 * 
 * Wraps expo-secure-store for secure token and user data persistence.
 * Uses hardware-backed encryption on iOS (Keychain) and Android (Keystore).
 * 
 * SECURITY: Never log token values.
 */

import * as SecureStore from 'expo-secure-store';
import type { User } from '../types/auth.types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Save JWT token securely
 * @param token - JWT token string (NEVER log this value)
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save token to secure storage:', error);
    throw new Error('Could not save authentication token');
  }
}

/**
 * Retrieve JWT token from secure storage
 * @returns JWT token or null if not found
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve token from secure storage:', error);
    return null;
  }
}

/**
 * Remove JWT token from secure storage
 */
export async function deleteToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to delete token from secure storage:', error);
    // Don't throw - logout should proceed even if delete fails
  }
}

/**
 * Save user data securely
 * @param user - User object
 */
export async function saveUser(user: User): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user to secure storage:', error);
    throw new Error('Could not save user data');
  }
}

/**
 * Retrieve user data from secure storage
 * @returns User object or null if not found
 */
export async function getUser(): Promise<User | null> {
  try {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Failed to retrieve user from secure storage:', error);
    return null;
  }
}

/**
 * Remove user data from secure storage
 */
export async function deleteUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Failed to delete user from secure storage:', error);
    // Don't throw - logout should proceed even if delete fails
  }
}

/**
 * Clear all authentication data (token + user)
 * Used on logout or when token becomes invalid
 */
export async function clearAuth(): Promise<void> {
  await Promise.all([deleteToken(), deleteUser()]);
}
