'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChatActivityData, ChartPeriod } from '../types/dashboard.types';

interface ChatActivityChartProps {
  data: ChatActivityData;
}

const PERIOD_OPTIONS: ChartPeriod[] = ['Daily', 'Weekly', 'Monthly'];

export function ChatActivityChart({ data }: ChatActivityChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>('Daily');

  const chartData =
    period === 'Daily' ? data.daily : period === 'Weekly' ? data.weekly : data.monthly;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">Chat Activity</h3>
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
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="chatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="chatGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            {/* Second area (lighter — simulates "agent" activity) */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#a5b4fc"
              strokeWidth={2}
              fill="url(#chatGradient2)"
              dot={false}
              name="Agent"
            />
            {/* Primary area */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#chatGradient)"
              dot={false}
              name="Total Chats"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
