import React from 'react';
import { DashboardStats } from '@/src/features/dashboard/components/DashboardStats';
import { ChatActivityChart } from '@/src/features/dashboard/components/ChatActivityChart';
import { ContainmentRateChart } from '@/src/features/dashboard/components/ContainmentRateChart';
import { TokenUsageChart } from '@/src/features/dashboard/components/TokenUsageChart';
import { UserFeedbackChart } from '@/src/features/dashboard/components/UserFeedbackChart';
import type { AnalyticsData } from '@/src/features/analytics/types/analytics.types';

interface OverviewTabProps {
  data: AnalyticsData['overview'];
}

export function OverviewTab({ data }: OverviewTabProps) {
  return (
    <div className="analytics-tab-content">
      {/* Stat Cards */}
      <DashboardStats stats={data.stats} />

      {/* Row 1: Chat Activity + Containment Rate */}
      <div className="dashboard-grid-5">
        <div className="dashboard-col-3">
          <ChatActivityChart data={data.chatActivity} />
        </div>
        <div className="dashboard-col-2">
          <ContainmentRateChart data={data.containmentRate} />
        </div>
      </div>

      {/* Row 2: Token Usage + User Feedback */}
      <div className="dashboard-grid-2 mb-6">
        <TokenUsageChart data={data.tokenUsage} />
        <UserFeedbackChart data={data.userFeedback} />
      </div>
    </div>
  );
}
