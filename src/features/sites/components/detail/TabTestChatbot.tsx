'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CheckSquareOutlined,
  BorderOutlined,
  ExperimentOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { API_BASE_URL } from '@/src/lib/api.client';
import { siteApi } from '../../services/site.api';
import type { SiteDetailInfo, MockKBFile } from '../../mock/sitesDetailMockData';

/**
 * Reads NEXT_PUBLIC_CHAT_WIDGET_URL from the environment.
 * Returns null when the variable is missing or blank — callers must handle
 * this case explicitly rather than silently falling back to localhost.
 *
 * This value is baked in at build time by Next.js.
 * Set it in GitHub → Settings → Variables → NEXT_PUBLIC_CHAT_WIDGET_URL
 * and pass it as a Docker build-arg in the CI workflow.
 */
export function getChatWidgetUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CHAT_WIDGET_URL?.trim();
  return url || null;
}

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

  // Resolve widget URL — must come from the environment, never hardcoded
  const chatWidgetUrl = getChatWidgetUrl();
  const backendBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');

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

        {/* Embedded Chat Widget Iframe — or config error banner */}
        <div className="test-chat-iframe-container">
          {chatWidgetUrl ? (
            <iframe
              ref={iframeRef}
              src={`${chatWidgetUrl}/?siteId=${encodeURIComponent(siteId)}&backendUrl=${encodeURIComponent(backendBaseUrl)}&testMode=true&openDefault=true`}
              title="Chatbot Test Sandbox"
              className="test-chat-iframe"
              allow="clipboard-write"
            />
          ) : (
            <div className="test-widget-config-error" role="alert">
              <WarningOutlined className="test-widget-config-error-icon" />
              <p className="test-widget-config-error-title">Widget URL not configured</p>
              <p className="test-widget-config-error-desc">
                The environment variable <code>NEXT_PUBLIC_CHAT_WIDGET_URL</code> is missing or
                empty.
              </p>
              <p className="test-widget-config-error-hint">
                Add it to your deployment environment variables and rebuild the application.
              </p>
            </div>
          )}
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
