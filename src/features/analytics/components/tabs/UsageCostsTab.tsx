import React from 'react';
import { DashboardStats } from '@/src/features/dashboard/components/DashboardStats';
import { TokenUsageChart } from '@/src/features/dashboard/components/TokenUsageChart';
import type { AnalyticsData } from '@/src/features/analytics/types/analytics.types';

interface UsageCostsTabProps {
  data: AnalyticsData['usageCosts'];
}

export function UsageCostsTab({ data }: UsageCostsTabProps) {
  return (
    <div className="analytics-tab-content">
      {/* Stat Cards */}
      <DashboardStats stats={data.stats} />

      {/* Token Usage Chart */}
      <div className="mb-6">
        <TokenUsageChart data={data.tokenUsage} />
      </div>

      {/* Usage by Site */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Usage by Site</h3>
        <div className="horizontal-bar-list">
          {data.usageBySite.map((site, idx) => (
            <div key={idx} className="horizontal-bar-item mb-2">
              <div className="horizontal-bar-header">
                <span className="horizontal-bar-label">{site.siteName}</span>
                <div className="horizontal-bar-value">
                  <span>{site.tokens.toLocaleString()} tokens</span>
                </div>
              </div>
              <div className="horizontal-bar-track my-1">
                <div
                  className="horizontal-bar-fill"
                  style={{ width: `${site.percentage}%`, backgroundColor: '#3b82f6' }}
                />
              </div>
              <div className="horizontal-bar-header" style={{ fontSize: 12 }}>
                <span
                  className="horizontal-bar-value"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {site.percentage}% of total
                </span>
                <span
                  className="horizontal-bar-value"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Est. cost: {site.estimatedCost}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
