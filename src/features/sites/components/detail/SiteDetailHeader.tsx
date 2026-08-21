'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftOutlined,
  GlobalOutlined,
  CodeOutlined,
  CheckOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { Button, Popover, App } from 'antd';
import type { Site } from '../../types/site.types';
import { getKbStatusMeta } from '../../types/site.types';

interface SiteDetailHeaderProps {
  site: Site;
}

export function SiteDetailHeader({ site }: SiteDetailHeaderProps) {
  const kbStatus = getKbStatusMeta(site.knowledgeBaseStatus);
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);

  const widgetScriptUrl =
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL ||
    'https://widget.intern2026.zodinet.tech/ez-chat-widget.js';
  const widgetScriptVersion = process.env.NEXT_PUBLIC_WIDGET_VERSION;

  const embedCode = useMemo(() => {
    const versionedWidgetScriptUrl =
      widgetScriptVersion && !/[?&]v=/.test(widgetScriptUrl)
        ? `${widgetScriptUrl}${widgetScriptUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(
            widgetScriptVersion,
          )}`
        : widgetScriptUrl;

    return `<script src="${versionedWidgetScriptUrl}" data-site-id="${site.id}"></script>`;
  }, [site.id, widgetScriptUrl, widgetScriptVersion]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      message.success('Embed code copied');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      message.error('Cannot copy embed code');
    }
  };

  const popoverContent = (
    <div style={{ maxWidth: 350 }}>
      <div style={{ marginBottom: 8, fontWeight: 500 }}>Embed Script</div>
      <textarea
        readOnly
        value={embedCode}
        style={{
          width: '100%',
          height: 80,
          padding: 8,
          borderRadius: 6,
          border: '1px solid #d9d9d9',
          resize: 'none',
          fontFamily: 'monospace',
          fontSize: 12,
          background: '#f5f5f5',
        }}
      />
    </div>
  );

  return (
    <div
      className="site-detail-header"
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/sites" className="site-detail-back-btn" aria-label="Back to Sites list">
          <ArrowLeftOutlined />
        </Link>
        <div className="site-detail-header-content">
          <div className="site-detail-title-row">
            <h1 className="site-detail-title">{site.name}</h1>
            <span
              className={`site-detail-kb-badge ${kbStatus.variant}`}
              title="Knowledge Base status"
            >
              {kbStatus.label}
            </span>
            <span className={`site-detail-status-badge ${site.enabled ? 'active' : 'disabled'}`}>
              {site.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <div className="site-detail-url">
            <GlobalOutlined className="site-detail-url-icon" />
            <span className="site-detail-url-text">{site.url}</span>
          </div>
          {site.allowedDomains && site.allowedDomains.length > 0 && (
            <div
              className="site-detail-domains"
              style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}
            >
              <strong>Allowed Domains:</strong> {site.allowedDomains.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="site-detail-actions" style={{ paddingTop: 8 }}>
        <Popover content={popoverContent} trigger="hover" placement="bottomRight">
          <Button icon={<CodeOutlined />} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Installation Code'}
          </Button>
        </Popover>
      </div>
    </div>
  );
}
