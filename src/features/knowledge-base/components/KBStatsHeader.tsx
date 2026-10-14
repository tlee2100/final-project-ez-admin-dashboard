import React from 'react';
import type { VectorStorageStats } from '../types/knowledge-base.types';

interface KBStatsHeaderProps {
  stats: VectorStorageStats;
}

export function KBStatsHeader({ stats }: KBStatsHeaderProps) {
  const vectorsUsed = stats.vectorsUsed || 0;
  const vectorsLimit = stats.vectorsLimit || 100000;
  const rawPercentage = (vectorsUsed / vectorsLimit) * 100;

  let percentageLabel = '0%';
  if (vectorsUsed > 0) {
    if (rawPercentage < 0.01) {
      percentageLabel = '< 0.01%';
    } else if (rawPercentage < 1) {
      percentageLabel = `${rawPercentage.toFixed(2)}%`;
    } else {
      percentageLabel = `${rawPercentage.toFixed(1)}%`;
    }
  }

  const progressWidth = vectorsUsed > 0 ? Math.max(0.6, Math.min(100, rawPercentage)) : 0;

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
            <strong style={{ color: '#4f46e5' }}>{vectorsUsed.toLocaleString()}</strong> /{' '}
            {vectorsLimit.toLocaleString()} vectors ({percentageLabel})
          </span>
        </div>
        <div className="kb-progress-track">
          <div className="kb-progress-fill" style={{ width: `${progressWidth}%` }} />
        </div>
      </div>
    </div>
  );
}
