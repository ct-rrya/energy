import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { authService } from '@/api/services';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { FlexibleRoute } from '@/routes/FlexibleRoute';
import { AdminRoute } from '@/routes/AdminRoute';
import { ROUTES } from '@/routes/routes.config';
import AdminAccessCodePage from '@/features/auth/pages/AdminAccessCodePage';

// Mock authService
vi.mock('@/api/services', () => ({
  authService: {
    loginWithAccessCode: vi.fn(),
    getProfile: vi.fn(),
    login: vi.fn(),
  },
}));

const mockAuthService = vi.mocked(authService);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function createTestRouter(initialEntries: string[]) {
  return createMemoryRouter(
    [
      {
        path: ROUTES.HOME,
        element: <div data-testid="public-home">Public Monitoring Home</div>,
      },
      {
        path: ROUTES.ADMIN_LOGIN,
        element: (
          <FlexibleRoute redirectIfAuth={true}>
            <AdminAccessCodePage />
          </FlexibleRoute>
        ),
      },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <ProtectedRoute>
            <div data-testid="admin-dashboard">System Administrator Dashboard</div>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_MANAGEMENT,
        element: (
          <AdminRoute requireSuperAdmin={true}>
            <div data-testid="super-admin-management">Super Admin Management</div>
          </AdminRoute>
        ),
      },
      {
        path: '/login',
        element: <div data-testid="legacy-login-page">Legacy Login Page</div>,
      },
    ],
    { initialEntries }
  );
}

function renderWithProviders(router: ReturnType<typeof createTestRouter>) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('Authentication Redirect Flow Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('TEST 1: Valid SYSTEM_ADMIN logs in at /admin/login and redirects directly to /dashboard', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'sysadmin-1',
      name: 'System Admin',
      email: 'admin@energymonitor.com',
      role: 'SYSTEM_ADMIN' as const,
      isActive: true,
    };

    mockAuthService.loginWithAccessCode.mockResolvedValueOnce({
      success: true,
      message: 'Access code verified',
      data: {
        token: 'mock-jwt-token-system-admin',
        user: mockUser,
      },
    });

    const router = createTestRouter([ROUTES.ADMIN_LOGIN]);
    renderWithProviders(router);

    // Verify on /admin/login
    expect(screen.getByText('Administrator Access')).toBeInTheDocument();

    // Type 12-char access code ABC123DEF456
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4);
    await user.type(inputs[0], 'ABC');
    await user.type(inputs[1], '123');
    await user.type(inputs[2], 'DEF');
    await user.type(inputs[3], '456');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /access dashboard/i });
    await user.click(submitBtn);

    // Verify authService called with full code
    expect(mockAuthService.loginWithAccessCode).toHaveBeenCalledWith({
      accessCode: 'ABC123DEF456',
    });

    // Wait for redirect to /dashboard
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.DASHBOARD);
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    // Verify NOT redirected to /login
    expect(router.state.location.pathname).not.toBe('/login');
    expect(screen.queryByTestId('legacy-login-page')).not.toBeInTheDocument();
  });

  it('TEST 2: Invalid access code stays on /admin/login and displays error', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        status: 401,
        data: {
          success: false,
          statusCode: 401,
          message: 'Invalid access code. Please try again.',
        },
      },
    };
    mockAuthService.loginWithAccessCode.mockRejectedValueOnce(errorResponse);

    const router = createTestRouter([ROUTES.ADMIN_LOGIN]);
    renderWithProviders(router);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], 'INV');
    await user.type(inputs[1], 'ALI');
    await user.type(inputs[2], 'DCO');
    await user.type(inputs[3], 'DE1');

    const submitBtn = screen.getByRole('button', { name: /access dashboard/i });
    await user.click(submitBtn);

    // Verify error message displayed
    await waitFor(() => {
      expect(
        screen.getByText('Invalid access code. Please try again.')
      ).toBeInTheDocument();
    });

    // Verify remains on /admin/login
    expect(router.state.location.pathname).toBe(ROUTES.ADMIN_LOGIN);
    expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('legacy-login-page')).not.toBeInTheDocument();
  });

  it('TEST 3: Inactive account is rejected and remains on /admin/login', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        status: 401,
        data: {
          success: false,
          statusCode: 401,
          message: 'Account is inactive. Contact system administrator.',
        },
      },
    };
    mockAuthService.loginWithAccessCode.mockRejectedValueOnce(errorResponse);

    const router = createTestRouter([ROUTES.ADMIN_LOGIN]);
    renderWithProviders(router);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], 'INA');
    await user.type(inputs[1], 'CTI');
    await user.type(inputs[2], 'VE1');
    await user.type(inputs[3], '234');

    const submitBtn = screen.getByRole('button', { name: /access dashboard/i });
    await user.click(submitBtn);

    // Verify error displayed
    await waitFor(() => {
      expect(
        screen.getByText('Account is inactive. Contact system administrator.')
      ).toBeInTheDocument();
    });

    // Remains on /admin/login
    expect(router.state.location.pathname).toBe(ROUTES.ADMIN_LOGIN);
    expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
  });

  it('TEST 4: Direct access to /dashboard while unauthenticated redirects to /admin/login, NOT /login', async () => {
    const router = createTestRouter([ROUTES.DASHBOARD]);
    renderWithProviders(router);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.ADMIN_LOGIN);
    });

    // Crucial check: NOT /login
    expect(router.state.location.pathname).not.toBe('/login');
    expect(screen.queryByTestId('legacy-login-page')).not.toBeInTheDocument();
    expect(screen.getByText('Administrator Access')).toBeInTheDocument();
  });

