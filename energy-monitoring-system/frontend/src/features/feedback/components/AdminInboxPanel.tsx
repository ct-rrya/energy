import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  User,
  Loader2,
  Clock,
} from 'lucide-react';
import {
  adminChatService,
  type AdminChatThread,
} from '@/api/services/adminChat.service';

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AdminInboxPanel() {
  const queryClient = useQueryClient();
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-chat-threads'],
    queryFn: () => adminChatService.listThreadsForAdmin(),
    refetchInterval: 10_000,
  });

  const threads = data?.threads || [];
  const activeThread: AdminChatThread | undefined =
    threads.find((t) => t.visitorId === selectedVisitorId) || threads[0];

  useEffect(() => {
    if (!selectedVisitorId && threads.length > 0) {
      setSelectedVisitorId(threads[0].visitorId);
    }
  }, [selectedVisitorId, threads]);

  // Mark thread read when admin selects it and it has unread visitor messages
  useEffect(() => {
    if (activeThread && (activeThread.unreadByAdmin || 0) > 0) {
      adminChatService
        .markAdminRead(activeThread.visitorId)
        .then(() => queryClient.invalidateQueries({ queryKey: ['admin-chat-threads'] }))
        .catch(() => {});
    }
  }, [activeThread?.visitorId, activeThread?.unreadByAdmin, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages?.length, activeThread?.visitorId]);

  const replyMutation = useMutation({
    mutationFn: ({ visitorId, message }: { visitorId: string; message: string }) =>
      adminChatService.replyAsAdmin(visitorId, message),
    onSuccess: () => {
      setReplyText('');
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

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim() || replyMutation.isPending) return;
    replyMutation.mutate({ visitorId: activeThread.visitorId, message: replyText.trim() });
  };

  if (isLoading && threads.length === 0) {
    return (
      <div className="cd p-10 flex items-center justify-center gap-2 text-sm text-[var(--mu)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading visitor conversations...</span>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="cd p-12 text-center space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-[var(--mu)] opacity-60" />
        <h3 className="text-base font-semibold text-[var(--t)] m-0">No direct messages yet</h3>
        <p className="text-sm text-[var(--mu)] m-0">
          When campus visitors use the <strong>Talk to Admin</strong> tab inside EcoGuide, their messages will appear here for you to reply.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Conversations List */}
      <div className="lg:col-span-4 cd !p-0 overflow-hidden flex flex-col max-h-[600px]">
        <div className="px-4 py-3 border-b border-[var(--line)] flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--t)]">
            Conversations ({threads.length})
          </span>
          {(data?.totalUnread || 0) > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f]">
              {data?.totalUnread} unread
            </span>
          )}
        </div>

        <div className="overflow-y-auto divide-y divide-[var(--line)]">
          {threads.map((thread) => {
            const isSelected = activeThread?.visitorId === thread.visitorId;
            const lastMsg = thread.messages[thread.messages.length - 1];
            return (
              <button
                key={thread.visitorId}
                type="button"
                onClick={() => setSelectedVisitorId(thread.visitorId)}
                className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--soft)] border-l-2 border-l-[var(--acc)]'
                    : 'hover:bg-[var(--soft)]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-[var(--t)] truncate inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[var(--mu)] shrink-0" />
                    {thread.visitorName || 'Campus Visitor'}
                  </span>
                  <span className="text-[11px] text-[var(--mu)] shrink-0">
                    {formatRelative(thread.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[var(--mu)] truncate m-0">
                    {lastMsg ? `${lastMsg.sender === 'admin' ? 'You: ' : ''}${lastMsg.text}` : 'No messages'}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(thread.unreadByAdmin || 0) > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f] text-[10px] font-bold inline-flex items-center justify-center">
                        {thread.unreadByAdmin}
                      </span>
                    )}
                    {thread.status === 'resolved' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Active Conversation & Reply Box */}
      <div className="lg:col-span-8 cd !p-0 overflow-hidden flex flex-col h-[600px]">
        {activeThread && (
          <>
            <div className="px-5 py-3.5 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                  {activeThread.visitorName || 'Campus Visitor'}
                </h3>
                <p className="text-xs text-[var(--mu)] m-0 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>
                    {activeThread.messages.length} message{activeThread.messages.length === 1 ? '' : 's'}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{activeThread.status}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  statusMutation.mutate({
                    visitorId: activeThread.visitorId,
                    status: activeThread.status === 'resolved' ? 'open' : 'resolved',
                  })
                }
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--panel)] text-[var(--t)] transition-colors cursor-pointer"
              >
                {activeThread.status === 'resolved' ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reopen
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Mark Resolved
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
              {activeThread.messages.map((msg, idx) => {
                const isAdminMsg = msg.sender === 'admin';
                return (
                  <div
                    key={msg._id || `${msg.createdAt}-${idx}`}
                    className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-[var(--mu)] inline-flex items-center gap-1">
                        {isAdminMsg && <ShieldCheck className="w-3 h-3 text-[var(--acc)]" />}
                        {isAdminMsg ? msg.senderName || 'You (Admin)' : activeThread.visitorName || 'Visitor'}
                      </span>
                      <span className="text-[10.5px] text-[var(--mu)]">
                        {formatRelative(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isAdminMsg
                          ? 'bg-[var(--acc)] text-white dark:text-[#04210f] rounded-br-sm'
                          : 'bg-[var(--soft)] text-[var(--t)] border border-[var(--line)] rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSendReply}
              className="p-3.5 border-t border-[var(--line)] flex items-center gap-2 bg-[var(--panel)]"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply to this visitor..."
                maxLength={2000}
                disabled={replyMutation.isPending}
                className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--acc)]"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || replyMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--acc)] text-white dark:text-[#04210f] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
