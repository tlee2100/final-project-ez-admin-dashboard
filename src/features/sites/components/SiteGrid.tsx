'use client';

import React from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import type { Site } from '../types/site.types';
import { SiteCard } from './SiteCard';

interface SiteGridProps {
  sites: Site[];
  canManage: boolean;
  onToggle: (siteId: string) => void;
}

export function SiteGrid({ sites, canManage, onToggle }: SiteGridProps) {
  if (sites.length === 0) {
    return (
      <div className="sites-grid">
        <div className="sites-empty" role="status" aria-live="polite">
          <div className="sites-empty-icon">
            <GlobalOutlined />
          </div>
          <p className="sites-empty-title">No sites found</p>
          <p className="sites-empty-text">
            Try adjusting your search or filter to find what you&apos;re looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sites-grid" role="list" aria-label="Sites list">
      {sites.map((site) => (
        <div key={site.id} role="listitem">
          <SiteCard site={site} canManage={canManage} onToggle={onToggle} />
        </div>
      ))}
    </div>
  );
}
