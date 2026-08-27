import React, { useState, useMemo } from 'react';
import {
  CloseOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  SearchOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  ReadOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Tooltip, message, Segmented, Input, Button } from 'antd';
import type { KBDocument, DocumentChunksResponse } from '../types/knowledge-base.types';
import { useCustom } from '@refinedev/core';

interface DocPreviewModalProps {
  doc: KBDocument | null;
  siteId: string;
  onClose: () => void;
}

export function DocPreviewModal({ doc, siteId, onClose }: DocPreviewModalProps) {
  const { query } = useCustom<DocumentChunksResponse>({
    url: doc && siteId ? `/sites/${siteId}/kb/sources/${doc.id}/chunks` : '',
    method: 'get',
    queryOptions: {
      enabled: !!siteId && !!doc?.id,
    },
  });

  const loading = query.isLoading && query.isFetching;
  const error =
    query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null;
  const docDetail = query.data?.data?.document || null;
  const chunks = query.data?.data?.chunks;

  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'original'>('content');

  // Reconstruct the full document content from all chunks in order
  const fullDocumentText = useMemo(() => {
    if (!chunks || !chunks.length) return '';
    return [...chunks]
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((c) => c.content)
      .join('\n\n');
  }, [chunks]);

  // Document Reading Metrics
  const readingMetrics = useMemo(() => {
    if (!fullDocumentText.trim()) {
      return { words: 0, characters: 0, readingTimeMinutes: 0 };
    }
    const words = fullDocumentText.trim().split(/\s+/).filter(Boolean).length;
    const characters = fullDocumentText.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, characters, readingTimeMinutes };
  }, [fullDocumentText]);

  // Match count when searching
  const matchCount = useMemo(() => {
    if (!searchQuery.trim() || !fullDocumentText) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = fullDocumentText.match(regex);
    return matches ? matches.length : 0;
  }, [searchQuery, fullDocumentText]);

  // Copy Full Document Text
  const handleCopyFullText = async () => {
    if (!fullDocumentText) return;
    try {
      await navigator.clipboard.writeText(fullDocumentText);
      setCopied(true);
      message.success('Full document content copied to clipboard');
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      message.error('Failed to copy to clipboard');
    }
  };

  // Helper to render text with search highlight
  const renderHighlightedContent = (text: string, query: string) => {
    if (!query.trim()) {
      return text;
    }
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="kb-search-highlight">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  if (!doc) return null;

  const isProcessing = doc.status === 'processing';
  const isFailed = doc.status === 'failed';
  const hasOriginalFile = Boolean(docDetail?.filePath && docDetail.filePath.startsWith('http'));
  const isPdf = doc.type.toLowerCase() === 'pdf';

  return (
    <div className="kb-modal-overlay" onClick={onClose}>
      <div className="kb-modal-container kb-reader-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Modal Top Header: Document Info + Actions ── */}
        <div className="kb-reader-header">
          <div className="kb-reader-title-area">
            <div className={`kb-doc-icon-wrapper ${doc.type}`}>
              {isPdf ? <FilePdfOutlined /> : <FileTextOutlined />}
            </div>

            <div className="kb-reader-title-info">
              <div className="kb-reader-title-tags">
                <h3 className="kb-reader-doc-name" title={doc.name}>
                  {doc.name}
                </h3>
                <Tag color="indigo" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  {doc.type}
                </Tag>
                {isProcessing ? (
                  <Tag icon={<SyncOutlined spin />} color="processing">
                    Processing
                  </Tag>
                ) : isFailed ? (
                  <Tag icon={<ExclamationCircleOutlined />} color="error">
                    Failed
                  </Tag>
                ) : (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    Ready
                  </Tag>
                )}
              </div>

              <div className="kb-reader-meta-row">
                <span>Uploaded: {doc.uploadedAtFormatted}</span>
                {doc.sizeFormatted && <span>• Size: {doc.sizeFormatted}</span>}
                {readingMetrics.words > 0 && (
                  <span>
                    • <FontSizeOutlined /> {readingMetrics.words.toLocaleString()} words
                  </span>
                )}
                {readingMetrics.readingTimeMinutes > 0 && (
                  <span>
                    • <ClockCircleOutlined /> ~{readingMetrics.readingTimeMinutes} min read
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="kb-reader-header-actions">
            {hasOriginalFile && (
              <Tooltip title="Open original file in a new tab">
                <a
                  href={docDetail?.filePath ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kb-btn-header-action"
                >
                  <DownloadOutlined />
                  <span>Original File</span>
                </a>
              </Tooltip>
            )}

            <Tooltip title={copied ? 'Copied!' : 'Copy full document text'}>
              <Button
                type="primary"
                className="kb-btn-header-action primary"
                onClick={handleCopyFullText}
                disabled={!fullDocumentText || loading}
                aria-label="Copy full document text"
                icon={copied ? <CheckOutlined style={{ color: '#10b981' }} /> : <CopyOutlined />}
              >
                <span>{copied ? 'Copied' : 'Copy All'}</span>
              </Button>
            </Tooltip>

            {/* Vertical Divider & Clean Close Button */}
            <div className="kb-reader-header-divider" />
            <Button
              type="text"
              className="kb-reader-close-btn"
              onClick={onClose}
              aria-label="Close modal"
              title="Close modal"
              icon={<CloseOutlined />}
            />
          </div>
        </div>

        {/* ── Toolbar: View Mode Switcher + Search ── */}
        <div className="kb-reader-toolbar">
          <div className="kb-reader-view-tabs">
            {hasOriginalFile ? (
              <Segmented
                value={activeTab}
                onChange={(val) => setActiveTab(val as 'content' | 'original')}
                options={[
                  {
                    label: 'Document Content',
                    value: 'content',
                    icon: <ReadOutlined />,
                  },
                  {
                    label: 'Original File Preview',
                    value: 'original',
                    icon: <LinkOutlined />,
                  },
                ]}
              />
            ) : (
              <div className="kb-reader-tab-static">
                <ReadOutlined style={{ color: '#6366f1' }} />
                <span>Document Content</span>
              </div>
            )}
          </div>

          {activeTab === 'content' && (
            <div className="kb-reader-search-wrapper">
              <div className="kb-reader-search-box">
                <SearchOutlined style={{ color: '#94a3b8' }} />
                <Input
                  placeholder="Search in document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="kb-reader-search-input"
                  bordered={false}
                />
                {searchQuery && (
                  <Button
                    type="text"
                    size="small"
                    className="kb-reader-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                    icon={<CloseOutlined style={{ fontSize: 10 }} />}
                  />
                )}
              </div>
              {searchQuery.trim() && (
                <span className="kb-search-matches-badge">
                  {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Main Document Reading Body ── */}
        <div className="kb-reader-body">
          {loading ? (
            <div className="kb-reader-loading-state">
              <Spin size="large" />
              <p style={{ marginTop: 16, color: '#64748b', fontSize: 14 }}>
                Loading document content...
              </p>
            </div>
          ) : error ? (
            <div className="kb-reader-error-state">
              <ExclamationCircleOutlined
                style={{ fontSize: 28, color: '#ef4444', marginBottom: 12 }}
              />
              <strong style={{ color: '#b91c1c', fontSize: 15 }}>Failed to load document</strong>
              <p style={{ margin: '6px 0 0', color: '#ef4444', fontSize: 13 }}>{error}</p>
            </div>
          ) : isProcessing ? (
            <div className="kb-reader-processing-state">
              <Spin indicator={<SyncOutlined spin style={{ fontSize: 32, color: '#6366f1' }} />} />
              <h4 style={{ margin: '16px 0 6px', color: '#1e293b', fontSize: 16 }}>
                Document is being processed
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#64748b',
                  maxWidth: 460,
                  lineHeight: 1.6,
                }}
              >
                The background processor is extracting clean text and preparing the knowledge base.
                The full content will be available here once processing completes.
              </p>
            </div>
          ) : activeTab === 'original' && hasOriginalFile ? (
            <div className="kb-reader-original-preview">
              {isPdf ? (
                <iframe
                  src={docDetail?.filePath ?? undefined}
                  title={doc.name}
                  className="kb-reader-iframe"
                />
              ) : (
                <div className="kb-reader-file-link-box">
                  <FileTextOutlined style={{ fontSize: 48, color: '#6366f1', marginBottom: 16 }} />
                  <h4 style={{ margin: '0 0 8px', fontSize: 16, color: '#1e293b' }}>{doc.name}</h4>
                  <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>
                    Click below to open and view the original file directly.
                  </p>
                  <a
                    href={docDetail?.filePath ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kb-btn-primary"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <DownloadOutlined /> Open Original File
                  </a>
                </div>
              )}
            </div>
          ) : !fullDocumentText.trim() ? (
            <div className="kb-reader-empty-state">
              <InfoCircleOutlined style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                No text content extracted for this document.
              </p>
            </div>
          ) : (
            <div className="kb-reader-canvas">
              <div className="kb-reader-paper">
                <div className="kb-reader-text">
                  {renderHighlightedContent(fullDocumentText, searchQuery)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="kb-reader-footer">
          <div className="kb-reader-footer-info">
            <span>
              {readingMetrics.words.toLocaleString()} words ·{' '}
              {readingMetrics.characters.toLocaleString()} characters
            </span>
          </div>
          <Button className="kb-btn-secondary" onClick={onClose}>
            Close Reader
          </Button>
        </div>
      </div>
    </div>
  );
}
