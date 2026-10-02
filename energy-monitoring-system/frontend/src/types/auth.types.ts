/**
 * User Role
 */
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  PUBLIC_USER: 'PUBLIC_USER',
  // Legacy support
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * User Entity
 */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Admin Access Code Login
 */
export interface AccessCodeLoginCredentials {
  accessCode: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Auth Context State
 */
export interface AuthContextState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithAccessCode: (credentials: AccessCodeLoginCredentials) => Promise<User>;
  logout: () => void;
  switchAdministrator: () => void;
}
