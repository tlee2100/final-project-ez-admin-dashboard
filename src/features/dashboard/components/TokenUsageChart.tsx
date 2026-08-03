'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartDataPoint, ChartPeriod } from '../types/dashboard.types';

interface TokenUsageChartProps {
  data: { daily: ChartDataPoint[] };
}

const PERIOD_OPTIONS: ChartPeriod[] = ['Daily', 'Weekly', 'Monthly'];

// Gradient colors for bars
const BAR_COLORS = ['#6366f1', '#7c3aed', '#6366f1', '#8b5cf6', '#6366f1', '#7c3aed', '#6366f1'];

function formatK(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export function TokenUsageChart({ data }: TokenUsageChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>('Daily');

  // For mock we only have daily, other periods would be fetched from API
  const chartData = data.daily;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">Token Usage</h3>
        <div className="chart-period-tabs" role="tablist" aria-label="Chart period">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              className={`chart-period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatK}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${formatK(Number(value))} tokens`, 'Usage']}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              cursor={{ fill: 'rgba(99,102,241,0.06)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
