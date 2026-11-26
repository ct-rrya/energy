import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Clock,
  ShieldCheck,
  User,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import {
  adminChatService,
  type AdminChatThread,
} from '@/api/services/adminChat.service';
import { ChatInput } from './ChatInput';

function formatTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function AdminQuickInboxView() {
  const queryClient = useQueryClient();
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-chat-threads'],
    queryFn: () => adminChatService.listThreadsForAdmin(),
    refetchInterval: 10_000,
  });

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

  // View 1: Thread List
  if (!activeThread) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-[var(--line)] bg-[var(--soft)]/70 flex items-center justify-between shrink-0">
          <span className="text-[12px] font-semibold text-[var(--t)] inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--acc)]" />
            Visitor Messages ({threads.length})
          </span>
          {(data?.totalUnread || 0) > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--acc)] text-white dark:text-[#04210f]">
              {data?.totalUnread} unread
            </span>
          )}
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
                        ? `${lastMsg.sender === 'admin' ? 'You: ' : ''}${lastMsg.text}`
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

      {/* Messages: Visitor on LEFT, Admin on RIGHT */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-2.5">
        {activeThread.messages.map((msg, idx) => {
          const isAdminMsg = msg.sender === 'admin';
          return (
            <div
              key={msg._id || `${msg.createdAt}-${idx}`}
              className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 px-1">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--mu)]">
                  {isAdminMsg && <ShieldCheck size={11} className="text-[var(--acc)]" />}
                  {isAdminMsg
                    ? 'You (Admin)'
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
