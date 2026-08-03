'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { io, Socket } from 'socket.io-client';
import { apiRequest, getStoredAccessToken, ApiError } from '@/src/lib/api.client';
import { useAuth } from '@/src/contexts/AuthContext';
import type { Conversation, ChatMessage } from '../types/chat.types';

// ChatGateway runs on the default namespace at the API root. NEXT_PUBLIC_API_URL
// includes the /api/v1 REST prefix, so strip it for the socket connection
// (otherwise socket.io treats "/api/v1" as a namespace and never connects).
const WS_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(
  /\/api\/v\d+\/?$/,
  '',
);

// True when the backend blocked viewing because another agent owns the chat.
function isAccessDeniedError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.statusCode === 403 &&
    err.message.toLowerCase().includes('handled by another agent')
  );
}

export function useConversationDetail(conversationId: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  // Derived: the current user is handling this conversation iff they are the
  // assigned agent. Derived (not state) so it survives a page reload —
  // otherwise hasTakenChat reset to false and the reply box disappeared.
  const hasTakenChat = !!conversation?.agentId && !!user?.id && conversation.agentId === user.id;

  // ─── Fetch conversation and messages ─────────────────────────────────────

  const fetchConversation = useCallback(async () => {
    setIsLoadingConversation(true);
    setAccessDenied(false);
    try {
      const data = await apiRequest<Conversation>(`/chat/conversations/${conversationId}`);
      setConversation(data);
    } catch (err: unknown) {
      if (isAccessDeniedError(err)) {
        setAccessDenied(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      }
    } finally {
      setIsLoadingConversation(false);
    }
  }, [conversationId]);

  const fetchMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      const data = await apiRequest<ChatMessage[]>(
        `/chat/conversations/${conversationId}/messages?limit=100`,
      );
      setMessages(data);
    } catch (err: unknown) {
      // Access-denied is surfaced via accessDenied from fetchConversation; don't
      // also set a generic error (the page redirects instead).
      if (!isAccessDeniedError(err)) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchConversation(), fetchMessages()]);
    };
    void init();
  }, [fetchConversation, fetchMessages]);

  // ─── WebSocket ────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) return;

    const socket = io(WS_ROOT, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      console.error('[chat-detail] socket connect_error:', err.message);
    });

    socket.on('connected', () => {
      // Subscribe to conversation room (preview mode — no claiming)
      socket.emit('subscribeConversation', { conversationId });
    });

    socket.on('joinedConversation', () => {
      // Refresh conversation so the derived hasTakenChat (agentId === me)
      // flips the UI to "handling" and enables the reply box.
      fetchConversation();
    });

    // Take Chat failed (already claimed / unauthorized / not found)
    socket.on('joinError', (err?: { message?: string }) => {
      message.error(err?.message || 'Unable to take this chat');
    });

    socket.on('newMessage', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('messageSaved', (msg: ChatMessage & { localId?: string }) => {
      // Replace optimistic message with the server-confirmed one
      setMessages((prev) =>
        prev.map((m) =>
          m.localId && m.localId === msg.localId ? { ...msg, localId: undefined } : m,
        ),
      );
    });

    socket.on('conversationClosed', () => {
      fetchConversation();
    });

    socket.on('conversationAssigned', () => {
      fetchConversation();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId, fetchConversation]);

  // ─── Take Chat ────────────────────────────────────────────────────────────

  const takeChat = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      message.warning('Reconnecting… please try again in a moment');
      return;
    }
    socket.emit('joinConversation', { conversationId });
  }, [conversationId]);

  // ─── Send Message ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        message.warning('Not connected — please wait for the chat to reconnect');
        return;
      }
      if (!content.trim()) return;

      setIsSending(true);
      const localId = `local-${Date.now()}`;

      // Optimistic update
      const optimistic: ChatMessage = {
        id: localId,
        localId,
        conversationId,
        senderType: 'AGENT',
        agentId: null,
        content,
        status: 'SENT',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      socket.emit('sendMessage', {
        conversationId,
        content,
        senderType: 'AGENT',
        localId,
      });

      setIsSending(false);
    },
    [conversationId],
  );

  // ─── Close Chat ───────────────────────────────────────────────────────────

  const closeChat = useCallback(async () => {
    await apiRequest(`/chat/conversations/${conversationId}/close`, {
      method: 'PATCH',
    });
    fetchConversation();
  }, [conversationId, fetchConversation]);

  return {
    conversation,
    messages,
    isLoadingConversation,
    isLoadingMessages,
    isSending,
    hasTakenChat,
    isConnected,
    accessDenied,
    error,
    takeChat,
    sendMessage,
    closeChat,
    refresh: fetchConversation,
  };
}
