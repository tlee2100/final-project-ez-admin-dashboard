'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckSquareOutlined, BorderOutlined, ExperimentOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '@/src/lib/api.client';
import { siteApi } from '../../services/site.api';
import type { SiteDetailInfo, MockKBFile } from '../../mock/sitesDetailMockData';

interface TabTestChatbotProps {
  siteId: string;
  stats: SiteDetailInfo;
}

export function TabTestChatbot({ siteId, stats }: TabTestChatbotProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Real KB state
  const [kbDocuments, setKbDocuments] = useState<MockKBFile[]>([]);
  const [selectedKB, setSelectedKB] = useState<string[]>([]);

  // Fetch real KB Documents on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDocuments = async () => {
      try {
        const response = await siteApi.getKBSources(siteId);
        if (isMounted && response?.data) {
          const docs: MockKBFile[] = response.data.map((doc) => ({
            name: doc.filename,
            size: `${(doc.fileSizeBytes / 1024).toFixed(1)} KB`,
            type: doc.fileType?.toUpperCase() || 'TXT',
          }));
          setKbDocuments(docs);
          setSelectedKB(docs.map((d) => d.name));
        }
      } catch {
        // Fallback to stats if fetch fails
        if (isMounted) {
          const fallbackDocs: MockKBFile[] = stats.kbDocuments || [];
          setKbDocuments(fallbackDocs);
          setSelectedKB(fallbackDocs.map((d) => d.name));
        }
      }
    };

    fetchDocuments();

    return () => {
      isMounted = false;
    };
  }, [siteId, stats.kbDocuments]);

  const handleSendSampleQuestion = useCallback((question: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'EZ_CHAT_SEND_MESSAGE', text: question },
      '*',
    );
  }, []);

  // Widget URL & backend base URL for iframe
  const chatWidgetUrl = process.env.NEXT_PUBLIC_CHAT_WIDGET_URL || 'http://localhost:5173';
  const backendBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  const iframeSrc = `${chatWidgetUrl}/?siteId=${encodeURIComponent(
    siteId,
  )}&backendUrl=${encodeURIComponent(backendBaseUrl)}&testMode=true&openDefault=true`;

  return (
    <div className="test-chatbot-container">
      {/* ── Left Pane: Embedded Chat Widget Sandbox ── */}
      <div className="test-chat-pane">
        <div className="test-chat-header">
          <div className="test-chat-header-info">
            <span className="test-chat-title">Test Your Chatbot</span>
            <span className="test-chat-badge active">
              <ExperimentOutlined style={{ marginRight: 4 }} />
              Sandbox Mode (Embedded Widget • Zero DB)
            </span>
          </div>
        </div>

        {/* Embedded Chat Widget Iframe */}
        <div className="test-chat-iframe-container">
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title="Chatbot Test Sandbox"
            className="test-chat-iframe"
            allow="clipboard-write"
          />
        </div>
      </div>

      {/* ── Right Pane: Side Panel Testing Controls ── */}
      <div className="test-controls-pane">
        <h3 className="test-pane-title">Testing Controls</h3>

        {/* Section: KB Documents Selectors */}
        <div className="test-control-section">
          <h4 className="test-section-subtitle">Knowledge Base</h4>
          <p className="test-section-desc">
            These documents are currently active in the site&apos;s Knowledge Base and will be used
            by the AI.
          </p>
          <div className="test-kb-list">
            {kbDocuments.length === 0 && (
              <p style={{ color: '#888', fontSize: '0.85rem' }}>No documents uploaded yet.</p>
            )}
            {kbDocuments.map((doc) => {
              const isChecked = selectedKB.includes(doc.name);
              return (
                <button
                  key={doc.name}
                  type="button"
                  className={`test-kb-item ${isChecked ? 'selected' : ''}`}
                  aria-label={`Document ${doc.name}`}
                  style={{ cursor: 'default' }}
                >
                  <span className="test-kb-icon">
                    {isChecked ? <CheckSquareOutlined /> : <BorderOutlined />}
                  </span>
                  <div className="test-kb-info">
                    <span className="test-kb-name">{doc.name}</span>
                    <span className="test-kb-meta">
                      {doc.type} • {doc.size}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Sample Questions List */}
        <div className="test-control-section">
          <h4 className="test-section-subtitle">Sample Questions</h4>
          <p className="test-section-desc">
            Click any question below to test your chatbot&apos;s responses in real-time sandbox
            mode.
          </p>
          <div className="test-questions-list">
            {stats.sampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                className="test-question-card"
                onClick={() => handleSendSampleQuestion(q)}
              >
                <span className="test-question-card-text">{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
