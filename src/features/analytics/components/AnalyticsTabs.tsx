'use client';

import React, { useState } from 'react';
import type { AnalyticsData } from '@/src/features/analytics/types/analytics.types';
import { OverviewTab } from './tabs/OverviewTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { UsageCostsTab } from './tabs/UsageCostsTab';

interface AnalyticsTabsProps {
  data: AnalyticsData;
  datePicker?: React.ReactNode;
}

export type AnalyticsTabType = 'overview' | 'performance' | 'usage';

export function AnalyticsTabs({ data, datePicker }: AnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTabType>('overview');

  return (
    <div>
      {/* ── Toolbar: Tabs Switcher + Date Range Picker ── */}
      <div className="analytics-toolbar-row">
        <div className="analytics-tabs-container">
          <button
            className={`analytics-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            Usage & Costs
          </button>
        </div>

        {datePicker && <div className="analytics-date-picker-wrapper">{datePicker}</div>}
      </div>

      <div className="mt-4">
        {activeTab === 'overview' && <OverviewTab data={data.overview} />}
        {activeTab === 'performance' && <PerformanceTab data={data.performance} />}
        {activeTab === 'usage' && <UsageCostsTab data={data.usageCosts} />}
      </div>
    </div>
  );
}
