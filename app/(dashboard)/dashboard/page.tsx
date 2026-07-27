'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlusOutlined,
  ExportOutlined,
  MessageOutlined,
  CalendarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { useDashboardData } from '@/src/features/dashboard/hooks/useDashboardData';
import { DashboardStats } from '@/src/features/dashboard/components/DashboardStats';
import { ChatActivityChart } from '@/src/features/dashboard/components/ChatActivityChart';
import { ContainmentRateChart } from '@/src/features/dashboard/components/ContainmentRateChart';
import { TokenUsageChart } from '@/src/features/dashboard/components/TokenUsageChart';
import { UserFeedbackChart } from '@/src/features/dashboard/components/UserFeedbackChart';
import { ActivityFeed } from '@/src/components/ui/ActivityFeed/ActivityFeed';
import { ROLE_CONFIGS } from '@/src/types/auth.types';
import '@/src/features/dashboard/components/dashboard.css';

export default function DashboardPage() {
  const { currentRole, isSuperAdmin, isAdmin } = useCurrentRole();
  const { data } = useDashboardData();
  const roleConfig = ROLE_CONFIGS[currentRole];

  const pageSubtitle = isSuperAdmin
    ? 'Overview of your AI chatbot performance'
    : isAdmin
      ? 'Site overview — manage your chatbot and content'
      : 'Agent overview — focus on live chats and bookings';

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">
            <h1 className="page-title-text">Dashboard</h1>
            <span
              className={`header-role-badge ${currentRole}`}
              style={{ fontSize: 12, padding: '2px 10px' }}
            >
              {roleConfig.label}
            </span>
          </div>
          <p className="page-subtitle">{pageSubtitle}</p>
        </div>

        {/* Actions differ by role */}
        <div className="page-actions">
          {isSuperAdmin && (
            <>
              <button className="btn-secondary">
                <ExportOutlined />
                Export Report
              </button>
              <Link href="/sites/new" className="btn-primary">
                <PlusOutlined />
                New Site
              </Link>
            </>
          )}

          {isAdmin && (
            <Link href="/sites/new" className="btn-primary">
              <PlusOutlined />
              New Site
            </Link>
          )}

          {currentRole === 'agent' && (
            <Link href="/live-chats" className="btn-primary">
              <MessageOutlined />
              Open Live Chats
            </Link>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <DashboardStats stats={data.stats} />

      {/* ── Charts Section ── */}
      {isSuperAdmin || isAdmin ? (
        <>
          {/* Row 1: Chat Activity + Containment Rate */}
          <div className="dashboard-grid-5">
            <div className="dashboard-col-3">
              <ChatActivityChart data={data.chatActivity} />
            </div>
            <div className="dashboard-col-2">
              <ContainmentRateChart data={data.containmentRate} />
            </div>
          </div>

          {/* Row 2: Token Usage + User Feedback */}
          <div className="dashboard-grid-2 mb-6">
            <TokenUsageChart data={data.tokenUsage} />
            <UserFeedbackChart data={data.userFeedback} />
          </div>
        </>
      ) : (
        /* Agent: Analytics placeholder */
        <div className="analytics-placeholder mb-6">
          <div className="analytics-placeholder-icon">
            <BarChartOutlined />
          </div>
          <p className="analytics-placeholder-title">
            Detailed analytics charts are available to Admin and Super Admin roles.
          </p>
          <p className="analytics-placeholder-text">
            Switch role in the sidebar footer to preview full access.
          </p>
          <div className="analytics-placeholder-actions">
            <Link href="/live-chats" className="analytics-placeholder-btn primary">
              <MessageOutlined style={{ marginRight: 6 }} />
              Live Chats
            </Link>
            <Link href="/bookings" className="analytics-placeholder-btn secondary">
              <CalendarOutlined style={{ marginRight: 6 }} />
              Bookings
            </Link>
          </div>
        </div>
      )}

      {/* ── Recent Activity ── */}
      <ActivityFeed items={data.recentActivity} />
    </>
  );
}
