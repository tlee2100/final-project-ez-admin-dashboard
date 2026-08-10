'use client';

import React, { useState } from 'react';
import { AppSidebar } from '../AppSidebar/AppSidebar';
import { AppHeader } from '../AppHeader/AppHeader';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageName?: string;
}

const SIDEBAR_COLLAPSED_KEY = 'ez_sidebar_collapsed';

export function DashboardLayout({ children, pageName }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore parse error
        }
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const handleToggle = () => {
    setCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="layout-root">
      <AppSidebar collapsed={collapsed} onToggle={handleToggle} />
      <AppHeader pageName={pageName} sidebarCollapsed={collapsed} />
      <main className={`layout-main ${collapsed ? 'sidebar-collapsed' : ''}`} id="main-content">
        <div className="layout-content">{children}</div>
      </main>
    </div>
  );
}
