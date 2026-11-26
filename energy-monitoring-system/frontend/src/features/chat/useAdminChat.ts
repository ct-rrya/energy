import { useCallback, useEffect, useState } from 'react';
import {
  adminChatService,
  type AdminChatMessage,
} from '@/api/services/adminChat.service';

const VISITOR_ID_KEY = 'ecostep_admin_chat_visitor_id';
const VISITOR_NAME_KEY = 'ecostep_admin_chat_visitor_name';

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'visitor-ssr';
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.length >= 6) return existing;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `vis-${crypto.randomUUID()}`
        : `vis-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_ID_KEY, generated);
    return generated;
  } catch {
    return `vis-${Date.now()}`;
  }
}

function loadVisitorName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(VISITOR_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function useAdminChat(isActiveTab: boolean) {
  const [visitorId] = useState<string>(() => getOrCreateVisitorId());
  const [visitorName, setVisitorNameState] = useState<string>(() => loadVisitorName());
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setVisitorName = useCallback((name: string) => {
    setVisitorNameState(name);
    try {
      localStorage.setItem(VISITOR_NAME_KEY, name);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchThread = useCallback(
    async (silent = false) => {
      if (!visitorId || visitorId === 'visitor-ssr') return;
      if (!silent) setIsLoading(true);
      try {
        const thread = await adminChatService.getVisitorThread(visitorId);
        setMessages(thread.messages || []);
        if (isActiveTab && (thread.unreadByVisitor || 0) > 0) {
          setUnreadCount(0);
          adminChatService.markVisitorRead(visitorId).catch(() => {});
        } else {
          setUnreadCount(thread.unreadByVisitor || 0);
        }
        setError(null);
      } catch {
        if (!silent) {
          setError('Unable to load admin chat right now. Please try again.');
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [visitorId, isActiveTab],
  );

  // Initial load + gentle 12s background polling so delayed Admin replies show up automatically
  useEffect(() => {
    fetchThread(false);
    const interval = window.setInterval(() => {
      fetchThread(true);
    }, 12_000);
    return () => window.clearInterval(interval);
  }, [fetchThread]);

  // Clear unread badge immediately when visitor switches into the Talk to Admin tab
  useEffect(() => {
    if (isActiveTab && unreadCount > 0) {
      setUnreadCount(0);
      adminChatService.markVisitorRead(visitorId).catch(() => {});
    }
  }, [isActiveTab, unreadCount, visitorId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;
      setIsSending(true);
      setError(null);
      try {
        const updated = await adminChatService.sendVisitorMessage(
          visitorId,
          trimmed,
          visitorName.trim() || undefined,
        );
        setMessages(updated.messages || []);
        setUnreadCount(0);
      } catch {
        setError('Could not send your message. Please check your connection and retry.');
      } finally {
        setIsSending(false);
      }
    },
    [visitorId, visitorName, isSending],
  );

  return {
    visitorId,
    visitorName,
    setVisitorName,
    messages,
    unreadCount,
    isLoading,
    isSending,
    error,
    sendMessage,
    refresh: () => fetchThread(false),
  };
}
