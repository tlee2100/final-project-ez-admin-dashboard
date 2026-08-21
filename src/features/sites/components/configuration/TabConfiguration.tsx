'use client';

import React, { useState } from 'react';
import type { Site } from '../../types/site.types';
import { SubTabGeneral } from './SubTabGeneral';
import { SubTabAppearance } from './SubTabAppearance';
import { SubTabBehavior } from './SubTabBehavior';
import { SubTabSecurity } from './SubTabSecurity';
import './site-configuration.css';

export type ConfigSubTabKey = 'general' | 'appearance' | 'behavior' | 'security';

interface TabConfigurationProps {
  site: Site;
  onUpdateSite?: (updatedSite: Partial<Site>) => void;
  defaultSubTab?: ConfigSubTabKey;
}

const VALID_TABS: ConfigSubTabKey[] = ['general', 'appearance', 'behavior', 'security'];

export function TabConfiguration({
  site,
  onUpdateSite,
  defaultSubTab = 'general',
}: TabConfigurationProps) {
  const [selectedTab, setSelectedTab] = useState<ConfigSubTabKey | null>(null);

  const subscribe = React.useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getSnapshot = React.useCallback((): ConfigSubTabKey => {
    if (!site?.id) return defaultSubTab;
    try {
      const saved = localStorage.getItem(`site-config-subtab-${site.id}`) as ConfigSubTabKey;
      if (saved && VALID_TABS.includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return defaultSubTab;
  }, [site, defaultSubTab]);

  const getServerSnapshot = React.useCallback(
    (): ConfigSubTabKey => defaultSubTab,
    [defaultSubTab],
  );

  const storedTab = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const activeSubTab = selectedTab ?? storedTab;

  const handleTabChange = (tab: ConfigSubTabKey) => {
    setSelectedTab(tab);
    if (site?.id) {
      try {
        localStorage.setItem(`site-config-subtab-${site.id}`, tab);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="site-config-card">
      {/* ── Main Section Title & Subtitle ── */}
      <div className="site-config-header">
        <h2 className="site-config-title">Site Configuration</h2>
        <p className="site-config-subtitle">
          Configure how the chatbot appears and behaves on your website
        </p>
      </div>

      {/* ── Sub-Tabs Navigation Bar ── */}
      <div className="site-config-subtabs-nav" role="tablist">
        <button
          type="button"
          className={`site-config-subtab-btn ${activeSubTab === 'general' ? 'active' : ''}`}
          onClick={() => handleTabChange('general')}
          role="tab"
          aria-selected={activeSubTab === 'general'}
        >
          General
        </button>

        <button
          type="button"
          className={`site-config-subtab-btn ${activeSubTab === 'appearance' ? 'active' : ''}`}
          onClick={() => handleTabChange('appearance')}
          role="tab"
          aria-selected={activeSubTab === 'appearance'}
        >
          Appearance
        </button>

        <button
          type="button"
          className={`site-config-subtab-btn ${activeSubTab === 'behavior' ? 'active' : ''}`}
          onClick={() => handleTabChange('behavior')}
          role="tab"
          aria-selected={activeSubTab === 'behavior'}
        >
          Behavior
        </button>

        <button
          type="button"
          className={`site-config-subtab-btn ${activeSubTab === 'security' ? 'active' : ''}`}
          onClick={() => handleTabChange('security')}
          role="tab"
          aria-selected={activeSubTab === 'security'}
        >
          Security
        </button>
      </div>

      {/* ── Sub-Tab Active Body ── */}
      <div className="site-config-subtab-body">
        {activeSubTab === 'general' && <SubTabGeneral />}
        {activeSubTab === 'appearance' && <SubTabAppearance site={site} />}
        {activeSubTab === 'behavior' && <SubTabBehavior site={site} />}
        {activeSubTab === 'security' && <SubTabSecurity site={site} onSave={onUpdateSite} />}
      </div>
    </div>
  );
}
