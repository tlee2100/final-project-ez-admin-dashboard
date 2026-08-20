'use client';

import React, { useState } from 'react';
import { Switch, App, Popconfirm, Tag } from 'antd';
import { useUpdate } from '@refinedev/core';
import {
  WarningOutlined,
  CloseOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { Site } from '../../types/site.types';
import { apiRequest } from '@/src/lib/api.client';

interface SubTabSecurityProps {
  site: Site;
  onSave?: (updatedData: Partial<Site>) => void;
}

function sanitizeDomain(input: string): string {
  let clean = input.trim().toLowerCase();
  if (!clean) return '';

  // If input contains protocol, extract hostname
  if (clean.includes('://')) {
    try {
      clean = new URL(clean).hostname;
    } catch {
      clean = clean.replace(/^[a-zA-Z]+:\/\//, '');
      clean = clean.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
    }
  } else {
    // Strip trailing path, query params, hashes, and ports (e.g. 127.0.0.1:5500/path -> 127.0.0.1)
    clean = clean.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  }

  return clean.trim();
}

export function SubTabSecurity({ site, onSave }: SubTabSecurityProps) {
  const { message, modal } = App.useApp();
  const { mutate: updateSite } = useUpdate<Site>();

  // ── 1. Domain Restrictions State ──
  const [allowedDomains, setAllowedDomains] = useState<string[]>(() => {
    if (!site.allowedDomains || !Array.isArray(site.allowedDomains)) return [];
    return Array.from(new Set(site.allowedDomains.map(sanitizeDomain).filter(Boolean)));
  });
  const [newDomainInput, setNewDomainInput] = useState<string>('');

  // ── 2. API Key Management State (SEC-001 / CE-004 — BYOK) ──
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(
    site.hasCustomApiKey ?? site.useCustomOpenAiKey ?? false,
  );
  const [useCustomKey, setUseCustomKey] = useState<boolean>(site.useCustomOpenAiKey ?? false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [savingApiKey, setSavingApiKey] = useState<boolean>(false);
  const [removingApiKey, setRemovingApiKey] = useState<boolean>(false);

  // ── 3. Rate Limiting State ──
  const [maxMessagesPerSession, setMaxMessagesPerSession] = useState<number>(
    site.maxMessagesPerSession ?? 50,
  );
  const [maxSessionsPerIP, setMaxSessionsPerIP] = useState<number>(site.maxSessionsPerIp ?? 10);

  // Saving state (domain + rate limit)
  const [saving, setSaving] = useState<boolean>(false);

  // Handler: Add new domain
  const handleAddDomain = () => {
    const clean = sanitizeDomain(newDomainInput);
    if (!clean) {
      message.error('Please enter a valid domain or URL');
      return;
    }

    if (allowedDomains.includes(clean)) {
      message.warning('This domain is already in the allowed list');
      return;
    }

    setAllowedDomains((prev) => Array.from(new Set([...prev, clean])));
    setNewDomainInput('');
    message.success(`Added domain "${clean}"`);
  };

  // Handler: Remove domain tag
  const handleRemoveDomain = (indexToRemove: number, domainName: string) => {
    setAllowedDomains((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    message.success(`Removed domain "${domainName}"`);
  };

  // Handler: Keypress in domain input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
  };

  // Handler: Save domains + rate limit via Refine API
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

  // ── Handler: Save custom API key (BYOK) ──────────────────────────────────
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      message.error('Please enter your OpenAI API key before saving.');
      return;
    }

    setSavingApiKey(true);
    try {
      await apiRequest<{ useCustomOpenAiKey: boolean }>(`/sites/${site.id}/api-key`, {
        method: 'PUT',
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      setHasCustomKey(true);
      setUseCustomKey(true);
      setApiKeyInput('');
      message.success('Custom OpenAI key saved and encrypted successfully.');
    } catch (err) {
      message.error(`Failed to save API key: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingApiKey(false);
    }
  };

  // ── Handler: Remove custom API key ───────────────────────────────────────
  const handleRemoveApiKey = async () => {
    setRemovingApiKey(true);
    try {
      await apiRequest<{ useCustomOpenAiKey: boolean }>(`/sites/${site.id}/api-key`, {
        method: 'DELETE',
      });

      setHasCustomKey(false);
      setUseCustomKey(false);
      setApiKeyInput('');
      message.success('Custom key removed from database. Reverting to shared master key.');
    } catch (err) {
      message.error(
        `Failed to remove API key: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setRemovingApiKey(false);
    }
  };

  // Handler: Toggle Switch "Use Custom OpenAI Key" with confirmation popup
  const handleToggleSwitch = (checked: boolean) => {
    if (checked) {
      if (hasCustomKey) {
        modal.confirm({
          title: 'Activate Custom OpenAI Key?',
          content:
            'This site will switch to using its stored custom OpenAI API key for AI responses and chat conversations.',
          okText: 'Activate',
          cancelText: 'Cancel',
          okButtonProps: { style: { background: '#2563eb' } },
          onOk: () => {
            setUseCustomKey(true);
            updateSite(
              {
                resource: 'sites',
                id: site.id,
                values: { useCustomOpenAiKey: true },
              },
              {
                onSuccess: () => {
                  message.success('Custom OpenAI key activated for this site');
                },
                onError: (err) => {
                  message.error(err?.message || 'Failed to activate custom key');
                  setUseCustomKey(false);
                },
              },
            );
          },
        });
      } else {
        // No key saved yet — confirm intent to enter and save a new key
        modal.confirm({
          title: 'Use Custom OpenAI Key?',
          content:
            'Enable custom key mode to enter and use your own OpenAI API key instead of the shared master key. You will need to enter and save a valid API key.',
          okText: 'Continue',
          cancelText: 'Cancel',
          okButtonProps: { style: { background: '#2563eb' } },
          onOk: () => {
            setUseCustomKey(true);
          },
        });
      }
    } else {
      if (hasCustomKey) {
        modal.confirm({
          title: 'Switch to Shared Master Key?',
          content:
            'This site will switch to using the shared master key. Your saved custom key will remain safely stored in the database.',
          okText: 'Switch to Shared',
          cancelText: 'Cancel',
          onOk: () => {
            setUseCustomKey(false);
            setApiKeyInput('');
            updateSite(
              {
                resource: 'sites',
                id: site.id,
                values: { useCustomOpenAiKey: false },
              },
              {
                onSuccess: () => {
                  message.success(
                    'Switched to shared master key (saved custom key is kept in database).',
                  );
                },
                onError: (err) => {
                  message.error(err?.message || 'Failed to update custom key setting');
                  setUseCustomKey(true);
                },
              },
            );
          },
        });
      } else {
        setUseCustomKey(false);
        setApiKeyInput('');
      }
    }
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
          {allowedDomains.map((domain, index) => (
            <span key={`${domain}-${index}`} className="domain-tag">
              {domain}
              <Popconfirm
                title="Remove Domain"
                description={`Are you sure you want to remove "${domain}" from allowed domains?`}
                onConfirm={() => handleRemoveDomain(index, domain)}
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
            placeholder="Add a domain or URL (e.g. example.com, *.example.com, http://127.0.0.1:5500)"
            value={newDomainInput}
            onChange={(e) => setNewDomainInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="domain-add-btn" onClick={handleAddDomain}>
            Add
          </button>
        </div>
      </div>

      {/* ── 2. API Key Management Section (SEC-001 / CE-004 — BYOK) ── */}
      <div className="security-section">
        <h3 className="security-section-title" style={{ marginBottom: 16 }}>
          API Key Management
        </h3>

        {/* Current key status badge */}
        <div style={{ marginBottom: 16 }}>
          {useCustomKey && hasCustomKey ? (
            <Tag
              icon={<CheckCircleOutlined />}
              color="success"
              style={{ fontSize: 13, padding: '2px 10px' }}
            >
              Custom key active
            </Tag>
          ) : hasCustomKey ? (
            <Tag color="warning" style={{ fontSize: 13, padding: '2px 10px' }}>
              Using shared master key (Custom key paused)
            </Tag>
          ) : (
            <Tag color="default" style={{ fontSize: 13, padding: '2px 10px' }}>
              Using shared master key
            </Tag>
          )}
        </div>

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
            onChange={(checked) => handleToggleSwitch(checked)}
            aria-label="Use Custom OpenAI Key Toggle"
          />
        </div>

        {/* API Key Input Box */}
        <div
          className="api-key-input-box"
          style={{ opacity: useCustomKey ? 1 : 0.6, transition: 'opacity 0.2s ease' }}
        >
          <span className="api-key-input-label">
            {hasCustomKey
              ? 'Enter new OpenAI API Key (leave blank to keep current)'
              : 'OpenAI API Key'}
          </span>
          <div className="api-key-input-wrapper">
            <input
              type={showApiKey ? 'text' : 'password'}
              className="api-key-input"
              placeholder={
                hasCustomKey ? '(key securely stored — enter new key to overwrite)' : 'sk-proj-...'
              }
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
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

          {/* Save / Remove buttons — only visible when custom key is enabled */}
          {useCustomKey && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
              <button
                type="button"
                className="domain-add-btn"
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  background: '#3b82f6',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: savingApiKey ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease, transform 0.1s ease',
                }}
                onClick={() => void handleSaveApiKey()}
                disabled={savingApiKey}
              >
                {savingApiKey ? 'Saving…' : 'Save API Key'}
              </button>
              {hasCustomKey && (
                <Popconfirm
                  title="Remove Custom Key"
                  description="Are you sure? This will permanently delete the custom key from the database and revert this site to using the shared master key."
                  onConfirm={() => void handleRemoveApiKey()}
                  okText="Yes, remove"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <button
                    type="button"
                    style={{
                      height: 40,
                      padding: '0 20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      color: '#ef4444',
                      background: '#ffffff',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      cursor: removingApiKey ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!removingApiKey) {
                        e.currentTarget.style.background = '#fef2f2';
                        e.currentTarget.style.borderColor = '#f87171';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!removingApiKey) {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }
                    }}
                    disabled={removingApiKey}
                  >
                    <DeleteOutlined style={{ fontSize: 14 }} />
                    {removingApiKey ? 'Removing…' : 'Remove Key'}
                  </button>
                </Popconfirm>
              )}
            </div>
          )}
        </div>

        {/* Warning Alert Banner */}
        <div className="security-alert-box">
          <WarningOutlined className="security-alert-icon" />
          <div className="security-alert-content">
            <span className="security-alert-title">API keys are stored securely</span>
            <span className="security-alert-message">
              Your API key is AES-256-GCM encrypted before storage and never exposed to client-side
              code. The plaintext key is not retrievable after saving.
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

      {/* ── 4. Bottom Save Button (domains + rate limit) ── */}
      <div className="security-save-row">
        <button type="button" className="security-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
