'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Tag,
  Typography,
  Avatar,
  Spin,
  Input,
  Tabs,
  Divider,
  Alert,
  Tooltip,
  Modal,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  SendOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  MailOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useConversationDetail } from '@/src/features/live-chats/hooks/useConversationDetail';
import { useAuth } from '@/src/contexts/AuthContext';
import type { ChatMessage } from '@/src/features/live-chats/types/chat.types';
import ReactMarkdown from 'react-markdown';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getHandlingTag(h: string) {
  if (h === 'WAITING_FOR_AGENT') return <Tag color="orange">Waiting for Agent</Tag>;
  if (h === 'AGENT_HANDLING') return <Tag color="green">Active</Tag>;
  if (h === 'AI_HANDLING') return <Tag color="blue">AI Handling</Tag>;
  return <Tag>{h}</Tag>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
}

function senderKey(msg: ChatMessage) {
  return `${msg.senderType}:${msg.agentId ?? msg.senderName ?? ''}`;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  visitorName,
  currentUserId,
  isFirstInGroup,
  isLastInGroup,
}: {
  msg: ChatMessage;
  visitorName: string;
  currentUserId?: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isAgentSide = msg.senderType === 'AGENT' || msg.senderType === 'AI';
  const isSystem = msg.senderType === 'SYSTEM';
  const isAi = msg.senderType === 'AI';
  const isSelf =
    msg.senderType === 'AGENT' &&
    (!!msg.localId || (!!currentUserId && msg.agentId === currentUserId));
  const senderLabel =
    msg.senderType === 'VISITOR'
      ? visitorName
      : isAi
        ? 'AI Chatbot'
        : isSelf
          ? 'You'
          : msg.senderName || 'Agent';

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <Tag style={{ borderRadius: 12, fontSize: 12, padding: '2px 12px', color: '#6b7280' }}>
          {msg.content}
        </Tag>
      </div>
    );
  }

  const renderMessageStatus = (status?: string) => {
    if (!status) return null;
    const style = { marginLeft: 6, fontSize: 11, fontStyle: 'italic', color: '#6b7280' };
    if (status === 'queued') return <span style={style}>queued</span>;
    if (status === 'SENT') return <span style={style}>sent</span>;
    if (status === 'DELIVERED') return <span style={style}>delivered</span>;
    if (status === 'READ') return <span style={style}>read</span>;
    return null;
  };

  const avatar = isAgentSide ? (
    <Avatar
      size={32}
      icon={isAi ? <RobotOutlined /> : <UserOutlined />}
      style={{
        background: isAi ? '#06b6d4' : '#6366f1',
        color: '#fff',
        flexShrink: 0,
        fontSize: 13,
        fontWeight: 600,
      }}
    />
  ) : (
    <Avatar
      size={32}
      style={{
        background: '#e5e7eb',
        color: '#374151',
        flexShrink: 0,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {visitorName.charAt(0).toUpperCase()}
    </Avatar>
  );
  const avatarSlot = isLastInGroup ? (
    avatar
  ) : (
    <span style={{ width: 32, flex: '0 0 32px' }} aria-hidden="true" />
  );

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        justifyContent: isAgentSide ? 'flex-end' : 'flex-start',
        marginBottom: isLastInGroup ? 10 : 2,
        gap: 8,
        alignItems: 'flex-end',
      }}
    >
      {!isAgentSide && avatarSlot}

      <div style={{ maxWidth: '65%' }}>
        {isFirstInGroup && (
          <Text
            style={{
              fontSize: 11,
              color: '#9ca3af',
              display: 'block',
              marginBottom: 2,
              textAlign: isAgentSide ? 'right' : 'left',
            }}
          >
            {senderLabel}
          </Text>
        )}
        <div
          className="markdown-bubble"
          style={{
            background: isAgentSide ? '#dbeafe' : '#f3f4f6',
            borderRadius: isAgentSide ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            padding: '10px 14px',
            fontSize: 14,
            color: '#111827',
            lineHeight: 1.5,
            width: 'fit-content',
            marginLeft: isAgentSide ? 'auto' : 0,
            wordBreak: 'break-word',
          }}
        >
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        <Text
          style={{
            fontSize: 11,
            color: '#9ca3af',
            display: isLastInGroup || isHovered ? 'block' : 'none',
            marginTop: 2,
            textAlign: isAgentSide ? 'right' : 'left',
          }}
        >
          {formatTime(msg.createdAt)}
          {isAgentSide && renderMessageStatus(msg.status)}
        </Text>
      </div>

      {isAgentSide && avatarSlot}
    </div>
  );
}

// ─── Visitor Info Sidebar ─────────────────────────────────────────────────────

