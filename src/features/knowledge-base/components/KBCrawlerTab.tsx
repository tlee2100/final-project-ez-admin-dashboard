import React from 'react';
import { GlobalOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { CrawlerConfig, CrawledUrlItem } from '../types/knowledge-base.types';

interface KBCrawlerTabProps {
  config: CrawlerConfig;
  onAddSitemapClick: () => void;
}

export function KBCrawlerTab({ config, onAddSitemapClick }: KBCrawlerTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overview card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: 24,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Automatic Web Crawler & Sitemap Sync
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
              Automatically crawl your website pages to keep your AI chatbot updated with fresh
              content.
            </p>
          </div>
          <button className="kb-add-btn" onClick={onAddSitemapClick}>
            <GlobalOutlined /> Add Sitemap URL
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            padding: 16,
            background: '#f8fafc',
            borderRadius: 10,
          }}
        >
          <div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Active Sitemap</span>
            <div
              style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', wordBreak: 'break-all' }}
            >
              {config.sitemapUrl || 'None configured'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Crawl Frequency</span>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
              Every {config.crawlIntervalDays} days
            </div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Max Depth</span>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
              {config.maxDepth} levels deep
            </div>
          </div>
        </div>
      </div>

      {/* Crawled URL items table / list */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: 24,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
          Crawled Sources History
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {config.crawledItems.map((item: CrawledUrlItem) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <GlobalOutlined style={{ color: '#6366f1', fontSize: 16 }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.url}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Found {item.pagesFound} pages · Last synced {item.lastCrawled}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: '#dcfce7',
                    color: '#15803d',
                  }}
                >
                  <CheckCircleOutlined /> Indexed
                </span>
                <button
                  className="kb-tool-btn"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => alert(`Re-crawling ${item.url}...`)}
                >
                  <ReloadOutlined /> Recrawl
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
