import React from 'react';
import {
  CloseOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { KBDocument } from '../types/knowledge-base.types';

interface DocPreviewModalProps {
  doc: KBDocument | null;
  onClose: () => void;
}

export function DocPreviewModal({ doc, onClose }: DocPreviewModalProps) {
  if (!doc) return null;

  return (
    <div className="kb-modal-overlay" onClick={onClose}>
      <div
        className="kb-modal-container"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="kb-modal-close" onClick={onClose}>
          <CloseOutlined />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            className={`kb-doc-icon-wrapper ${doc.type}`}
            style={{ width: 40, height: 40, fontSize: 18 }}
          >
            <FileTextOutlined />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {doc.name}
            </h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Status: <CheckCircleOutlined style={{ color: '#10b981' }} /> {doc.status} | Uploaded{' '}
              {doc.uploadedAtFormatted}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            padding: 12,
            background: '#f8fafc',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Type</span>
            <strong style={{ textTransform: 'uppercase', color: '#0f172a' }}>{doc.type}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>File Size</span>
            <strong style={{ color: '#0f172a' }}>{doc.sizeFormatted}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Vector Chunks</span>
            <strong style={{ color: '#6366f1' }}>
              {typeof doc.chunksCount === 'number' ? `${doc.chunksCount} chunks` : '-'}
            </strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Processed</span>
            <strong style={{ color: '#0f172a' }}>{doc.processedAtFormatted || '-'}</strong>
          </div>
        </div>

        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
          <DatabaseOutlined style={{ marginRight: 6, color: '#6366f1' }} />
          Sample Extracted Vector Chunks:
        </h4>

        <div
          style={{
            maxHeight: 240,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingRight: 4,
          }}
        >
          {[1, 2, 3].map((chunkIndex) => (
            <div
              key={chunkIndex}
              style={{
                padding: 12,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.5,
                color: '#334155',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  fontSize: 11,
                  color: '#94a3b8',
                }}
              >
                <span>Chunk #{chunkIndex}</span>
                <span>Embedding Dim: 1536</span>
              </div>
              {doc.contentSnippet ||
                'Vectorized content chunk data ready for semantic retrieval in RAG pipeline.'}
            </div>
          ))}
        </div>

        <div className="kb-modal-footer" style={{ marginTop: 20 }}>
          <button className="kb-btn-secondary" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
