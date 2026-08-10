'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiRequest } from '@/src/lib/api.client';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/src/contexts/AuthContext';
import type { Conversation, PaginatedConversations, HandlingStatus } from '../types/chat.types';

// ChatGateway runs on the default namespace at the API root. NEXT_PUBLIC_API_URL
// includes the /api/v1 REST prefix, so strip it for the socket connection
// (otherwise socket.io treats "/api/v1" as a namespace and never connects).
const WS_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(
  /\/api\/v\d+\/?$/,
  '',
);

export function useLiveChats(siteId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [handlingFilter, setHandlingFilter] = useState<HandlingStatus | 'CLOSED' | ''>('');
  const [stats, setStats] = useState({
    total: 0,
    activeBotCount: 0,
    waitingCount: 0,
    assignedCount: 0,
    closedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuth();
  const { data: session } = useSession();

  const fetchConversations = useCallback(
    async (opts?: { background?: boolean }) => {
      const background = opts?.background ?? false;
      // Only show the full-page spinner for user-initiated loads (initial /
      // filter / page). Background refetches (socket events) update the list
      // in place so the screen doesn't flash on every new message.
      if (!background) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          sortBy: 'lastActivityAt:DESC',
        });
        if (handlingFilter) {
          if (handlingFilter === 'CLOSED') {
            params.set('filter.status', `$eq:CLOSED`);
          } else {
            params.set('filter.handlingStatus', `$eq:${handlingFilter}`);
            params.set('filter.status', `$not:$eq:CLOSED`);
          }
        } else {
          params.set('filter.status', `$not:$eq:CLOSED`);
        }
        if (siteId) {
          params.set('filter.siteId', `$eq:${siteId}`);
        }

        const data = await apiRequest<PaginatedConversations>(
          `/chat/conversations/active?${params.toString()}`,
        );
        setConversations(data.data);
        setTotal(data.meta.totalItems);
      } catch (err: unknown) {
        if (background) {
          console.error('[live-chats] background refetch failed:', err);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load chats');
        }
      } finally {
        if (!background) setIsLoading(false);
      }
    },
    [page, pageSize, handlingFilter, siteId],
  );

  const fetchConversationStats = useCallback(async () => {
    try {
      const url = siteId
        ? `/chat/conversations/stats?siteId=${siteId}`
        : `/chat/conversations/stats`;
      const data = await apiRequest<{
        total: number;
        activeBotCount: number;
        waitingCount: number;
        assignedCount: number;
        closedCount: number;
      }>(url);
      setStats(data);
    } catch (err) {
      console.error('[live-chats] failed to fetch stats:', err);
    }
  }, [siteId]);

  // Initial fetch + re-fetch on page/filter change
  useEffect(() => {
    const init = async () => {
      await fetchConversations();
      await fetchConversationStats();
    };
    void init();
  }, [fetchConversations, fetchConversationStats]);

  // Always-current ref so the socket can refetch without reconnecting on
  // every filter/page change.
  const fetchRef = useRef(fetchConversations);
  useEffect(() => {
    fetchRef.current = fetchConversations;
  }, [fetchConversations]);

  // WebSocket for real-time inbox updates — one stable connection per auth
  // state, not per filter/page change.
  useEffect(() => {
    const token = session?.accessToken;
    if (!isAuthenticated || !token) return;

    const socket = io(WS_ROOT, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    const refetch = () => {
      fetchRef.current({ background: true });
      fetchConversationStats();
    };

    socket.on('newConversation', refetch); // newly created conversation at top
    socket.on('conversationAssigned', refetch); // claimed by another agent
    socket.on('conversationActivity', refetch); // re-sort by lastActivityAt
    socket.on('conversationClosed', refetch); // drop closed conversations

    socket.on('connect_error', (err: Error) => {
      console.error('[live-chats] socket connect_error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, session?.accessToken, fetchConversationStats]);

  return {
    conversations,
    total,
    stats,
    page,
    pageSize,
    handlingFilter,
    isLoading,
    error,
    setPage,
    setHandlingFilter,
    refresh: fetchConversations,
  };
}
