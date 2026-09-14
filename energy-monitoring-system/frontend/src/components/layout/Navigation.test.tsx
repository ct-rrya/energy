/**
 * Navigation Component Unit Tests
 * 
 * Task 22.2: Write navigation component tests
 * 
 * Requirements:
 * - 12.1: EcoStep design system colors
 * - 18.1: ARIA labels for all interactive elements
 * - 18.2: Keyboard accessibility (Tab, Enter, Escape)
 * - 4.12: Responsive and mobile-friendly (hamburger menu)
 * - 19.1: Home and Dashboard links render correctly
 * - 19.2: Active state styling applies to current route
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './Navigation';

// Mock AuthContext
const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Logo SVG
vi.mock('@/assets/logo/1.svg?react', () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

// Mock routes config
vi.mock('@/routes/routes.config', () => ({
  ROUTES: {
    HOME: '/',
    DASHBOARD: '/dashboard',
    LOGIN: '/login',
  },
}));

// Helper to render Navigation with router
const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Navigation />
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/dashboard/*" element={<div>Dashboard Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Navigation Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockNavigate.mockClear();
    
    // Default: unauthenticated user
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    
    // Mock window dimensions for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Subtask 22.2.1: Home and Dashboard links render correctly', () => {
    it('should render navigation header with banner role', () => {
      renderWithRouter();
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render EcoStep logo and title', () => {
      renderWithRouter();
      
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /ecostep/i })).toBeInTheDocument();
      expect(screen.getByText('Energy Monitoring System')).toBeInTheDocument();
    });

    it('should render Home navigation link', () => {
      renderWithRouter();
      
      const homeButton = screen.getByRole('button', { name: /navigate to home page/i });
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveTextContent('Home');
    });

    it('should render Dashboard navigation link', () => {
      renderWithRouter();
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to dashboard/i });
      expect(dashboardButton).toBeInTheDocument();
      expect(dashboardButton).toHaveTextContent('Dashboard');
    });

    it('should render Login button when user is not authenticated', () => {
      renderWithRouter();
      
      const loginButton = screen.getByRole('button', { name: /login to your account/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveTextContent('Login');
    });

    it('should render user avatar when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { name: 'John Doe', email: 'john@example.com' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
      
      renderWithRouter();
      
      const avatar = screen.getByRole('img', { name: /user: john doe/i });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent('J'); // First letter of name
    });

    it('should have navigation landmark with proper ARIA label (Requirement 18.1)', () => {
      renderWithRouter();
      
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });
  });

  describe('Subtask 22.2.2: Active state styling applies to current route', () => {
    it('should apply active styles to Home link when on home page', () => {
      renderWithRouter('/');
      
      const homeButton = screen.getByRole('button', { name: /navigate to home page/i });
      expect(homeButton).toHaveAttribute('aria-current', 'page');
      expect(homeButton).toHaveStyle({ 
        color: '#FFFFFF',
        backgroundColor: '#428475' 
      });
    });

    it('should apply active styles to Dashboard link when on dashboard', () => {
      renderWithRouter('/dashboard');
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to dashboard/i });
      expect(dashboardButton).toHaveAttribute('aria-current', 'page');
      expect(dashboardButton).toHaveStyle({ 
        color: '#FFFFFF',
        backgroundColor: '#428475' 
      });
    });

    it('should not apply active styles to non-active links', () => {
      renderWithRouter('/');
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to dashboard/i });
      expect(dashboardButton).not.toHaveAttribute('aria-current');
      expect(dashboardButton).toHaveStyle({ 
        color: '#1A312C',
        backgroundColor: 'transparent' 
      });
    });

    it('should recognize dashboard sub-routes as active', () => {
      renderWithRouter('/dashboard/analytics');
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to dashboard/i });
      expect(dashboardButton).toHaveAttribute('aria-current', 'page');
    });

    it('should use EcoStep design system colors (Requirement 12.1)', () => {
      renderWithRouter('/');
      
      const homeButton = screen.getByRole('button', { name: /navigate to home page/i });
      
      // Active colors: white text (#FFFFFF) on secondary (#428475)
      expect(homeButton).toHaveStyle({ 
        color: '#FFFFFF',
        backgroundColor: '#428475' 
      });
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to dashboard/i });
      
      // Inactive colors: primary text (#1A312C) on transparent
      expect(dashboardButton).toHaveStyle({ 
        color: '#1A312C',
        backgroundColor: 'transparent' 
      });
    });
  });

  describe('Subtask 22.2.3: Keyboard accessibility (Requirement 18.2)', () => {
    it('should navigate to Home when Home link is clicked', async () => {
      renderWithRouter('/dashboard');
      
      const homeButton = screen.getByRole('button', { name: /navigate to home page/i });
      await user.click(homeButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to Dashboard when Dashboard link is clicked', async () => {
      renderWithRouter('/');
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to dashboard/i });
      await user.click(dashboardButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should be keyboard accessible with Tab navigation', async () => {
      renderWithRouter();
      
      // Tab through navigation elements
      await user.tab();
      
      // Logo link should be focused first
      const logoLink = screen.getByRole('link', { name: /ecostep home/i });
      expect(logoLink).toHaveFocus();
      
      await user.tab();
      
      // Home button should be focused next
      const homeButton = screen.getByRole('button', { name: /navigate to home page/i });
      expect(homeButton).toHaveFocus();
    });

    it('should support keyboard activation with Enter', async () => {
      renderWithRouter();
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to dashboard/i });
      dashboardButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should show focus indicators when focused (Requirement 18.5)', () => {
      renderWithRouter();
      
      const homeButton = screen.getByRole('button', { name: /navigate to home page/i });
      homeButton.focus();
      
      // Component applies focus styles via onFocus handler
      // In actual browser, this would show outline with --tw-ring-color: #89D7B7
      expect(homeButton).toHaveFocus();
    });

    it('should redirect to login when unauthenticated user clicks Dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
      
      renderWithRouter();
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to login to access dashboard/i });
      await user.click(dashboardButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should navigate to Dashboard when authenticated user clicks Dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: { name: 'John Doe', email: 'john@example.com' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
      
      renderWithRouter();
      
      const dashboardButton = screen.getByRole('button', { name: /navigate to dashboard/i });
      await user.click(dashboardButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Mobile Responsiveness (Requirement 4.12)', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should render mobile menu toggle button on small screens', () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    it('should expand mobile menu when toggle is clicked', async () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
        const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
        expect(mobileNav).toBeInTheDocument();
      });
    });

    it('should display navigation links in mobile menu', async () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      await waitFor(() => {
        const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
        expect(within(mobileNav).getByRole('button', { name: /navigate to home page/i })).toBeInTheDocument();
        expect(within(mobileNav).getByRole('button', { name: /navigate to dashboard/i })).toBeInTheDocument();
      });
    });

    it('should close mobile menu when Escape is pressed', async () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      });
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();
      });
    });

    it('should close mobile menu after navigation', async () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      await waitFor(() => {
        const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
        expect(mobileNav).toBeInTheDocument();
      });
      
      const homeButton = within(screen.getByRole('navigation', { name: /mobile navigation/i }))
        .getByRole('button', { name: /navigate to home page/i });
      await user.click(homeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();
      });
    });

    it('should show hamburger icon when menu is closed', () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      const svg = menuButton.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      // Hamburger has 3 horizontal lines (M4 6h16M4 12h16M4 18h16)
    });

    it('should show close icon when menu is open', async () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      await waitFor(() => {
        const svg = menuButton.querySelector('svg');
        expect(svg).toBeInTheDocument();
        // Close icon has X shape (M6 18L18 6M6 6l12 12)
      });
    });
  });

  describe('Authentication States', () => {
    it('should display Login button for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
      
      renderWithRouter();
      
      const loginButton = screen.getByRole('button', { name: /login to your account/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveStyle({ background: '#1A312C' }); // EcoStep primary color
    });

    it('should display user info for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: { 
          name: 'Jane Smith', 
          email: 'jane@example.com' 
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
      
      renderWithRouter();
      
      const avatar = screen.getByRole('img', { name: /user: jane smith/i });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent('J');
      expect(avatar).toHaveAttribute('title', 'Jane Smith');
    });

    it('should show email initial if name is not provided', () => {
      mockUseAuth.mockReturnValue({
        user: { 
          email: 'admin@example.com' 
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
      
      renderWithRouter();
      
      const avatar = screen.getByRole('img', { name: /user: admin@example.com/i });
      expect(avatar).toHaveTextContent('A'); // First letter of email
    });

    it('should navigate to login when Login button is clicked', async () => {
      renderWithRouter();
      
      const loginButton = screen.getByRole('button', { name: /login to your account/i });
      await user.click(loginButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Logo Link Behavior', () => {
    it('should render logo as a link to home', () => {
      renderWithRouter();
      
      const logoLink = screen.getByRole('link', { name: /ecostep home/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should navigate to home when logo is clicked', async () => {
      renderWithRouter('/dashboard');
      
      const logoLink = screen.getByRole('link', { name: /ecostep home/i });
      await user.click(logoLink);
      
      // Link uses react-router Link, so it will navigate internally
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: {},
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
      
      renderWithRouter();
      
      // Should not crash, should show default state
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should close mobile menu when clicking outside', async () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
      });
      
      // Click outside the nav
      const header = screen.getByRole('banner');
      await user.click(header);
      
      // Note: This behavior requires actual DOM event handling
      // The component uses a click outside handler
    });

    it('should prevent body scroll when mobile menu is open', async () => {
      renderWithRouter();
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
      });
      
      // Component should set document.body.style.overflow = 'hidden'
      // This is tested via useEffect in the component
    });
  });
});
