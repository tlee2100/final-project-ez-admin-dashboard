import { useState, useEffect } from 'react';
import type { AnalyticsData } from '../types/analytics.types';
import { mockAnalyticsData } from '../mock/analyticsMockData';
import { apiRequest } from '@/src/lib/api.client';
import { useSession } from 'next-auth/react';

export function useAnalyticsData() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = session?.accessToken;
        if (token) {
          try {
            const analyticsRes = await apiRequest<{
              totalChats: number;
              activeSites: number;
              containmentRate: { aiResolved: number; agentHandoff: number };
              chatActivity: {
                daily: { label: string; value: number }[];
                weekly: { label: string; value: number }[];
                monthly: { label: string; value: number }[];
              };
              userFeedback?: { label: string; value: number; color?: string }[];
            }>('/analytics/dashboard');

            const helpfulItem = analyticsRes.userFeedback?.find((d) => d.label === 'Helpful');
            const unhelpfulItem = analyticsRes.userFeedback?.find((d) => d.label === 'Not Helpful');
            const helpfulCount = helpfulItem?.value ?? 0;
            const unhelpfulCount = unhelpfulItem?.value ?? 0;
            const totalFeedback = helpfulCount + unhelpfulCount;
            const helpfulRatio =
              totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;

            const realOverviewStats = [
              {
                id: 'total-conversations',
                title: 'Total Conversations',
                value: analyticsRes.totalChats?.toLocaleString('en-US') ?? '0',
                trend: 12,
                trendDirection: 'up' as const,
                icon: 'message',
                iconColor: '#3b82f6',
                iconBg: '#eff6ff',
              },
              {
                id: 'avg-response-time',
                title: 'Avg. Response Time (Mock)',
                value: '1.2s',
                trend: 0.3,
                trendDirection: 'up' as const,
                icon: 'clock',
                iconColor: '#10b981',
                iconBg: '#d1fae5',
              },
              {
                id: 'containment-rate',
                title: 'Containment Rate',
                value: `${analyticsRes.containmentRate?.aiResolved ?? 80}%`,
                trend: 5,
                trendDirection: 'up' as const,
                icon: 'check',
                iconColor: '#8b5cf6',
                iconBg: '#ede9fe',
              },
              {
                id: 'helpful-ratio',
                title: 'Helpful Ratio',
                value: totalFeedback > 0 ? `${helpfulRatio}%` : 'N/A',
                trend: 2,
                trendDirection: 'up' as const,
                icon: 'like',
                iconColor: '#10b981',
                iconBg: '#d1fae5',
              },
            ];

            setData({
              ...mockAnalyticsData,
              overview: {
                ...mockAnalyticsData.overview,
                stats: realOverviewStats,
                chatActivity: analyticsRes.chatActivity || mockAnalyticsData.overview.chatActivity,
                containmentRate:
                  analyticsRes.containmentRate || mockAnalyticsData.overview.containmentRate,
                userFeedback: analyticsRes.userFeedback || mockAnalyticsData.overview.userFeedback,
              },
            });
            return;
          } catch {
            // Silently fall back to mock analytics if endpoint fails or 401
          }
        }
        setData(mockAnalyticsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session?.accessToken]);

  return { data, isLoading, error };
}
