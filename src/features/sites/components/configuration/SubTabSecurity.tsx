'use client';

import React, { useState } from 'react';
import { Switch, App, Popconfirm, Tag, AutoComplete } from 'antd';
import { useUpdate } from '@refinedev/core';
import {
  WarningOutlined,
  CloseOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { Site } from '../../types/site.types';
import { apiRequest } from '@/src/lib/api.client';

interface SubTabSecurityProps {
  site: Site;
  onSave?: (updatedData: Partial<Site>) => void;
}

const MODEL_PRESETS = [
  { value: 'qwen3.7-flash', label: 'qwen3.7-flash (Qwen 3.7 Flash — Default)' },
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini (OpenAI — Fast & Cost-effective)' },
  { value: 'gpt-4o', label: 'gpt-4o (OpenAI — High Intelligence)' },
  { value: 'deepseek-chat', label: 'deepseek-chat (DeepSeek Official)' },
  { value: 'deepseek-reasoner', label: 'deepseek-reasoner (DeepSeek R1 Reasoning)' },
  { value: 'claude-3-5-sonnet', label: 'claude-3-5-sonnet (Anthropic Claude)' },
  { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash (Google Gemini)' },
];

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

  // ── 2. AI Provider & API Key State (BYOK) ──
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(
    site.hasCustomApiKey ?? site.useCustomOpenAiKey ?? false,
  );
  const [useCustomKey, setUseCustomKey] = useState<boolean>(site.useCustomOpenAiKey ?? false);
  const [customKeyStatus, setCustomKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>(
    site.customKeyStatus ?? 'unknown',
  );
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(site.customBaseUrl || '');
  const [llmModel, setLlmModel] = useState<string>(site.llmModel || 'qwen3.7-flash');
  const [keyMask, setKeyMask] = useState<string | null>(site.keyMask || null);

  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [savingApiKey, setSavingApiKey] = useState<boolean>(false);
  const [removingApiKey, setRemovingApiKey] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);

  const [testResult, setTestResult] = useState<{
    valid: boolean;
    latencyMs?: number;
    text: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  const [validationFeedback, setValidationFeedback] = useState<{
    type: 'checking' | 'success' | 'warning' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });

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

  // ── Handler: Test connection on-demand ──────────────────────────────────
  const handleTestConnection = async () => {
    if (!hasCustomKey && !apiKeyInput.trim()) {
      message.warning('Please enter an API key to test the connection.');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);
    setValidationFeedback({ type: null, text: '' });

    try {
      const res = await apiRequest<{
        valid: boolean;
        latencyMs: number;
        customKeyStatus: 'valid' | 'invalid' | 'unknown';
        endpointTested: string;
        warning?: string;
        error?: string;
      }>(`/sites/${site.id}/api-key/test`, {
        method: 'POST',
        body: JSON.stringify({
          apiKey: apiKeyInput.trim() || undefined,
          customBaseUrl: customBaseUrl.trim() || undefined,
          llmModel: llmModel.trim() || undefined,
        }),
      });

      if (res.valid) {
        setCustomKeyStatus('valid');
        setTestResult({
          valid: true,
          latencyMs: res.latencyMs,
          type: res.warning ? 'warning' : 'success',
          text: res.warning
            ? `${res.warning} (Latency: ${res.latencyMs}ms)`
            : `Connection verified successfully! Latency: ${res.latencyMs}ms (${res.endpointTested})`,
        });
        message.success(`Connection verified (${res.latencyMs}ms)`);
      } else {
        setCustomKeyStatus(res.customKeyStatus ?? 'invalid');
        setTestResult({
          valid: false,
          latencyMs: res.latencyMs,
          type: 'error',
          text: res.error || 'Connection test failed with provider endpoint.',
        });
        message.error(`Test failed: ${res.error || 'Connection error'}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTestResult({
        valid: false,
        type: 'error',
        text: errMsg,
      });
      message.error(`Connection test failed: ${errMsg}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // ── Handler: Save custom API key & AI provider settings (BYOK) ───────────
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim() && !hasCustomKey) {
      message.error('Please enter your API key before saving.');
      return;
    }

    setSavingApiKey(true);
    setTestResult(null);
    setValidationFeedback({
      type: 'checking',
      text: 'Verifying credentials with provider endpoint...',
    });

    try {
      // If no new key entered but already has a key, update model & customBaseUrl via site update
      if (!apiKeyInput.trim() && hasCustomKey) {
        updateSite(
          {
            resource: 'sites',
            id: site.id,
            values: {
              customBaseUrl: customBaseUrl.trim() || undefined,
              llmModel: llmModel.trim() || 'qwen3.7-flash',
            },
          },
          {
            onSuccess: () => {
              setSavingApiKey(false);
              setValidationFeedback({
                type: 'success',
                text: 'AI Provider settings (Base URL & Model) updated successfully.',
              });
              message.success('AI Provider settings updated successfully.');
              onSave?.({
                customBaseUrl: customBaseUrl.trim() || null,
                llmModel: llmModel.trim() || 'qwen3.7-flash',
              });
            },
            onError: (err) => {
              setSavingApiKey(false);
              const errMsg = err?.message || 'Failed to update settings';
              setValidationFeedback({
                type: 'error',
                text: errMsg,
              });
              message.error(errMsg);
            },
          },
        );
        return;
      }

      const res = await apiRequest<{
        useCustomOpenAiKey: boolean;
        customKeyStatus: 'unknown' | 'valid' | 'invalid';
        customBaseUrl?: string | null;
        keyMask?: string | null;
        llmModel?: string;
        warning?: string;
      }>(`/sites/${site.id}/api-key`, {
        method: 'PUT',
        body: JSON.stringify({
          apiKey: apiKeyInput.trim(),
          customBaseUrl: customBaseUrl.trim() || undefined,
          llmModel: llmModel.trim() || undefined,
        }),
      });

      setHasCustomKey(true);
      setUseCustomKey(true);
      setCustomKeyStatus(res.customKeyStatus ?? 'valid');
      if (res.keyMask) setKeyMask(res.keyMask);
      setApiKeyInput('');

      if (res.warning) {
        setValidationFeedback({
          type: 'warning',
          text: res.warning,
        });
        message.warning(res.warning);
      } else {
        setValidationFeedback({
          type: 'success',
          text: 'API credentials & model settings verified and saved successfully.',
        });
        message.success('Custom API credentials verified and saved successfully.');
      }

      onSave?.({
        useCustomOpenAiKey: true,
        hasCustomApiKey: true,
        customKeyStatus: res.customKeyStatus ?? 'valid',
        customBaseUrl: res.customBaseUrl ?? (customBaseUrl.trim() || null),
        keyMask: res.keyMask ?? keyMask,
        llmModel: res.llmModel ?? (llmModel.trim() || undefined),
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setValidationFeedback({
        type: 'error',
        text: errMsg,
      });
      message.error(`Failed to save settings: ${errMsg}`);
    } finally {
      setSavingApiKey(false);
    }
  };

  // ── Handler: Remove custom API key ───────────────────────────────────────
  const handleRemoveApiKey = async () => {
    setRemovingApiKey(true);
    setTestResult(null);
    setValidationFeedback({ type: null, text: '' });
    try {
      await apiRequest<{ useCustomOpenAiKey: boolean; customKeyStatus: 'unknown' }>(
        `/sites/${site.id}/api-key`,
        {
          method: 'DELETE',
        },
      );

      setHasCustomKey(false);
      setUseCustomKey(false);
      setCustomKeyStatus('unknown');
      setKeyMask(null);
      setCustomBaseUrl('');
      setApiKeyInput('');
      message.success('Custom key removed from database. Reverting to shared master key.');
      onSave?.({
        useCustomOpenAiKey: false,
        hasCustomApiKey: false,
        customKeyStatus: 'unknown',
        customBaseUrl: null,
        keyMask: null,
      });
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

      {/* ── 2. AI Model & API Key Management Section (BYOK) ── */}
      <div className="security-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h3 className="security-section-title" style={{ marginBottom: 4 }}>
              AI Model & Custom API Key (BYOK)
            </h3>
            <p className="security-section-desc" style={{ margin: 0 }}>
              Configure your own API Key, Provider Endpoint (Base URL), and LLM Model for this site
            </p>
          </div>

          {/* Current key status badge + Quick Test Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {useCustomKey && hasCustomKey ? (
              customKeyStatus === 'valid' ? (
                <Tag
                  icon={<CheckCircleOutlined />}
                  color="success"
                  style={{ fontSize: 13, padding: '2px 10px' }}
                >
                  Custom key active (Verified)
                </Tag>
              ) : customKeyStatus === 'invalid' ? (
                <Tag
                  icon={<CloseCircleOutlined />}
                  color="error"
                  style={{ fontSize: 13, padding: '2px 10px' }}
                >
                  Custom key failed (Fallback to shared master key)
                </Tag>
              ) : (
                <Tag
                  icon={<WarningOutlined />}
                  color="warning"
                  style={{ fontSize: 13, padding: '2px 10px' }}
                >
                  Custom key active (Unverified)
                </Tag>
              )
            ) : hasCustomKey ? (
              <Tag color="warning" style={{ fontSize: 13, padding: '2px 10px' }}>
                Using shared master key (Custom key paused)
              </Tag>
            ) : (
              <Tag color="default" style={{ fontSize: 13, padding: '2px 10px' }}>
                Using shared master key
              </Tag>
            )}

            {useCustomKey && (
              <button
                type="button"
                style={{
                  height: 28,
                  padding: '0 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: testingConnection ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => void handleTestConnection()}
                disabled={testingConnection || savingApiKey}
                title="Test connection to AI provider with current credentials"
              >
                {testingConnection ? <LoadingOutlined spin /> : <ApiOutlined />}
                {testingConnection ? 'Testing…' : 'Test Connection'}
              </button>
            )}
          </div>
        </div>

        {/* Toggle Switch Row */}
        <div className="api-key-header-row">
          <div className="api-key-title-group">
            <span className="api-key-label">Use Custom AI Provider & Key</span>
            <span className="api-key-subtext">
              Route this site&apos;s AI conversations through your own API Key &amp; Provider
              Endpoint
            </span>
          </div>
          <Switch
            checked={useCustomKey}
            onChange={(checked) => handleToggleSwitch(checked)}
            aria-label="Use Custom AI Provider Toggle"
          />
        </div>

        {/* API Key Input Box */}
        <div
          className="api-key-input-box"
          style={{ opacity: useCustomKey ? 1 : 0.6, transition: 'opacity 0.2s ease' }}
        >
          {/* Field 1: API Key */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span className="api-key-input-label" style={{ margin: 0 }}>
                {hasCustomKey ? 'API Key (leave blank to keep current)' : 'Custom API Key'}
              </span>
              {hasCustomKey && keyMask && (
                <span style={{ fontSize: 12, color: '#4b5563' }}>
                  Current key:{' '}
                  <Tag color="blue" style={{ fontFamily: 'monospace', margin: 0 }}>
                    {keyMask}
                  </Tag>
                </span>
              )}
            </div>
            <div className="api-key-input-wrapper">
              <input
                type={showApiKey ? 'text' : 'password'}
                className="api-key-input"
                placeholder={
                  hasCustomKey
                    ? '(key securely stored — enter new key to overwrite)'
                    : 'sk-proj-... or sk-...'
                }
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  if (validationFeedback.type) {
                    setValidationFeedback({ type: null, text: '' });
                  }
                  if (testResult) {
                    setTestResult(null);
                  }
                }}
                disabled={!useCustomKey || savingApiKey}
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

          {/* Field 2: Custom Base URL (Optional) */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 6 }}>
              <span className="api-key-input-label" style={{ margin: 0 }}>
                Provider Base URL{' '}
                <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span>
              </span>
            </div>
            <input
              type="text"
              className="domain-input-field"
              style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
              placeholder="Leave empty to use server default (e.g. https://api.openai.com/v1, https://api.ai-box.vn/v1)"
              value={customBaseUrl}
              onChange={(e) => setCustomBaseUrl(e.target.value)}
              disabled={!useCustomKey || savingApiKey}
            />
            <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4, display: 'block' }}>
              Compatible with OpenAI official (<code>https://api.openai.com/v1</code>), AI-Box (
              <code>https://api.ai-box.vn/v1</code>), Azure OpenAI, or self-hosted proxy.
            </span>
          </div>

          {/* Field 3: LLM Model Selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 6 }}>
              <span className="api-key-input-label" style={{ margin: 0 }}>
                LLM Model
              </span>
            </div>
            <AutoComplete
              value={llmModel}
              onChange={(value) => setLlmModel(value)}
              options={MODEL_PRESETS}
              placeholder="e.g. qwen3.7-flash, gpt-4o-mini, deepseek-chat..."
              style={{ width: '100%' }}
              disabled={!useCustomKey || savingApiKey}
              filterOption={(inputValue, option) =>
                (option?.value?.toUpperCase().indexOf(inputValue.toUpperCase()) ?? -1) !== -1 ||
                (typeof option?.label === 'string' &&
                  option.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1)
              }
            />
          </div>

          {/* Inline Validation / Verification Feedback */}
          {(validationFeedback.type || testResult) && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background:
                  testResult?.type === 'error' || validationFeedback.type === 'error'
                    ? '#fef2f2'
                    : testResult?.type === 'warning' || validationFeedback.type === 'warning'
                      ? '#fffbeb'
                      : '#f0fdf4',
                border:
                  testResult?.type === 'error' || validationFeedback.type === 'error'
                    ? '1px solid #fecaca'
                    : testResult?.type === 'warning' || validationFeedback.type === 'warning'
                      ? '1px solid #fde68a'
                      : '1px solid #bbf7d0',
              }}
            >
              {validationFeedback.type === 'checking' && (
                <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LoadingOutlined spin /> {validationFeedback.text}
                </span>
              )}
              {validationFeedback.type === 'success' && !testResult && (
                <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircleOutlined /> {validationFeedback.text}
                </span>
              )}
              {validationFeedback.type === 'warning' && !testResult && (
                <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WarningOutlined /> {validationFeedback.text}
                </span>
              )}
              {validationFeedback.type === 'error' && !testResult && (
                <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CloseCircleOutlined /> {validationFeedback.text}
                </span>
              )}
              {testResult && (
                <span
                  style={{
                    color:
                      testResult.type === 'error'
                        ? '#dc2626'
                        : testResult.type === 'warning'
                          ? '#d97706'
                          : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {testResult.type === 'error' ? (
                    <CloseCircleOutlined />
                  ) : testResult.type === 'warning' ? (
                    <WarningOutlined />
                  ) : (
                    <CheckCircleOutlined />
                  )}
                  {testResult.text}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons — only visible when custom key is enabled */}
          {useCustomKey && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 16,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="domain-add-btn"
                style={{
                  flex: 1,
                  minWidth: 180,
                  height: 40,
                  padding: '0 24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
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
                disabled={savingApiKey || testingConnection}
              >
                {savingApiKey && <LoadingOutlined spin />}
                {savingApiKey ? 'Verifying & Saving…' : 'Validate & Save Settings'}
              </button>

              <button
                type="button"
                style={{
                  height: 40,
                  padding: '0 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  color: '#2563eb',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: testingConnection ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => void handleTestConnection()}
                disabled={testingConnection || savingApiKey}
              >
                {testingConnection ? <LoadingOutlined spin /> : <ApiOutlined />}
                {testingConnection ? 'Testing…' : 'Test Connection'}
              </button>

              {hasCustomKey && (
                <Popconfirm
                  title="Remove Custom AI Credentials"
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
                      padding: '0 18px',
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
                    disabled={removingApiKey || savingApiKey || testingConnection}
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
            <span className="security-alert-title">
              API credentials are encrypted & securely isolated
            </span>
            <span className="security-alert-message">
              Your API key is verified against the provider endpoint before storage and encrypted
              with AES-256-GCM. It is never exposed in plaintext to client-side code.
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
