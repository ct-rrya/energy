import { useEffect, useRef } from 'react';
import { ShieldCheck, Sparkles, Check, CheckCheck } from 'lucide-react';
import type { AdminChatMessage } from '@/api/services/adminChat.service';

interface AdminChatViewProps {
  messages: AdminChatMessage[];
  visitorName?: string;
  adminLastReadAt?: string | null;
  unreadByAdmin?: number;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  onRefresh: () => void;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function AdminChatView({
  messages,
  adminLastReadAt,
  unreadByAdmin = 0,
  isLoading,
  isSending,
  error,
  onRefresh,
}: AdminChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  let lastVisitorMsgIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === 'visitor') {
      lastVisitorMsgIdx = i;
      break;
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Scrollable message thread */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-2.5">
        {isLoading && messages.length === 0 ? (
          <div className="text-center text-xs text-[var(--mu)] py-8">
            Loading your conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-center space-y-1.5 my-4">
            <ShieldCheck size={20} className="mx-auto text-[var(--acc)]" />
            <p className="text-[13px] font-medium text-[var(--t)] m-0">
              Start a conversation with Admin
            </p>
            <p className="text-[11.5px] text-[var(--mu)] m-0 leading-relaxed">
              Ask about campus tile status, report a hardware issue, or request help. You can switch back to EcoGuide anytime without losing this chat.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isVisitor = msg.sender === 'visitor';
            return (
              <div
                key={msg._id || `${msg.createdAt}-${idx}`}
                className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  {!isVisitor && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--acc)]">
                      {msg.isAutoReply ? <Sparkles size={11} /> : <ShieldCheck size={11} />}
                      {msg.isAutoReply
                        ? 'EcoStep Auto-Reply'
                        : msg.senderName || 'EcoStep Admin'}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--mu)]">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap break-words ${
                    isVisitor
                      ? 'bg-[var(--acc)] text-white dark:text-[#04210f] rounded-br-sm'
                      : 'bg-[var(--soft)] text-[var(--t)] border border-[var(--line)] rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                {isVisitor && idx === lastVisitorMsgIdx && (() => {
                  const isSeen =
                    unreadByAdmin === 0 &&
                    (!adminLastReadAt ||
                      new Date(adminLastReadAt).getTime() >=
                        new Date(msg.createdAt).getTime());
                  return (
                    <span
                      className={`mt-1 px-1 inline-flex items-center gap-1 text-[10px] ${
                        isSeen ? 'text-[var(--acc)] font-medium' : 'text-[var(--mu)]'
                      }`}
                    >
                      {isSeen ? (
                        <>
                          <CheckCheck size={12} strokeWidth={2.2} />
                          <span>
                            Seen{adminLastReadAt ? ` · ${formatTime(adminLastReadAt)}` : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <Check size={11} strokeWidth={2.2} />
                          <span>Sent</span>
                        </>
                      )}
                    </span>
                  );
                })()}
              </div>
            );
          })
        )}

        {error && (
          <div className="chat-error" role="alert">
            <p>{error}</p>
            <button className="chat-error-retry" onClick={onRefresh} type="button">
              Retry
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
