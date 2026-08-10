'use client';

import React from 'react';
import Link from 'next/link';
import {
  GlobalOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Popconfirm } from 'antd';
import type { Site } from '../types/site.types';
import { getKbStatusMeta } from '../types/site.types';
import { getRelativeTime } from '../hooks/useSitesData';

interface SiteCardProps {
  site: Site;
  canManage: boolean; // admin/superadmin → true; agent → false
  onToggle: (siteId: string) => void;
  onEdit: (site: Site) => void;
  onDelete: (siteId: string) => void;
  onAssignAgent?: (siteId: string, siteName: string) => void;
}

export function SiteCard({
  site,
  canManage,
  onToggle,
  onEdit,
  onDelete,
  onAssignAgent,
}: SiteCardProps) {
  const relativeTime = getRelativeTime(site.updatedAt);
  const kbStatus = getKbStatusMeta(site.knowledgeBaseStatus);

  return (
    <div className="site-card">
      {/* ── Header: Name + Toggle ── */}
      <div className="site-card-header">
        <h3 className="site-card-name" title={site.name}>
          {site.name}
        </h3>

        {/* Custom toggle switch — only shown for admin/superadmin */}
        {canManage && (
          <label
            className="site-toggle"
            aria-label={`${site.enabled ? 'Disable' : 'Enable'} ${site.name}`}
          >
            <input type="checkbox" checked={site.enabled} onChange={() => onToggle(site.id)} />
            <span className="site-toggle-track" />
          </label>
        )}
      </div>

      {/* ── URL ── */}
      <div className="site-card-url">
        <GlobalOutlined className="site-card-url-icon" />
        <span className="site-card-url-text" title={site.url}>
          {site.url}
        </span>
        <span className={`site-kb-badge ${kbStatus.variant}`} title="Knowledge Base status">
          {kbStatus.label}
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
                title="Edit Site"
                onClick={() => onEdit(site)}
                aria-label={`Edit ${site.name}`}
              >
                <EditOutlined />
              </button>
              <Popconfirm
                title="Delete Site"
                description={`Are you sure you want to delete "${site.name}"?`}
                onConfirm={() => onDelete(site.id)}
                okText="Yes"
                cancelText="No"
                placement="topRight"
              >
                <button
                  className="site-action-icon-btn delete-btn"
                  title="Delete Site"
                  aria-label={`Delete ${site.name}`}
                >
                  <DeleteOutlined />
                </button>
              </Popconfirm>
              <Link
                href={`/sites/${site.id}/kb`}
                className="site-action-icon-btn"
                title="Knowledge Base"
                aria-label={`Knowledge Base for ${site.name}`}
              >
                <DatabaseOutlined />
              </Link>
              <button
                className="site-action-icon-btn"
                title="Assign Agent"
                onClick={() => onAssignAgent?.(site.id, site.name)}
                aria-label={`Assign Agent to ${site.name}`}
              >
                <TeamOutlined />
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
            <>
              <Link
                href={`/sites/${site.id}/kb`}
                className="site-action-icon-btn"
                title="Knowledge Base"
                aria-label={`Knowledge Base for ${site.name}`}
              >
                <DatabaseOutlined />
              </Link>
              <Link
                href={`/sites/${site.id}`}
                className="site-action-btn view"
                aria-label={`View ${site.name}`}
              >
                View
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
