'use client';

import { useCustom } from '@refinedev/core';
import type { DashboardData } from '../types/dashboard.types';

const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: [
    {
      id: 'total-chats',
      title: 'Total Chats',
      value: '0',
      icon: 'message',
      iconColor: '#3b82f6',
      iconBg: '#eff6ff',
      isMock: false,
    },
    {
      id: 'active-sites',
      title: 'Active Sites',
      value: '0',
      icon: 'global',
      iconColor: '#10b981',
      iconBg: '#d1fae5',
      isMock: false,
    },
    {
      id: 'avg-response-time',
      title: 'Agent Response Time',
      value: 'N/A',
      icon: 'clock',
      iconColor: '#f59e0b',
      iconBg: '#fef3c7',
      isMock: false,
    },
    {
      id: 'token-usage',
      title: 'Token Usage',
      value: '0',
      icon: 'api',
      iconColor: '#8b5cf6',
      iconBg: '#f3e8ff',
      isMock: false,
    },
  ],
  chatActivity: { daily: [], weekly: [], monthly: [] },
  containmentRate: { aiResolved: 100, agentHandoff: 0 },
  tokenUsage: { daily: [], weekly: [], monthly: [] },
  userFeedback: [
    { label: 'Helpful', value: 0, color: '#10b981' },
    { label: 'Not Helpful', value: 0, color: '#ef4444' },
  ],
  recentActivity: [],
};

/**
 * Hook that returns dashboard analytics data via Refine.
 */
export function useDashboardData(): { data: DashboardData; isLoading: boolean } {
  const { query } = useCustom<DashboardData>({
    url: '/analytics/dashboard',
    method: 'get',
  });

  return {
    data: query.data?.data ?? EMPTY_DASHBOARD_DATA,
    isLoading: query.isLoading,
  };
}
