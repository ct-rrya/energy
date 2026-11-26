import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Plus,
  Send,
  Sparkles,
  Wrench,
  Lightbulb,
  MessageCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Eye,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalVisitor } from '@/contexts/VisitorContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { Dialog } from '@/components/ui/Dialog';
import { ROUTES } from '@/routes/routes.config';
import {
  feedbackService,
  type FeedbackCategory,
  type FeedbackTab,
} from '@/api/services/feedback.service';

const CATEGORY_OPTIONS: Array<{
  value: FeedbackCategory;
  label: string;
  Icon: React.ElementType;
}> = [
  { value: 'issue', label: 'Tile / Bug Issue', Icon: Wrench },
  { value: 'suggestion', label: 'Suggestion', Icon: Lightbulb },
  { value: 'review', label: 'Review', Icon: Sparkles },
  { value: 'general', label: 'General', Icon: MessageCircle },
];

const FOLDER_TABS: Array<{ id: FeedbackTab; label: string }> = [
  { id: 'newest', label: 'Newest' },
  { id: 'top', label: 'Most Voted' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'resolved', label: 'Resolved' },
];

function formatPostedAgo(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FeedbackPage() {
  const { isAuthenticated, user } = useAuth();
  const visitor = useOptionalVisitor();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { status: hardwareStatus } = useHardwareStatus();
  const queryClient = useQueryClient();

  const isAdmin = Boolean(isAuthenticated && user);
  const activeAuthorName = isAdmin
    ? user?.name || 'EcoStep Admin'
    : visitor?.nickname || 'EcoGuest';

  const [activeTab, setActiveTab] = useState<FeedbackTab>('newest');
  const [page, setPage] = useState(1);

  // Composer Modal state
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('issue');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [submitNotice, setSubmitNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feedback', page, activeTab],
    queryFn: () =>
      feedbackService.getFeedbackList({
        page,
        limit: 15,
        tab: activeTab,
      }),
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof feedbackService.createFeedback>[0]) =>
      feedbackService.createFeedback(payload),
    onSuccess: () => {
      setTitle('');
      setMessage('');
      setRating(0);
      setSubmitNotice(null);
      setComposerOpen(false);
      setActiveTab('newest');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitNotice(null);
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (trimmedTitle.length < 3) {
      setSubmitNotice({
        type: 'error',
        text: 'Please enter a short problem title (at least 3 characters).',
      });
      return;
    }
    if (trimmedMessage.length < 3) {
      setSubmitNotice({
        type: 'error',
        text: 'Please provide details (at least 3 characters) before posting.',
      });
      return;
    }

    createMutation.mutate({
      title: trimmedTitle,
      authorName: activeAuthorName,
      category,
      rating: category === 'review' && rating > 0 ? rating : undefined,
      message: trimmedMessage,
    });
  };

  const items = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="page">
      <DashboardHeader
        greeting="Community Q&A & Reviews"
        title="ECommunity"
        subtitle="Click any topic to view full details, community answers, and official admin responses"
        systemStatus={hardwareStatus}
        onRefresh={async () => {
          await refetch();
        }}
      />

      {/* Top Folder Tabs Row + Top-Right "New Post / Ask Question" Button */}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
        {/* Record-Folder Tabs */}
        <div
          className="flex flex-wrap items-end gap-1 max-w-full"
          role="tablist"
          aria-label="ECommunity folder tabs"
        >
          {FOLDER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`relative px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--card-bg)] text-[var(--t)] border-[var(--line)] -mb-px z-10 pb-2.5'
                    : 'bg-transparent text-[var(--mu)] border-transparent hover:text-[var(--t)] hover:bg-[var(--card-bg)]/50'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full bg-[var(--acc)]"
                    aria-hidden="true"
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Top-Right Stack Overflow–style Primary Button */}
        <button
          type="button"
          onClick={() => {
            setSubmitNotice(null);
            setComposerOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 mb-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-[0.99] shrink-0"
          style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Post / Ask Question</span>
        </button>
      </div>

      {/* Connected Record-Folder Content Sheet (Clean, Non-Boxy Flat List) */}
      <section className="rounded-b-2xl rounded-tr-2xl border border-[var(--line)] bg-[var(--card-bg)] overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[var(--mu)] gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#19D46A]" />
            <span className="text-xs">Loading community topics...</span>
          </div>
        ) : error ? (
          <div className="py-14 text-center space-y-2.5 px-4">
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
          <div className="py-16 text-center space-y-2 px-4">
            <MessageCircle className="w-7 h-7 text-[var(--mu)] opacity-50 mx-auto" />
            <p className="text-sm font-semibold text-[var(--t)] m-0">
              No posts in this folder yet
            </p>
            <p className="text-xs text-[var(--mu)] m-0">
              Click <strong>New Post / Ask Question</strong> above to start a topic.
            </p>
          </div>
        ) : (
          <>
            {/* Flat ECommunity List: Title + 2-Line Snippet + Compact Metadata Row */}
            <div className="divide-y divide-[var(--line)]">
              {items.map((item) => {
                const voteCount = item.upvotes ?? 0;
                const commentCount = item.answersCount ?? item.answers?.length ?? 0;
                const viewCount = item.views ?? 0;
                const postedAgo = formatPostedAgo(item.createdAt);

                return (
                  <Link
                    key={item.id}
                    to={`${ROUTES.FEEDBACK}/${item.id}`}
                    className="block px-5 sm:px-6 py-4 hover:bg-[var(--soft)]/45 transition-colors group no-underline"
                  >
                    <h3 className="text-[15.5px] sm:text-[16.5px] font-semibold leading-snug m-0 text-[#0284C7] dark:text-[#38BDF8] group-hover:underline">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 mb-0 text-[13.5px] leading-relaxed text-[var(--mu)] line-clamp-2">
                      {item.message}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11.5px] text-[var(--mu)]">
                      {/* Left: Upvotes, Comments, Views */}
                      <div className="flex items-center gap-3.5 tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <ChevronUp className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
                        </span>
                      </div>

                      {/* Right: Poster + Posted X ago */}
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="text-[var(--t)]/85 font-medium">{item.authorName || 'Anonymous'}</span>
                        </span>
                        {postedAgo && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>posted {postedAgo}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="px-5 sm:px-6 py-3.5 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--mu)]">
                <span>
                  Page {meta.page} of {meta.totalPages} ({meta.total} topics)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* New Post / Ask Question Composer Dialog */}
      <Dialog
        open={composerOpen}
        onClose={() => {
          if (!createMutation.isPending) setComposerOpen(false);
        }}
        title="New Post / Ask Question"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Active Identity Caption (Flat, no box) */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--mu)]">
            <User className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
            <span className="truncate">
              Posting as <strong className="text-[var(--t)]">{activeAuthorName}</strong>
            </span>
          </div>

          {/* Main Problem / Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="feedback-title"
                className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]"
              >
                Title / Main Problem
              </label>
              <span className="text-[10.5px] text-[var(--mu)] tabular-nums">
                {title.length}/160
              </span>
            </div>
            <input
              id="feedback-title"
              type="text"
              maxLength={160}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Tile voltage drops when multiple people step quickly"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A] transition-colors"
              style={{ backgroundColor: isDark ? '#12241A' : 'var(--soft)' }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)] mb-1.5">
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
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
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

          {/* Details */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="feedback-message"
                className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]"
              >
                Details
              </label>
              <span className="text-[10.5px] text-[var(--mu)] tabular-nums">
                {message.length}/2000
              </span>
            </div>
            <textarea
              id="feedback-message"
              rows={5}
              maxLength={2000}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue, question, suggestion, or review in detail..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A] transition-colors resize-y"
              style={{ backgroundColor: isDark ? '#12241A' : 'var(--soft)' }}
            />
          </div>

          {/* Optional Star Rating (Review posts only) */}
          {category === 'review' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
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
          )}

          {submitNotice && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-start gap-2 ${
                submitNotice.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400'
                  : 'bg-red-500/15 border border-red-500/35 text-red-400'
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--mu)] hover:text-[var(--t)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                title.trim().length < 3 ||
                message.trim().length < 3
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-90"
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
                  Publish Post
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
