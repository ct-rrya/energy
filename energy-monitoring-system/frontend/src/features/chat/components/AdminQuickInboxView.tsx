import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Clock,
  ShieldCheck,
  Sparkles,
  User,
  CheckCircle2,
  Check,
  CheckCheck,
  RotateCcw,
  MessageSquare,
  SlidersHorizontal,
  Zap,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import {
  adminChatService,
  type AdminChatThread,
  type CannedReplyItem,
} from '@/api/services/adminChat.service';
import { showToast } from '@/components/common/Toast';
import { ChatInput } from './ChatInput';

function formatTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

interface AdminQuickInboxViewProps {
  onActiveVisitorChange?: (visitorId: string | null) => void;
}

const COOLDOWN_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 },
];

export function AdminQuickInboxView({
  onActiveVisitorChange,
}: AdminQuickInboxViewProps = {}) {
  const queryClient = useQueryClient();
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Settings draft state
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [draftCooldown, setDraftCooldown] = useState(60);
  const [draftReplies, setDraftReplies] = useState<CannedReplyItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    onActiveVisitorChange?.(selectedVisitorId);
    return () => {
      onActiveVisitorChange?.(null);
    };
  }, [selectedVisitorId, onActiveVisitorChange]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-chat-threads'],
    queryFn: () => adminChatService.listThreadsForAdmin(),
    refetchInterval: 10_000,
  });

  const { data: chatSettings } = useQuery({
    queryKey: ['admin-chat-settings'],
    queryFn: () => adminChatService.getSettings(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (chatSettings && settingsOpen) {
      setDraftEnabled(chatSettings.autoReplyEnabled);
      setDraftMessage(chatSettings.autoReplyMessage);
      setDraftCooldown(chatSettings.autoReplyCooldownMinutes);
      setDraftReplies(chatSettings.cannedReplies || []);
    }
  }, [chatSettings, settingsOpen]);

  const threads = data?.threads || [];
  const activeThread: AdminChatThread | undefined = selectedVisitorId
    ? threads.find((t) => t.visitorId === selectedVisitorId)
    : undefined;

  // Mark thread as read when admin opens it
  useEffect(() => {
    if (activeThread && (activeThread.unreadByAdmin || 0) > 0) {
      adminChatService
        .markAdminRead(activeThread.visitorId)
        .then(() => queryClient.invalidateQueries({ queryKey: ['admin-chat-threads'] }))
        .catch(() => {});
    }
  }, [activeThread?.visitorId, activeThread?.unreadByAdmin, queryClient]);

  useEffect(() => {
    if (activeThread) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages?.length, activeThread?.visitorId]);

  const replyMutation = useMutation({
    mutationFn: ({ visitorId, message }: { visitorId: string; message: string }) =>
      adminChatService.replyAsAdmin(visitorId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-threads'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ visitorId, status }: { visitorId: string; status: 'open' | 'resolved' }) =>
      adminChatService.updateThreadStatus(visitorId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-threads'] });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      adminChatService.updateSettings({
        autoReplyEnabled: draftEnabled,
        autoReplyMessage: draftMessage,
        autoReplyCooldownMinutes: draftCooldown,
        cannedReplies: draftReplies,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-chat-settings'], updated);
      showToast('Auto-reply & quick replies saved', 'success');
      setSettingsOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not save chat settings.';
      showToast(Array.isArray(msg) ? msg.join(', ') : String(msg), 'error');
    },
  });

  const handleAddCannedReply = () => {
    const cleanLabel = newLabel.trim().slice(0, 40);
    const cleanText = newText.trim().slice(0, 500);
    if (!cleanLabel || !cleanText) return;
    if (draftReplies.length >= 12) {
      showToast('Maximum of 12 quick replies reached.', 'info');
      return;
    }
    setDraftReplies((prev) => [
      ...prev,
      { id: `reply-${Date.now()}`, label: cleanLabel, text: cleanText },
    ]);
    setNewLabel('');
    setNewText('');
  };

  // View 0: Auto-Reply & Quick Replies Settings Panel
  if (settingsOpen) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-[var(--line)] bg-[var(--soft)]/70 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--t)] hover:text-[var(--acc)] cursor-pointer"
          >
            <ChevronLeft size={15} />
            <span>Auto-Reply &amp; Quick Replies</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-4">
          {/* Auto-Reply Toggle + Message */}
          <div className="space-y-2.5 pb-3.5 border-b border-[var(--line)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[12.5px] font-semibold text-[var(--t)] m-0">
                  Automatic Greeting / Away Reply
                </p>
                <p className="text-[11px] text-[var(--mu)] m-0 mt-0.5">
                  Instantly replies when a visitor sends a direct message.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draftEnabled}
                onClick={() => setDraftEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors cursor-pointer ${
                  draftEnabled
                    ? 'bg-[var(--acc)] border-[var(--acc)]'
                    : 'bg-[var(--soft)] border-[var(--line)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-[1px] ${
                    draftEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--mu)]">
                  Auto-Reply Message
                </label>
                <span className="text-[10px] text-[var(--mu)] tabular-nums">
                  {draftMessage.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                placeholder="Thanks for messaging EcoStep! An admin will reply soon."
                className="w-full px-2.5 py-2 text-[12px] rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--acc)] resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--mu)]">
                Send at most once per visitor every:
              </span>
              <select
                value={draftCooldown}
                onChange={(e) => setDraftCooldown(Number(e.target.value))}
                className="text-[11.5px] px-2 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)]"
              >
                {COOLDOWN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 1-Click Canned Replies */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--t)] inline-flex items-center gap-1.5">
                <Zap size={12} className="text-[var(--acc)]" />
                Quick Canned Replies ({draftReplies.length}/12)
              </span>
            </div>

            <div className="space-y-1.5">
              {draftReplies.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--soft)]/60"
                >
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-semibold text-[var(--t)] truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-[var(--mu)] line-clamp-2">
                      {item.text}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftReplies((prev) => prev.filter((r) => r.id !== item.id))
                    }
                    aria-label={`Remove ${item.label}`}
                    className="p-1 text-[var(--mu)] hover:text-red-400 cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new canned reply */}
            {draftReplies.length < 12 && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  maxLength={40}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Short button label (e.g., Inspecting tile)"
                  className="w-full px-2.5 py-1.5 text-[11.5px] rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--acc)]"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    maxLength={500}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Full reply message to send..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-[11.5px] rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--acc)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCannedReply}
                    disabled={!newLabel.trim() || !newText.trim()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] hover:border-[var(--acc)] hover:text-[var(--acc)] disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <Plus size={12} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-3.5 py-2.5 border-t border-[var(--line)] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium text-[var(--mu)] hover:text-[var(--t)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveSettingsMutation.mutate()}
            disabled={saveSettingsMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11.5px] font-semibold cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
          >
            <Save size={12} />
            <span>{saveSettingsMutation.isPending ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    );
  }

  // View 1: Thread List
  if (!activeThread) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-[var(--line)] bg-[var(--soft)]/70 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[12px] font-semibold text-[var(--t)] inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--acc)]" />
            Visitor Messages ({threads.length})
          </span>
          <div className="flex items-center gap-1.5">
            {(data?.totalUnread || 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f]">
                {data?.totalUnread} unread
              </span>
            )}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title="Auto-Reply & Quick Replies"
              aria-label="Configure auto-reply and quick replies"
              className="relative p-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--mu)] hover:text-[var(--t)] hover:border-[var(--acc)] transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={13} />
              {chatSettings?.autoReplyEnabled && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#19D46A]"
                  title="Auto-reply enabled"
                />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--line)]">
          {isLoading && threads.length === 0 ? (
            <div className="text-center text-xs text-[var(--mu)] py-8">
              Loading visitor messages...
            </div>
          ) : threads.length === 0 ? (
            <div className="p-6 text-center space-y-1.5">
              <MessageSquare size={20} className="mx-auto text-[var(--mu)] opacity-60" />
              <p className="text-[13px] font-medium text-[var(--t)] m-0">No visitor messages yet</p>
              <p className="text-[11.5px] text-[var(--mu)] m-0">
                Messages from public users will appear here so you can reply directly.
              </p>
            </div>
          ) : (
            threads.map((thread) => {
              const lastMsg = thread.messages[thread.messages.length - 1];
              return (
                <button
                  key={thread.visitorId}
                  type="button"
                  onClick={() => setSelectedVisitorId(thread.visitorId)}
                  className="w-full text-left px-3.5 py-3 hover:bg-[var(--soft)]/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[12.5px] font-semibold text-[var(--t)] truncate inline-flex items-center gap-1.5">
                      <User size={12} className="text-[var(--mu)] shrink-0" />
                      {thread.visitorName || 'Campus Visitor'}
                    </span>
                    <span className="text-[10.5px] text-[var(--mu)] shrink-0">
                      {formatTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11.5px] text-[var(--mu)] truncate m-0">
                      {lastMsg
                        ? `${lastMsg.sender === 'admin' ? (lastMsg.isAutoReply ? 'Auto: ' : 'You: ') : ''}${lastMsg.text}`
                        : 'No messages'}
                    </p>
                    {(thread.unreadByAdmin || 0) > 0 && (
                      <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f] text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                        {thread.unreadByAdmin}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const cannedReplies = chatSettings?.cannedReplies || [];

  // View 2: Active Visitor Thread (Admin replies as sender='admin')
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Thread top bar */}
      <div className="px-3 py-2 border-b border-[var(--line)] bg-[var(--soft)]/70 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setSelectedVisitorId(null)}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--t)] hover:text-[var(--acc)] cursor-pointer"
        >
          <ChevronLeft size={15} />
          <span className="truncate max-w-[130px]">
            {activeThread.visitorName || 'Campus Visitor'}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="Auto-Reply & Quick Replies"
            aria-label="Configure auto-reply and quick replies"
            className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--mu)] hover:text-[var(--t)] cursor-pointer"
          >
            <SlidersHorizontal size={12} />
          </button>
          <button
            type="button"
            onClick={() =>
              statusMutation.mutate({
                visitorId: activeThread.visitorId,
                status: activeThread.status === 'resolved' ? 'open' : 'resolved',
              })
            }
            disabled={statusMutation.isPending}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] hover:opacity-85 cursor-pointer shrink-0"
          >
            {activeThread.status === 'resolved' ? (
              <>
                <RotateCcw size={11} />
                <span>Reopen</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span>Resolve</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages: Visitor on LEFT, Admin on RIGHT */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-2.5">
        {(() => {
          let lastAdminMsgIdx = -1;
          for (let i = activeThread.messages.length - 1; i >= 0; i--) {
            if (activeThread.messages[i].sender === 'admin') {
              lastAdminMsgIdx = i;
              break;
            }
          }
          return activeThread.messages.map((msg, idx) => {
            const isAdminMsg = msg.sender === 'admin';
            const isSeenByVisitor =
              isAdminMsg &&
              idx === lastAdminMsgIdx &&
              activeThread.unreadByVisitor === 0 &&
              (!activeThread.visitorLastReadAt ||
                new Date(activeThread.visitorLastReadAt).getTime() >=
                  new Date(msg.createdAt).getTime());

            return (
              <div
                key={msg._id || `${msg.createdAt}-${idx}`}
                className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--mu)]">
                    {isAdminMsg &&
                      (msg.isAutoReply ? (
                        <Sparkles size={11} className="text-[var(--acc)]" />
                      ) : (
                        <ShieldCheck size={11} className="text-[var(--acc)]" />
                      ))}
                    {isAdminMsg
                      ? msg.isAutoReply
                        ? 'Auto-Reply'
                        : 'You (Admin)'
                      : activeThread.visitorName || 'Campus Visitor'}
                  </span>
                  <span className="text-[10px] text-[var(--mu)] inline-flex items-center gap-0.5">
                    <Clock size={9} />
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap break-words ${
                    isAdminMsg
                      ? msg.isAutoReply
                        ? 'bg-[var(--soft)] text-[var(--t)] border border-[var(--acc)]/40 rounded-br-sm'
                        : 'bg-[var(--acc)] text-white dark:text-[#04210f] rounded-br-sm'
                      : 'bg-[var(--soft)] text-[var(--t)] border border-[var(--line)] rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                {isAdminMsg && idx === lastAdminMsgIdx && (
                  <span
                    className={`mt-1 px-1 inline-flex items-center gap-1 text-[10px] ${
                      isSeenByVisitor
                        ? 'text-[var(--acc)] font-medium'
                        : 'text-[var(--mu)]'
                    }`}
                  >
                    {isSeenByVisitor ? (
                      <>
                        <CheckCheck size={12} strokeWidth={2.2} />
                        <span>
                          Seen
                          {activeThread.visitorLastReadAt
                            ? ` · ${formatTime(activeThread.visitorLastReadAt)}`
                            : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check size={11} strokeWidth={2.2} />
                        <span>Sent</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            );
          });
        })()}
        <div ref={bottomRef} />
      </div>

      {/* 1-Click Quick Canned Replies Strip */}
      {cannedReplies.length > 0 && (
        <div className="px-3 py-1.5 border-t border-[var(--line)] bg-[var(--soft)]/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <Zap size={12} className="text-[var(--acc)] shrink-0" />
          {cannedReplies.map((reply) => (
            <button
              key={reply.id}
              type="button"
              disabled={replyMutation.isPending}
              title={reply.text}
              onClick={() =>
                replyMutation.mutate({
                  visitorId: activeThread.visitorId,
                  message: reply.text,
                })
              }
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-[var(--line)] bg-[var(--panel)] text-[var(--t)] hover:border-[var(--acc)] hover:text-[var(--acc)] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 shrink-0"
            >
              {reply.label}
            </button>
          ))}
        </div>
      )}

      {/* Admin reply input */}
      <ChatInput
        onSend={(text) =>
          replyMutation.mutate({ visitorId: activeThread.visitorId, message: text })
        }
        disabled={replyMutation.isPending}
      />
    </div>
  );
}