function VisitorInfoTab({
  conversation,
  hasTakenChat,
  isConnected,
  isAiStreaming,
  onTakeChat,
}: {
  conversation: NonNullable<ReturnType<typeof useConversationDetail>['conversation']>;
  hasTakenChat: boolean;
  isConnected: boolean;
  isAiStreaming: boolean;
  onTakeChat: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isWaiting = conversation.handlingStatus === 'WAITING_FOR_AGENT';
  const isClosed = conversation.status === 'CLOSED';
  const durationMins = Math.floor((now - new Date(conversation.createdAt).getTime()) / 60000);

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Status Card */}
      {isWaiting && !hasTakenChat && !isClosed && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 4 }}>
            Waiting for an agent
          </div>
          <div style={{ fontSize: 13, color: '#3b82f6', marginBottom: 12 }}>
            Take this chat to start assisting the visitor.
          </div>
          <Button
            type="primary"
            block
            onClick={onTakeChat}
            disabled={!isConnected || isAiStreaming}
            icon={<UserOutlined />}
            style={{ background: '#2563eb', borderColor: '#2563eb', borderRadius: 8 }}
          >
            Take Chat
          </Button>
        </div>
      )}

      {hasTakenChat && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#15803d', fontSize: 13, fontWeight: 500 }}>
            ✓ You are now handling this conversation
          </Text>
        </div>
      )}

      {isClosed && (
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 20,
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            This conversation is closed
          </Text>
        </div>
      )}

      {/* Visitor Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Avatar size={48} style={{ background: '#6366f1', fontSize: 18, fontWeight: 700 }}>
          {conversation.visitorName.charAt(0).toUpperCase()}
        </Avatar>
        <div>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>
            {conversation.visitorName}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{conversation.visitorEmail}</div>
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Current Page / Site */}
      <div style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, letterSpacing: 0.5 }}>
          CURRENT PAGE
        </Text>
        <div
          style={{
            marginTop: 8,
            background: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <div style={{ fontWeight: 500, color: '#111827', fontSize: 13 }}>
            {conversation.site?.name ?? 'Unknown Site'}
          </div>
          {conversation.site?.url && (
            <a
              href={conversation.site.url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: '#6366f1' }}
            >
              {conversation.site.url}
            </a>
          )}
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Visitor Details */}
      <div style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, letterSpacing: 0.5 }}>
          VISITOR DETAILS
        </Text>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#374151',
            }}
          >
            <MailOutlined style={{ color: '#9ca3af' }} />
            <span>{conversation.visitorEmail}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#374151',
            }}
          >
            <ClockCircleOutlined style={{ color: '#9ca3af' }} />
            <span>Started {relativeTime(conversation.createdAt)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#374151',
            }}
          >
            <GlobalOutlined style={{ color: '#9ca3af' }} />
            <span>
              {durationMins} minute{durationMins !== 1 ? 's' : ''} duration
            </span>
          </div>
        </div>
      </div>

      {conversation.agent && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div>
            <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, letterSpacing: 0.5 }}>
              ASSIGNED AGENT
            </Text>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar size={32} style={{ background: '#10b981' }} icon={<UserOutlined />} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13, color: '#111827' }}>
                  {conversation.agent.name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{conversation.agent.email}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const conversationId = params.id;

  const {
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
  } = useConversationDetail(conversationId);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isVisitorTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canTakeChat = !isAdmin && !conversation?.agentId && conversation?.status !== 'CLOSED';
  const canReply = hasTakenChat && conversation?.status !== 'CLOSED';
  const isClosed = conversation?.status === 'CLOSED';
  const isPaused = conversation?.status === 'PAUSED';

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const durationMins = conversation
    ? Math.floor((now - new Date(conversation.createdAt).getTime()) / 60000)
    : 0;

  if (isLoadingConversation) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <Modal
        open
        title="Conversation unavailable"
        closable={false}
        footer={[
          <Button key="ok" type="primary" onClick={() => router.replace('/live-chats')}>
            OK
          </Button>,
        ]}
      >
        This chat is being handled by another agent.
      </Modal>
    );
  }

  if (error || !conversation) {
    return (
      <div style={{ padding: 32 }}>
        <Alert
          type="error"
          message={error ?? 'Conversation not found'}
          showIcon
          action={
            <Button onClick={() => router.back()} size="small">
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}
    >
      {/* ── Top Header ── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => router.push('/live-chats')}
          style={{ padding: '4px 8px', color: '#374151' }}
        />

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <Title level={4} style={{ margin: 0, fontSize: 18, color: '#111827' }}>
              Chat with {conversation.visitorName}
            </Title>
            {getHandlingTag(conversation.handlingStatus)}
          </div>
          <Text style={{ fontSize: 13, color: '#6b7280' }}>
            {conversation.site?.name ?? 'Unknown Site'}
            {' · '}
            Started{' '}
            {new Date(conversation.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' · '}
            Duration: {durationMins} minute{durationMins !== 1 ? 's' : ''}
          </Text>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {canTakeChat && (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={takeChat}
              disabled={!isConnected || isAiStreaming}
              style={{
                background: '#2563eb',
                borderColor: '#2563eb',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Take Chat
            </Button>
          )}

          {(isAdmin || hasTakenChat) && !isClosed && (
            <>
              <Button
                icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={() => setStatus(isPaused ? 'OPEN' : 'PAUSED')}
                style={{ borderRadius: 8 }}
              >
                {isPaused ? 'Resume Chat' : 'Pause Chat'}
              </Button>
              <Tooltip title="Close this conversation">
                <Popconfirm
                  title="Close conversation"
                  description="Are you sure you want to end this chat?"
                  onConfirm={closeChat}
                  okText="Yes, end chat"
                  cancelText="No"
                  placement="bottomRight"
                >
                  <Button danger icon={<CloseCircleOutlined />} style={{ borderRadius: 8 }}>
                    Close Chat
                  </Button>
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Chat Panel ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            margin: '16px 0 16px 16px',
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <Text style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>Conversation</Text>
            {!isConnected && (
              <Tag
                style={{
                  borderRadius: 20,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#b45309',
                  fontSize: 12,
                  padding: '1px 10px',
                }}
              >
                Reconnecting…
              </Tag>
            )}
            {!canReply && !isClosed && (
              <Tag
                style={{
                  borderRadius: 20,
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontSize: 12,
                  padding: '1px 10px',
                }}
              >
                Preview only
              </Tag>
            )}
            {isClosed && (
              <Tag
                style={{
                  borderRadius: 20,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: 12,
                  padding: '1px 10px',
                }}
              >
                Closed
              </Tag>
            )}
            {isPaused && !isClosed && (
              <Tag
                style={{
                  borderRadius: 20,
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#d97706',
                  fontSize: 12,
                  padding: '1px 10px',
                }}
              >
                Paused
              </Tag>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                minHeight: '100%',
              }}
            >
              {isLoadingMessages ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                  No messages yet
                </div>
              ) : (
                messages.map((msg, index) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    visitorName={conversation.visitorName}
                    currentUserId={user?.id}
                    isFirstInGroup={
                      index === 0 || senderKey(messages[index - 1]) !== senderKey(msg)
                    }
                    isLastInGroup={
                      index === messages.length - 1 ||
                      senderKey(messages[index + 1]) !== senderKey(msg)
                    }
                  />
                ))
              )}
              {isVisitorTyping && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', margin: '8px 0' }}>
                  <Avatar
                    size={32}
                    style={{
                      background: '#e5e7eb',
                      color: '#374151',
                      flexShrink: 0,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    V
                  </Avatar>
                  <div className="typing-bubble">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer */}
          {!isClosed && (
            <div
              style={{
                flexShrink: 0,
                borderTop: '1px solid #f0f0f0',
              }}
            >
              {canReply ? (
                /* Reply input */
                <div
                  style={{ display: 'flex', gap: 10, padding: '14px 20px', alignItems: 'flex-end' }}
                >
                  <TextArea
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      emitTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isPaused
                        ? 'Conversation is paused'
                        : 'Type your reply… (Enter to send, Shift+Enter for new line)'
                    }
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ borderRadius: 10, flex: 1, resize: 'none' }}
                    disabled={isSending || isPaused}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={isSending}
                    disabled={!inputValue.trim() || !isConnected || isPaused}
                    style={{
                      borderRadius: 10,
                      background: '#6366f1',
                      borderColor: '#6366f1',
                      height: 40,
                      paddingInline: 18,
                    }}
                  />
                </div>
              ) : (
                /* Preview banner */
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 10,
                    margin: '12px 20px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>👁</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#92400e', fontSize: 13 }}>
                        You are viewing this conversation
                      </div>
                      <div style={{ fontSize: 12, color: '#b45309' }}>
                        Review the visitor&apos;s messages, then take the chat to reply as an agent.
                      </div>
                    </div>
                  </div>
                  {canTakeChat && (
                    <Button
                      type="primary"
                      icon={<UserOutlined />}
                      onClick={takeChat}
                      disabled={!isConnected || isAiStreaming}
                      style={{
                        background: '#2563eb',
                        borderColor: '#2563eb',
                        borderRadius: 8,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Take Chat →
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            margin: '16px 16px 16px 12px',
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: 'info',
                label: 'Visitor Info',
                children: (
                  <div style={{ padding: '0 16px 16px', overflowY: 'auto' }}>
                    <VisitorInfoTab
                      conversation={conversation}
                      hasTakenChat={hasTakenChat}
                      isConnected={isConnected}
                      isAiStreaming={isAiStreaming}
                      onTakeChat={takeChat}
                    />
                  </div>
                ),
              },
              {
                key: 'notes',
                label: 'Notes',
                children: (
                  <div style={{ padding: '16px' }}>
                    <Paragraph type="secondary" style={{ fontSize: 13 }}>
                      Notes are visible only to your team and are not sent to the visitor.
                    </Paragraph>
                    <TextArea
                      placeholder="Add internal notes here…"
                      autoSize={{ minRows: 4 }}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                ),
              },
            ]}
            style={{ flex: 1 }}
            tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
