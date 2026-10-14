'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Alert, message } from 'antd';
import {
  GlobalOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useLiveChats } from '@/src/features/live-chats/hooks/useLiveChats';
import type { Conversation } from '@/src/features/live-chats/types/chat.types';

interface TabConversationsProps {
  siteId: string;
  siteName: string;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusBadgeFor(conv: Conversation): { cls: string; label: string } {
  if (conv.status === 'CLOSED') return { cls: 'closed', label: 'Closed' };
  if (conv.handlingStatus === 'WAITING_FOR_AGENT') return { cls: 'waiting', label: 'Waiting' };
  if (conv.handlingStatus === 'AGENT_HANDLING') return { cls: 'agent', label: 'Agent' };
  return { cls: 'active', label: 'Active' };
}

export function TabConversations({ siteId, siteName }: TabConversationsProps) {
  const router = useRouter();
  const { conversations, stats, handlingFilter, setHandlingFilter, isLoading, error } =
    useLiveChats(siteId);
  const [searchTerm, setSearchTerm] = useState('');

  // Real metrics derived from the live conversations stats
  const countAll = stats.total;
  const countActive = stats.activeBotCount;
  const countWaiting = stats.waitingCount;
  const countWithAgent = stats.assignedCount;
  const countClosed = stats.closedCount;
  const countOpen = stats.activeBotCount + stats.waitingCount + stats.assignedCount;

  const filteredConvs = useMemo(() => {
    if (!searchTerm.trim()) return conversations;

    return conversations.filter((c: Conversation) => {
      const q = searchTerm.toLowerCase();
      const matchesName = c.visitorName?.toLowerCase().includes(q) ?? false;
      const matchesMsg = (c.latestMessage?.content ?? '').toLowerCase().includes(q);
      const matchesEmail = c.visitorEmail?.toLowerCase().includes(q) ?? false;
      return matchesName || matchesMsg || matchesEmail;
    });
  }, [conversations, searchTerm]);

  const handleLiveMonitor = () => {
    message.info('Redirecting to Live Chat monitor...');
    setTimeout(() => router.push('/live-chats'), 400);
  };

  const openConversation = (convId: string) => {
    router.push(`/live-chats/${convId}`);
  };

  if (error) {
    return <Alert type="error" message={error} showIcon style={{ borderRadius: 8 }} />;
  }

  const metrics = [
    {
      title: 'On this site',
      icon: <GlobalOutlined className="conv-metric-icon blue" />,
      value: countAll,
    },
    {
      title: 'Active',
      icon: <PlayCircleOutlined className="conv-metric-icon green" />,
      value: countActive,
    },
    {
      title: 'Waiting',
      icon: <ClockCircleOutlined className="conv-metric-icon yellow" />,
      value: countWaiting,
    },
    {
      title: 'With agent',
      icon: <CustomerServiceOutlined className="conv-metric-icon purple" />,
      value: countWithAgent,
    },
    {
      title: 'Closed',
      icon: <CheckCircleOutlined className="conv-metric-icon grey" />,
      value: countClosed,
    },
  ];

  return (
    <div className="conversations-tab-container">
      {/* ── Metric Summary Row ── */}
      <div className="conv-metrics-row">
        {metrics.map((m) => (
          <div key={m.title} className="conv-metric-card">
            <div className="conv-metric-header">
              <span className="conv-metric-title">{m.title}</span>
              {m.icon}
            </div>
            <span className="conv-metric-value">{m.value}</span>
          </div>
        ))}
      </div>

      {/* ── Controls Section ── */}
      <div className="conv-controls-bar">
        <div className="conv-filters">
          <button
            className={`conv-filter-btn ${handlingFilter === '' ? 'active' : ''}`}
            onClick={() => setHandlingFilter('')}
          >
            All Open <span className="filter-count">{countOpen}</span>
          </button>
          <button
            className={`conv-filter-btn ${handlingFilter === 'AI_HANDLING' ? 'active' : ''}`}
            onClick={() => setHandlingFilter('AI_HANDLING')}
          >
            Active <span className="filter-count">{countActive}</span>
          </button>
          <button
            className={`conv-filter-btn ${handlingFilter === 'WAITING_FOR_AGENT' ? 'active' : ''}`}
            onClick={() => setHandlingFilter('WAITING_FOR_AGENT')}
          >
            Waiting <span className="filter-count">{countWaiting}</span>
          </button>
          <button
            className={`conv-filter-btn ${handlingFilter === 'CLOSED' ? 'active' : ''}`}
            onClick={() => setHandlingFilter('CLOSED')}
          >
            Closed <span className="filter-count">{countClosed}</span>
          </button>
        </div>

        <div className="conv-search-actions">
          <div className="conv-search-wrapper">
            <SearchOutlined className="conv-search-icon" />
            <input
              type="text"
              className="conv-search-input"
              placeholder={`Search conversations on ${siteName}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search conversation list"
            />
          </div>
          <button className="conv-monitor-btn" onClick={handleLiveMonitor}>
            <DashboardOutlined /> Live monitor
          </button>
        </div>
      </div>

      {/* ── Conversations List ── */}
      <div className="conv-list">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : filteredConvs.length === 0 ? (
          <div className="conv-empty-state">
            <p className="conv-empty-text">No conversations match the current criteria.</p>
          </div>
        ) : (
          filteredConvs.map((conv: Conversation) => {
            const badge = statusBadgeFor(conv);
            const isWaiting = conv.handlingStatus === 'WAITING_FOR_AGENT';
            return (
              <div key={conv.id} className="conv-list-card">
                <div className="conv-card-left">
                  <div className="conv-avatar">
                    {(conv.visitorName || '?')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="conv-info-col">
                    <div className="conv-name-row">
                      <span className="conv-visitor-name">{conv.visitorName}</span>
                      <span className={`conv-status-badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p className="conv-message-preview">
                      {conv.latestMessage?.content ?? 'No messages yet'}
                    </p>
                    <div className="conv-meta-info-row">
                      <span className="conv-meta-time">{relativeTime(conv.lastActivityAt)}</span>
                      <span className="conv-meta-dot">•</span>
                      <span className="conv-meta-start">{conv.visitorEmail || 'No email'}</span>
                    </div>
                  </div>
                </div>

                <div className="conv-card-right">
                  {isWaiting ? (
                    <button
                      className="conv-action-btn primary"
                      onClick={() => openConversation(conv.id)}
                    >
                      Take chat &rarr;
                    </button>
                  ) : (
                    <button
                      className="conv-action-btn secondary"
                      onClick={() => openConversation(conv.id)}
                    >
                      Join &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
