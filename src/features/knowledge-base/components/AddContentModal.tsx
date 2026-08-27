import React, { useState, useRef } from 'react';
import {
  CloudUploadOutlined,
  GlobalOutlined,
  CloseOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ModalTabType } from '../types/knowledge-base.types';
import { Button, Input } from 'antd';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: (files: File[]) => void;
  onScrapeUrl: (url: string) => void;
  onAddSitemap: (sitemapUrl: string) => void;
  initialTab?: ModalTabType;
}

export function AddContentModal({
  isOpen,
  onClose,
  onUploadFiles,
  onScrapeUrl,
  onAddSitemap,
  initialTab = 'upload',
}: AddContentModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTabType>(initialTab);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [sitemapInput, setSitemapInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'upload') {
      if (selectedFiles.length > 0) {
        onUploadFiles(selectedFiles);
        setSelectedFiles([]);
        onClose();
      }
    } else if (activeTab === 'url') {
      if (urlInput.trim()) {
        onScrapeUrl(urlInput.trim());
        setUrlInput('');
        onClose();
      }
    } else if (activeTab === 'sitemap') {
      if (sitemapInput.trim()) {
        onAddSitemap(sitemapInput.trim());
        setSitemapInput('');
        onClose();
      }
    }
  };

  const isSubmitDisabled =
    (activeTab === 'upload' && selectedFiles.length === 0) ||
    (activeTab === 'url' && !urlInput.trim()) ||
    (activeTab === 'sitemap' && !sitemapInput.trim());

  return (
    <div className="kb-modal-overlay" onClick={onClose}>
      <div className="kb-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <Button
          type="text"
          className="kb-modal-close"
          onClick={onClose}
          aria-label="Close modal"
          icon={<CloseOutlined />}
        />

        {/* Title */}
        <h2 className="kb-modal-title">Add to Knowledge Base</h2>

        {/* Sub Tabs */}
        <div className="kb-modal-tabs">
          <Button
            type={activeTab === 'upload' ? 'primary' : 'text'}
            className="kb-modal-tab-btn"
            onClick={() => setActiveTab('upload')}
          >
            Upload File
          </Button>
          <Button
            type={activeTab === 'url' ? 'primary' : 'text'}
            className="kb-modal-tab-btn"
            onClick={() => setActiveTab('url')}
          >
            From URL
          </Button>
          <Button
            type={activeTab === 'sitemap' ? 'primary' : 'text'}
            className="kb-modal-tab-btn"
            onClick={() => setActiveTab('sitemap')}
          >
            Sitemap
          </Button>
        </div>

        {/* ── TAB 1: Upload File ── */}
        {activeTab === 'upload' && (
          <div>
            <div
              className={`kb-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.md,.markdown,.html,.htm,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <div className="kb-upload-cloud-icon">
                <CloudUploadOutlined />
              </div>

              <div className="kb-dropzone-title">Drag and drop your file here</div>
              <div className="kb-dropzone-desc">
                Supports PDF, DOCX, Markdown, HTML, TXT (Max 10MB)
              </div>

              <Button
                type="primary"
                className="kb-browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </Button>
            </div>

            {/* Selected File List */}
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                  Selected Files ({selectedFiles.length}):
                </span>
                {selectedFiles.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      fontSize: 13,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>
                      <CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} />
                      {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                    <Button
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: From URL ── */}
        {activeTab === 'url' && (
          <div>
            <div className="kb-form-group">
              <label className="kb-form-label">URL to scrape</label>
              <div className="kb-input-with-icon">
                <GlobalOutlined className="kb-input-icon" />
                <Input
                  type="url"
                  className="kb-text-input"
                  placeholder="https://example.com/page-to-add"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  bordered={false}
                />
              </div>
            </div>
            <div className="kb-form-hint">
              The system will scrape the content from this URL and add it to your knowledge base.
              <br />
              Make sure the URL is publicly accessible and contains relevant information.
            </div>
          </div>
        )}

        {/* ── TAB 3: Sitemap ── */}
        {activeTab === 'sitemap' && (
          <div>
            <div className="kb-form-group">
              <label className="kb-form-label">Sitemap URL</label>
              <div className="kb-input-with-icon">
                <FileTextOutlined className="kb-input-icon" />
                <Input
                  type="url"
                  className="kb-text-input"
                  placeholder="https://example.com/sitemap.xml"
                  value={sitemapInput}
                  onChange={(e) => setSitemapInput(e.target.value)}
                  bordered={false}
                />
              </div>
            </div>
            <div className="kb-form-hint">
              The system will parse all pages listed in this sitemap file and automatically crawl
              and index them into your vector store.
            </div>
          </div>
        )}

        {/* Modal Footer Buttons */}
        <div className="kb-modal-footer">
          <Button className="kb-btn-secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            className="kb-btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {activeTab === 'upload'
              ? 'Upload'
              : activeTab === 'url'
                ? 'Start Crawl'
                : 'Save & Crawl'}
          </Button>
        </div>
      </div>
    </div>
  );
}
