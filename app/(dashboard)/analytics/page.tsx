'use client';

import React from 'react';
import Link from 'next/link';
import { ExportOutlined, CalendarOutlined, ApiOutlined } from '@ant-design/icons';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { useAnalyticsData } from '@/src/features/analytics/hooks/useAnalyticsData';
import { AnalyticsTabs } from '@/src/features/analytics/components/AnalyticsTabs';
import '@/src/features/analytics/components/analytics.css';

export default function AnalyticsPage() {
  const { currentRole } = useCurrentRole();
  const { data, isLoading, error } = useAnalyticsData();

  if (currentRole === 'agent') {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ApiOutlined className="text-2xl text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access restricted</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Your current demo role{' '}
            <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-medium">
              Agent
            </span>{' '}
            does not have permission to view this page.
            <br />
            <br />
            Use the sticky role switcher in the sidebar footer to try Super Admin or Admin.
          </p>
          <Link href="/dashboard" className="btn-primary w-full justify-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-center text-red-500">Failed to load analytics data.</div>;
  }

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">
            <h1 className="page-title-text">Analytics</h1>
          </div>
          <p className="page-subtitle">Insights and performance metrics</p>
        </div>

        {/* Actions */}
        <div className="page-actions">
          <button className="analytics-action-btn">
            <CalendarOutlined />
            Last 7 Days
          </button>
          <button className="analytics-action-btn">
            <ExportOutlined />
            Export
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <AnalyticsTabs data={data} />
    </>
  );
}
