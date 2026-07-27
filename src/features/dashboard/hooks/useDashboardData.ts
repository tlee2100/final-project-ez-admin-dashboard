'use client';

import { mockDashboardData } from '../mock/dashboardMockData';
import type { DashboardData } from '../types/dashboard.types';

/**
 * Hook that returns dashboard data.
 * Currently returns mock data — swap the return value for a real API call (SWR/React Query).
 */
export function useDashboardData(): { data: DashboardData; isLoading: boolean } {
  // TODO: Replace with real API call when backend is ready
  // const { data, isLoading } = useSWR<DashboardData>('/api/v1/dashboard', fetcher);
  return { data: mockDashboardData, isLoading: false };
}
