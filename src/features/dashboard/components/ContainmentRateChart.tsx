'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ContainmentData } from '../types/dashboard.types';

interface ContainmentRateChartProps {
  data: ContainmentData;
}

const COLORS = ['#10b981', '#6366f1'];
const RADIAN = Math.PI / 180;

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function ContainmentRateChart({ data }: ContainmentRateChartProps) {
  const chartData = [
    { name: 'AI Resolved', value: data.aiResolved },
    { name: 'Agent Handoff', value: data.agentHandoff },
  ];

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">Containment Rate</h3>
      </div>

      <div style={{ height: 220, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={CustomLabel as unknown as boolean}
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value}%`, '']}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{data.aiResolved}%</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>AI Resolved</div>
        </div>
      </div>

      <p
        style={{
          fontSize: 12,
          color: '#6b7280',
          textAlign: 'center',
          margin: '0 0 4px',
          padding: '0 16px',
        }}
      >
        {data.aiResolved}% of conversations are successfully handled by the AI without human
        intervention
      </p>
    </div>
  );
}
