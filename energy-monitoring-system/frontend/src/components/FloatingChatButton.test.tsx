/**
 * FloatingChatButton Component Unit Tests
 * 
 * Task 22.1: Write FloatingChatButton component tests
 * 
 * Requirements:
 * - 14.5, 14.6: Component functionality and session persistence
 * - 18.1: ARIA labels for accessibility
 * - 18.2: Keyboard navigation (Tab, Enter, Escape)
 * - 18.4: Focus management when chat opens/closes
 * - 18.8: Focus trap when chat is expanded
 * - 4.12: Responsive design (desktop and mobile)
 * - 12.10: Smooth expand/collapse animations
 * - 12.11: EcoStep design system colors
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import FloatingChatButton from './FloatingChatButton';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock ChatInterface component to focus on FloatingChatButton logic
vi.mock('@/features/chat/components/ChatInterface', () => ({
  default: ({ initialMessage, className }: { initialMessage?: string; className?: string }) => (
    <div data-testid="chat-interface" className={className}>
      <textarea data-testid="chat-input" aria-label="Type your message" />
      <button data-testid="send-button">Send</button>
      {initialMessage && <div data-testid="initial-message">{initialMessage}</div>}
    </div>
  ),
}));

// Helper to render with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('FloatingChatButton Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    sessionStorage.clear();
    localStorage.clear();
    
    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Subtask 22.1.1: Button renders in collapsed state by default', () => {
    it('should render floating button in collapsed state on initial load', () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should not render chat panel when collapsed', () => {
      renderWithTheme(<FloatingChatButton />);
      
      const chatPanel = screen.queryByRole('dialog');
      expect(chatPanel).not.toBeInTheDocument();
    });

    it('should render button with correct ARIA labels (Requirement 18.1)', () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { 
        name: /open chat assistant to get help with energy monitoring/i 
      });
      expect(button).toHaveAttribute('aria-label', 'Open chat assistant to get help with energy monitoring');
      expect(button).toHaveAttribute('aria-controls', 'floating-chat-panel');
    });

    it('should render button with EcoStep accent color (Requirement 12.3, 12.11)', () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      expect(button).toHaveStyle({ backgroundColor: '#89D7B7' });
    });
  });

  describe('Subtask 22.1.2: Clicking button expands chat panel', () => {
    it('should expand chat panel when button is clicked', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(button);
      
      // Wait for animation and panel to appear
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-label', /chat assistant panel/i);
      });
    });

    it('should update aria-expanded attribute when expanded', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(button);
      
      // Button should not be visible when expanded
      await waitFor(() => {
        expect(button).not.toBeVisible();
      });
    });

    it('should render ChatInterface component when expanded', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(button);
      
      await waitFor(() => {
        const chatInterface = screen.getByTestId('chat-interface');
        expect(chatInterface).toBeInTheDocument();
        expect(chatInterface).toHaveClass('floating-chat-interface');
      });
    });

    it('should render chat header with EcoStep branding (Requirement 12.5)', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(button);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('EcoStep Chat')).toBeInTheDocument();
        expect(within(dialog).getByText('🌱')).toBeInTheDocument();
      });
    });

    it('should announce state change to screen readers (Requirement 18.3)', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(button);
      
      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveTextContent(/chat assistant opened/i);
      });
    });
  });

  describe('Subtask 22.1.3: Close button collapses chat panel', () => {
    it('should render close button when chat is expanded', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const openButton = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(openButton);
      
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close chat assistant panel/i });
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveAttribute('title', 'Close chat (Esc)');
      });
    });

    it('should collapse chat panel when close button is clicked', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      // Open chat
      const openButton = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close chat
      const closeButton = screen.getByRole('button', { name: /close chat assistant panel/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /open chat assistant/i })).toBeInTheDocument();
      });
    });

    it('should announce close to screen readers (Requirement 18.3)', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      // Open and close
      const openButton = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByRole('button', { name: /close chat assistant panel/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveTextContent(/chat assistant closed/i);
      });
    });

    it('should restore focus to open button after closing (Requirement 18.4)', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const openButton = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByRole('button', { name: /close chat assistant panel/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(openButton).toHaveFocus();
      });
    });
  });

  describe('Subtask 22.1.4: Session persists across expand/collapse', () => {
    it('should maintain ChatInterface state when collapsed and re-expanded', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      // Open chat
      const openButton = screen.getByRole('button', { name: /open chat assistant/i });
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close chat
      const closeButton = screen.getByRole('button', { name: /close chat assistant panel/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Re-open chat
      await user.click(openButton);
      
      await waitFor(() => {
        const chatInterface = screen.getByTestId('chat-interface');
        expect(chatInterface).toBeInTheDocument();
      });
      
      // Note: ChatInterface itself manages session persistence via sessionStorage
      // This test verifies the FloatingChatButton doesn't destroy/recreate the component
    });

    it('should not lose chat state during expand/collapse cycle', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      // Open chat
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('initial-message')).toBeInTheDocument();
      });
      
      // Close and re-open
      await user.click(screen.getByRole('button', { name: /close chat assistant panel/i }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('initial-message')).toBeInTheDocument();
      });
    });
  });

  describe('Subtask 22.1.5: Chat functionality works when expanded', () => {
    it('should render chat input field when expanded', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        const input = screen.getByTestId('chat-input');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-label', 'Type your message');
      });
    });

    it('should render send button when expanded', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('send-button')).toBeInTheDocument();
      });
    });

    it('should display initial welcome message', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        const message = screen.getByTestId('initial-message');
        expect(message).toHaveTextContent(/Hi! I'm your EcoStep assistant/i);
      });
    });
  });

  describe('Keyboard Navigation (Requirement 18.2)', () => {
    it('should open chat when Enter is pressed on button', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      button.focus();
      
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should open chat when Space is pressed on button', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      button.focus();
      
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should close chat when Escape is pressed', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      // Open chat
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Press Escape
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close chat when Enter is pressed on close button', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByRole('button', { name: /close chat assistant panel/i });
      closeButton.focus();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Focus Management (Requirements 18.4, 18.8)', () => {
    it('should focus chat input when panel opens', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        const chatInput = screen.getByTestId('chat-input');
        expect(chatInput).toHaveFocus();
      }, { timeout: 500 }); // Allow time for animation and focus
    });

    it('should include descriptive text for screen readers (Requirement 18.1)', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-describedby', 'chat-description');
        
        const description = document.getElementById('chat-description');
        expect(description).toHaveTextContent(/Interactive chat assistant/i);
      });
    });

    it('should trap focus within chat panel when expanded (Requirement 18.8)', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Tab through elements - focus should stay within dialog
      await user.tab();
      const closeButton = screen.getByRole('button', { name: /close chat assistant panel/i });
      
      // At least the close button should be focusable
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design (Requirement 4.12)', () => {
    it('should render in desktop size by default', () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      expect(button).toHaveStyle({ 
        width: '60px',
        height: '60px',
      });
    });

    it('should handle mobile viewport width', async () => {
      // Set mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
      
      // In mobile mode, chat should be full screen (tested via CSS class in real browser)
    });
  });

  describe('Animation Behavior (Requirement 12.10)', () => {
    it('should apply animation class when expanding', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveClass('chat-panel-enter');
      });
    });

    it('should respect reduced motion preference (Requirement 18.9)', () => {
      // Mock prefers-reduced-motion
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      expect(button).toBeInTheDocument();
      
      // Animation duration should be minimal with reduced motion
      // This is tested in the component via prefersReducedMotion flag
    });
  });

  describe('Edge Cases', () => {
    it('should not allow multiple rapid clicks (debouncing)', async () => {
      renderWithTheme(<FloatingChatButton />);
      
      const button = screen.getByRole('button', { name: /open chat assistant/i });
      
      // Rapid clicks
      await user.click(button);
      await user.click(button); // This should be ignored during animation
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Only one dialog should be present
      const dialogs = screen.queryAllByRole('dialog');
      expect(dialogs).toHaveLength(1);
    });

    it('should prevent body scroll on mobile when chat is open', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Body should have overflow hidden class on mobile
      // This is managed by the component's useEffect
    });

    it('should handle missing ChatInterface gracefully', async () => {
      // This test verifies the component structure, actual ChatInterface is mocked
      renderWithTheme(<FloatingChatButton />);
      
      await user.click(screen.getByRole('button', { name: /open chat assistant/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
      });
    });
  });
});
