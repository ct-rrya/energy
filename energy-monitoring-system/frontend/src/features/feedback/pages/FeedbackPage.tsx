import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  ThumbsUp,
  CheckCircle2,
  Clock,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Trash2,
  RotateCcw,
  Reply,
  Sparkles,
  Wrench,
  Lightbulb,
  MessageCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import {
  feedbackService,
  type FeedbackCategory,
  type FeedbackItem,
  type FeedbackStatus,
} from '@/api/services/feedback.service';
import { adminChatService } from '@/api/services/adminChat.service';
import { AdminInboxPanel } from '../components/AdminInboxPanel';

const CATEGORY_OPTIONS: Array<{
  value: FeedbackCategory;
  label: string;
  Icon: React.ElementType;
  badgeClass: string;
}> = [
  {
    value: 'review',
    label: 'Review',
    Icon: Sparkles,
    badgeClass: 'bg-emerald-500/15 text-[#19D46A] border-emerald-500/30',
  },
  {
    value: 'suggestion',
    label: 'Suggestion',
    Icon: Lightbulb,
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  {
    value: 'issue',
    label: 'Tile / Bug Issue',
    Icon: Wrench,
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    value: 'general',
    label: 'General',
    Icon: MessageCircle,
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
];

function getCategoryMeta(category: FeedbackCategory) {
  return CATEGORY_OPTIONS.find((c) => c.value === category) || CATEGORY_OPTIONS[3];
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FeedbackPage() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { status: hardwareStatus } = useHardwareStatus();
  const queryClient = useQueryClient();

  const isAdmin = Boolean(isAuthenticated && user);
  const [activeTab, setActiveTab] = useState<'board' | 'inbox'>('board');

  const { data: inboxMeta } = useQuery({
    queryKey: ['admin-chat-threads'],
    queryFn: () => adminChatService.listThreadsForAdmin(),
    enabled: isAdmin,
    refetchInterval: 15_000,
  });
  const unreadInboxCount = inboxMeta?.totalUnread ?? 0;

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FeedbackCategory>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const [page, setPage] = useState(1);

  // Submission form state
  const [authorName, setAuthorName] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('review');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [submitNotice, setSubmitNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin inline reply & delete state
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const queryKey = ['feedback', page, statusFilter, categoryFilter, sortBy];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      feedbackService.getFeedbackList({
        page,
        limit: 15,
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        sort: sortBy,
      }),
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof feedbackService.createFeedback>[0]) =>
      feedbackService.createFeedback(payload),
    onSuccess: () => {
      setAuthorName('');
      setMessage('');
      setRating(0);
      setSubmitNotice({
        type: 'success',
        text: 'Thank you! Your feedback has been posted to the public board.',
      });
      setPage(1);
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        'Could not post feedback right now. Please try again in a moment.';
      setSubmitNotice({
        type: 'error',
        text: Array.isArray(msg) ? msg.join(', ') : String(msg),
      });
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => feedbackService.toggleFeedbackUpvote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  const adminUpdateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminReply,
    }: {
      id: string;
      status?: FeedbackStatus;
      adminReply?: string;
    }) => feedbackService.updateFeedbackAdmin(id, { status, adminReply }),
    onSuccess: () => {
      setReplyingId(null);
      setReplyDraft('');
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feedbackService.deleteFeedback(id),
    onSuccess: () => {
      setConfirmDeleteId(null);
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitNotice(null);
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setSubmitNotice({
        type: 'error',
        text: 'Please write at least 3 characters before posting.',
      });
      return;
    }

    createMutation.mutate({
      authorName: authorName.trim() || undefined,
      category,
      rating: rating > 0 ? rating : undefined,
      message: trimmed,
    });
  };

  const openReplyEditor = (item: FeedbackItem) => {
    setReplyingId(item.id);
    setReplyDraft(item.adminReply || '');
  };

  const items = data?.data || [];
  const meta = data?.meta;
  const stats = data?.stats;

  return (
    <div className="page">
      <DashboardHeader
        greeting="Community & Reviews"
        title="Feedback Board"
        subtitle="Share reviews, suggestions, or report tile issues — everyone can see status updates and admin responses"
        systemStatus={hardwareStatus}
        onRefresh={async () => {
          await refetch();
        }}
      />

      {/* Admin-only Tab Switcher: Public Feedback Board vs Direct Messages Inbox */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
              activeTab === 'board'
                ? 'bg-[var(--acc)] text-white dark:text-[#04210f] border-transparent'
                : 'bg-[var(--panel)] text-[var(--t)] border-[var(--line)] hover:bg-[var(--soft)]'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Public Feedback Board</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-[var(--acc)] text-white dark:text-[#04210f] border-transparent'
                : 'bg-[var(--panel)] text-[var(--t)] border-[var(--line)] hover:bg-[var(--soft)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Direct Messages</span>
            {unreadInboxCount > 0 && (
              <span
                className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center ${
                  activeTab === 'inbox'
                    ? 'bg-white/25 text-white dark:bg-black/20 dark:text-[#04210f]'
                    : 'bg-[var(--acc)] text-white dark:text-[#04210f]'
                }`}
              >
                {unreadInboxCount}
              </span>
            )}
          </button>
        </div>
      )}

      {isAdmin && activeTab === 'inbox' ? (
        <AdminInboxPanel />
      ) : (
        <>
      {/* Clean inline summary strip (no floating pill boxes) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs text-[var(--mu)] px-0.5">
        <span>
          <strong className="text-[var(--t)] tabular-nums">{stats?.total ?? 0}</strong> posts
        </span>
        <span className="opacity-40">·</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <strong className="text-[var(--t)] tabular-nums">{stats?.openCount ?? 0}</strong> open
        </span>
        <span className="opacity-40">·</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#19D46A]" />
          <strong className="text-[var(--t)] tabular-nums">{stats?.resolvedCount ?? 0}</strong> resolved
        </span>
        <span className="opacity-40">·</span>
        <span className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <strong className="text-[var(--t)] tabular-nums">
            {stats?.averageRating !== null && stats?.averageRating !== undefined
              ? stats.averageRating.toFixed(1)
              : '--'}
          </strong>
          <span className="opacity-75">({stats?.ratingCount ?? 0})</span>
        </span>
      </div>

      {/* Main Responsive Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Left: Slim Submit Feedback Composer */}
        <section className="cd !p-4 xl:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-[#19D46A] border border-emerald-500/25 shrink-0">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--t)] m-0">Post Feedback</h2>
              <p className="text-[11px] text-[var(--mu)] m-0">Visible to the EcoStep community</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Category Pills */}
            <div>
              <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mu)] mb-1">
                Category
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORY_OPTIONS.map((opt) => {
                  const Icon = opt.Icon;
                  const active = category === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500/15 border-[#19D46A] text-[#19D46A]'
                          : 'bg-[var(--soft)] border-[var(--line)] text-[var(--mu)] hover:text-[var(--t)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Star Rating */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mu)]">
                  Star Rating (Optional)
                </label>
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-[11px] text-[var(--mu)] hover:text-[var(--t)] underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${star} out of 5 stars`}
                      className="p-0.5 rounded-md hover:bg-[var(--soft)] transition-transform active:scale-90 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          filled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[var(--mu)] opacity-45'
                        }`}
                      />
                    </button>
                  );
                })}
                {rating > 0 && (
                  <span className="text-xs font-semibold text-amber-400 ml-1">
                    {rating} / 5
                  </span>
                )}
              </div>
            </div>

            {/* Optional Name */}
            <div>
              <label
                htmlFor="feedback-author"
                className="block text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mu)] mb-1"
              >
                Your Name (Optional)
              </label>
              <input
                id="feedback-author"
                type="text"
                maxLength={60}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Leave blank to post as Anonymous"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--line)] text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A] transition-colors"
                style={{ backgroundColor: isDark ? '#12241A' : 'var(--soft)' }}
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="feedback-message"
                  className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mu)]"
                >
                  Feedback or Review
                </label>
                <span className="text-[10.5px] text-[var(--mu)] tabular-nums">
                  {message.length}/1000
                </span>
              </div>
              <textarea
                id="feedback-message"
                rows={3}
                required
                minLength={3}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your experience, suggest an improvement, or report a tile issue..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--line)] text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A] transition-colors resize-y"
                style={{ backgroundColor: isDark ? '#12241A' : 'var(--soft)' }}
              />
            </div>

            {submitNotice && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-start gap-2 ${
                  submitNotice.type === 'success'
                    ? isDark
                      ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : isDark
                    ? 'bg-red-500/15 border border-red-500/35 text-red-300'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {submitNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#19D46A]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                )}
                <span>{submitNotice.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending || message.trim().length < 3}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Post to Board
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right: Single Unified Flat Feed Container (Toolbar + Divided List Rows) */}
        <section className="cd !p-0 overflow-hidden xl:col-span-8">
          {/* Flush Filter & Sort Header Bar */}
          <div className="px-4 py-2.5 border-b border-[var(--line)] bg-[var(--soft)]/40 flex flex-wrap items-center justify-between gap-2.5">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'open', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#19D46A] text-[#0D1B14]'
                      : 'text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)]'
                  }`}
                >
                  {st === 'all' ? 'All' : st === 'open' ? 'Open' : 'Resolved'}
                </button>
              ))}
            </div>

            {/* Category & Sort Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as 'all' | FeedbackCategory);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] focus:outline-none focus:border-[#19D46A] cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Sort feedback"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'newest' | 'top');
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] focus:outline-none focus:border-[#19D46A] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="top">Most Upvoted</option>
              </select>
            </div>
          </div>

          {/* Loading / Error / Empty / Unified Divided List */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[var(--mu)] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#19D46A]" />
              <span className="text-xs">Loading community feedback...</span>
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-2.5">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
              <p className="text-sm text-[var(--t)] font-semibold m-0">
                Unable to load feedback right now
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#19D46A] text-[#0D1B14] cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center space-y-1.5">
              <MessageCircle className="w-7 h-7 text-[var(--mu)] opacity-50 mx-auto" />
              <p className="text-sm font-semibold text-[var(--t)] m-0">No feedback posts yet</p>
              <p className="text-xs text-[var(--mu)] m-0">
                Be the first to share a review, suggestion, or report an issue on the left.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {items.map((item) => {
                const catMeta = getCategoryMeta(item.category);
                const CatIcon = catMeta.Icon;
                const isResolved = item.status === 'resolved';

                return (
                  <article
                    key={item.id}
                    className="px-4 py-3.5 hover:bg-[var(--soft)]/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Compact Upvote Button */}
                      <button
                        type="button"
                        onClick={() => upvoteMutation.mutate(item.id)}
                        disabled={upvoteMutation.isPending}
                        aria-label={`Upvote feedback from ${item.authorName}`}
                        className={`flex flex-col items-center justify-center min-w-[40px] py-1.5 px-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                          item.hasUpvoted
                            ? 'bg-emerald-500/15 border-[#19D46A] text-[#19D46A]'
                            : 'bg-[var(--soft)] border-[var(--line)] text-[var(--mu)] hover:border-[#19D46A]/60 hover:text-[var(--t)]'
                        }`}
                      >
                        <ThumbsUp
                          className={`w-3 h-3 mb-0.5 ${
                            item.hasUpvoted ? 'fill-current' : ''
                          }`}
                        />
                        <span className="tabular-nums">{item.upvotes}</span>
                      </button>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Meta Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-[var(--t)]">
                              {item.authorName}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${catMeta.badgeClass}`}
                            >
                              <CatIcon className="w-2.5 h-2.5" />
                              {catMeta.label}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                isResolved
                                  ? 'bg-emerald-500/15 text-[#19D46A] border-emerald-500/35'
                                  : 'bg-amber-500/15 text-amber-400 border-amber-500/35'
                              }`}
                            >
                              {isResolved ? (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              ) : (
                                <Clock className="w-2.5 h-2.5" />
                              )}
                              {isResolved ? 'Resolved' : 'Open'}
                            </span>
                            {item.rating && item.rating > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 ml-0.5"
                                aria-label={`${item.rating} out of 5 stars`}
                              >
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= item.rating!
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-[var(--mu)] opacity-25'
                                    }`}
                                  />
                                ))}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--mu)]">
                            {formatRelativeDate(item.createdAt)}
                          </span>
                        </div>

                        {/* Message Body */}
                        <p className="text-[13.5px] text-[var(--t)] leading-relaxed whitespace-pre-wrap break-words m-0">
                          {item.message}
                        </p>

                        {/* Official Admin Reply */}
                        {item.adminReply && (
                          <div className="mt-1.5 pl-3 py-1.5 border-l-2 border-[#19D46A] bg-emerald-500/5 rounded-r-lg space-y-0.5">
                            <div className="flex items-center justify-between gap-2 text-[11px] pr-2">
                              <span className="inline-flex items-center gap-1 font-semibold text-[#19D46A]">
                                <ShieldCheck className="w-3 h-3" />
                                Admin Reply{item.adminReplyBy ? ` · ${item.adminReplyBy}` : ''}
                              </span>
                              {item.adminReplyAt && (
                                <span className="text-[var(--mu)]">
                                  {formatRelativeDate(item.adminReplyAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--t)] leading-relaxed whitespace-pre-wrap m-0 pr-2">
                              {item.adminReply}
                            </p>
                          </div>
                        )}

                        {/* Admin Moderation Controls */}
                        {isAdmin && (
                          <div className="pt-2 mt-1.5 border-t border-[var(--line)]/60 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={adminUpdateMutation.isPending}
                                onClick={() =>
                                  adminUpdateMutation.mutate({
                                    id: item.id,
                                    status: isResolved ? 'open' : 'resolved',
                                  })
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                  isResolved
                                    ? 'bg-[var(--soft)] text-[var(--t)] border border-[var(--line)] hover:bg-[var(--panel)]'
                                    : 'bg-[#19D46A] text-[#0D1B14] hover:opacity-90'
                                }`}
                              >
                                {isResolved ? (
                                  <>
                                    <RotateCcw className="w-3 h-3" />
                                    Reopen
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    Mark Resolved
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  replyingId === item.id
                                    ? setReplyingId(null)
                                    : openReplyEditor(item)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--soft)] text-[var(--t)] border border-[var(--line)] hover:border-[#19D46A] transition-colors cursor-pointer"
                              >
                                <Reply className="w-3 h-3" />
                                {item.adminReply ? 'Edit Reply' : 'Official Reply'}
                              </button>

                              {confirmDeleteId === item.id ? (
                                <span className="inline-flex items-center gap-1.5 ml-auto">
                                  <button
                                    type="button"
                                    disabled={deleteMutation.isPending}
                                    onClick={() => deleteMutation.mutate(item.id)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                                  >
                                    Confirm Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 rounded-lg text-[11px] text-[var(--mu)] hover:text-[var(--t)] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors ml-auto cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              )}
                            </div>

                            {/* Inline Admin Reply Editor */}
                            {replyingId === item.id && (
                              <div className="space-y-2 p-2.5 rounded-lg bg-[var(--soft)] border border-[var(--line)]">
                                <textarea
                                  rows={2}
                                  maxLength={1000}
                                  value={replyDraft}
                                  onChange={(e) => setReplyDraft(e.target.value)}
                                  placeholder="Write an official admin response (visible to everyone)..."
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--line)] text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A]"
                                  style={{ backgroundColor: isDark ? '#0D1B14' : '#FFFFFF' }}
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setReplyingId(null)}
                                    className="px-2.5 py-1 rounded-lg text-xs text-[var(--mu)] hover:text-[var(--t)] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={adminUpdateMutation.isPending}
                                    onClick={() =>
                                      adminUpdateMutation.mutate({
                                        id: item.id,
                                        adminReply: replyDraft,
                                      })
                                    }
                                    className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-[#19D46A] text-[#0D1B14] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                  >
                                    Save Reply
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Flush Pagination Footer */}
          {meta && meta.totalPages > 1 && (
            <div className="px-4 py-2.5 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--mu)]">
              <span>
                Page {meta.page} of {meta.totalPages} ({meta.total} posts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
        </>
      )}
    </div>
  );
}
