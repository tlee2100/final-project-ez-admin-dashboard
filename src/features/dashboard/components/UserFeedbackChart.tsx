'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LikeOutlined } from '@ant-design/icons';
import type { UserFeedbackData } from '../types/dashboard.types';

interface UserFeedbackChartProps {
  data?: UserFeedbackData;
}

export function UserFeedbackChart({ data }: UserFeedbackChartProps) {
  const helpfulItem = Array.isArray(data) ? data.find((d) => d.label === 'Helpful') : undefined;
  const unhelpfulItem = Array.isArray(data)
    ? data.find((d) => d.label === 'Not Helpful')
    : undefined;

  const helpfulCount = helpfulItem?.value ?? 0;
  const unhelpfulCount = unhelpfulItem?.value ?? 0;
  const totalVotes = helpfulCount + unhelpfulCount;
  const helpfulRatio = totalVotes > 0 ? Math.round((helpfulCount / totalVotes) * 100) : 0;

  const chartData = [
    { label: 'Helpful', value: helpfulCount, color: '#10b981' },
    { label: 'Not Helpful', value: unhelpfulCount, color: '#ef4444' },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value), 5);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">User Feedback</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: totalVotes > 0 ? '#d1fae5' : '#f3f4f6',
            color: totalVotes > 0 ? '#059669' : '#6b7280',
            padding: '4px 10px',
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <LikeOutlined />
          {totalVotes > 0 ? `${helpfulRatio}% Helpful` : 'No Feedback'}
        </div>
      </div>

      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 16, right: 24, left: 12, bottom: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, maxValue + 2]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={80}
              tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [value ?? 0, 'Responses']}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
              }}
              cursor={{ fill: 'rgba(99,102,241,0.05)' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
              {chartData.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
