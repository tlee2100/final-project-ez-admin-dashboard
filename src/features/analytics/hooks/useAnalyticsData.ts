import { useState, useEffect } from 'react';
import type { AnalyticsData } from '../types/analytics.types';
import { apiRequest } from '@/src/lib/api.client';
import { useSession } from 'next-auth/react';

function formatTokens(t: number): string {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`;
  if (t >= 1_000) return `${(t / 1_000).toFixed(1)}K`;
  return t.toLocaleString('en-US');
}

interface AnalyticsApiResponse {
  totalChats: number;
  activeSites: number;
  totalSites: number;
  totalTokens: number;
  avgResponseTime: string;
  estimatedCost: number;
  containmentRate: { aiResolved: number; agentHandoff: number };
  chatActivity: {
    daily: { label: string; value: number }[];
    weekly: { label: string; value: number }[];
    monthly: { label: string; value: number }[];
  };
  tokenUsage: {
    daily: { label: string; value: number }[];
    weekly: { label: string; value: number }[];
    monthly: { label: string; value: number }[];
  };
  userFeedback?: { label: string; value: number; color?: string }[];
  topDocuments?: { id: string; name: string; siteName: string; hits: number }[];
  usageBySite?: {
    siteId: string;
    siteName: string;
    tokens: number;
    percentage: number;
    estimatedCost: string;
  }[];
}

export function useAnalyticsData(startDate?: string, endDate?: string) {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const queryParams: string[] = [];
        if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
        if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        const analyticsRes = await apiRequest<AnalyticsApiResponse>(
          `/analytics/dashboard${queryString}`,
        );

        const helpfulItem = analyticsRes.userFeedback?.find((d) => d.label === 'Helpful');
        const unhelpfulItem = analyticsRes.userFeedback?.find((d) => d.label === 'Not Helpful');
        const helpfulCount = helpfulItem?.value ?? 0;
        const unhelpfulCount = unhelpfulItem?.value ?? 0;
        const totalFeedback = helpfulCount + unhelpfulCount;
        const helpfulRatio =
          totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;

        const totalChats = analyticsRes.totalChats ?? 0;
        const totalTokens = analyticsRes.totalTokens ?? 0;
        const estimatedCost = analyticsRes.estimatedCost ?? 0;
        const avgTokensPerChat = Math.round(totalTokens / (totalChats || 1));
        const costPerChat = (estimatedCost / (totalChats || 1)).toFixed(3);

        const realOverviewStats = [
          {
            id: 'total-conversations',
            title: 'Total Conversations',
            value: totalChats.toLocaleString('en-US'),
            icon: 'message',
            iconColor: '#3b82f6',
            iconBg: '#eff6ff',
          },
          {
            id: 'avg-response-time',
            title: 'Agent Response Time',
            value: analyticsRes.avgResponseTime || 'N/A',
            icon: 'clock',
            iconColor: '#10b981',
            iconBg: '#d1fae5',
          },
          {
            id: 'containment-rate',
            title: 'Containment Rate',
            value: `${analyticsRes.containmentRate?.aiResolved ?? 100}%`,
            icon: 'check',
            iconColor: '#8b5cf6',
            iconBg: '#ede9fe',
          },
          {
            id: 'helpful-ratio',
            title: 'Helpful Ratio',
            value: totalFeedback > 0 ? `${helpfulRatio}%` : 'N/A',
            icon: 'like',
            iconColor: '#10b981',
            iconBg: '#d1fae5',
          },
        ];

        const realUsageCostStats = [
          {
            id: 'total-token-usage',
            title: 'Total Token Usage',
            value: formatTokens(totalTokens),
            icon: 'api',
            iconColor: '#3b82f6',
            iconBg: '#eff6ff',
          },
          {
            id: 'estimated-cost',
            title: 'Estimated Cost',
            value: `$${estimatedCost.toFixed(2)}`,
            icon: 'dollar',
            iconColor: '#10b981',
            iconBg: '#d1fae5',
          },
          {
            id: 'avg-tokens-chat',
            title: 'Avg. Tokens/Chat',
            value: avgTokensPerChat.toLocaleString('en-US'),
            icon: 'message',
            iconColor: '#8b5cf6',
            iconBg: '#ede9fe',
          },
          {
            id: 'cost-per-chat',
            title: 'Cost per Chat',
            value: `$${costPerChat}`,
            icon: 'calculator',
            iconColor: '#f59e0b',
            iconBg: '#fef3c7',
          },
        ];

        const topDocs = analyticsRes.topDocuments || [];
        const totalDocs = topDocs.length;
        const totalChunks = topDocs.reduce((acc, doc) => acc + (doc.hits || 0), 0);
        const avgChunks = totalDocs > 0 ? Math.round(totalChunks / totalDocs) : 0;

        const realPerformanceStats = [
          {
            id: 'avg-response-time',
            title: 'Agent Response Time',
            value: analyticsRes.avgResponseTime || 'N/A',
            icon: 'clock',
            iconColor: '#3b82f6',
            iconBg: '#eff6ff',
          },
          {
            id: 'kb-documents',
            title: 'Indexed Documents',
            value: totalDocs.toString(),
            icon: 'file',
            iconColor: '#10b981',
            iconBg: '#d1fae5',
          },
          {
            id: 'total-chunks',
            title: 'Total Vector Chunks',
            value: totalChunks.toLocaleString('en-US'),
            icon: 'database',
            iconColor: '#8b5cf6',
            iconBg: '#ede9fe',
          },
          {
            id: 'avg-chunks-doc',
            title: 'Avg. Chunks / Doc',
            value: avgChunks.toString(),
            icon: 'api',
            iconColor: '#f59e0b',
            iconBg: '#fef3c7',
          },
        ];

        const usageBySite = analyticsRes.usageBySite || [];

        setData({
          overview: {
            stats: realOverviewStats,
            chatActivity: analyticsRes.chatActivity || { daily: [], weekly: [], monthly: [] },
            containmentRate: analyticsRes.containmentRate || { aiResolved: 100, agentHandoff: 0 },
            tokenUsage: analyticsRes.tokenUsage || { daily: [], weekly: [], monthly: [] },
            userFeedback: analyticsRes.userFeedback || [
              { label: 'Helpful', value: 0, color: '#10b981' },
              { label: 'Not Helpful', value: 0, color: '#ef4444' },
            ],
          },
          performance: {
            stats: realPerformanceStats,
            kb: {
              topDocuments: topDocs,
            },
            model: {
              avgGenerationTime: analyticsRes.avgResponseTime || 'N/A',
            },
          },
          usageCosts: {
            stats: realUsageCostStats,
            tokenUsage: analyticsRes.tokenUsage || { daily: [], weekly: [], monthly: [] },
            usageBySite,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session?.accessToken, startDate, endDate]);

  return { data, isLoading, error };
}
