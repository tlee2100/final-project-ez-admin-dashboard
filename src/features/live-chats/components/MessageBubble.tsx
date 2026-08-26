'use client';

import React, { useState } from 'react';
import { Typography, Tag, Avatar, Image } from 'antd';
import { UserOutlined, RobotOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../types/chat.types';
import { formatTime } from '../utils/chatFormat.utils';

const { Text } = Typography;

interface MessageBubbleProps {
  msg: ChatMessage;
  visitorName: string;
  currentUserId?: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export function MessageBubble({
  msg,
  visitorName,
  currentUserId,
  isFirstInGroup,
  isLastInGroup,
}: MessageBubbleProps) {
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
      {(visitorName || 'Guest').charAt(0).toUpperCase()}
    </Avatar>
  );

  const avatarSlot = isLastInGroup ? (
    avatar
  ) : (
    <span style={{ width: 32, flex: '0 0 32px' }} aria-hidden="true" />
  );

  const handleDownloadImage = async (srcUrl: string) => {
    try {
      if (srcUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = srcUrl;
        a.download = 'attachment.png';
        a.click();
      } else {
        const res = await fetch(srcUrl);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = 'attachment.png';
        a.click();
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      window.open(srcUrl, '_blank');
    }
  };

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
          <Image.PreviewGroup>
            <ReactMarkdown
              components={{
                img(props) {
                  const src = props.src as string;
                  return (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <Image
                        src={src}
                        alt={props.alt}
                        style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }}
                        preview={{
                          toolbarRender: (originalNode) => (
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              {originalNode}
                              <a
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDownloadImage(src);
                                }}
                                style={{
                                  color: 'rgba(255, 255, 255, 0.85)',
                                  fontSize: 20,
                                  cursor: 'pointer',
                                  marginLeft: 16,
                                }}
                              >
                                <DownloadOutlined />
                              </a>
                            </div>
                          ),
                        }}
                      />
                    </div>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </Image.PreviewGroup>
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
