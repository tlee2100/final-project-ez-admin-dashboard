'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dropdown, Switch, Tooltip, type MenuProps, App, Breadcrumb } from 'antd';
import {
  MessageOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  BulbOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useOne } from '@refinedev/core';
import type { Site } from '@/src/features/sites/types/site.types';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { useAuth } from '@/src/contexts/AuthContext';
import { NotificationBell } from '@/src/components/ui/NotificationBell/NotificationBell';
import './AppHeader.css';

interface AppHeaderProps {
  sidebarCollapsed?: boolean;
  pageName?: string;
  isMobile?: boolean;
  onMobileToggle?: () => void;
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
  pageName,
  isMobile = false,
  onMobileToggle,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { currentRole, roleConfig, user } = useCurrentRole();
  const { message } = App.useApp();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'profile') {
      router.push('/profile');
      return;
    }

    if (key === 'logout') {
      logout();
      message.success('Logged out successfully!');
      router.push('/login');
    }
  };

  const userMenuItems: MenuProps['items'] = [
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

  // Generate breadcrumb items
  const pathSnippets = pathname.split('/').filter((i) => i);
  const siteId =
    pathSnippets[0] === 'sites' && pathSnippets[1] && pathSnippets[1] !== 'new'
      ? pathSnippets[1]
      : undefined;

  const { query: siteQuery } = useOne<Site>({
    resource: 'sites',
    id: siteId,
    queryOptions: {
      enabled: Boolean(siteId),
    },
  });
  const siteName = siteQuery.data?.data?.name;

  const breadcrumbItems = pathSnippets.map((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    let name = snippet.charAt(0).toUpperCase() + snippet.slice(1).replace(/-/g, ' ');
    if (index === 1 && pathSnippets[0] === 'sites') {
      name = siteName || (pageName && pageName !== 'AI Chatbot Admin' ? pageName : name);
    } else if (snippet.toLowerCase() === 'kb') {
      name = 'Knowledge Base';
    }
    return {
      key: url,
      title: <Link href={url}>{name}</Link>,
    };
  });
  const allBreadcrumbItems = [
    { key: 'home', title: <Link href="/dashboard">Home</Link> },
    ...breadcrumbItems,
  ];

  return (
    <header
      className={`app-header ${sidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}
      role="banner"
    >
      {/* ── Left ── */}
      <div className="header-left">
        {isMobile && (
          <button className="mobile-toggle-btn" onClick={onMobileToggle} aria-label="Toggle menu">
            <MenuOutlined />
          </button>
        )}
        <Breadcrumb items={allBreadcrumbItems} className="header-breadcrumb" />
        <span
          className="header-breadcrumb-sep"
          style={{ marginLeft: 8, marginRight: 8, color: '#d1d5db' }}
        >
          |
        </span>
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
          <NotificationBell />
        </Tooltip>

        {/* Live Chats */}
        <Link href="/live-chats" className="header-live-btn" aria-label="Open Live Chats">
          <span className="header-live-dot" aria-hidden="true" />
          <MessageOutlined />
          <span>Live Chats</span>
        </Link>

        <div className="header-divider" aria-hidden="true" />

        {/* Avatar + User dropdown */}
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
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
