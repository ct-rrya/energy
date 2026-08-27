import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/api/services';
import { STORAGE_KEYS } from '@/lib/constants';
import { isTokenExpired } from '@/lib/utils';
import type { AuthContextState, LoginCredentials, User } from '@/types';

/**
 * Auth Context
 */
const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Manages authentication state and provides auth methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

        if (storedToken && storedUser) {
          // Check if token is expired
          if (isTokenExpired(storedToken)) {
            // Token expired, clear auth
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
            setIsLoading(false);
            return;
          }

          // Verify token by fetching user profile
          try {
            const response = await authService.getProfile();
            setUser(response.data);
            setToken(storedToken);
          } catch (error) {
            // Token invalid, clear auth
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
            console.error('Token validation failed:', error);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login function
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      const { token: newToken, user: newUser } = response.data;

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(newUser));

      // Update state
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw error for component to handle
      throw error;
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);

    // Clear state
    setToken(null);
    setUser(null);

    // Clear all cached queries
    queryClient.clear();
  }, [queryClient]);

  const value: AuthContextState = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use Auth Context
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
