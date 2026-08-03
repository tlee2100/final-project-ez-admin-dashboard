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
  const { conversations, isLoading, error } = useLiveChats(siteId);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Real metrics derived from the live conversations list (shared logic with
  // the live-chats page via useLiveChats).
  const countAll = conversations.length;
  const countActive = conversations.filter((c) => c.handlingStatus === 'AI_HANDLING').length;
  const countWaiting = conversations.filter((c) => c.handlingStatus === 'WAITING_FOR_AGENT').length;
  const countWithAgent = conversations.filter((c) => c.handlingStatus === 'AGENT_HANDLING').length;
  const countClosed = conversations.filter((c) => c.status === 'CLOSED').length;

  const filteredConvs = useMemo(() => {
    return conversations.filter((c) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.visitorName.toLowerCase().includes(q);
        const matchesMsg = (c.latestMessage?.content ?? '').toLowerCase().includes(q);
        const matchesEmail = c.visitorEmail.toLowerCase().includes(q);
        if (!matchesName && !matchesMsg && !matchesEmail) return false;
      }

      if (activeFilter === 'open') return c.status !== 'CLOSED';
      if (activeFilter === 'waiting') return c.handlingStatus === 'WAITING_FOR_AGENT';
      if (activeFilter === 'closed') return c.status === 'CLOSED';
      return true;
    });
  }, [conversations, activeFilter, searchTerm]);

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
            className={`conv-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All <span className="filter-count">{countAll}</span>
          </button>
          <button
            className={`conv-filter-btn ${activeFilter === 'open' ? 'active' : ''}`}
            onClick={() => setActiveFilter('open')}
          >
            Open <span className="filter-count">{countAll - countClosed}</span>
          </button>
          <button
            className={`conv-filter-btn ${activeFilter === 'waiting' ? 'active' : ''}`}
            onClick={() => setActiveFilter('waiting')}
          >
            Waiting <span className="filter-count">{countWaiting}</span>
          </button>
          <button
            className={`conv-filter-btn ${activeFilter === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('closed')}
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
          filteredConvs.map((conv) => {
            const badge = statusBadgeFor(conv);
            const isWaiting = conv.handlingStatus === 'WAITING_FOR_AGENT';
            return (
              <div key={conv.id} className="conv-list-card">
                <div className="conv-card-left">
                  <div className="conv-avatar">
                    {conv.visitorName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
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
                      <span className="conv-meta-start">{conv.visitorEmail}</span>
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
