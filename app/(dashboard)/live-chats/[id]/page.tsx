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
  Alert,
  Tooltip,
  Modal,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useConversationDetail } from '@/src/features/live-chats/hooks/useConversationDetail';
import { useAuth } from '@/src/contexts/AuthContext';
import { MessageBubble } from '@/src/features/live-chats/components/MessageBubble';
import { VisitorInfoTab } from '@/src/features/live-chats/components/VisitorInfoTab';
import { ChatInputArea } from '@/src/features/live-chats/components/ChatInputArea';
import { getHandlingTag, senderKey } from '@/src/features/live-chats/utils/chatFormat.utils';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isVisitorTyping]);

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

          {/* Messages List */}
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

          {/* Footer Input Area */}
          {!isClosed && (
            <div
              style={{
                flexShrink: 0,
                borderTop: '1px solid #f0f0f0',
              }}
            >
              {canReply ? (
                <ChatInputArea
                  conversationId={conversationId}
                  isSending={isSending}
                  isPaused={isPaused}
                  isConnected={isConnected}
                  onSendMessage={sendMessage}
                  onTyping={emitTyping}
                />
              ) : (
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
