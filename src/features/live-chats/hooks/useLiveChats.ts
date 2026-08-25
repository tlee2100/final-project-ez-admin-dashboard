'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiRequest } from '@/src/lib/api.client';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useList, useInvalidate, CrudFilter } from '@refinedev/core';
import type { Conversation, HandlingStatus } from '../types/chat.types';

const WS_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(
  /\/api\/v\d+\/?$/,
  '',
);

export type DateRangeFilter = { start?: string; end?: string } | null;

export function useLiveChats(siteId?: string) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [handlingFilter, setHandlingFilter] = useState<HandlingStatus | 'CLOSED' | ''>('');
  const [agentId, setAgentId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>(null);

  const [stats, setStats] = useState({
    total: 0,
    activeBotCount: 0,
    waitingCount: 0,
    assignedCount: 0,
    closedCount: 0,
  });

  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuth();
  const { data: session } = useSession();
  const invalidate = useInvalidate();

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

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
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
        if (isMounted) setStats(data);
      } catch (err) {
        console.error('[live-chats] failed to fetch stats:', err);
      }
    };
    void loadStats();
    return () => {
      isMounted = false;
    };
  }, [siteId]);

  // Build Refine filters
  const filters: CrudFilter[] = [];

  if (handlingFilter) {
    if (handlingFilter === 'CLOSED') {
      filters.push({ field: 'status', operator: 'eq', value: 'CLOSED' });
    } else {
      filters.push({ field: 'handlingStatus', operator: 'eq', value: handlingFilter });
      filters.push({ field: 'status', operator: 'eq', value: 'OPEN' }); // status != CLOSED
    }
  } else {
    filters.push({ field: 'status', operator: 'eq', value: 'OPEN' });
  }

  if (siteId) {
    filters.push({ field: 'siteId', operator: 'eq', value: siteId });
  }

  if (agentId !== 'all') {
    if (agentId === 'unassigned') {
      filters.push({ field: 'agentId', operator: 'null', value: 'true' });
    } else {
      filters.push({ field: 'agentId', operator: 'eq', value: agentId });
    }
  }

  if (dateRange?.start) {
    filters.push({ field: 'lastActivityAt', operator: 'gte', value: dateRange.start });
  }
  if (dateRange?.end) {
    filters.push({ field: 'lastActivityAt', operator: 'lte', value: dateRange.end });
  }

  const [accumulatedList, setAccumulatedList] = useState<Conversation[]>([]);
  const [lastProcessed, setLastProcessed] = useState<{
    data?: Conversation[];
    page: number;
    siteId: string | null | undefined;
  }>({
    page: 1,
    siteId: null,
  });

  // Reset page when filters change
  const handleSetHandlingFilter = useCallback((filter: HandlingStatus | 'CLOSED' | '') => {
    setHandlingFilter(filter);
    setPage(1);
  }, []);

  const handleSetAgentId = useCallback((id: string) => {
    setAgentId(id);
    setPage(1);
  }, []);

  const handleSetDateRange = useCallback((range: DateRangeFilter) => {
    setDateRange(range);
    setPage(1);
  }, []);

  const [prevSiteId, setPrevSiteId] = useState(siteId);
  if (siteId !== prevSiteId) {
    setPrevSiteId(siteId);
    setPage(1);
  }

  const { query: listQuery } = useList<Conversation>({
    resource: 'chat/conversations/active',
    pagination: { currentPage: page, pageSize },
    sorters: [{ field: 'lastActivityAt', order: 'desc' }],
    filters,
  });

  const queryData = listQuery.data?.data;
  const total = listQuery.data?.total ?? 0;
  const error = listQuery.error ? listQuery.error.message : null;
  const isFetching = listQuery.isLoading || listQuery.isFetching;
  const refetch = listQuery.refetch;

  if (
    queryData &&
    (lastProcessed.data !== queryData ||
      lastProcessed.page !== page ||
      lastProcessed.siteId !== siteId)
  ) {
    setLastProcessed({ data: queryData, page, siteId });
    if (page === 1) {
      setAccumulatedList(queryData);
    } else {
      const existingIds = new Set(accumulatedList.map((c) => c.id));
      const newItems = queryData.filter((c) => !existingIds.has(c.id));
      setAccumulatedList([...accumulatedList, ...newItems]);
    }
  }

  const conversations = page === 1 && queryData ? queryData : accumulatedList;

  const hasMore = conversations.length < total;
  const isLoading = page === 1 && isFetching && conversations.length === 0;
  const isLoadingMore = page > 1 && isFetching;

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isFetching, hasMore]);

  // WebSocket for real-time inbox updates
  useEffect(() => {
    const token = session?.accessToken;
    if (!isAuthenticated || !token) return;

    const socket = io(WS_ROOT, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    const handleSocketEvent = () => {
      // Silently invalidate to trigger a background refetch
      invalidate({
        resource: 'chat/conversations/active',
        invalidates: ['list'],
      });
      fetchConversationStats();
    };

    socket.on('newConversation', handleSocketEvent);
    socket.on('conversationAssigned', handleSocketEvent);
    socket.on('conversationActivity', handleSocketEvent);
    socket.on('conversationClosed', handleSocketEvent);

    socket.on('connect_error', (err: Error) => {
      console.error('[live-chats] socket connect_error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, session?.accessToken, fetchConversationStats, invalidate]);

  return {
    conversations,
    total,
    stats,
    page,
    pageSize,
    hasMore,
    isLoadingMore,
    loadMore,
    handlingFilter,
    agentId,
    dateRange,
    isLoading,
    error,
    setPage,
    setHandlingFilter: handleSetHandlingFilter,
    setAgentId: handleSetAgentId,
    setDateRange: handleSetDateRange,
    refresh: refetch,
  };
}
