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

  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleMobileToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <div className="layout-root">
      {isMobile && mobileOpen && (
        <div className="sidebar-mobile-overlay" onClick={closeMobileSidebar} />
      )}
      <AppSidebar
        collapsed={isMobile ? false : collapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onToggle={handleToggle}
        onCloseMobile={closeMobileSidebar}
      />
      <AppHeader
        pageName={pageName}
        sidebarCollapsed={collapsed}
        isMobile={isMobile}
        onMobileToggle={handleMobileToggle}
      />
      <main
        className={`layout-main ${collapsed && !isMobile ? 'sidebar-collapsed' : ''}`}
        id="main-content"
      >
        <div className="layout-content">{children}</div>
      </main>
    </div>
  );
}
