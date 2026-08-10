'use client';

import React, { use, useState } from 'react';
import { useOne } from '@refinedev/core';
import type { Site } from '@/src/features/sites/types/site.types';
import { getSiteDetailInfo } from '@/src/features/sites/mock/sitesDetailMockData';
import { SiteDetailHeader } from '@/src/features/sites/components/detail/SiteDetailHeader';
import { SiteDetailStats } from '@/src/features/sites/components/detail/SiteDetailStats';
import { TabPreview } from '@/src/features/sites/components/detail/TabPreview';
import { TabTestChatbot } from '@/src/features/sites/components/detail/TabTestChatbot';
import { TabConversations } from '@/src/features/sites/components/detail/TabConversations';
import { TabKnowledgeBase } from '@/src/features/sites/components/detail/TabKnowledgeBase';
import { TabAgentManagement } from '@/src/features/sites/components/detail/TabAgentManagement';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { useLiveChats } from '@/src/features/live-chats/hooks/useLiveChats';
import '@/src/features/sites/components/detail/sites-detail.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabKey = 'preview' | 'test' | 'conversations' | 'knowledge-base' | 'agents';

export default function SiteDetailPage({ params }: PageProps) {
  const { id: siteId } = use(params);
  const [activeTab, setActiveTab] = useState<TabKey>('preview');
  const { isSuperAdmin, isAdmin } = useCurrentRole();
  const canManage = isSuperAdmin || isAdmin;

  // Fetch site data via Refine
  const { query } = useOne<Site>({
    resource: 'sites',
    id: siteId,
  });

  const site = query.data?.data;
  const isLoading = query.isLoading;

  // Fetch real live chat data
  const { conversations, stats: chatStats } = useLiveChats(siteId);

  if (isLoading) {
    return (
      <div className="site-detail-page loading">
        <div
          className="site-detail-skeleton-header"
          style={{ height: 60, background: '#f3f4f6', borderRadius: 8, marginBottom: 20 }}
        />
        <div
          className="site-detail-skeleton-stats"
          style={{ height: 100, background: '#f3f4f6', borderRadius: 12, marginBottom: 20 }}
        />
        <div
          className="site-detail-skeleton-body"
          style={{ height: 400, background: '#f3f4f6', borderRadius: 16 }}
        />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="site-detail-page error" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Site not found</h2>
        <p>The requested site with ID &quot;{siteId}&quot; could not be retrieved.</p>
      </div>
    );
  }

  // Load detailed dynamic mock data
  const mockDetailInfo = getSiteDetailInfo(site.id, site.name, site.kbDocuments, site.activeChats);

  // Override mock stats with real data
  const detailInfo = {
    ...mockDetailInfo,
    totalChats: chatStats.total + chatStats.closedCount,
    activeChats: chatStats.activeBotCount,
  };

  return (
    <div className="site-detail-page page-fade-in">
      {/* Header */}
      <SiteDetailHeader site={site} />

      {/* Stats row */}
      <SiteDetailStats stats={detailInfo} />

      {/* Tab Switcher */}
      <div className="site-detail-tabs-nav" role="tablist">
        <button
          className={`site-detail-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
          role="tab"
          aria-selected={activeTab === 'preview'}
        >
          Preview
        </button>
        <button
          className={`site-detail-tab-btn ${activeTab === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTab('test')}
          role="tab"
          aria-selected={activeTab === 'test'}
        >
          Test Chatbot
        </button>
        <button
          className={`site-detail-tab-btn ${activeTab === 'conversations' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversations')}
          role="tab"
          aria-selected={activeTab === 'conversations'}
        >
          Conversations
        </button>
        {canManage && (
          <button
            className={`site-detail-tab-btn ${activeTab === 'knowledge-base' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge-base')}
            role="tab"
            aria-selected={activeTab === 'knowledge-base'}
          >
            Knowledge Base
          </button>
        )}
        {canManage && (
          <button
            className={`site-detail-tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
            role="tab"
            aria-selected={activeTab === 'agents'}
          >
            Agent Management
          </button>
        )}
      </div>

      {/* Tab Body */}
      <div className="site-detail-tab-body">
        {activeTab === 'preview' && <TabPreview key={site.id} siteId={site.id} />}
        {activeTab === 'test' && <TabTestChatbot key={site.id} stats={detailInfo} />}
        {activeTab === 'conversations' && (
          <TabConversations key={site.id} siteId={site.id} siteName={site.name} />
        )}
        {activeTab === 'knowledge-base' && canManage && (
          <TabKnowledgeBase key={site.id} site={site} />
        )}
        {activeTab === 'agents' && canManage && (
          <TabAgentManagement key={site.id} siteId={site.id} siteName={site.name} />
        )}
      </div>
    </div>
  );
}
