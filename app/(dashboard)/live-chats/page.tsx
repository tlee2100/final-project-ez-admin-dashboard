'use client';

import './live-chats.css';
import React from 'react';
import Link from 'next/link';
import { Input, Button, Avatar, Alert, Spin } from 'antd';
import {
  FilterOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MessageOutlined,
  RobotOutlined,
  GlobalOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useLiveChats } from '@/src/features/live-chats/hooks/useLiveChats';
import type { HandlingStatus } from '@/src/features/live-chats/types/chat.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveChatsPage() {
  const { conversations, total, handlingFilter, isLoading, error, setHandlingFilter } =
    useLiveChats();

  // For UI demonstration, we count what is on the current page.
  // In a full implementation, you'd fetch these aggregates from the backend.
  const activeBotCount = conversations.filter((c) => c.handlingStatus === 'AI_HANDLING').length;
  const waitingCount = conversations.filter((c) => c.handlingStatus === 'WAITING_FOR_AGENT').length;
  const assignedCount = conversations.filter((c) => c.handlingStatus === 'AGENT_HANDLING').length;
  const closedCount = conversations.filter((c) => c.status === 'CLOSED').length;

  const tabs = [
    { key: '', label: 'All Conversations', count: total },
    { key: 'AI_HANDLING', label: 'Active', count: activeBotCount },
    { key: 'WAITING_FOR_AGENT', label: 'Waiting', count: waitingCount },
    { key: 'AGENT_HANDLING', label: 'Agent Assigned', count: assignedCount },
    // CLOSED is a status, not handlingStatus, but we add it for layout completeness
    { key: 'CLOSED', label: 'Recently Closed', count: closedCount },
  ];

  return (
    <div className="live-chats-container">
      {/* ── Error ── */}
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          closable
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* ── Stat Cards Row ── */}
      <div className="stats-grid">
        <div className="stat-card bot-chats">
          <div className="stat-header">
            <span className="stat-title">Active Bot Chats</span>
            <div className="stat-icon-wrapper bot">
              <RobotOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div className="stat-body">
            <span className="stat-value">{activeBotCount}</span>
          </div>
        </div>

        <div className="stat-card waiting">
          <div className="stat-header">
            <span className="stat-title">Waiting for Agent</span>
            <div className="stat-icon-wrapper waiting">
              <ClockCircleOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div className="stat-body">
            <span className="stat-value">{waitingCount}</span>
            <span className="stat-badge high-priority">2 high priority</span>
          </div>
        </div>

        <div className="stat-card assigned">
          <div className="stat-header">
            <span className="stat-title">Agent Assigned</span>
            <div className="stat-icon-wrapper assigned">
              <UserOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div className="stat-body">
            <span className="stat-value">{assignedCount}</span>
            <span className="stat-badge to-me">2 to me</span>
          </div>
        </div>

        <div className="stat-card closed">
          <div className="stat-header">
            <span className="stat-title">Recently Closed</span>
            <div className="stat-icon-wrapper closed">
              <CheckCircleOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div className="stat-body">
            <span className="stat-value">{closedCount}</span>
          </div>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="filters-row">
        <div className="search-input-wrapper">
          <Input.Search placeholder="Search conversations..." allowClear size="large" />
        </div>
        <div className="filters-actions">
          <Button icon={<FilterOutlined />} className="filter-btn">
            Filter by Site
          </Button>
          <Button icon={<UserOutlined />} className="filter-btn">
            Filter by Agent
          </Button>
          <Button icon={<CalendarOutlined />} className="filter-btn">
            Today
          </Button>
        </div>
      </div>

      {/* ── Tabs Row ── */}
      <div className="custom-tabs-row">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`pill-tab ${handlingFilter === tab.key ? 'active' : ''}`}
            onClick={() => {
              if (tab.key !== 'CLOSED') {
                setHandlingFilter(tab.key as HandlingStatus | '');
              }
            }}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </div>
        ))}
      </div>

      {/* ── List / Cards View ── */}
      <div className="conversations-list">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <MessageOutlined className="empty-state-icon" />
            <div className="empty-state-title">No active conversations</div>
            <div className="empty-state-desc">New chats will appear here in real time</div>
          </div>
        ) : (
          conversations.map((chat) => {
            let statusClass = 'closed';
            let statusLabel = 'Closed';
            if (chat.handlingStatus === 'WAITING_FOR_AGENT') {
              statusClass = 'waiting';
              statusLabel = 'Waiting for Agent';
            } else if (chat.handlingStatus === 'AGENT_HANDLING') {
              statusClass = 'assigned';
              statusLabel = 'Agent Assigned';
            } else if (chat.handlingStatus === 'AI_HANDLING') {
              statusClass = 'active';
              statusLabel = 'Active';
            }

            return (
              <div key={chat.id} className="conversation-card">
                <div className="card-avatar">
                  <Avatar
                    size={48}
                    src={undefined}
                    icon={<UserOutlined />}
                    style={{ background: '#6366f1' }}
                  >
                    {chat.visitorName?.charAt(0).toUpperCase()}
                  </Avatar>
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <span className="visitor-name">{chat.visitorName}</span>
                    <span className={`status-tag ${statusClass}`}>{statusLabel}</span>
                  </div>

                  {/* Latest message preview */}
                  <div className="message-preview">
                    {chat.latestMessage?.content ?? 'No messages yet'}
                  </div>

                  <div className="card-footer">
                    <div className="footer-item">
                      <GlobalOutlined />
                      <span>{chat.site?.name || 'TechSolutions Inc.'}</span>
                    </div>
                    <span>•</span>
                    <div className="footer-item">
                      <ClockCircleOutlined />
                      <span>{relativeTime(chat.lastActivityAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <Link href={`/live-chats/${chat.id}`}>
                    <button className="action-btn">
                      {chat.handlingStatus === 'WAITING_FOR_AGENT' ? 'Take Chat' : 'Join Chat'}
                      <ArrowRightOutlined style={{ fontSize: 12 }} />
                    </button>
                  </Link>
                  <div className="page-url">
                    <FileTextOutlined />
                    <a href={chat.site?.url || '#'} target="_blank" rel="noreferrer">
                      {chat.site?.url || 'https://techsolutions.example.com'}
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
