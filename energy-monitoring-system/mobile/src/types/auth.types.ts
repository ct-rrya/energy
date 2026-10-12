/**
 * Authentication Type Definitions
 * 
 * Matches backend contract exactly.
 * Backend endpoints:
 * - POST /auth/login (email/password for PUBLIC_USER)
 * - POST /auth/admin/access-code (12-char code for admins)
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  PUBLIC_USER = 'PUBLIC_USER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AccessCodeCredentials {
  accessCode: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface AuthContextState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithAccessCode: (credentials: AccessCodeCredentials) => Promise<void>;
  logout: () => Promise<void>;
}
