'use client';

import React from 'react';
import { AppSidebar } from '../AppSidebar/AppSidebar';
import { AppHeader } from '../AppHeader/AppHeader';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageName?: string;
}

export function DashboardLayout({ children, pageName }: DashboardLayoutProps) {
  return (
    <div className="layout-root">
      <AppSidebar />
      <AppHeader pageName={pageName} />
      <main className="layout-main" id="main-content">
        <div className="layout-content">{children}</div>
      </main>
    </div>
  );
}
