import { useCallback, useEffect, useRef, useState } from 'react';
import {
  adminChatService,
  type AdminChatMessage,
} from '@/api/services/adminChat.service';
import {
  getOrCreateVisitorId,
  getStoredVisitorNickname,
  useOptionalVisitor,
} from '@/contexts/VisitorContext';
import { useSocket } from '@/contexts/SocketContext';
import { notifyIncomingChatMessage } from './chatNotifications';

export function useAdminChat(isViewingThread: boolean, enabled = true) {
  const visitor = useOptionalVisitor();
  const { socket } = useSocket();
  const [fallbackVisitorId] = useState<string>(() => getOrCreateVisitorId());
  const [fallbackVisitorName] = useState<string>(() => getStoredVisitorNickname());

  const visitorId = visitor?.visitorId || fallbackVisitorId;
  const visitorName = visitor?.nickname || fallbackVisitorName || 'EcoGuest';

  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadByAdmin, setUnreadByAdmin] = useState<number>(0);
  const [adminLastReadAt, setAdminLastReadAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isViewingRef = useRef(isViewingThread);
  isViewingRef.current = isViewingThread;

  const setVisitorName = useCallback(
    (name: string) => {
      visitor?.setNickname(name);
    },
    [visitor],
  );

  const fetchThread = useCallback(
    async (silent = false) => {
      if (!enabled || !visitorId || visitorId === 'visitor-ssr') return;
      if (!silent) setIsLoading(true);
      try {
        const thread = await adminChatService.getVisitorThread(visitorId);
        setMessages(thread.messages || []);
        setUnreadByAdmin(thread.unreadByAdmin ?? 0);
        setAdminLastReadAt(thread.adminLastReadAt ?? null);
        if (isViewingRef.current && (thread.unreadByVisitor || 0) > 0) {
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
    [enabled, visitorId],
  );

  // Initial load + gentle 15s fallback polling
  useEffect(() => {
    if (!enabled) return;
    fetchThread(false);
    const interval = window.setInterval(() => {
      fetchThread(true);
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [enabled, fetchThread]);

  // Real-time Socket.IO sync for incoming admin replies & Seen receipts
  useEffect(() => {
    if (!enabled || !socket || !visitorId) return;

    const handleAdminChatUpdated = (payload?: {
      action?: string;
      visitorId?: string;
      senderName?: string;
      readAt?: string;
    }) => {
      if (!payload || payload.visitorId !== visitorId) return;

      if (payload.action === 'admin_read') {
        setUnreadByAdmin(0);
        if (payload.readAt) {
          setAdminLastReadAt(payload.readAt);
        }
        return;
      }

      if (payload.action === 'admin_reply') {
        void fetchThread(true);
        if (!isViewingRef.current) {
          notifyIncomingChatMessage({
            senderName: payload.senderName || 'EcoStep Admin',
            count: 1,
          });
        }
        return;
      }

      void fetchThread(true);
    };

    socket.on('admin-chat:updated', handleAdminChatUpdated);
    return () => {
      socket.off('admin-chat:updated', handleAdminChatUpdated);
    };
  }, [enabled, socket, visitorId, fetchThread]);

  // Mark messages read immediately when visitor opens the Talk to Admin thread
  useEffect(() => {
    if (enabled && isViewingThread && unreadCount > 0) {
      setUnreadCount(0);
      adminChatService.markVisitorRead(visitorId).catch(() => {});
    }
  }, [enabled, isViewingThread, unreadCount, visitorId]);

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
        setUnreadByAdmin(updated.unreadByAdmin ?? 1);
        setAdminLastReadAt(updated.adminLastReadAt ?? null);
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
    unreadByAdmin,
    adminLastReadAt,
    isLoading,
    isSending,
    error,
    sendMessage,
    refresh: () => fetchThread(false),
  };
}
