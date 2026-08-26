'use client';

import React from 'react';
import {
  MessageOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  CheckOutlined,
  LikeOutlined,
  DollarOutlined,
  CalculatorOutlined,
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
  file: <FileTextOutlined />,
  database: <DatabaseOutlined />,
  check: <CheckOutlined />,
  like: <LikeOutlined />,
  dollar: <DollarOutlined />,
  calculator: <CalculatorOutlined />,
};

// Accent color map for the top border
const ACCENT_MAP: Record<string, string> = {
  message: '#6366f1',
  global: '#10b981',
  clock: '#3b82f6',
  api: '#f97316',
  file: '#10b981',
  database: '#8b5cf6',
  check: '#8b5cf6',
  like: '#10b981',
  dollar: '#10b981',
  calculator: '#f59e0b',
};

export function StatCard({ data }: StatCardProps) {
  const { title, value, icon, iconColor, iconBg, isMock } = data;

  return (
    <div
      className="stat-card"
      style={{ '--card-accent': ACCENT_MAP[icon] ?? '#6366f1' } as React.CSSProperties}
      role="article"
      aria-label={`${title}: ${value}`}
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
