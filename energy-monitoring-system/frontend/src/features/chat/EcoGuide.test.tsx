import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatHeader } from './components/ChatHeader';
import { SuggestionChips } from './components/SuggestionChips';
import { ChatLauncher } from './components/ChatLauncher';
import { ChatPanel } from './components/ChatPanel';
import api from '@/lib/api';

describe('EcoGuide Frontend Components', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('ChatHeader', () => {
    it('renders EcoGuide title and learning assistant subtitle', () => {
      const onClose = vi.fn();
      const onNewChat = vi.fn();

      render(<ChatHeader onClose={onClose} onNewChat={onNewChat} />);

      expect(screen.getByText('EcoGuide')).toBeInTheDocument();
      expect(screen.getByText(/learning assistant/i)).toBeInTheDocument();
    });

    it('triggers onCollapse and onNewChat callbacks', () => {
      const onCollapse = vi.fn();
      const onNewChat = vi.fn();

      render(<ChatHeader onCollapse={onCollapse} onNewChat={onNewChat} isExpanded={true} isMobile={false} />);

      fireEvent.click(screen.getByLabelText('Start new chat'));
      expect(onNewChat).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByLabelText(/Collapse (EcoGuide|chat)/i));
      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when on mobile', () => {
      const onClose = vi.fn();
      render(<ChatHeader onClose={onClose} onNewChat={vi.fn()} isMobile={true} />);

      fireEvent.click(screen.getByLabelText('Close chat'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('SuggestionChips', () => {
    it('renders educational and milestone suggestion prompts', () => {
      const onChipClick = vi.fn();

      render(<SuggestionChips onChipClick={onChipClick} />);

      expect(
        screen.getByText('What is our milestone goal this month?'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('How does piezoelectricity work?'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('How close are we to this week’s target?'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('What does power generation mean?'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Explain voltage vs current vs power'),
      ).toBeInTheDocument();
    });

    it('invokes onChipClick when a prompt pill is clicked', () => {
      const onChipClick = vi.fn();

      render(<SuggestionChips onChipClick={onChipClick} />);

      fireEvent.click(
        screen.getByText('What is our milestone goal this month?'),
      );
      expect(onChipClick).toHaveBeenCalledWith(
        'What is our milestone goal this month?',
      );
    });
  });

  describe('ChatLauncher (Removed Floating Button)', () => {
    it('renders null so no floating button exists', () => {
      const { container } = render(<ChatLauncher />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Docked ChatPanel', () => {
    it('renders as complementary aside with aria-label="EcoGuide"', () => {
      render(<ChatPanel />);
      const aside = screen.getByRole('complementary', { name: /EcoGuide|Chat/i });
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('docked-chat-panel');
    });

    it('defaults to collapsed on medium screen (< 1280px) and toggles to expanded', () => {
      // Default jsdom width is 1024px (medium screen -> collapsed)
      render(<ChatPanel />);
      const aside = screen.getByRole('complementary', { name: /EcoGuide|Chat/i });
      expect(aside).toHaveClass('collapsed');

      // Rail expand button is present
      const expandBtn = screen.getByLabelText(/Expand (EcoGuide|chat)/i);
      expect(expandBtn).toBeInTheDocument();
      fireEvent.click(expandBtn);
      expect(aside).toHaveClass('expanded');

      // Click collapse button
      const collapseBtn = screen.getByLabelText(/Collapse (EcoGuide|chat)/i);
      fireEvent.click(collapseBtn);
      expect(aside).toHaveClass('collapsed');
    });

    it('honors localStorage expanded setting and toggles with Ctrl+J shortcut', () => {
      localStorage.setItem('ecostep_chat_docked_expanded', 'true');
      render(<ChatPanel />);
      const aside = screen.getByRole('complementary', { name: /EcoGuide|Chat/i });

      expect(aside).toHaveClass('expanded');

      // Press Ctrl+J to collapse
      fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
      expect(aside).toHaveClass('collapsed');

      // Press Ctrl+J to expand
      fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
      expect(aside).toHaveClass('expanded');
    });
  });

  describe('API Session Token Passthrough', () => {
    it('attaches guest session token to chat request headers when stored', async () => {
      const fakeSession = {
        playerId: 'p123',
        username: 'GuestLearner',
        sessionToken: 'gst_test_session_token_xyz',
      };
      localStorage.setItem('ecostep_player_session', JSON.stringify(fakeSession));

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: 'Hello from EcoGuide!',
          suggestions: ['missions', 'guide'],
        }),
      });
      global.fetch = mockFetch;

      await api.chat.sendMessage('Hello EcoGuide');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['x-guest-session']).toBe('gst_test_session_token_xyz');
      expect(options.headers['Authorization']).toBe('Bearer gst_test_session_token_xyz');
    });
  });
});
