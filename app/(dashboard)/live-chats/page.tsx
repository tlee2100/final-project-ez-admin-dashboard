'use client';

import './live-chats.css';
import React from 'react';
import Link from 'next/link';
import { Input, Button, Avatar, Alert, Spin, Dropdown, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useOne } from '@refinedev/core';
import type { Site } from '@/src/features/sites/types/site.types';
import {
  FilterOutlined,
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
import type { HandlingStatus, Conversation } from '@/src/features/live-chats/types/chat.types';
import { useSitesData } from '@/src/features/sites/hooks/useSitesData';
import { useAuth } from '@/src/contexts/AuthContext';

const { RangePicker } = DatePicker;

const rangePresets = [
  { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
  {
    label: 'Yesterday',
    value: [dayjs().subtract(1, 'd').startOf('day'), dayjs().subtract(1, 'd').endOf('day')] as [
      Dayjs,
      Dayjs,
    ],
  },
  { label: 'This Week', value: [dayjs().startOf('week'), dayjs().endOf('week')] as [Dayjs, Dayjs] },
];

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
  const [selectedSiteId, setSelectedSiteId] = React.useState<string | undefined>();
  const {
    conversations,
    total,
    stats,
    isLoadingStats,
    handlingFilter,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    setHandlingFilter,
    agentId,
    setAgentId,
    setDateRange,
    searchText,
    setSearchText,
  } = useLiveChats(selectedSiteId);

  const { filteredSites } = useSitesData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { query: siteQuery } = useOne<Site>({
    resource: 'sites',
    id: selectedSiteId as string,
    queryOptions: { enabled: !!selectedSiteId },
  });

  const siteAgents = siteQuery.data?.data?.agents || [];

  const { activeBotCount, waitingCount, assignedCount, closedCount } = stats;

  const tabs = [
    { key: '', label: 'All Conversations', count: stats.total },
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
      <div className="lc-stats-grid">
        <div className="lc-stat-card lc-bot-chats">
          <div className="lc-stat-header">
            <span className="lc-stat-title">Active Bot Chats</span>
            <div className="lc-stat-icon-wrapper lc-bot">
              <RobotOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div className="lc-stat-body">
            <span className="lc-stat-value">
              {isLoadingStats ? <span className="lc-stat-skeleton" /> : activeBotCount}
            </span>
          </div>
        </div>

        <div className="lc-stat-card lc-waiting">
          <div className="lc-stat-header">
            <span className="lc-stat-title">Waiting for Agent</span>
            <div className="lc-stat-icon-wrapper lc-waiting">
              <ClockCircleOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div className="lc-stat-body">
            <span className="lc-stat-value">
              {isLoadingStats ? <span className="lc-stat-skeleton" /> : waitingCount}
            </span>
            <span className="lc-stat-badge lc-high-priority">2 high priority</span>
          </div>
        </div>

        <div className="lc-stat-card lc-assigned">
          <div className="lc-stat-header">
            <span className="lc-stat-title">Agent Assigned</span>
            <div className="lc-stat-icon-wrapper lc-assigned">
              <UserOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div className="lc-stat-body">
            <span className="lc-stat-value">
              {isLoadingStats ? <span className="lc-stat-skeleton" /> : assignedCount}
            </span>
            <span className="lc-stat-badge lc-to-me">2 to me</span>
          </div>
        </div>

        <div className="lc-stat-card lc-closed">
          <div className="lc-stat-header">
            <span className="lc-stat-title">Recently Closed</span>
            <div className="lc-stat-icon-wrapper lc-closed">
              <CheckCircleOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div className="lc-stat-body">
            <span className="lc-stat-value">
              {isLoadingStats ? <span className="lc-stat-skeleton" /> : closedCount}
            </span>
          </div>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="lc-filters-row">
        <div className="lc-search-input-wrapper">
          <Input.Search
            placeholder="Search by visitor name..."
            allowClear
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(val) => setSearchText(val)}
          />
        </div>
        <div className="lc-filters-actions">
          <Dropdown
            menu={{
              items: [
                { key: 'all', label: 'All Sites' },
                ...filteredSites.map((site) => ({ key: site.id, label: site.name })),
              ],
              onClick: (info) => setSelectedSiteId(info.key === 'all' ? undefined : info.key),
            }}
            trigger={['click']}
          >
            <Button icon={<FilterOutlined />} className="lc-filter-btn">
              {selectedSiteId
                ? filteredSites.find((s) => s.id === selectedSiteId)?.name || 'Filtered'
                : 'Filter by Site'}
            </Button>
          </Dropdown>

          {isAdmin && selectedSiteId && (
            <Select
              className="filter-select"
              value={agentId}
              onChange={(val) => setAgentId(val)}
              style={{ width: 160 }}
              options={[
                { label: 'All Agents', value: 'all' },
                { label: 'Unassigned', value: 'unassigned' },
                ...siteAgents.map((a: { id: string; name?: string; email?: string }) => ({
                  label: a.name || a.email,
                  value: a.id,
                })),
              ]}
            />
          )}

          <RangePicker
            className="filter-datepicker"
            presets={rangePresets}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange({ start: dates[0].toISOString(), end: dates[1].toISOString() });
              } else {
                setDateRange(null);
              }
            }}
          />
        </div>
      </div>

      {/* ── Tabs Row ── */}
      <div className="lc-custom-tabs-row">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`lc-pill-tab ${handlingFilter === tab.key ? 'active' : ''}`}
            onClick={() => {
              setHandlingFilter(tab.key as HandlingStatus | 'CLOSED' | '');
            }}
          >
            {tab.label}
            <span className="lc-tab-count">{isLoadingStats ? '-' : tab.count}</span>
          </div>
        ))}
      </div>

      {/* ── List / Cards View ── */}
      <div className="lc-conversations-list">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="lc-empty-state">
            <MessageOutlined className="lc-empty-state-icon" />
            <div className="lc-empty-state-title">No conversations found</div>
            <div className="lc-empty-state-desc">New chats will appear here in real time</div>
          </div>
        ) : (
          conversations.map((chat: Conversation) => {
            let statusClass = 'closed';
            let statusLabel = 'Closed';
            if (chat.status === 'CLOSED') {
              statusClass = 'closed';
              statusLabel = 'Closed';
            } else if (chat.handlingStatus === 'WAITING_FOR_AGENT') {
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
              <div key={chat.id} className="lc-conversation-card">
                <div className="lc-card-avatar">
                  <Avatar
                    size={48}
                    src={undefined}
                    icon={<UserOutlined />}
                    style={{ background: '#6366f1' }}
                  >
                    {chat.visitorName?.charAt(0).toUpperCase()}
                  </Avatar>
                </div>

                <div className="lc-card-content">
                  <div className="lc-card-header">
                    <span className="lc-visitor-name">{chat.visitorName}</span>
                    <span className={`lc-status-tag ${statusClass}`}>{statusLabel}</span>
                  </div>

                  {/* Latest message preview */}
                  <div className="lc-message-preview">
                    {chat.latestMessage?.content ?? 'No messages yet'}
                  </div>

                  <div className="lc-card-footer">
                    <div className="lc-footer-item">
                      <GlobalOutlined />
                      <span>{chat.site?.name || 'TechSolutions Inc.'}</span>
                    </div>
                    <span>•</span>
                    <div className="lc-footer-item">
                      <ClockCircleOutlined />
                      <span>{relativeTime(chat.lastActivityAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="lc-card-actions">
                  <Link href={`/live-chats/${chat.id}`}>
                    <button className="lc-action-btn">
                      {chat.agentId ? 'View Chat' : isAdmin ? 'View Chat' : 'Take Chat'}
                      <ArrowRightOutlined style={{ fontSize: 12 }} />
                    </button>
                  </Link>
                  <div className="lc-page-url">
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

      {/* ── Load More Button ── */}
      {hasMore && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          <Button
            size="large"
            onClick={loadMore}
            loading={isLoadingMore}
            style={{
              minWidth: 200,
              height: 42,
              borderRadius: 8,
              fontWeight: 600,
              borderColor: '#d1d5db',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            {isLoadingMore ? 'Loading...' : `Load More Chats (${conversations.length} of ${total})`}
          </Button>
        </div>
      )}
    </div>
  );
}
