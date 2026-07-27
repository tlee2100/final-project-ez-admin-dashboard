'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LikeOutlined } from '@ant-design/icons';
import type { UserFeedbackData } from '../types/dashboard.types';

interface UserFeedbackChartProps {
  data: UserFeedbackData;
}

const FEEDBACK_COLORS: Record<string, string> = {
  Excellent: '#6366f1',
  Good: '#8b5cf6',
  Average: '#a5b4fc',
  Poor: '#c4b5fd',
  'No Rating': '#e0e7ff',
};

export function UserFeedbackChart({ data }: UserFeedbackChartProps) {
  const chartData = [
    { label: 'Excellent', value: data.excellent },
    { label: 'Good', value: data.good },
    { label: 'Average', value: data.average },
    { label: 'Poor', value: data.poor },
    { label: 'No Rating', value: data.noRating },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">User Feedback</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#d1fae5',
            color: '#059669',
            padding: '4px 10px',
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <LikeOutlined />
          {data.averageScore}/5
        </div>
      </div>

      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, maxValue + 5]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={72}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, 'Responses']}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
              }}
              cursor={{ fill: 'rgba(99,102,241,0.05)' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {chartData.map((entry) => (
                <Cell key={entry.label} fill={FEEDBACK_COLORS[entry.label] ?? '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
