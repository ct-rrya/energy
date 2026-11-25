import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedbackPage } from './FeedbackPage';
import { feedbackService } from '@/api/services/feedback.service';

const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('@/contexts/HardwareStatusContext', () => ({
  useHardwareStatus: () => ({
    status: 'waiting',
    refreshStatus: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/api/services/feedback.service', () => ({
  feedbackService: {
    getFeedbackList: vi.fn(),
    createFeedback: vi.fn(),
    toggleFeedbackUpvote: vi.fn(),
    updateFeedbackAdmin: vi.fn(),
    deleteFeedback: vi.fn(),
  },
}));

const sampleResponse = {
  success: true,
  data: [
    {
      id: 'fb-1',
      authorName: 'Student Visitor',
      category: 'review' as const,
      rating: 5,
      message: 'Awesome piezo tile! Very cool live power readout.',
      status: 'open' as const,
      upvotes: 4,
      hasUpvoted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
  stats: {
    total: 1,
    openCount: 1,
    resolvedCount: 0,
    averageRating: 5.0,
    ratingCount: 1,
  },
};

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <FeedbackPage />
    </QueryClientProvider>,
  );
}

describe('FeedbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(feedbackService.getFeedbackList).mockResolvedValue(sampleResponse);
  });

  it('allows public visitors to view, upvote, and post feedback without admin controls', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    vi.mocked(feedbackService.createFeedback).mockResolvedValue(sampleResponse.data[0]);
    vi.mocked(feedbackService.toggleFeedbackUpvote).mockResolvedValue({
      ...sampleResponse.data[0],
      upvotes: 5,
      hasUpvoted: true,
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Awesome piezo tile/i)).toBeInTheDocument();
    });

    // Admin controls must NOT appear for public visitors
    expect(screen.queryByRole('button', { name: /mark resolved/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /official reply/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();

    // Upvote
    await user.click(screen.getByRole('button', { name: /upvote feedback from student visitor/i }));
    expect(feedbackService.toggleFeedbackUpvote).toHaveBeenCalledWith('fb-1');

    // Post new feedback with 5-star rating
    await user.click(screen.getByRole('button', { name: /rate 5 out of 5 stars/i }));
    await user.type(screen.getByLabelText(/your name/i), 'Maria');
    await user.type(screen.getByLabelText(/feedback or review/i), 'Works great on campus!');
    await user.click(screen.getByRole('button', { name: /post to board/i }));

    expect(feedbackService.createFeedback).toHaveBeenCalledWith({
      authorName: 'Maria',
      category: 'review',
      rating: 5,
      message: 'Works great on campus!',
    });
  });

  it('displays resolve, official reply, and delete controls for authenticated admins', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'admin-1', name: 'EcoStep Admin', role: 'SYSTEM_ADMIN' },
    });
    vi.mocked(feedbackService.updateFeedbackAdmin).mockResolvedValue({
      ...sampleResponse.data[0],
      status: 'resolved',
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark resolved/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /official reply/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mark resolved/i }));
    expect(feedbackService.updateFeedbackAdmin).toHaveBeenCalledWith('fb-1', {
      status: 'resolved',
      adminReply: undefined,
    });
  });
});
