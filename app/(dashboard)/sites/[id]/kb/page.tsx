'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useOne } from '@refinedev/core';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import type { Site } from '@/src/features/sites/types/site.types';
import { useKnowledgeBase } from '@/src/features/knowledge-base/hooks/useKnowledgeBase';
import { KBStatsHeader } from '@/src/features/knowledge-base/components/KBStatsHeader';
import { KBDocumentsTab } from '@/src/features/knowledge-base/components/KBDocumentsTab';
import { KBCrawlerTab } from '@/src/features/knowledge-base/components/KBCrawlerTab';
import { KBSettingsTab } from '@/src/features/knowledge-base/components/KBSettingsTab';
import { AddContentModal } from '@/src/features/knowledge-base/components/AddContentModal';
import { DocPreviewModal } from '@/src/features/knowledge-base/components/DocPreviewModal';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { useCrawler } from '@/src/features/knowledge-base/hooks/useCrawler';
import type { ModalTabType } from '@/src/features/knowledge-base/types/knowledge-base.types';

import '@/src/features/knowledge-base/components/knowledge-base.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

type MainTabType = 'documents' | 'crawler' | 'settings';

export default function KnowledgeBasePage({ params }: PageProps) {
  const { id: siteId } = use(params);
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('documents');
  const [addContentInitialTab, setAddContentInitialTab] = useState<ModalTabType>('upload');
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
    settings,
    isSettingsLoading,
    isSettingsSaving,
    isBulkReindexing,
    saveSettings,
    reindexDocument,
    reindexAllOutdated,
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
    refreshDocuments,
    isAddModalOpen,
    setIsAddModalOpen,
    previewDoc,
    setPreviewDoc,
    handleAddFile,
    handleDeleteDocument,
  } = useKnowledgeBase(siteId);

  const crawler = useCrawler(siteId, refreshDocuments);

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
          <button
            className="kb-add-btn"
            onClick={() => {
              setAddContentInitialTab('upload');
              setIsAddModalOpen(true);
            }}
          >
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
            canManage={canAddContent}
            onReindex={(documentId) => void reindexDocument(documentId)}
          />
        )}

        {activeMainTab === 'crawler' && (
          <KBCrawlerTab
            key={crawler.config?.updatedAt ?? 'new-crawler-config'}
            config={crawler.config}
            activeRun={crawler.activeRun}
            selectedRun={crawler.selectedRun}
            selectedRunId={crawler.selectedRunId}
            runs={crawler.runs}
            pages={crawler.pages}
            pagesTotal={crawler.pagesTotal}
            pagesPage={crawler.pagesPage}
            pagesLimit={crawler.pagesLimit}
            pageSearch={crawler.pageSearch}
            pageStatusFilter={crawler.pageStatusFilter}
            progressPercent={crawler.progressPercent}
            isLoading={crawler.isLoading}
            isActionLoading={crawler.isActionLoading}
            canManage={canAddContent}
            onSelectRun={crawler.setSelectedRunId}
            onStatusFilter={crawler.setPageStatusFilter}
            onSearchPages={crawler.searchPages}
            onPagesChange={(page, pageSize) => {
              crawler.setPagesPage(page);
              crawler.setPagesLimit(pageSize);
            }}
            onSaveConfig={crawler.saveConfig}
            onStartCrawl={crawler.startCrawl}
            onRetryFailed={crawler.retryFailed}
            onRecrawlSource={crawler.recrawlSource}
            onAddSitemapClick={() => {
              if (!canAddContent) return;
              setAddContentInitialTab('sitemap');
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeMainTab === 'settings' && (
          <KBSettingsTab
            key={`${siteId}:${settings.chunkSize}:${settings.chunkOverlap}:${settings.topKResults}:${settings.similarityThreshold}`}
            settings={settings}
            canManage={canAddContent}
            isLoading={isSettingsLoading}
            isSaving={isSettingsSaving}
            isBulkReindexing={isBulkReindexing}
            onSave={saveSettings}
            onReindexAll={reindexAllOutdated}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {canAddContent && (
        <AddContentModal
          key={`${siteId}:${addContentInitialTab}:${isAddModalOpen ? 'open' : 'closed'}`}
          isOpen={isAddModalOpen}
          initialTab={addContentInitialTab}
          onClose={() => setIsAddModalOpen(false)}
          onUploadFiles={handleAddFile}
          onScrapeUrl={(url) => void crawler.ingestUrl(url)}
          onAddSitemap={(sitemapUrl) => void crawler.addSitemapAndStart(sitemapUrl)}
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
