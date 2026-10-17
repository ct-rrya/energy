import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

describe('Responsive Dashboard Layout Architecture', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { name: 'Admin User', role: 'SYSTEM_ADMIN' },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Desktop layout with EcoSidebar when width >= 1024px', () => {
    window.innerWidth = 1280;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div>Desktop Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    // Desktop EcoSidebar elements
    expect(screen.getByLabelText(/ecostep home/i)).toBeInTheDocument();
    expect(screen.getByText('Desktop Content')).toBeInTheDocument();
    expect(screen.getByLabelText(/toggle sidebar/i)).toBeInTheDocument();
  });

  it('renders Mobile layout with MobileHeader when width < 768px', async () => {
    window.innerWidth = 375;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div>Mobile Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    // Mobile header elements
    expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
    expect(screen.getByText('Mobile Content')).toBeInTheDocument();

    // Clicking menu button opens MobileNavDrawer
    const menuButton = screen.getByLabelText(/open navigation menu/i);
    await user.click(menuButton);

    expect(screen.getByLabelText(/mobile navigation drawer/i)).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('System Administrator')).toBeInTheDocument();
  });

  it('renders Tablet layout when width is between 768px and 1023px', () => {
    window.innerWidth = 834;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div>Tablet Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
    expect(screen.getByText('Tablet Content')).toBeInTheDocument();
  });

  it('closes mobile drawer when close button or backdrop is clicked', async () => {
    window.innerWidth = 414;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    // Open drawer
    await user.click(screen.getByLabelText(/open navigation menu/i));
    expect(screen.getByLabelText(/mobile navigation drawer/i)).toBeInTheDocument();

    // Close drawer via close button
    const closeBtn = screen.getByLabelText(/close menu/i);
    await user.click(closeBtn);

    expect(screen.queryByLabelText(/mobile navigation drawer/i)).not.toBeInTheDocument();
  });
});