function createMockJwt(payload: Record<string, any>) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 86400; // 24 hours in future
  const body = btoa(JSON.stringify({ ...payload, exp }));
  return `${header}.${body}.mock-signature`;
}

  it('TEST 5: Already authenticated administrator visiting /admin/login redirects directly to /dashboard', async () => {
    const mockUser = {
      id: 'sysadmin-1',
      name: 'System Admin',
      email: 'admin@energymonitor.com',
      role: 'SYSTEM_ADMIN' as const,
      isActive: true,
    };
    const validToken = createMockJwt({ sub: mockUser.id, role: mockUser.role });
    localStorage.setItem('auth_token', validToken);
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    mockAuthService.getProfile.mockResolvedValueOnce({
      success: true,
      message: 'Profile retrieved',
      data: mockUser,
    });

    const router = createTestRouter([ROUTES.ADMIN_LOGIN]);
    renderWithProviders(router);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.DASHBOARD);
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    expect(router.state.location.pathname).not.toBe(ROUTES.ADMIN_LOGIN);
    expect(router.state.location.pathname).not.toBe('/login');
  });

  it('TEST 6: Public user opening public monitoring functionality is NOT redirected to /admin/login', async () => {
    const router = createTestRouter([ROUTES.HOME]);
    renderWithProviders(router);

    // Verify public route renders without redirect
    expect(screen.getByTestId('public-home')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.HOME);
    expect(router.state.location.pathname).not.toBe(ROUTES.ADMIN_LOGIN);
    expect(router.state.location.pathname).not.toBe('/login');
  });

  it('AUTHORIZATION CHECK: SYSTEM_ADMIN cannot access /admin-management and is redirected to /dashboard', async () => {
    const mockUser = {
      id: 'sysadmin-1',
      name: 'System Admin',
      email: 'admin@energymonitor.com',
      role: 'SYSTEM_ADMIN' as const,
      isActive: true,
    };
    const validToken = createMockJwt({ sub: mockUser.id, role: mockUser.role });
    localStorage.setItem('auth_token', validToken);
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    mockAuthService.getProfile.mockResolvedValueOnce({
      success: true,
      message: 'Profile retrieved',
      data: mockUser,
    });

    const router = createTestRouter([ROUTES.ADMIN_MANAGEMENT]);
    renderWithProviders(router);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.DASHBOARD);
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    // SYSTEM_ADMIN cannot access Super Admin page
    expect(screen.queryByTestId('super-admin-management')).not.toBeInTheDocument();
  });

  it('API CLIENT: 401 error on protected page redirects to /admin/login (NOT /login)', async () => {
    // Setup window location
    delete (window as any).location;
    window.location = {
      pathname: '/dashboard',
      href: 'http://localhost:5173/dashboard',
    } as any;

    localStorage.setItem('auth_token', 'mock-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: '1' }));

    const { default: apiClient } = await import('@/api/client');

    // Simulate 401 response interceptor
    const error = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    };

    const interceptor = (apiClient.interceptors.response as any).handlers[0];
    try {
      await interceptor.rejected(error);
    } catch {
      // Expected rejection
    }

    // Token cleared
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();

    // Redirected to /admin/login (NOT /login)
    expect(window.location.href).toBe('/admin/login');
    expect(window.location.href).not.toBe('/login');
  });

  it('API CLIENT: 401 error while on /admin/login does not trigger page reload/redirect', async () => {
    delete (window as any).location;
    window.location = {
      pathname: '/admin/login',
      href: 'http://localhost:5173/admin/login',
    } as any;

    const { default: apiClient } = await import('@/api/client');

    const error = {
      response: {
        status: 401,
        data: { message: 'Invalid access code' },
      },
    };

    const interceptor = (apiClient.interceptors.response as any).handlers[0];
    try {
      await interceptor.rejected(error);
    } catch {
      // Expected rejection
    }

    // Still on /admin/login, href was not reassigned
    expect(window.location.href).toBe('http://localhost:5173/admin/login');
  });
});
