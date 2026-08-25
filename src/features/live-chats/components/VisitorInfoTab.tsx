'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Button, Avatar, Divider } from 'antd';
import { UserOutlined, GlobalOutlined, MailOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { useConversationDetail } from '../hooks/useConversationDetail';
import { relativeTime } from '../utils/chatFormat.utils';

const { Text } = Typography;

interface VisitorInfoTabProps {
  conversation: NonNullable<ReturnType<typeof useConversationDetail>['conversation']>;
  hasTakenChat: boolean;
  isConnected: boolean;
  isAiStreaming: boolean;
  onTakeChat: () => void;
}

export function VisitorInfoTab({
  conversation,
  hasTakenChat,
  isConnected,
  isAiStreaming,
  onTakeChat,
}: VisitorInfoTabProps) {
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
