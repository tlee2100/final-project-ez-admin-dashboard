'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { AppSidebar } from '../AppSidebar/AppSidebar';
import { AppHeader } from '../AppHeader/AppHeader';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageName?: string;
}

const SIDEBAR_COLLAPSED_KEY = 'ez_sidebar_collapsed';

function subscribeToSidebar(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('sidebar-toggle', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('sidebar-toggle', callback);
  };
}

function getSidebarSnapshot(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored !== null ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

export function DashboardLayout({ children, pageName }: DashboardLayoutProps) {
  const collapsed = useSyncExternalStore(
    subscribeToSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot,
  );

  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    try {
      if (collapsed) {
        document.documentElement.classList.add('ez-sidebar-collapsed');
      } else {
        document.documentElement.classList.remove('ez-sidebar-collapsed');
      }
    } catch {
      // ignore
    }

    const timer = setTimeout(() => {
      document.documentElement.classList.add('sidebar-transitions-enabled');
      setMounted(true);
    }, 60);

    return () => clearTimeout(timer);
  }, [collapsed]);

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
    try {
      const next = !collapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(next));
      if (next) {
        document.documentElement.classList.add('ez-sidebar-collapsed');
      } else {
        document.documentElement.classList.remove('ez-sidebar-collapsed');
      }
      window.dispatchEvent(new Event('sidebar-toggle'));
    } catch {
      // ignore
    }
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
    <div className={`layout-root ${!mounted ? 'layout-no-transition' : ''}`}>
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
