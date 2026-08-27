import React, { useState } from 'react';
import {
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  EyeOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileMarkdownOutlined,
  CodeOutlined,
  GlobalOutlined,
  FileTextOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Popconfirm, Dropdown, MenuProps, Pagination, Popover, Tag, Input, Button } from 'antd';
import { DocFileType, type KBDocument } from '../types/knowledge-base.types';
import type { SortOption } from '../hooks/useKnowledgeBase';

interface KBDocumentsTabProps {
  documents: KBDocument[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: DocFileType | 'all';
  onTypeChange: (type: DocFileType | 'all') => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  page?: number;
  limit?: number;
  totalDocs?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onPreview: (doc: KBDocument) => void;
  onDelete: (id: string) => void;
  canManage: boolean;
  onReindex: (id: string) => void;
}

const DOC_TYPE_LABELS: Record<DocFileType, string> = {
  [DocFileType.PDF]: 'PDF Documents',
  [DocFileType.DOCX]: 'Word Documents (.docx)',
  [DocFileType.MARKDOWN]: 'Markdown Files (.md)',
  [DocFileType.HTML]: 'HTML Files (.html)',
  [DocFileType.URL]: 'Scraped Web URLs',
  [DocFileType.TXT]: 'Text Files (.txt)',
};

export function KBDocumentsTab({
  documents,
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  sortOption,
  onSortChange,
  page = 1,
  limit = 10,
  totalDocs = 0,
  onPageChange,
  onLimitChange,
  onPreview,
  onDelete,
  canManage,
  onReindex,
}: KBDocumentsTabProps) {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const getDocIcon = (type: DocFileType) => {
    switch (type) {
      case DocFileType.PDF:
        return <FilePdfOutlined />;
      case DocFileType.DOCX:
        return <FileWordOutlined />;
      case DocFileType.MARKDOWN:
        return <FileMarkdownOutlined />;
      case DocFileType.HTML:
        return <CodeOutlined />;
      case DocFileType.URL:
        return <GlobalOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getDocTypeBadgeLabel = (type: DocFileType) => {
    switch (type) {
      case DocFileType.PDF:
        return 'PDF';
      case DocFileType.DOCX:
        return 'DOCX';
      case DocFileType.MARKDOWN:
        return 'Markdown';
      case DocFileType.HTML:
        return 'HTML';
      case DocFileType.URL:
        return 'URL';
      default:
        return type ? type.toUpperCase() : 'TXT';
    }
  };

  // Dynamically generated from Enum (Single Source of Truth)
  const filterItems: MenuProps['items'] = [
    { key: 'all', label: 'All Document Types' },
    ...Object.values(DocFileType).map((type) => ({
      key: type,
      label: DOC_TYPE_LABELS[type] || type.toUpperCase(),
    })),
  ];

  const sortItems: MenuProps['items'] = [
    { key: 'date_desc', label: 'Newest First' },
    { key: 'date_asc', label: 'Oldest First' },
    { key: 'name_asc', label: 'Name (A-Z)' },
    { key: 'name_desc', label: 'Name (Z-A)' },
    { key: 'size_desc', label: 'Largest Size' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Toolbar: Search + Filter + Sort ── */}
      <div className="kb-toolbar">
        <div className="kb-search-box">
          <SearchOutlined className="kb-search-icon" />
          <Input
            className="kb-search-input"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="kb-toolbar-actions">
          {/* Filter Dropdown */}
          <Dropdown
            menu={{
              items: filterItems,
              selectable: true,
              selectedKeys: [selectedType],
              onClick: (info) => onTypeChange(info.key as DocFileType | 'all'),
            }}
            trigger={['click']}
            open={filterDropdownOpen}
            onOpenChange={setFilterDropdownOpen}
          >
            <Button className="kb-tool-btn">
              <FilterOutlined />
              Filter {selectedType !== 'all' ? `(${selectedType.toUpperCase()})` : ''}
            </Button>
          </Dropdown>

          {/* Sort Dropdown */}
          <Dropdown
            menu={{
              items: sortItems,
              selectable: true,
              selectedKeys: [sortOption],
              onClick: (info) => onSortChange(info.key as SortOption),
            }}
            trigger={['click']}
            open={sortDropdownOpen}
            onOpenChange={setSortDropdownOpen}
          >
            <Button className="kb-tool-btn">
              <SortAscendingOutlined />
              Sort
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* ── Empty State ── */}
      {documents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #f1f5f9',
          }}
        >
          <FileTextOutlined style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 12 }} />
          <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>No documents found</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
            Try adjusting your search or click &quot;+ Add Content&quot; to upload new files.
          </p>
        </div>
      ) : (
        <>
          {/* ── 2-Column Grid of Document Cards ── */}
          <div className="kb-docs-grid">
            {documents.map((doc) => (
              <div key={doc.id} className="kb-doc-card">
                <div className="kb-doc-top">
                  <div className={`kb-doc-icon-wrapper ${doc.type}`}>{getDocIcon(doc.type)}</div>
                  <div className="kb-doc-info">
                    <h4 className="kb-doc-name" title={doc.name}>
                      {doc.name}
                    </h4>
                    <div className="kb-doc-badges">
                      <span className="kb-type-badge">{getDocTypeBadgeLabel(doc.type)}</span>
                      <span className="kb-doc-meta-text">{doc.sizeFormatted}</span>
                      <span className="kb-doc-meta-bullet">•</span>
                      {doc.status === 'processing' ? (
                        <Tag
                          icon={<SyncOutlined spin />}
                          color="processing"
                          style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
                        >
                          Chunking...
                        </Tag>
                      ) : doc.status === 'failed' ? (
                        <Tag
                          icon={<ExclamationCircleOutlined />}
                          color="error"
                          style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
                        >
                          Failed
                        </Tag>
                      ) : doc.status === 'retired' ? (
                        <Tag color="default" style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>
                          Retired
                        </Tag>
                      ) : (
                        <Tag
                          icon={<CheckCircleOutlined />}
                          color="success"
                          style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
                        >
                          Ready
                        </Tag>
                      )}
                    </div>
                    {doc.needsReindex && doc.reindexStatus === 'idle' && (
                      <Tag color="warning" style={{ marginTop: 8 }}>
                        Needs re-index
                      </Tag>
                    )}
                    {['queued', 'processing'].includes(doc.reindexStatus) && (
                      <Tag icon={<SyncOutlined spin />} color="processing" style={{ marginTop: 8 }}>
                        Re-indexing
                      </Tag>
                    )}
                    {doc.reindexStatus === 'failed' && (
                      <Popover
                        title="Re-index details"
                        content={doc.reindexError || 'The source could not be re-indexed.'}
                        trigger="click"
                      >
                        <Button size="small" className="kb-tool-btn" style={{ marginTop: 8 }}>
                          View details
                        </Button>
                      </Popover>
                    )}
                  </div>
                </div>

                <div className="kb-doc-bottom">
                  <span className="kb-doc-updated">Uploaded {doc.uploadedAtFormatted}</span>

                  {doc.url && doc.type === DocFileType.URL && (
                    <a href={doc.url} target="_blank" rel="noreferrer" title={doc.url}>
                      Open source
                    </a>
                  )}

                  <div className="kb-doc-actions">
                    {canManage && (doc.needsReindex || doc.reindexStatus === 'failed') && (
                      <Popconfirm
                        title={
                          doc.reindexStatus === 'failed' ? 'Retry re-index' : 'Re-index document'
                        }
                        description="The existing chunks remain available until the new index is ready."
                        onConfirm={() => onReindex(doc.id)}
                        okText="Re-index"
                        cancelText="Cancel"
                      >
                        <Button
                          type="text"
                          className="kb-icon-action view"
                          title={doc.reindexStatus === 'failed' ? 'Retry Re-index' : 'Re-index'}
                          aria-label={`Re-index ${doc.name}`}
                          icon={<ReloadOutlined />}
                        />
                      </Popconfirm>
                    )}
                    <Button
                      type="text"
                      className="kb-icon-action view"
                      title="Preview Document"
                      onClick={() => onPreview(doc)}
                      aria-label={`Preview ${doc.name}`}
                      icon={<EyeOutlined />}
                    />

                    <Popconfirm
                      title="Delete document"
                      description={`Are you sure you want to remove "${doc.name}" from KB?`}
                      onConfirm={() => onDelete(doc.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      placement="topRight"
                    >
                      <Button
                        type="text"
                        danger
                        className="kb-icon-action delete"
                        title="Delete Document"
                        aria-label={`Delete ${doc.name}`}
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination Controls ── */}
          {totalDocs > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                paddingTop: 12,
              }}
            >
              <Pagination
                current={page}
                pageSize={limit}
                total={totalDocs}
                showSizeChanger
                pageSizeOptions={['10', '20', '50']}
                onChange={(newPage, newLimit) => {
                  if (onPageChange && newPage !== page) onPageChange(newPage);
                  if (onLimitChange && newLimit !== limit) onLimitChange(newLimit);
                }}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} documents`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
