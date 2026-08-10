import React, { useState, useEffect, useMemo } from 'react';
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
  CodeOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Tooltip, message } from 'antd';
import type {
  KBDocument,
  DocumentChunkItem,
  DocumentChunksResponse,
} from '../types/knowledge-base.types';
import { fetchDocumentChunksApi } from '../services/knowledge-base.api';

interface DocPreviewModalProps {
  doc: KBDocument | null;
  siteId: string;
  onClose: () => void;
}

export function DocPreviewModal({ doc, siteId, onClose }: DocPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docDetail, setDocDetail] = useState<DocumentChunksResponse['document'] | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkItem[]>([]);
  const [searchChunkQuery, setSearchChunkQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!doc || !siteId) return;

    let isMounted = true;

    fetchDocumentChunksApi(siteId, doc.id)
      .then((res) => {
        if (isMounted) {
          setChunks(res.chunks || []);
          setDocDetail(res.document);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch document chunks';
          setError(msg);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [doc, siteId]);

  const filteredChunks = useMemo(() => {
    if (!searchChunkQuery.trim()) return chunks;
    const q = searchChunkQuery.toLowerCase();
    return chunks.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        (c.sectionTitle && c.sectionTitle.toLowerCase().includes(q)),
    );
  }, [chunks, searchChunkQuery]);

  const totalTokens = useMemo(() => {
    return chunks.reduce((acc, c) => acc + (c.tokenCount || 0), 0);
  }, [chunks]);

  const handleCopyChunk = async (chunkId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(chunkId);
      message.success('Chunk text copied to clipboard');
      setTimeout(() => {
        setCopiedId((curr) => (curr === chunkId ? null : curr));
      }, 2000);
    } catch {
      message.error('Failed to copy to clipboard');
    }
  };

  if (!doc) return null;

  const isProcessing = doc.status === 'processing';
  const isFailed = doc.status === 'failed';
  const embeddingModel = chunks[0]?.embeddingModel || 'text-embedding-3-small';
  const vectorDims = chunks[0]?.vectorDimensions || 1536;

  return (
    <div className="kb-modal-overlay" onClick={onClose}>
      <div
        className="kb-modal-container kb-chunk-inspector-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="kb-modal-close" onClick={onClose} aria-label="Close modal">
          <CloseOutlined />
        </button>

        {/* ── Modal Top Header: Document Info + Compact Stats ── */}
        <div className="kb-inspector-header">
          <div className="kb-inspector-title-area">
            <div
              className={`kb-doc-icon-wrapper ${doc.type}`}
              style={{ width: 42, height: 42, fontSize: 20, flexShrink: 0 }}
            >
              <FileTextOutlined />
            </div>

            <div className="kb-inspector-title-info">
              <div className="kb-inspector-title-tags">
                <h3 className="kb-inspector-doc-name" title={doc.name}>
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

              <div className="kb-inspector-meta-row">
                <span>Uploaded: {doc.uploadedAtFormatted}</span>
                {doc.processedAtFormatted && <span>• Processed: {doc.processedAtFormatted}</span>}
                {docDetail?.filePath && docDetail.filePath.startsWith('http') && (
                  <>
                    <span>•</span>
                    <a
                      href={docDetail.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="kb-inspector-source-link"
                    >
                      <LinkOutlined /> View Original File
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Compact Stats Badges */}
          <div className="kb-inspector-stats-row">
            <div className="kb-inspector-stat-item">
              <span className="label">Chunks</span>
              <span className="value primary">{chunks.length}</span>
            </div>
            <div className="kb-inspector-stat-item">
              <span className="label">Tokens</span>
              <span className="value">{totalTokens.toLocaleString()}</span>
            </div>
            <div className="kb-inspector-stat-item">
              <span className="label">Model</span>
              <span className="value" title={embeddingModel}>
                {embeddingModel}
              </span>
            </div>
            <div className="kb-inspector-stat-item">
              <span className="label">Vector Dim</span>
              <span className="value success">{vectorDims}d</span>
            </div>
          </div>
        </div>

        {/* ── Toolbar: Search & Count ── */}
        <div className="kb-inspector-toolbar">
          <div className="kb-inspector-toolbar-title">
            <CodeOutlined style={{ color: '#6366f1', fontSize: 16 }} />
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Extracted Vector Chunks ({filteredChunks.length} of {chunks.length})
            </h4>
          </div>

          <div className="kb-chunk-search-box">
            <SearchOutlined style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search in chunks..."
              value={searchChunkQuery}
              onChange={(e) => setSearchChunkQuery(e.target.value)}
              className="kb-chunk-search-input"
            />
          </div>
        </div>

        {/* ── Chunks Scrollable Content (Takes all remaining vertical space) ── */}
        <div className="kb-chunks-list-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" description="Loading chunks and vector embeddings..." />
            </div>
          ) : error ? (
            <div className="kb-chunk-error-box">
              <ExclamationCircleOutlined style={{ fontSize: 20, color: '#ef4444' }} />
              <div>
                <strong style={{ display: 'block', color: '#b91c1c' }}>
                  Failed to load chunks
                </strong>
                <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="kb-chunk-processing-box">
              <Spin indicator={<SyncOutlined spin style={{ fontSize: 24, color: '#6366f1' }} />} />
              <h4 style={{ margin: '12px 0 4px', color: '#1e293b' }}>
                Document is being chunked and embedded
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 460 }}>
                The background Bull queue worker is splitting the sanitized text into contextual
                chunks, generating OpenAI 1536-dimensional embeddings, and persisting them to
                PgVector.
              </p>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <InfoCircleOutlined style={{ fontSize: 32, color: '#cbd5e1', marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14 }}>
                {searchChunkQuery
                  ? `No chunks match your search query "${searchChunkQuery}"`
                  : 'No chunks available for this document.'}
              </p>
            </div>
          ) : (
            filteredChunks.map((chunk) => (
              <div key={chunk.id || chunk.chunkIndex} className="kb-chunk-card">
                {/* Chunk Card Header */}
                <div className="kb-chunk-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="kb-chunk-index-badge">Chunk #{chunk.chunkIndex}</span>
                    {chunk.sectionTitle && (
                      <span className="kb-chunk-section-badge" title={chunk.sectionTitle}>
                        {chunk.sectionTitle}
                      </span>
                    )}
                    <span className="kb-chunk-token-badge">{chunk.tokenCount} tokens</span>
                    <span className="kb-chunk-vector-badge">1536d Vector</span>
                  </div>

                  <Tooltip title={copiedId === chunk.id ? 'Copied!' : 'Copy chunk text'}>
                    <button
                      className="kb-chunk-copy-btn"
                      onClick={() => handleCopyChunk(chunk.id, chunk.content)}
                      aria-label="Copy chunk text"
                    >
                      {copiedId === chunk.id ? (
                        <CheckOutlined style={{ color: '#10b981', marginRight: 4 }} />
                      ) : (
                        <CopyOutlined style={{ marginRight: 4 }} />
                      )}
                      <span style={{ fontSize: 12 }}>
                        {copiedId === chunk.id ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </Tooltip>
                </div>

                {/* Chunk Card Body */}
                <div className="kb-chunk-card-body">
                  <pre className="kb-chunk-text-pre">{chunk.content}</pre>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div className="kb-inspector-footer">
          <button className="kb-btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
