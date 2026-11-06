import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getUserRole, getPermissions } from '@/lib/permissions';
import { EcoSidebar } from '@/components/layout/EcoSidebar';

// Mock contexts for EcoSidebar
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('EcoStep Milestones Role-Based Access Control & Navigation', () => {
  it('correctly assigns public role to unauthenticated users', () => {
    const role = getUserRole(false, null);
    expect(role).toBe('public');

    const perms = getPermissions(role);
    expect(perms.canAccessDashboard).toBe(true);
    expect(perms.canConfigureMilestones).toBe(false);
    expect(perms.canModifySettings).toBe(false);
  });

  it('correctly assigns admin role to authenticated administrators', () => {
    const mockAdminUser: any = {
      id: 'admin-1',
      email: 'admin@ecostep.local',
      role: 'admin',
      name: 'System Administrator',
    };

    const role = getUserRole(true, mockAdminUser);
    expect(role).toBe('admin');

    const perms = getPermissions(role);
    expect(perms.canConfigureMilestones).toBe(true);
    expect(perms.canModifySettings).toBe(true);
  });

  it('renders Milestones navigation in mobile tab bar for public users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <EcoSidebar>
          <div>Page Content</div>
        </EcoSidebar>
      </MemoryRouter>
    );

    // Primary mobile tabbar navigation includes Milestones
    const mobileMilestonesTabs = screen.getAllByRole('link', { name: /milestones/i });
    expect(mobileMilestonesTabs.length).toBeGreaterThanOrEqual(1);

    // Matches href to /milestones
    const hrefs = mobileMilestonesTabs.map((el) => el.getAttribute('href'));
    expect(hrefs).toContain('/milestones');
  });

  it('renders Milestones navigation in mobile tab bar for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Admin', role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/milestones']}>
        <EcoSidebar>
          <div>Milestones Content</div>
        </EcoSidebar>
      </MemoryRouter>
    );

    const mobileMilestonesTabs = screen.getAllByRole('link', { name: /milestones/i });
    expect(mobileMilestonesTabs.length).toBeGreaterThanOrEqual(1);
    const activeTab = mobileMilestonesTabs.find((el) => el.getAttribute('href') === '/milestones');
    expect(activeTab).toBeDefined();
  });
});
