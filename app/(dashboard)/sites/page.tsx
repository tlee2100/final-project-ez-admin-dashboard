'use client';

import React from 'react';
import Link from 'next/link';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { useSitesData } from '@/src/features/sites/hooks/useSitesData';
import { SitesSearchBar } from '@/src/features/sites/components/SitesSearchBar';
import { SitesFilterBar } from '@/src/features/sites/components/SitesFilterBar';
import { SiteGrid } from '@/src/features/sites/components/SiteGrid';
import '@/src/features/sites/components/sites.css';
import '@/src/features/dashboard/components/dashboard.css';

export default function SitesPage() {
  const { currentRole, isSuperAdmin, isAdmin } = useCurrentRole();
  const { filter, updateFilter, filteredSites, toggleSiteEnabled } = useSitesData();

  const canManage = isSuperAdmin || isAdmin;
  const isAgent = currentRole === 'agent';

  const pageSubtitle = canManage
    ? 'Manage your chatbot installations'
    : 'View assigned sites (read-only for your role)';

  return (
    <div className="sites-page page-fade-in">
      {/* ── Page Header ── */}
      <div className="sites-header">
        <div className="sites-header-left">
          <h1 className="sites-title">Sites</h1>
          <p className="sites-subtitle">{pageSubtitle}</p>
          {isAgent && (
            <span className="sites-agent-badge">
              <ExclamationCircleOutlined style={{ fontSize: 11 }} />
              Agent: limited site access
            </span>
          )}
        </div>

        {canManage && (
          <Link href="/sites/new" id="add-new-site-btn" className="btn-primary">
            <PlusOutlined />
            Add New Site
          </Link>
        )}
      </div>

      {/* ── Controls: Search + Filter + Sort ── */}
      <div className="sites-controls">
        <SitesSearchBar value={filter.search} onChange={(search) => updateFilter({ search })} />
        <SitesFilterBar
          filter={filter}
          onStatusChange={(status) => updateFilter({ status })}
          onSortChange={(sortKey, sortOrder) => updateFilter({ sortKey, sortOrder })}
        />
      </div>

      {/* ── Sites Grid ── */}
      <SiteGrid sites={filteredSites} canManage={canManage} onToggle={toggleSiteEnabled} />
    </div>
  );
}
