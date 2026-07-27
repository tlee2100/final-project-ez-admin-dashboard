'use client';

import React from 'react';
import Link from 'next/link';
import { GlobalOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { Site } from '../types/site.types';
import { getRelativeTime } from '../hooks/useSitesData';

interface SiteCardProps {
  site: Site;
  canManage: boolean; // admin/superadmin → true; agent → false
  onToggle: (siteId: string) => void;
}

export function SiteCard({ site, canManage, onToggle }: SiteCardProps) {
  const relativeTime = getRelativeTime(site.updatedAt);

  return (
    <div className="site-card">
      {/* ── Header: Name + Toggle ── */}
      <div className="site-card-header">
        <h3 className="site-card-name" title={site.name}>
          {site.name}
        </h3>

        {/* Custom toggle switch */}
        <label
          className="site-toggle"
          aria-label={`${site.enabled ? 'Disable' : 'Enable'} ${site.name}`}
        >
          <input
            type="checkbox"
            checked={site.enabled}
            disabled={!canManage}
            onChange={() => canManage && onToggle(site.id)}
          />
          <span className="site-toggle-track" />
        </label>
      </div>

      {/* ── URL ── */}
      <div className="site-card-url">
        <GlobalOutlined className="site-card-url-icon" />
        <span className="site-card-url-text" title={site.url}>
          {site.url}
        </span>
      </div>

      {/* ── Stats ── */}
      <div className="site-card-stats">
        <div className="site-stat">
          <span className="site-stat-label">KB Documents</span>
          <span className="site-stat-value">{site.kbDocuments}</span>
        </div>
        <div className="site-stat">
          <span className="site-stat-label">Active Chats</span>
          <span className="site-stat-value">
            {site.activeChats}
            {site.activeChats > 0 && <span className="site-active-dot" aria-label="live" />}
          </span>
        </div>
      </div>

      {/* ── Footer: Updated time + Action ── */}
      <div className="site-card-footer">
        <span className="site-updated-text">Updated {relativeTime}</span>

        <div className="site-card-actions">
          {canManage ? (
            <>
              <button
                className="site-action-icon-btn"
                title="KB Documents"
                aria-label={`Manage KB for ${site.name}`}
              >
                <DatabaseOutlined />
              </button>
              <Link
                href={`/sites/${site.id}`}
                className="site-action-btn manage"
                aria-label={`Manage ${site.name}`}
              >
                Manage
              </Link>
            </>
          ) : (
            <Link
              href={`/sites/${site.id}`}
              className="site-action-btn view"
              aria-label={`View ${site.name}`}
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
