'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip } from 'antd';
import {
  DashboardOutlined,
  GlobalOutlined,
  MessageOutlined,
  CalendarOutlined,
  BarChartOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  LeftOutlined,
  RightOutlined,
  RobotOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import './AppSidebar.css';

// ── Nav item definitions ─────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined />, href: '/dashboard' },
  { key: 'organizations', label: 'Organizations', icon: <BankOutlined />, href: '/organizations' },
  { key: 'sites', label: 'Sites', icon: <GlobalOutlined />, href: '/sites' },
  { key: 'live-chats', label: 'Live Chats', icon: <MessageOutlined />, href: '/live-chats' },
  { key: 'bookings', label: 'Bookings', icon: <CalendarOutlined />, href: '/bookings' },
  { key: 'analytics', label: 'Analytics', icon: <BarChartOutlined />, href: '/analytics' },
  { key: 'users', label: 'Users', icon: <TeamOutlined />, href: '/users' },
];

interface AppSidebarProps {
  collapsed?: boolean;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onToggle?: () => void;
  onCloseMobile?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AppSidebar({
  collapsed = false,
  isMobile = false,
  mobileOpen = false,
  onToggle,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user, hasAccess } = useCurrentRole();

  const segments = pathname.split('/').filter(Boolean);
  const rootSegment = segments.length > 0 ? `/${segments[0]}` : '/dashboard';
  const activeKey = NAV_ITEMS.find((item) => item.href === rootSegment)?.key ?? 'dashboard';

  const visibleNavItems = NAV_ITEMS.filter((item) => hasAccess(item.key));

  const sidebarClass = isMobile
    ? `sidebar mobile-drawer ${mobileOpen ? 'open' : ''}`
    : `sidebar ${collapsed ? 'collapsed' : ''}`;

  return (
    <aside className={sidebarClass}>
      {/* ── Logo ── */}
      <Link href="/dashboard" className="sidebar-logo" onClick={onCloseMobile}>
        <div className="sidebar-logo-icon">
          <RobotOutlined />
        </div>
        <span className="sidebar-logo-text">ChatBot Admin</span>
      </Link>

      {/* ── Collapse toggle ── */}
      {!isMobile && (
        <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <RightOutlined style={{ fontSize: 10 }} />
            ) : (
              <LeftOutlined style={{ fontSize: 10 }} />
            )}
          </button>
        </Tooltip>
      )}

      {/* ── Nav ── */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {visibleNavItems.map((item) => {
          const isActive = activeKey === item.key;
          const navEl = (
            <Link
              key={item.key}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={onCloseMobile}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </Link>
          );

          return collapsed && !isMobile ? (
            <Tooltip key={item.key} title={item.label} placement="right">
              {navEl}
            </Tooltip>
          ) : (
            navEl
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="sidebar-bottom">
        {/* Help */}
        <Tooltip title={collapsed ? 'Help & Support' : undefined} placement="right">
          <div className="sidebar-help">
            <QuestionCircleOutlined style={{ fontSize: 16, flexShrink: 0 }} />
            <span className="nav-item-label">Help &amp; Support</span>
          </div>
        </Tooltip>

        {/* Signed in as */}
        <div className="sidebar-user">
          <div>
            <div className="sidebar-user-label">Signed in as</div>
            <div className="sidebar-user-name">{user?.name ?? 'Unknown'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
