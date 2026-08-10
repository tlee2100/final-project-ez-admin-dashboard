'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useOne } from '@refinedev/core';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import type { Site } from '@/src/features/sites/types/site.types';
import type { KBSettings } from '@/src/features/knowledge-base/types/knowledge-base.types';
import { useKnowledgeBase } from '@/src/features/knowledge-base/hooks/useKnowledgeBase';
import { KBStatsHeader } from '@/src/features/knowledge-base/components/KBStatsHeader';
import { KBDocumentsTab } from '@/src/features/knowledge-base/components/KBDocumentsTab';
import { KBCrawlerTab } from '@/src/features/knowledge-base/components/KBCrawlerTab';
import { KBSettingsTab } from '@/src/features/knowledge-base/components/KBSettingsTab';
import { AddContentModal } from '@/src/features/knowledge-base/components/AddContentModal';
import { DocPreviewModal } from '@/src/features/knowledge-base/components/DocPreviewModal';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';

import '@/src/features/knowledge-base/components/knowledge-base.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

type MainTabType = 'documents' | 'crawler' | 'settings';

export default function KnowledgeBasePage({ params }: PageProps) {
  const { id: siteId } = use(params);
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('documents');
  const { isSuperAdmin, isAdmin } = useCurrentRole();
  const canAddContent = isSuperAdmin || isAdmin;

  // Fetch Site detail to get real site name
  const { query } = useOne<Site>({
    resource: 'sites',
    id: siteId,
  });

  const site = query.data?.data;
  const siteName = site?.name || 'TechSolutions Inc.';

  // Custom KB Hook
  const {
    documents,
    stats,
    crawlerConfig,
    settings,
    setSettings,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    sortOption,
    setSortOption,
    page,
    setPage,
    limit,
    setLimit,
    totalDocs,
    isAddModalOpen,
    setIsAddModalOpen,
    previewDoc,
    setPreviewDoc,
    handleAddFile,
    handleAddUrl,
    handleAddSitemap,
    handleDeleteDocument,
  } = useKnowledgeBase(siteId);

  return (
    <div className="kb-page page-fade-in">
      {/* ── Header: Back button + Title + "+ Add Content" Button ── */}
      <div className="kb-header">
        <div className="kb-header-left">
          <Link href={`/sites/${siteId}`} className="kb-back-btn" title="Back to site details">
            <ArrowLeftOutlined />
          </Link>
          <div className="kb-header-titles">
            <h1>Knowledge Base</h1>
            <p className="kb-subtitle">{siteName}</p>
          </div>
        </div>

        {canAddContent && (
          <button className="kb-add-btn" onClick={() => setIsAddModalOpen(true)}>
            <PlusOutlined />
            Add Content
          </button>
        )}
      </div>

      {/* ── Top Stat Cards + Vector Usage Progress ── */}
      <KBStatsHeader stats={stats} />

      {/* ── 3 Main Tabs: Documents | Web Crawler | KB Settings ── */}
      <div className="kb-tabs-bar" role="tablist">
        <button
          className={`kb-tab-btn ${activeMainTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('documents')}
          role="tab"
          aria-selected={activeMainTab === 'documents'}
        >
          Documents
        </button>
        <button
          className={`kb-tab-btn ${activeMainTab === 'crawler' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('crawler')}
          role="tab"
          aria-selected={activeMainTab === 'crawler'}
        >
          Web Crawler
        </button>
        <button
          className={`kb-tab-btn ${activeMainTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('settings')}
          role="tab"
          aria-selected={activeMainTab === 'settings'}
        >
          KB Settings
        </button>
      </div>

      {/* ── Main Tab Content ── */}
      <div>
        {activeMainTab === 'documents' && (
          <KBDocumentsTab
            documents={documents}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            sortOption={sortOption}
            onSortChange={setSortOption}
            page={page}
            limit={limit}
            totalDocs={totalDocs}
            onPageChange={setPage}
            onLimitChange={setLimit}
            onPreview={setPreviewDoc}
            onDelete={handleDeleteDocument}
          />
        )}

        {activeMainTab === 'crawler' && (
          <KBCrawlerTab
            config={crawlerConfig}
            onAddSitemapClick={() => canAddContent && setIsAddModalOpen(true)}
          />
        )}

        {activeMainTab === 'settings' && (
          <KBSettingsTab
            settings={settings}
            onUpdateSettings={(newSettings) =>
              setSettings((prev: KBSettings) => ({ ...prev, ...newSettings }))
            }
          />
        )}
      </div>

      {/* ── Modals ── */}
      {canAddContent && (
        <AddContentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onUploadFiles={handleAddFile}
          onScrapeUrl={handleAddUrl}
          onAddSitemap={handleAddSitemap}
        />
      )}

      <DocPreviewModal
        key={`${siteId}:${previewDoc?.id ?? 'closed'}`}
        doc={previewDoc}
        siteId={siteId}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
