'use client';

import React, { useState, useEffect } from 'react';
import type { Site } from '../../types/site.types';
import { SubTabGeneral } from './SubTabGeneral';
import { SubTabAppearance } from './SubTabAppearance';
import { SubTabBehavior } from './SubTabBehavior';
import { SubTabSecurity } from './SubTabSecurity';
import './site-configuration.css';

interface TabConfigurationProps {
  site: Site;
  onUpdateSite?: (updatedSite: Partial<Site>) => void;
  defaultSubTab?: ConfigSubTabKey;
}

export type ConfigSubTabKey = 'general' | 'appearance' | 'behavior' | 'security';

export function TabConfiguration({
  site,
  onUpdateSite,
  defaultSubTab = 'general',
}: TabConfigurationProps) {
  const [activeSubTab, setActiveSubTab] = useState<ConfigSubTabKey>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`site-config-subtab-${site?.id}`);
      if (saved) return saved as ConfigSubTabKey;
    }
    return defaultSubTab;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && site?.id) {
      localStorage.setItem(`site-config-subtab-${site.id}`, activeSubTab);
    }
  }, [activeSubTab, site?.id]);

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
          onClick={() => setActiveSubTab('general')}
          role="tab"
          aria-selected={activeSubTab === 'general'}
        >
          General
        </button>

        <button
          type="button"
          className={`site-config-subtab-btn ${activeSubTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('appearance')}
          role="tab"
          aria-selected={activeSubTab === 'appearance'}
        >
          Appearance
        </button>

        <button
          type="button"
          className={`site-config-subtab-btn ${activeSubTab === 'behavior' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('behavior')}
          role="tab"
          aria-selected={activeSubTab === 'behavior'}
        >
          Behavior
        </button>

        <button
          type="button"
          className={`site-config-subtab-btn ${activeSubTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('security')}
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
