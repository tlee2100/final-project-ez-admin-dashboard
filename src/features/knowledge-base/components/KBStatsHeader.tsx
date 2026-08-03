import React from 'react';
import type { VectorStorageStats } from '../types/knowledge-base.types';

interface KBStatsHeaderProps {
  stats: VectorStorageStats;
}

export function KBStatsHeader({ stats }: KBStatsHeaderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── 4 Top Metric Cards ── */}
      <div className="kb-stats-grid">
        <div className="kb-stat-card">
          <span className="kb-stat-label">Total Documents</span>
          <div className="kb-stat-value">{stats.totalDocuments}</div>
        </div>

        <div className="kb-stat-card">
          <span className="kb-stat-label">Total Chunks</span>
          <div className="kb-stat-value">{stats.totalChunks}</div>
        </div>

        <div className="kb-stat-card">
          <span className="kb-stat-label">Total Size</span>
          <div className="kb-stat-value">{stats.totalSizeFormatted}</div>
        </div>

        <div className="kb-stat-card">
          <span className="kb-stat-label">Last Updated</span>
          <div className="kb-stat-value">{stats.lastUpdatedRelative}</div>
        </div>
      </div>

      {/* ── Vector Storage Usage Progress Section ── */}
      <div className="kb-vector-section">
        <div className="kb-vector-header">
          <span className="kb-vector-title">Vector Storage Usage</span>
          <span className="kb-vector-meta">
            {stats.usagePercentage}% of {stats.vectorsLimit.toLocaleString()} vectors used
          </span>
        </div>
        <div className="kb-progress-track">
          <div
            className="kb-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, stats.usagePercentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
