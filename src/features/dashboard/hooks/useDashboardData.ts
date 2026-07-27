'use client';

import { useOne } from '@refinedev/core';
import { mockDashboardData } from '../mock/dashboardMockData';
import type { DashboardData } from '../types/dashboard.types';

/**
 * Hook that returns dashboard data via Refine's useOne.
 * Currently backed by mockDataProvider — swap dataProvider in providers.tsx to go live.
 */
export function useDashboardData(): { data: DashboardData; isLoading: boolean } {
  const { query } = useOne<DashboardData>({
    resource: 'dashboard',
    id: 'overview',
  });

  // Use mock as fallback while loading so charts never flash empty
  return {
    data: query.data?.data ?? mockDashboardData,
    isLoading: query.isLoading,
  };
}
