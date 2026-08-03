'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftOutlined, GlobalOutlined } from '@ant-design/icons';
import type { Site } from '../../types/site.types';
import { getKbStatusMeta } from '../../types/site.types';

interface SiteDetailHeaderProps {
  site: Site;
}

export function SiteDetailHeader({ site }: SiteDetailHeaderProps) {
  const kbStatus = getKbStatusMeta(site.knowledgeBaseStatus);

  return (
    <div className="site-detail-header">
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
      </div>
    </div>
  );
}
