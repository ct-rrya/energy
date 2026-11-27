import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  ShieldCheck,
  Sparkles,
  Wrench,
  Lightbulb,
  MessageCircle,
  Star,
  Send,
  Trash2,
  RotateCcw,
  Loader2,
  AlertCircle,
  User,
  CornerDownRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalVisitor } from '@/contexts/VisitorContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSocket } from '@/contexts/SocketContext';
import { ROUTES } from '@/routes/routes.config';
import {
  feedbackService,
  type FeedbackAnswer,
  type FeedbackCategory,
  type FeedbackStatus,
  type VoteDirection,
} from '@/api/services/feedback.service';

const CATEGORY_META: Record<
  FeedbackCategory,
  { label: string; Icon: React.ElementType; badgeClass: string }
> = {
  review: {
    label: 'Review',
    Icon: Sparkles,
    badgeClass: 'bg-emerald-500/15 text-[#19D46A] border-emerald-500/30',
  },
  suggestion: {
    label: 'Suggestion',
    Icon: Lightbulb,
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  issue: {
    label: 'Tile / Bug Issue',
    Icon: Wrench,
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  general: {
    label: 'General',
    Icon: MessageCircle,
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
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

interface VoteColumnProps {
  upvoteCount: number;
  downvoteCount: number;
  userVote?: VoteDirection | null;
  onVote: (direction: VoteDirection) => void;
  disabled?: boolean;
  isAccepted?: boolean;
  canAccept?: boolean;
  onToggleAccept?: () => void;
}

function VoteColumn({
  upvoteCount,
  downvoteCount,
  userVote,
  onVote,
  disabled,
  isAccepted,
  canAccept,
  onToggleAccept,
}: VoteColumnProps) {
  return (
    <div className="flex flex-col items-stretch gap-1.5 shrink-0 min-w-[54px]">
      <button
        type="button"
        onClick={() => onVote('up')}
        disabled={disabled}
        aria-label={`Upvote (${upvoteCount})`}
        aria-pressed={userVote === 'up'}
        title={`Upvote (${upvoteCount})`}
        className={`h-8 px-2.5 rounded-full border inline-flex items-center justify-center gap-1 text-xs font-semibold tabular-nums transition-all cursor-pointer disabled:opacity-50 ${
          userVote === 'up'
            ? 'bg-emerald-500/20 border-[#19D46A] text-[#19D46A]'
            : 'bg-[var(--soft)] border-[var(--line)] text-[var(--mu)] hover:border-[#19D46A]/60 hover:text-[var(--t)]'
        }`}
      >
        <ChevronUp className="w-4 h-4 stroke-[2.4] shrink-0" />
        <span>{upvoteCount}</span>
      </button>

      <button
        type="button"
        onClick={() => onVote('down')}
        disabled={disabled}
        aria-label={`Downvote (${downvoteCount})`}
        aria-pressed={userVote === 'down'}
        title={`Downvote (${downvoteCount})`}
        className={`h-8 px-2.5 rounded-full border inline-flex items-center justify-center gap-1 text-xs font-semibold tabular-nums transition-all cursor-pointer disabled:opacity-50 ${
          userVote === 'down'
            ? 'bg-red-500/15 border-red-400 text-red-400'
            : 'bg-[var(--soft)] border-[var(--line)] text-[var(--mu)] hover:border-red-400/60 hover:text-[var(--t)]'
        }`}
      >
        <ChevronDown className="w-4 h-4 stroke-[2.4] shrink-0" />
        <span>{downvoteCount}</span>
      </button>

      {canAccept ? (
        <button
          type="button"
          onClick={onToggleAccept}
          title={isAccepted ? 'Unmark accepted answer' : 'Mark as accepted answer'}
          aria-label={isAccepted ? 'Unmark accepted answer' : 'Mark as accepted answer'}
          className={`mt-1 mx-auto w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            isAccepted
              ? 'bg-[#19D46A] border-[#19D46A] text-[#0D1B14]'
              : 'border-[var(--line)] text-[var(--mu)] hover:border-[#19D46A] hover:text-[#19D46A]'
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.6]" />
        </button>
      ) : isAccepted ? (
        <div
          className="mt-1 mx-auto w-8 h-8 rounded-full bg-[#19D46A]/20 border border-[#19D46A] text-[#19D46A] flex items-center justify-center"
          title="Accepted Answer"
        >
          <Check className="w-4 h-4 stroke-[2.6]" />
        </div>
      ) : null}
    </div>
  );
}

export function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const visitor = useOptionalVisitor();
  const { theme } = useTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const isAdmin = Boolean(isAuthenticated && user);
  const activeAuthorName = isAdmin
    ? user?.name || 'EcoStep Admin'
    : visitor?.nickname || 'EcoGuest';

  const [answerBody, setAnswerBody] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [collapsedThreads, setCollapsedThreads] = useState<Record<string, boolean>>({});
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const countedViewForIdRef = useRef<string | null>(null);

  const detailQueryKey = ['feedback', 'detail', id, isAdmin ? user?._id ?? 'admin' : 'visitor'];

  const { data: post, isLoading, error } = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => {
      const alreadyCounted = countedViewForIdRef.current === id;
      if (!alreadyCounted && id) {
        countedViewForIdRef.current = id;
      }
      return feedbackService.getFeedbackById(id!, { noCount: alreadyCounted });
    },
    enabled: Boolean(id),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  // Real-time Socket.IO sync for live votes, comments, replies, and status changes
  useEffect(() => {
    if (!socket || !id) return;
    const handleFeedbackUpdate = (payload?: { action?: string; feedbackId?: string }) => {
      if (payload?.feedbackId && payload.feedbackId !== id) return;
      if (payload?.action === 'deleted') {
        void queryClient.invalidateQueries({ queryKey: ['feedback'] });
        navigate(ROUTES.FEEDBACK);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['feedback', 'detail', id] });
    };
    socket.on('feedback:updated', handleFeedbackUpdate);
    return () => {
      socket.off('feedback:updated', handleFeedbackUpdate);
    };
  }, [socket, id, queryClient, navigate]);

  const votePostMutation = useMutation({
    mutationFn: (direction: VoteDirection) =>
      feedbackService.voteFeedbackPost(id!, direction),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailQueryKey, updated);
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  const addAnswerMutation = useMutation({
    mutationFn: (payload: { body: string; parentAnswerId?: string }) =>
      feedbackService.createFeedbackAnswer(id!, {
        body: payload.body,
        authorName: activeAuthorName,
        ...(payload.parentAnswerId ? { parentAnswerId: payload.parentAnswerId } : {}),
        ...(honeypot ? { website: honeypot } : {}),
      }),
    onSuccess: (updated, variables) => {
      if (variables.parentAnswerId) {
        setReplyBody('');
        setReplyError(null);
        setReplyingToId(null);
      } else {
        setAnswerBody('');
        setAnswerError(null);
      }
      queryClient.setQueryData(detailQueryKey, updated);
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
    onError: (err: any, variables) => {
      const msg =
        err?.response?.data?.message || 'Could not post your reply. Please try again.';
      const text = Array.isArray(msg) ? msg.join(', ') : String(msg);
      if (variables.parentAnswerId) {
        setReplyError(text);
      } else {
        setAnswerError(text);
      }
    },
  });

  const voteAnswerMutation = useMutation({
    mutationFn: ({ answerId, direction }: { answerId: string; direction: VoteDirection }) =>
      feedbackService.voteFeedbackAnswer(id!, answerId, direction),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailQueryKey, updated);
    },
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: (answerId: string) =>
      feedbackService.toggleAcceptFeedbackAnswer(id!, answerId),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailQueryKey, updated);
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: (answerId: string) =>
      feedbackService.deleteFeedbackAnswer(id!, answerId),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailQueryKey, updated);
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: FeedbackStatus) =>
      feedbackService.updateFeedbackAdmin(id!, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailQueryKey, updated);
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: () => feedbackService.deleteFeedback(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
      navigate(ROUTES.FEEDBACK);
    },
  });

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAnswerError(null);
    const trimmed = answerBody.trim();
    if (trimmed.length < 2) {
      setAnswerError('Please write at least 2 characters for your answer.');
      return;
    }
    addAnswerMutation.mutate({ body: trimmed });
  };

  const handleReplySubmit = (e: React.FormEvent, parentAnswerId: string) => {
    e.preventDefault();
    setReplyError(null);
    const trimmed = replyBody.trim();
    if (trimmed.length < 2) {
      setReplyError('Please write at least 2 characters for your reply.');
      return;
    }
    addAnswerMutation.mutate({ body: trimmed, parentAnswerId });
  };

  const toggleThreadCollapse = (answerId: string) => {
    setCollapsedThreads((prev) => ({ ...prev, [answerId]: !prev[answerId] }));
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-[var(--mu)]">
          <Loader2 className="w-6 h-6 animate-spin text-[#19D46A]" />
          <span className="text-xs">Loading discussion...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page">
        <Link
          to={ROUTES.FEEDBACK}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--mu)] hover:text-[var(--t)] mb-4 no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ECommunity
        </Link>
        <div className="py-16 text-center space-y-2 border border-[var(--line)] rounded-2xl bg-[var(--panel)]">
          <AlertCircle className="w-7 h-7 text-red-400 mx-auto" />
          <p className="text-sm font-semibold text-[var(--t)] m-0">
            This feedback topic could not be found
          </p>
        </div>
      </div>
    );
  }

  const catMeta = CATEGORY_META[post.category] || CATEGORY_META.general;
  const CatIcon = catMeta.Icon;
  const supportsResolution = post.category === 'issue' || post.category === 'suggestion';
  const isResolved = supportsResolution && post.status === 'resolved';
  const answers = post.answers || [];
  const hasLegacyAdminReply = Boolean(post.adminReply && answers.length === 0);
  const totalAnswerCount = answers.length + (hasLegacyAdminReply ? 1 : 0);

  return (
    <div className="page max-w-4xl">
      {/* Top Back Navigation + Admin Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link
          to={ROUTES.FEEDBACK}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--mu)] hover:text-[var(--t)] transition-colors no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ECommunity</span>
        </Link>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {supportsResolution && (
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate(isResolved ? 'open' : 'resolved')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] hover:border-[#19D46A] transition-colors cursor-pointer"
              >
                {isResolved ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#19D46A]" />
                    <span>Mark Resolved</span>
                  </>
                )}
              </button>
            )}

            {confirmDeletePost ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={deletePostMutation.isPending}
                  onClick={() => deletePostMutation.mutate()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white cursor-pointer"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeletePost(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-[var(--mu)] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeletePost(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Problem / Question Section (Flat, Open Layout) */}
      <article className="pb-7 border-b border-[var(--line)]">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--t)] leading-snug m-0">
          {post.title}
        </h1>

        {/* Metadata Strip (lives strictly on Detail Page) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pb-4 border-b border-[var(--line)] text-xs text-[var(--mu)]">
          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>
              Asked by <strong className="text-[var(--t)]">{post.authorName}</strong>
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeDate(post.createdAt)}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="tabular-nums">
              {post.views ?? 0} {(post.views ?? 0) === 1 ? 'view' : 'views'}
            </span>
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${catMeta.badgeClass}`}
          >
            <CatIcon className="w-3 h-3" />
            {catMeta.label}
          </span>
          {supportsResolution && (
            <span
              className={`inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isResolved
                  ? 'bg-emerald-500/15 text-[#19D46A] border-emerald-500/35'
                  : 'bg-[var(--soft)] text-[var(--mu)] border-[var(--line)]'
              }`}
            >
              {isResolved ? 'Resolved' : 'Open'}
            </span>
          )}
          {post.category === 'review' && post.rating && post.rating > 0 && (
            <span className="inline-flex items-center gap-0.5 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {post.rating}/5
            </span>
          )}
        </div>

        {/* Stacked Upvote / Downvote Column + Full Details */}
        <div className="flex items-start gap-5 pt-5">
          <VoteColumn
            upvoteCount={post.upvoteCount ?? Math.max(0, post.upvotes)}
            downvoteCount={post.downvoteCount ?? 0}
            userVote={post.userVote}
            onVote={(dir) => votePostMutation.mutate(dir)}
            disabled={votePostMutation.isPending}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] leading-relaxed text-[var(--t)] whitespace-pre-wrap break-words m-0">
              {post.message}
            </p>
          </div>
        </div>
      </article>

      {/* Answers Section */}
      <section className="pt-6 pb-8">
        <h2 className="text-base sm:text-lg font-bold text-[var(--t)] m-0 mb-4">
          {totalAnswerCount} {totalAnswerCount === 1 ? 'Answer' : 'Answers'}
        </h2>

        {totalAnswerCount === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--mu)] border-y border-[var(--line)]">
            No answers yet. Be the first to help or share your insight below!
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {/* Legacy single adminReply fallback for older records */}
            {hasLegacyAdminReply && (
              <div className="py-5 px-3 bg-emerald-500/[0.04]">
                <div className="flex items-start gap-5">
                  <div className="w-10 shrink-0 flex justify-center pt-1">
                    <ShieldCheck className="w-5 h-5 text-[#19D46A]" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <p className="text-[14.5px] leading-relaxed text-[var(--t)] whitespace-pre-wrap break-words m-0">
                      {post.adminReply}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[var(--mu)]">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[#19D46A] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Official Admin · {post.adminReplyBy || 'EcoStep Admin'}
                      </span>
                      {post.adminReplyAt && (
                        <span>answered {formatRelativeDate(post.adminReplyAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(() => {
              // Build nested thread tree (top-level answers + recursive child replies)
              const byId = new Map<string, FeedbackAnswer>();
              answers.forEach((a) => byId.set(a.id, a));

              const childrenMap = new Map<string, FeedbackAnswer[]>();
              const rootAnswers: FeedbackAnswer[] = [];

              answers.forEach((a) => {
                if (a.parentAnswerId && byId.has(a.parentAnswerId)) {
                  const list = childrenMap.get(a.parentAnswerId) || [];
                  list.push(a);
                  childrenMap.set(a.parentAnswerId, list);
                } else {
                  rootAnswers.push(a);
                }
              });

              // Sort child replies chronologically (oldest first, like Reddit/Facebook threads)
              childrenMap.forEach((list) => {
                list.sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                );
              });

              const countDescendants = (nodeId: string): number => {
                const kids = childrenMap.get(nodeId) || [];
                return kids.reduce((sum, k) => sum + 1 + countDescendants(k.id), 0);
              };

              const renderThreadNode = (ans: FeedbackAnswer, depth: number): React.ReactNode => {
                const isOfficialAdmin = ans.authorRole === 'admin';
                const childReplies = childrenMap.get(ans.id) || [];
                const totalChildCount = countDescendants(ans.id);
                const isThreadCollapsed = Boolean(collapsedThreads[ans.id]);
                const isReplyingHere = replyingToId === ans.id;
                const isNested = depth > 0;
                // Cap visual indentation at 4 levels so narrow screens stay readable
                const shouldIndentChildren = depth < 4;

                return (
                  <div
                    key={ans.id}
                    className={
                      isNested
                        ? 'pt-3.5 pb-1'
                        : `py-5 px-2 sm:px-3 transition-colors ${
                            ans.isAccepted
                              ? 'bg-emerald-500/[0.06]'
                              : isOfficialAdmin
                                ? 'bg-emerald-500/[0.03]'
                                : ''
                          }`
                    }
                  >
                    <div className="flex items-start gap-3.5 sm:gap-5">
                      {!isNested && (
                        <VoteColumn
                          upvoteCount={ans.upvoteCount ?? Math.max(0, ans.voteScore)}
                          downvoteCount={ans.downvoteCount ?? 0}
                          userVote={ans.userVote}
                          onVote={(direction) =>
                            voteAnswerMutation.mutate({ answerId: ans.id, direction })
                          }
                          disabled={voteAnswerMutation.isPending}
                          isAccepted={ans.isAccepted}
                          canAccept={isAdmin}
                          onToggleAccept={() => acceptAnswerMutation.mutate(ans.id)}
                        />
                      )}

                      <div className="flex-1 min-w-0 space-y-2">
                        {ans.isAccepted && !isNested && (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#19D46A]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accepted Answer</span>
                          </div>
                        )}

                        {/* Author + timestamp header for nested replies */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--mu)]">
                          {isOfficialAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-[#19D46A] font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              Official Admin · {ans.authorName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-[var(--t)]">
                              <User className="w-3 h-3 text-[var(--mu)]" />
                              {ans.authorName}
                            </span>
                          )}
                          {isNested && ans.replyToAuthor && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--mu)]">
                              <CornerDownRight className="w-3 h-3 opacity-70" />
                              <span className="text-[var(--acc)] font-medium">@{ans.replyToAuthor}</span>
                            </span>
                          )}
                          <span>· {formatRelativeDate(ans.createdAt)}</span>
                        </div>

                        <p className="text-[14px] sm:text-[14.5px] leading-relaxed text-[var(--t)] whitespace-pre-wrap break-words m-0">
                          {ans.body}
                        </p>

                        {/* Flat Action Bar: Inline Votes (for nested), Reply, Hide/Show Replies, Admin Delete */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-xs text-[var(--mu)]">
                          {isNested && (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={voteAnswerMutation.isPending}
                                onClick={() =>
                                  voteAnswerMutation.mutate({ answerId: ans.id, direction: 'up' })
                                }
                                aria-label={`Upvote reply (${ans.upvoteCount ?? Math.max(0, ans.voteScore)})`}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-[var(--soft)] tabular-nums font-semibold cursor-pointer ${
                                  ans.userVote === 'up' ? 'text-[#19D46A]' : 'text-[var(--mu)] hover:text-[var(--t)]'
                                }`}
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>{ans.upvoteCount ?? Math.max(0, ans.voteScore)}</span>
                              </button>
                              <button
                                type="button"
                                disabled={voteAnswerMutation.isPending}
                                onClick={() =>
                                  voteAnswerMutation.mutate({ answerId: ans.id, direction: 'down' })
                                }
                                aria-label={`Downvote reply (${ans.downvoteCount ?? 0})`}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-[var(--soft)] tabular-nums font-semibold cursor-pointer ${
                                  ans.userVote === 'down' ? 'text-red-400' : 'text-[var(--mu)] hover:text-[var(--t)]'
                                }`}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                                <span>{ans.downvoteCount ?? 0}</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (isReplyingHere) {
                                setReplyingToId(null);
                                setReplyError(null);
                              } else {
                                setReplyingToId(ans.id);
                                setReplyBody('');
                                setReplyError(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--mu)] hover:text-[var(--t)] transition-colors cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </button>

                          {totalChildCount > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleThreadCollapse(ans.id)}
                              className="text-[11.5px] font-medium text-[var(--mu)] hover:text-[var(--t)] transition-colors cursor-pointer"
                            >
                              {isThreadCollapsed
                                ? `Show ${totalChildCount} ${totalChildCount === 1 ? 'reply' : 'replies'}`
                                : `Hide ${totalChildCount} ${totalChildCount === 1 ? 'reply' : 'replies'}`}
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              disabled={deleteAnswerMutation.isPending}
                              onClick={() => deleteAnswerMutation.mutate(ans.id)}
                              className="inline-flex items-center gap-1 text-[11.5px] text-red-400 hover:underline cursor-pointer ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Inline Reply Form (Flat, left hairline accent, no box) */}
                        {isReplyingHere && (
                          <form
                            onSubmit={(e) => handleReplySubmit(e, ans.id)}
                            className="mt-2.5 pl-3.5 border-l-2 border-[var(--acc)] space-y-2"
                          >
                            <div className="text-[11px] text-[var(--mu)]">
                              Replying to <strong className="text-[var(--t)]">@{ans.authorName}</strong> as{' '}
                              <strong className="text-[var(--t)]">{activeAuthorName}</strong>
                            </div>
                            <textarea
                              rows={2}
                              maxLength={2000}
                              autoFocus
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              placeholder={`Write a reply to ${ans.authorName}...`}
                              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[var(--line)] bg-transparent text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A] transition-colors resize-y"
                            />
                            {replyError && (
                              <p className="text-xs text-red-400 m-0">{replyError}</p>
                            )}
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToId(null);
                                  setReplyError(null);
                                }}
                                className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--mu)] hover:text-[var(--t)] cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={addAnswerMutation.isPending || replyBody.trim().length < 2}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer hover:opacity-90"
                                style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
                              >
                                {addAnswerMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Replying...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3 h-3" />
                                    Reply
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Nested Child Replies with thin 1px vertical hairline thread line */}
                        {childReplies.length > 0 && !isThreadCollapsed && (
                          <div
                            className={
                              shouldIndentChildren
                                ? 'mt-2 pl-4 sm:pl-5 border-l border-[var(--line)] hover:border-[var(--acc)]/45 transition-colors space-y-1'
                                : 'mt-2 space-y-1'
                            }
                          >
                            {childReplies.map((child) => renderThreadNode(child, depth + 1))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              };

              return rootAnswers.map((root) => renderThreadNode(root, 0));
            })()}
          </div>
        )}
      </section>

      {/* Post Your Answer Form */}
      <section className="pt-2 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-bold text-[var(--t)] m-0">Your Answer</h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--mu)]">
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#19D46A]" />
                <span>
                  Answering as <strong className="text-[#19D46A]">Official Admin ({activeAuthorName})</strong>
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>
                  Answering as <strong className="text-[var(--t)]">{activeAuthorName}</strong>
                </span>
              </>
            )}
          </span>
        </div>

        <form onSubmit={handleAnswerSubmit} className="space-y-3">
          {/* Invisible anti-bot honeypot field */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
          />
          <textarea
            rows={4}
            maxLength={2000}
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            placeholder="Write a helpful answer, explanation, or follow-up comment..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[var(--line)] text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A] transition-colors resize-y"
            style={{ backgroundColor: isDark ? '#12241A' : 'var(--panel)' }}
          />

          {answerError && (
            <div className="p-2.5 rounded-lg text-xs font-medium bg-red-500/15 border border-red-500/35 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{answerError}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--mu)] tabular-nums">
              {answerBody.length}/2000
            </span>
            <button
              type="submit"
              disabled={addAnswerMutation.isPending || answerBody.trim().length < 2}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
            >
              {addAnswerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Your Answer
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
