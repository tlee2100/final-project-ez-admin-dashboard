'use client';

import React, { useState } from 'react';
import { Switch, App, Popconfirm } from 'antd';
import { useUpdate } from '@refinedev/core';
import {
  WarningOutlined,
  CloseOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import type { Site } from '../../types/site.types';

interface SubTabSecurityProps {
  site: Site;
  onSave?: (updatedData: Partial<Site>) => void;
}

export function SubTabSecurity({ site, onSave }: SubTabSecurityProps) {
  const { message } = App.useApp();
  const { mutate: updateSite } = useUpdate<Site>();

  // ── 1. Domain Restrictions State ──
  const initialDomains =
    site.allowedDomains && site.allowedDomains.length > 0
      ? site.allowedDomains
      : [
          'techsolutions.example.com',
          'support.techsolutions.example.com',
          'blog.techsolutions.example.com',
        ];

  const [allowedDomains, setAllowedDomains] = useState<string[]>(initialDomains);
  const [newDomainInput, setNewDomainInput] = useState<string>('');

  // ── 2. API Key Management State (UI active, Backend BYOK processing to be wired in next phase) ──
  const [useCustomKey, setUseCustomKey] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // ── 3. Rate Limiting State ──
  const [maxMessagesPerSession, setMaxMessagesPerSession] = useState<number>(
    site.maxMessagesPerSession ?? 50,
  );
  const [maxSessionsPerIP, setMaxSessionsPerIP] = useState<number>(site.maxSessionsPerIp ?? 10);

  // Saving state
  const [saving, setSaving] = useState<boolean>(false);

  // Handler: Add new domain
  const handleAddDomain = () => {
    const trimmed = newDomainInput.trim().toLowerCase();
    if (!trimmed) return;

    // Simple domain regex validation (e.g., example.com or *.example.com)
    const domainRegex = /^(\*\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?$/;
    if (!domainRegex.test(trimmed)) {
      message.error('Please enter a valid domain format (e.g. example.com or blog.example.com)');
      return;
    }

    if (allowedDomains.includes(trimmed)) {
      message.warning('This domain is already in the allowed list');
      return;
    }

    setAllowedDomains((prev) => [...prev, trimmed]);
    setNewDomainInput('');
    message.success(`Added domain "${trimmed}"`);
  };

  // Handler: Remove domain tag
  const handleRemoveDomain = (domainToRemove: string) => {
    setAllowedDomains((prev) => prev.filter((d) => d !== domainToRemove));
    message.success(`Removed domain "${domainToRemove}"`);
  };

  // Handler: Keypress in domain input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
  };

  // Handler: Save changes via Refine API
  const handleSave = () => {
    setSaving(true);
    updateSite(
      {
        resource: 'sites',
        id: site.id,
        values: {
          allowedDomains,
          maxMessagesPerSession,
          maxSessionsPerIp: maxSessionsPerIP,
        },
      },
      {
        onSuccess: () => {
          setSaving(false);
          message.success('Security settings saved successfully');
          onSave?.({
            allowedDomains,
            maxMessagesPerSession,
            maxSessionsPerIp: maxSessionsPerIP,
          });
        },
        onError: (error) => {
          setSaving(false);
          message.error(error?.message || 'Failed to save security settings');
        },
      },
    );
  };

  return (
    <div className="security-tab-container">
      {/* ── 1. Domain Restrictions Section ── */}
      <div className="security-section">
        <h3 className="security-section-title">Domain Restrictions</h3>
        <p className="security-section-desc">
          Specify which domains are allowed to embed this chatbot
        </p>

        {/* Tags List with Popconfirm Confirmation */}
        <div className="domain-tags-wrapper">
          {allowedDomains.map((domain) => (
            <span key={domain} className="domain-tag">
              {domain}
              <Popconfirm
                title="Remove Domain"
                description={`Are you sure you want to remove "${domain}" from allowed domains?`}
                onConfirm={() => handleRemoveDomain(domain)}
                okText="Yes"
                cancelText="No"
                placement="top"
              >
                <button
                  type="button"
                  className="domain-tag-remove-btn"
                  title={`Remove ${domain}`}
                  aria-label={`Remove ${domain}`}
                >
                  <CloseOutlined style={{ fontSize: 9 }} />
                </button>
              </Popconfirm>
            </span>
          ))}
        </div>

        {/* Input Row */}
        <div className="domain-input-row">
          <input
            type="text"
            className="domain-input-field"
            placeholder="Add a domain (e.g., example.com)"
            value={newDomainInput}
            onChange={(e) => setNewDomainInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="domain-add-btn" onClick={handleAddDomain}>
            Add
          </button>
        </div>
      </div>

      {/* ── 2. API Key Management Section (UI preserved matching mockup) ── */}
      <div className="security-section">
        <h3 className="security-section-title" style={{ marginBottom: 16 }}>
          API Key Management
        </h3>

        {/* Toggle Switch Row */}
        <div className="api-key-header-row">
          <div className="api-key-title-group">
            <span className="api-key-label">Use Custom OpenAI Key</span>
            <span className="api-key-subtext">
              Use your own OpenAI API key instead of the shared one
            </span>
          </div>
          <Switch
            checked={useCustomKey}
            onChange={(checked) => setUseCustomKey(checked)}
            aria-label="Use Custom OpenAI Key Toggle"
          />
        </div>

        {/* API Key Input Box */}
        <div
          className="api-key-input-box"
          style={{ opacity: useCustomKey ? 1 : 0.6, transition: 'opacity 0.2s ease' }}
        >
          <span className="api-key-input-label">OpenAI API Key</span>
          <div className="api-key-input-wrapper">
            <input
              type={showApiKey ? 'text' : 'password'}
              className="api-key-input"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={!useCustomKey}
            />
            {useCustomKey && (
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? 'Hide API Key' : 'Show API Key'}
              >
                {showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            )}
          </div>
        </div>

        {/* Warning Alert Banner */}
        <div className="security-alert-box">
          <WarningOutlined className="security-alert-icon" />
          <div className="security-alert-content">
            <span className="security-alert-title">API keys are stored securely</span>
            <span className="security-alert-message">
              Your API key is encrypted and never exposed to the client-side code.
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Rate Limiting Section ── */}
      <div className="security-section">
        <h3 className="security-section-title" style={{ marginBottom: 12 }}>
          Rate Limiting
        </h3>
        <p className="security-section-desc">
          Configure maximum allowed messages per session and session limits per IP
        </p>

        <div className="rate-limit-grid">
          {/* Max Messages Per Session */}
          <div className="rate-limit-box">
            <label htmlFor="max-messages-input" className="rate-limit-label">
              Max Messages Per Session
            </label>
            <input
              id="max-messages-input"
              type="number"
              className="rate-limit-input"
              value={maxMessagesPerSession}
              min={1}
              max={1000}
              onChange={(e) => setMaxMessagesPerSession(Number(e.target.value))}
            />
          </div>

          {/* Max Sessions Per IP (24h) */}
          <div className="rate-limit-box">
            <label htmlFor="max-sessions-input" className="rate-limit-label">
              Max Sessions Per IP (24h)
            </label>
            <input
              id="max-sessions-input"
              type="number"
              className="rate-limit-input"
              value={maxSessionsPerIP}
              min={1}
              max={500}
              onChange={(e) => setMaxSessionsPerIP(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Save Button ── */}
      <div className="security-save-row">
        <button type="button" className="security-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
