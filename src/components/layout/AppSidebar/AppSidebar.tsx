'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Select, Tooltip } from 'antd';
import {
  DashboardOutlined,
  GlobalOutlined,
  MessageOutlined,
  CalendarOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  LeftOutlined,
  RightOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import type { UserRole } from '@/src/types/auth.types';
import './AppSidebar.css';

// ── Nav item definitions ─────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined />, href: '/dashboard' },
  { key: 'sites', label: 'Sites', icon: <GlobalOutlined />, href: '/sites' },
  { key: 'live-chats', label: 'Live Chats', icon: <MessageOutlined />, href: '/live-chats' },
  { key: 'bookings', label: 'Bookings', icon: <CalendarOutlined />, href: '/bookings' },
  { key: 'analytics', label: 'Analytics', icon: <BarChartOutlined />, href: '/analytics' },
  { key: 'users', label: 'Users', icon: <TeamOutlined />, href: '/users' },
  { key: 'settings', label: 'Settings', icon: <SettingOutlined />, href: '/settings' },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'agent', label: 'Agent' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { currentRole, roleConfig, user, switchRole, hasAccess } = useCurrentRole();

  const activeKey = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.key ?? 'dashboard';

  const visibleNavItems = NAV_ITEMS.filter((item) => hasAccess(item.key));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Logo ── */}
      <Link href="/dashboard" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <RobotOutlined />
        </div>
        <span className="sidebar-logo-text">ChatBot Admin</span>
      </Link>

      {/* ── Collapse toggle ── */}
      <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <RightOutlined style={{ fontSize: 10 }} />
          ) : (
            <LeftOutlined style={{ fontSize: 10 }} />
          )}
        </button>
      </Tooltip>

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
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </Link>
          );

          return collapsed ? (
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

        {/* Role Switcher */}
        <div className="role-switcher">
          <div className="role-switcher-label">
            <span className="role-switcher-title">DEMO ROLE</span>
            <span className={`role-tag ${currentRole}`}>{roleConfig.label}</span>
          </div>

          <Select
            value={currentRole}
            onChange={(val) => switchRole(val as UserRole)}
            size="small"
            style={{ width: '100%' }}
            options={ROLE_OPTIONS}
            aria-label="Switch demo role"
            suffixIcon={null}
          />

          <div className="role-switcher-desc">Switch roles to preview access control.</div>
        </div>
      </div>
    </aside>
  );
}
