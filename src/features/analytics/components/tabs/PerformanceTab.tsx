import React from 'react';
import {
  FileTextOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  InfoCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { DashboardStats } from '@/src/features/dashboard/components/DashboardStats';
import type { AnalyticsData } from '@/src/features/analytics/types/analytics.types';

interface PerformanceTabProps {
  data: AnalyticsData['performance'];
}

export function PerformanceTab({ data }: PerformanceTabProps) {
  const documents = data.kb.topDocuments || [];
  const maxHits = Math.max(...documents.map((d) => d.hits), 1);

  return (
    <div className="analytics-tab-content">
      {/* ── Stat Cards (Response Time, Docs, Chunks, Avg Chunks) ── */}
      {data.stats && data.stats.length > 0 && (
        <div className="mb-6">
          <DashboardStats stats={data.stats} />
        </div>
      )}

      <div className="analytics-grid-2">
        {/* ── Knowledge Base Documents ── */}
        <div className="analytics-card">
          <div className="perf-header-row">
            <div>
              <h3 className="analytics-card-title mb-1">Knowledge Base Documents</h3>
              <p className="perf-desc">
                Source files processed into vector embeddings for semantic AI retrieval.
              </p>
            </div>
            <span className="perf-badge primary">
              <FileTextOutlined />
              {documents.length} {documents.length === 1 ? 'File' : 'Files'}
            </span>
          </div>

          {documents.length > 0 ? (
            <div className="perf-doc-list">
              {documents.map((doc, idx) => {
                const percent = Math.min(Math.round((doc.hits / maxHits) * 100), 100);
                return (
                  <div key={doc.id || idx} className="perf-doc-item">
                    <div className="perf-doc-top">
                      <div className="perf-doc-info">
                        <div className="perf-doc-icon">
                          <FileTextOutlined />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p className="perf-doc-name" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="perf-doc-site">{doc.siteName || 'Default Site'}</p>
                        </div>
                      </div>
                      <div className="perf-doc-meta">
                        <span className="perf-doc-chunks">{doc.hits.toLocaleString()} chunks</span>
                        <span className="perf-badge success">
                          <CheckCircleFilled style={{ fontSize: 11 }} /> Indexed
                        </span>
                      </div>
                    </div>

                    <div className="perf-doc-bar-bg">
                      <div className="perf-doc-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="perf-empty-state">
              <InboxOutlined className="perf-empty-icon" />
              <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                No documents indexed yet
              </p>
              <p style={{ fontSize: 13 }}>
                Upload PDF, DOCX, or text files in Site Configuration to populate the Knowledge
                Base.
              </p>
            </div>
          )}
        </div>

        {/* ── Agent Response Performance & Pipeline ── */}
        <div className="analytics-card">
          <div className="perf-header-row">
            <div>
              <h3 className="analytics-card-title mb-1">Agent Response & Support Performance</h3>
              <p className="perf-desc">
                Measured response latency when human support agents interact with visitors.
              </p>
            </div>
            <span className="perf-badge success">
              <ThunderboltFilled style={{ color: '#10b981' }} /> Live Calculated
            </span>
          </div>

          {/* Hero Latency Box */}
          <div className="perf-latency-hero">
            <div>
              <div className="perf-latency-val">{data.model.avgGenerationTime}</div>
              <div className="perf-latency-label">Average Human Agent Response Time</div>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                fontSize: 22,
              }}
            >
              <ThunderboltFilled />
            </div>
          </div>

          {/* Execution Pipeline Steps */}
          <div className="perf-pipeline-list">
            <div className="perf-pipeline-step">
              <div className="perf-step-circle">1</div>
              <div className="perf-step-content">
                <div className="perf-step-title">Support Request / Handoff</div>
                <div className="perf-step-desc">
                  Visitor requests live assistance or conversation escalates to the agent queue.
                </div>
              </div>
            </div>

            <div className="perf-pipeline-step">
              <div className="perf-step-circle">2</div>
              <div className="perf-step-content">
                <div className="perf-step-title">Agent Takeover & Live Room Join</div>
                <div className="perf-step-desc">
                  Agent accepts the chat, reviews AI history, and enters the secure messaging room.
                </div>
              </div>
            </div>

            <div className="perf-pipeline-step">
              <div className="perf-step-circle">3</div>
              <div className="perf-step-content">
                <div className="perf-step-title">Live Agent Response Delivered</div>
                <div className="perf-step-desc">
                  Agent delivers personalized resolution message directly to the visitor in real
                  time.
                </div>
              </div>
            </div>
          </div>

          <div className="perf-info-callout">
            <InfoCircleOutlined style={{ color: '#3b82f6', fontSize: 15 }} />
            <span>
              Response time is calculated from the time a visitor sends a query until a human agent
              submits their reply.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
