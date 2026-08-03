'use client';

import React from 'react';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  MessageOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { StatCardData } from '@/src/features/dashboard/types/dashboard.types';
import './StatCard.css';

interface StatCardProps {
  data: StatCardData;
}

// Map icon string → Ant Design icon
const ICON_MAP: Record<string, React.ReactElement> = {
  message: <MessageOutlined />,
  global: <GlobalOutlined />,
  clock: <ClockCircleOutlined />,
  api: <ApiOutlined />,
};

// Accent color map for the top border
const ACCENT_MAP: Record<string, string> = {
  message: '#6366f1',
  global: '#10b981',
  clock: '#f59e0b',
  api: '#f97316',
};

export function StatCard({ data }: StatCardProps) {
  const { title, value, trend, trendDirection, icon, iconColor, iconBg, isMock } = data;

  const trendLabel =
    trendDirection === 'up' ? `+${trend}%` : trendDirection === 'down' ? `-${trend}%` : `${trend}%`;

  const TrendIcon =
    trendDirection === 'up'
      ? ArrowUpOutlined
      : trendDirection === 'down'
        ? ArrowDownOutlined
        : MinusOutlined;

  return (
    <div
      className="stat-card"
      style={{ '--card-accent': ACCENT_MAP[icon] ?? '#6366f1' } as React.CSSProperties}
      role="article"
      aria-label={`${title}: ${value}, trend ${trendLabel}`}
    >
      <div className="stat-card-content">
        <p className="stat-card-title">
          {title}
          {isMock && (
            <span
              style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}
              title="This metric is simulated (Mock Data)"
            >
              (Mock)
            </span>
          )}
        </p>
        <p className="stat-card-value">{value}</p>
        <span className={`stat-card-trend ${trendDirection}`}>
          <TrendIcon />
          {trendLabel}
        </span>
      </div>

      <div
        className="stat-card-icon"
        style={{ background: iconBg, color: iconColor }}
        aria-hidden="true"
      >
        {ICON_MAP[icon] ?? <ApiOutlined />}
      </div>
    </div>
  );
}
