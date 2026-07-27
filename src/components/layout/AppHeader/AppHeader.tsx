'use client';

import React from 'react';
import Link from 'next/link';
import { Dropdown, Switch, Tooltip } from 'antd';
import {
  MessageOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import './AppHeader.css';

interface AppHeaderProps {
  sidebarCollapsed?: boolean;
  pageName?: string;
}

// ── Helper: get user initials ────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AppHeader({
  sidebarCollapsed = false,
  pageName = 'AI Chatbot Admin',
}: AppHeaderProps) {
  const { currentRole, roleConfig, user } = useCurrentRole();

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  return (
    <header className={`app-header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} role="banner">
      {/* ── Left ── */}
      <div className="header-left">
        <span className="header-app-name">{pageName}</span>
        <span className="header-breadcrumb-sep">·</span>
        <span
          className={`header-role-badge ${currentRole}`}
          aria-label={`Current role: ${roleConfig.label}`}
        >
          {roleConfig.label}
        </span>
      </div>

      {/* ── Right ── */}
      <div className="header-right">
        {/* Theme toggle */}
        <Tooltip title="Toggle theme">
          <div className="header-theme-toggle">
            <BulbOutlined style={{ fontSize: 13, color: '#f59e0b' }} />
            <Switch size="small" defaultChecked={false} style={{ backgroundColor: '#d1d5db' }} />
          </div>
        </Tooltip>

        {/* Notification */}
        <Tooltip title="Notifications">
          <button className="header-notif-btn" aria-label="Notifications">
            <BellOutlined />
            <span className="header-notif-dot" aria-hidden="true" />
          </button>
        </Tooltip>

        {/* Live Chats */}
        <Link href="/live-chats" className="header-live-btn" aria-label="Open Live Chats">
          <span className="header-live-dot" aria-hidden="true" />
          <MessageOutlined />
          <span>Live Chats</span>
        </Link>

        <div className="header-divider" aria-hidden="true" />

        {/* Avatar + User dropdown */}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <div className="header-avatar-wrap" role="button" aria-label="User menu" tabIndex={0}>
            <div className="header-avatar" aria-hidden="true">
              {user ? getInitials(user.name) : 'AU'}
            </div>
            <div className="header-user-info">
              <span className="header-user-name">{user?.name ?? 'Admin User'}</span>
              <span className="header-user-email">{user?.email ?? ''}</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
