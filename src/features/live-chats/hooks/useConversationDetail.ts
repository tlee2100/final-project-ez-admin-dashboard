'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { io, Socket } from 'socket.io-client';
import { apiRequest, ApiError } from '@/src/lib/api.client';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/src/contexts/AuthContext';
import type { Conversation, ChatMessage, ConversationStatus } from '../types/chat.types';

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
  const [isVisitorTyping, setIsVisitorTyping] = useState(false);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const hasTakenChatRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const { data: session } = useSession();

  // Derived: the current user is handling this conversation iff they are the
  // assigned agent. Derived (not state) so it survives a page reload —
  // otherwise hasTakenChat reset to false and the reply box disappeared.
  const hasTakenChat = !!conversation?.agentId && !!user?.id && conversation.agentId === user.id;

  useEffect(() => {
    hasTakenChatRef.current = hasTakenChat;
  }, [hasTakenChat]);

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
    const token = session?.accessToken;
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
      setMessages((prev) => {
        const next = msg.senderType === 'AI' ? prev.filter((m) => m.id !== 'ai-stream-temp') : prev;
        return [...next, msg];
      });

      if (msg.senderType === 'VISITOR') {
        setIsVisitorTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (document.hasFocus() && hasTakenChatRef.current) {
          socket.emit('conversation-read', { conversationId });
        }
      }
    });

    socket.on('messageSaved', (msg: ChatMessage & { localId?: string }) => {
      // Replace optimistic message with the server-confirmed one
      setMessages((prev) =>
        prev.map((m) =>
          m.localId && m.localId === msg.localId ? { ...msg, localId: undefined } : m,
        ),
      );
    });

    socket.on(
      'conversation-delivered',
      (payload: { conversationId: string; receiverType: string }) => {
        if (payload.conversationId !== conversationId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.senderType !== payload.receiverType && m.status === 'SENT'
              ? { ...m, status: 'DELIVERED' }
              : m,
          ),
        );
      },
    );

    socket.on('conversation-read', (payload: { conversationId: string; readerType: string }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderType !== payload.readerType && (m.status === 'SENT' || m.status === 'DELIVERED')
            ? { ...m, status: 'READ' }
            : m,
        ),
      );
    });

    socket.on('conversation-typing', (payload: { conversationId: string; senderType: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.senderType === 'VISITOR') {
        setIsVisitorTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsVisitorTyping(false), 3000);
      }
    });

    const handleFocus = () => {
      if (document.hasFocus() && hasTakenChatRef.current) {
        socket.emit('conversation-read', { conversationId });
      }
    };
    window.addEventListener('focus', handleFocus);

    socket.on('conversationClosed', () => {
      fetchConversation();
    });

    socket.on(
      'conversationStatusChanged',
      (payload: { conversationId: string; status: string }) => {
        if (payload.conversationId !== conversationId) return;
        setConversation((prev) =>
          prev ? { ...prev, status: payload.status as ConversationStatus } : prev,
        );
      },
    );

    socket.on('conversationAssigned', () => {
      fetchConversation();
    });

    socket.on('ai-stream-start', (payload: { conversationId: string }) => {
      if (payload.conversationId === conversationId) {
        setIsAiStreaming(true);
        setMessages((prev) => {
          if (prev.some((m) => m.id === 'ai-stream-temp')) return prev;
          return [
            ...prev,
            {
              id: 'ai-stream-temp',
              conversationId,
              senderType: 'AI',
              agentId: null,
              content: '',
              status: 'SENT',
              createdAt: new Date().toISOString(),
            },
          ];
        });
      }
    });

    socket.on('aiChunk', (payload: { token: string; conversationId: string }) => {
      if (payload.conversationId === conversationId) {
        setMessages((prev) => {
          if (!prev.some((m) => m.id === 'ai-stream-temp')) {
            return [
              ...prev,
              {
                id: 'ai-stream-temp',
                conversationId,
                senderType: 'AI',
                agentId: null,
                content: payload.token,
                status: 'SENT',
                createdAt: new Date().toISOString(),
              },
            ];
          }
          return prev.map((m) =>
            m.id === 'ai-stream-temp' ? { ...m, content: m.content + payload.token } : m,
          );
        });
      }
    });

    socket.on('ai-stream-end', (payload: { conversationId: string }) => {
      if (payload.conversationId === conversationId) {
        setIsAiStreaming(false);
      }
    });

    return () => {
      socket.off('newMessage');
      socket.off('messageSaved');
      socket.off('conversation-delivered');
      socket.off('conversation-read');
      socket.off('conversation-typing');
      socket.off('conversationStatusChanged');
      socket.off('ai-stream-start');
      socket.off('aiChunk');
      socket.off('ai-stream-end');
      window.removeEventListener('focus', handleFocus);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, fetchConversation, session?.accessToken]);

  // ─── Take Chat ────────────────────────────────────────────────────────────

  const takeChat = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      message.warning('Reconnecting… please try again in a moment');
      return;
    }
    socket.emit('joinConversation', { conversationId });
  }, [conversationId]);

  const emitTyping = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('conversation-typing', { conversationId });
    }
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
        senderName: user?.name ?? null,
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
    [conversationId, user?.name],
  );

  // ─── Close Chat ───────────────────────────────────────────────────────────

  const closeChat = useCallback(async () => {
    try {
      await apiRequest(`/chat/conversations/${conversationId}/close`, { method: 'PATCH' });
      // The socket event conversationClosed will re-fetch and update the UI
      message.success('Conversation closed');
    } catch (err) {
      console.error(err);
      message.error('Failed to close conversation');
    }
  }, [conversationId]);

  const setStatus = useCallback(
    async (status: string) => {
      try {
        await apiRequest(`/chat/conversations/${conversationId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      } catch (err) {
        console.error(err);
        message.error(`Failed to change status to ${status}`);
      }
    },
    [conversationId],
  );

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
    isVisitorTyping,
    isAiStreaming,
    takeChat,
    sendMessage,
    emitTyping,
    closeChat,
    setStatus,
    refresh: fetchConversation,
  };
}
