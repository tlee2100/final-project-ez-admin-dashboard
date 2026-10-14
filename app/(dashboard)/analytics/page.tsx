'use client';

import React, { useState } from 'react';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { useAnalyticsData } from '@/src/features/analytics/hooks/useAnalyticsData';
import { AnalyticsTabs } from '@/src/features/analytics/components/AnalyticsTabs';
import '@/src/features/analytics/components/analytics.css';

const { RangePicker } = DatePicker;

export default function AnalyticsPage() {
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const startDate = dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined;
  const endDate = dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined;

  const { data, isLoading, error } = useAnalyticsData(startDate, endDate);

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
      </div>

      {/* ── Tabs & Date Picker Toolbar ── */}
      <AnalyticsTabs
        data={data}
        datePicker={
          <RangePicker
            value={dates}
            onChange={(newDates) => {
              setDates(newDates as [Dayjs | null, Dayjs | null] | null);
            }}
            allowClear
            placeholder={['Start Date', 'End Date']}
            className="analytics-range-picker"
          />
        }
      />
    </>
  );
}
