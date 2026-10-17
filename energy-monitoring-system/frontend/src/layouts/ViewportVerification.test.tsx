import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

describe('Viewport Breakpoint Verification (320px, 375px, 430px, 768px, 1024px, 1440px)', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { name: 'Apple Admin', role: 'SYSTEM_ADMIN' },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderLayoutAtWidth = (width: number) => {
    window.innerWidth = width;
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div data-testid="page-content">Viewport {width}px Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );
  };

  it('verifies 320px mobile viewport (iPhone SE compact)', () => {
    renderLayoutAtWidth(320);
    expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/toggle sidebar/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('verifies 375px mobile viewport (Standard phone)', () => {
    renderLayoutAtWidth(375);
    expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/toggle sidebar/i)).not.toBeInTheDocument();
  });

  it('verifies 430px mobile viewport (Large phone)', () => {
    renderLayoutAtWidth(430);
    expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/toggle sidebar/i)).not.toBeInTheDocument();
  });

  it('verifies 768px tablet viewport (iPad Mini/Tablet portrait)', () => {
    renderLayoutAtWidth(768);
    expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/toggle sidebar/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('verifies 1024px desktop viewport (Laptop / Desktop)', () => {
    renderLayoutAtWidth(1024);
    expect(screen.getByLabelText(/toggle sidebar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ecostep home/i)).toBeInTheDocument();
  });

  it('verifies 1440px desktop viewport (Wide desktop)', () => {
    renderLayoutAtWidth(1440);
    expect(screen.getByLabelText(/toggle sidebar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ecostep home/i)).toBeInTheDocument();
  });

  it('verifies dynamic switching when resizing window from 375px to 1440px', async () => {
    const { rerender } = renderLayoutAtWidth(375);
    expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();

    act(() => {
      window.innerWidth = 1440;
      window.dispatchEvent(new Event('resize'));
    });

    rerender(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div data-testid="page-content">Resized Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/toggle sidebar/i)).toBeInTheDocument();
  });
});
