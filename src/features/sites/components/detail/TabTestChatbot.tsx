'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendOutlined, UndoOutlined, CheckSquareOutlined, BorderOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { io, Socket } from 'socket.io-client';
import { apiRequest } from '@/src/lib/api.client';
import type { SiteDetailInfo, MockKBFile } from '../../mock/sitesDetailMockData';

interface TabTestChatbotProps {
  siteId: string;
  stats: SiteDetailInfo;
}

interface MessageItem {
  id: string;
  sender: 'bot' | 'visitor' | 'system';
  text: string;
  timestamp: string;
}

interface KBResponse {
  data: {
    id: string;
    filename: string;
    fileSizeBytes: number;
    fileType: string;
  }[];
}

// BACKEND_URL already contains '/api/v1' (NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1)
// Strip the '/api/v1' suffix to get the socket host
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const SOCKET_HOST = BACKEND_URL.replace(/\/api\/v1\/?$/, '');

export function TabTestChatbot({ siteId, stats }: TabTestChatbotProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputVal, setInputVal] = useState('');

  // Real KB state
  const [kbDocuments, setKbDocuments] = useState<MockKBFile[]>([]);
  const [selectedKB, setSelectedKB] = useState<string[]>([]);

  // Chat state
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch real KB Documents on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDocuments = async () => {
      try {
        const response = await apiRequest<KBResponse>(`/sites/${siteId}/kb/sources`);
        if (isMounted && response?.data) {
          const docs: MockKBFile[] = response.data.map((doc) => ({
            name: doc.filename,
            size: `${(doc.fileSizeBytes / 1024).toFixed(1)} KB`,
            type: doc.fileType,
          }));
          setKbDocuments(docs);
          setSelectedKB(docs.map((d) => d.name));
        }
      } catch (err) {
        console.error('Failed to fetch KB documents:', err);
        // Fallback to stats mock if API fails
        if (isMounted) {
          setKbDocuments(stats.kbDocuments);
          setSelectedKB(stats.kbDocuments.map((d) => d.name));
        }
      }
    };
    void fetchDocuments();
    return () => {
      isMounted = false;
    };
  }, [siteId, stats.kbDocuments]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Create conversation and connect socket
  const initializeChat = useCallback(async () => {
    try {
      // 1. Create a sandboxed test conversation via the admin-only endpoint.
      //    apiRequest automatically attaches the JWT Bearer token so the
      //    DomainAllowlistGuard is bypassed cleanly via JwtAuthGuard.
      const data = await apiRequest<{ conversationId: string }>('/chat/admin-test/conversations', {
        method: 'POST',
        body: JSON.stringify({ siteId }),
      });

      if (!data?.conversationId) {
        throw new Error('Failed to create test conversation');
      }

      const newConversationId = data.conversationId;
      setConversationId(newConversationId);
      setMessages([
        {
          id: `msg-start-${Date.now()}`,
          sender: 'bot',
          text: `Hi there! I'm your AI assistant. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);

      // 2. Initialize Socket connection to the base host (not the /api/v1 path)
      const newSocket = io(SOCKET_HOST, {
        query: { conversationId: newConversationId },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected for testing:', newConversationId);
      });

      newSocket.on('newMessage', (payload: { id: string; senderType: string; content: string }) => {
        if (payload.senderType === 'VISITOR') return;

        setIsTyping(false);
        setMessages((prev) => {
          // If we are replacing an AI stream message
          if (payload.senderType === 'AI') {
            const filtered = prev.filter((m) => m.id !== `ai-stream-${newConversationId}`);
            return [
              ...filtered,
              {
                id: payload.id,
                sender: 'bot',
                text: payload.content,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ];
          }
          return [
            ...prev,
            {
              id: payload.id,
              sender: payload.senderType === 'SYSTEM' ? 'system' : 'bot',
              text: payload.content,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      });

      newSocket.on('aiChunk', (payload: { conversationId: string; token: string }) => {
        if (payload.conversationId !== newConversationId) return;
        setIsTyping(false);

        setMessages((prev) => {
          const streamId = `ai-stream-${newConversationId}`;
          const existingIdx = prev.findIndex((m) => m.id === streamId);
          if (existingIdx >= 0) {
            const copy = [...prev];
            copy[existingIdx] = {
              ...copy[existingIdx],
              text: copy[existingIdx].text + payload.token,
            };
            return copy;
          }
          return [
            ...prev,
            {
              id: streamId,
              sender: 'bot',
              text: payload.token,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      });

      newSocket.on('aiMessageComplete', (payload: { conversationId: string }) => {
        if (payload.conversationId !== newConversationId) return;
        setIsTyping(false);
      });

      setSocket(newSocket);
    } catch (err) {
      console.error('Chat init error:', err);
      setMessages([
        {
          id: `msg-error-${Date.now()}`,
          sender: 'system',
          text: `Failed to connect to the live chatbot server.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [siteId]);

  // Initial chat setup
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initializeChat();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleResetConversation = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    void initializeChat();
  };

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !conversationId || !socket) return;

      const userMsg: MessageItem = {
        id: `msg-user-${Date.now()}`,
        sender: 'visitor',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputVal('');
      setIsTyping(true);

      // Emit to backend
      socket.emit('sendMessage', {
        conversationId,
        content: text,
        senderType: 'VISITOR',
        localId: userMsg.id,
      });
    },
    [conversationId, socket],
  );

  return (
    <div className="test-chatbot-container">
      {/* ── Left Pane: Active Chat Window ── */}
      <div className="test-chat-pane">
        <div className="test-chat-header">
          <div className="test-chat-header-info">
            <span className="test-chat-title">Test Your Chatbot</span>
            <span className="test-chat-badge active">Live Testing</span>
          </div>
          <button className="test-chat-reset-btn" onClick={handleResetConversation}>
            <UndoOutlined /> Reset Conversation
          </button>
        </div>

        {/* Message Feed */}
        <div className="test-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
              <div className="chat-message-bubble">
                <div className="chat-message-text">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
                <span className="chat-message-time">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message-row bot typing">
              <div className="chat-message-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Box */}
        <form
          className="test-chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
        >
          <input
            type="text"
            className="test-chat-input"
            placeholder="Type your message..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isTyping || !conversationId}
            maxLength={200}
            autoComplete="off"
          />
          <button
            type="submit"
            className="test-chat-send-btn"
            disabled={!inputVal.trim() || isTyping || !conversationId}
          >
            <SendOutlined />
          </button>
        </form>
      </div>

      {/* ── Right Pane: Side Panel Testing Controls ── */}
      <div className="test-controls-pane">
        <h3 className="test-pane-title">Testing Controls</h3>

        {/* Section: KB Documents Selectors */}
        <div className="test-control-section">
          <h4 className="test-section-subtitle">Knowledge Base</h4>
          <p className="test-section-desc">
            These documents are currently active in the site&apos;s Knowledge Base and will be used
            by the AI.
          </p>
          <div className="test-kb-list">
            {kbDocuments.length === 0 && (
              <p style={{ color: '#888', fontSize: '0.85rem' }}>No documents uploaded yet.</p>
            )}
            {kbDocuments.map((doc) => {
              const isChecked = selectedKB.includes(doc.name);
              return (
                <button
                  key={doc.name}
                  className={`test-kb-item ${isChecked ? 'selected' : ''}`}
                  aria-label={`Document ${doc.name}`}
                  style={{ cursor: 'default' }}
                >
                  <span className="test-kb-icon">
                    {isChecked ? <CheckSquareOutlined /> : <BorderOutlined />}
                  </span>
                  <div className="test-kb-info">
                    <span className="test-kb-name">{doc.name}</span>
                    <span className="test-kb-meta">
                      {doc.type} • {doc.size}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Sample Questions List */}
        <div className="test-control-section">
          <h4 className="test-section-subtitle">Sample Questions</h4>
          <p className="test-section-desc">
            Try these sample questions to test your chatbot&apos;s responses.
          </p>
          <div className="test-questions-list">
            {stats.sampleQuestions.map((q) => (
              <button
                key={q}
                className="test-question-card"
                onClick={() => handleSendMessage(q)}
                disabled={isTyping || !conversationId}
              >
                <span className="test-question-card-text">{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
