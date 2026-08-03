'use client';

import React, { useState } from 'react';
import type { AnalyticsData } from '@/src/features/analytics/types/analytics.types';
import { OverviewTab } from './tabs/OverviewTab';
import { ConversationsTab } from './tabs/ConversationsTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { UsageCostsTab } from './tabs/UsageCostsTab';

interface AnalyticsTabsProps {
  data: AnalyticsData;
}

export type AnalyticsTabType = 'overview' | 'conversations' | 'performance' | 'usage';

export function AnalyticsTabs({ data }: AnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTabType>('overview');

  return (
    <div>
      <div className="analytics-tabs-container">
        <button
          className={`analytics-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`analytics-tab-btn ${activeTab === 'conversations' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversations')}
        >
          Conversations
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

      <div className="mt-4">
        {activeTab === 'overview' && <OverviewTab data={data.overview} />}
        {activeTab === 'conversations' && <ConversationsTab data={data.conversations} />}
        {activeTab === 'performance' && <PerformanceTab data={data.performance} />}
        {activeTab === 'usage' && <UsageCostsTab data={data.usageCosts} />}
      </div>
    </div>
  );
}
