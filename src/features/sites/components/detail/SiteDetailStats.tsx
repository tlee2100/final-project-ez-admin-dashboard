'use client';

import React from 'react';
import type { SiteDetailInfo } from '../../mock/sitesDetailMockData';

interface SiteDetailStatsProps {
  stats: SiteDetailInfo;
}

export function SiteDetailStats({ stats }: SiteDetailStatsProps) {
  return (
    <div className="site-detail-stats-grid">
      <div className="site-detail-stat-card">
        <span className="site-detail-stat-label">Total Chats</span>
        <span className="site-detail-stat-val">{stats.totalChats}</span>
      </div>
      <div className="site-detail-stat-card">
        <span className="site-detail-stat-label">Active Chats</span>
        <span className="site-detail-stat-val">{stats.activeChats}</span>
      </div>
      <div className="site-detail-stat-card">
        <span className="site-detail-stat-label">Avg Response</span>
        <span className="site-detail-stat-val">{stats.avgResponse}</span>
      </div>
      <div className="site-detail-stat-card">
        <span className="site-detail-stat-label">Containment</span>
        <span className="site-detail-stat-val">{stats.containmentRate}</span>
      </div>
      <div className="site-detail-stat-card">
        <span className="site-detail-stat-label">KB Documents</span>
        <span className="site-detail-stat-val">{stats.kbDocumentsCount}</span>
      </div>
    </div>
  );
}
