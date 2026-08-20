'use client';

import React, { useState } from 'react';
import { Switch, App, Select } from 'antd';
import { useUpdate } from '@refinedev/core';
import type { Site } from '../../types/site.types';

interface SubTabBehaviorProps {
  site: Site;
  onSave?: (updatedData: Partial<Site>) => void;
}

export function SubTabBehavior({ site, onSave }: SubTabBehaviorProps) {
  const { message } = App.useApp();
  const { mutate: updateSite } = useUpdate<Site>();

  // ── 1. Conversation Settings State ──
  const [useCurrentPageContent, setUseCurrentPageContent] = useState<boolean>(
    site.useCurrentPageContent ?? true,
  );
  const [sentimentDetection, setSentimentDetection] = useState<boolean>(
    site.sentimentDetection ?? false,
  );

  // ── 2. AI Model Settings State ──
  const [maxTokens, setMaxTokens] = useState<number>(site.maxTokensPerResponse ?? 1000);
  const [systemPrompt, setSystemPrompt] = useState<string>(site.systemPromptOverride || '');

  // Saving state
  const [saving, setSaving] = useState<boolean>(false);

  const handleSaveChanges = () => {
    setSaving(true);
    const updatedPayload: Partial<Site> = {
      useCurrentPageContent,
      sentimentDetection,
      maxTokensPerResponse: maxTokens,
      systemPromptOverride: systemPrompt.trim() === '' ? null : systemPrompt.trim(),
    };

    updateSite(
      {
        resource: 'sites',
        id: site.id,
        values: updatedPayload,
      },
      {
        onSuccess: () => {
          message.success('Behavior settings saved successfully.');
          setSaving(false);
          onSave?.(updatedPayload);
        },
        onError: () => {
          message.error('Failed to save behavior settings. Please try again.');
          setSaving(false);
        },
      },
    );
  };

  return (
    <div className="security-tab-container">
      {/* ── SECTION 1: Conversation Settings ── */}
      <div className="security-section">
        <h3 className="security-section-title">Conversation Settings</h3>
        <p className="security-section-desc">
          Configure how the AI interacts with the user during a session.
        </p>

        <div className="behavior-settings-row">
          <div className="behavior-setting-text">
            <span className="behavior-setting-label">Use Current Page Content</span>
            <span className="behavior-setting-desc">
              Include content from the current page in responses.
            </span>
          </div>
          <Switch
            checked={useCurrentPageContent}
            onChange={(checked) => setUseCurrentPageContent(checked)}
          />
        </div>

        <div className="behavior-settings-row">
          <div className="behavior-setting-text">
            <span className="behavior-setting-label">Sentiment Detection</span>
            <span className="behavior-setting-desc">
              Alert agents when negative sentiment is detected.
            </span>
          </div>
          <Switch
            checked={sentimentDetection}
            onChange={(checked) => setSentimentDetection(checked)}
          />
        </div>
      </div>

      <hr style={{ borderTop: '1px solid #e5e7eb', borderBottom: 'none', margin: 0 }} />

      {/* ── SECTION 2: AI Model Settings ── */}
      <div className="security-section">
        <h3 className="security-section-title">AI Model Settings</h3>
        <p className="security-section-desc">
          Configure the underlying language model and instructions.
        </p>

        <div className="behavior-model-grid">
          <div className="rate-limit-box">
            <span className="rate-limit-label">LLM Model</span>
            <Select
              value={site.llmModel || 'qwen3.7-flash'}
              disabled
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { value: 'qwen3.7-flash', label: 'qwen3.7-flash' },
                { value: 'gpt-4o', label: 'GPT-4o' },
              ]}
            />
          </div>

          <div className="rate-limit-box">
            <span className="rate-limit-label">Max Tokens Per Response</span>
            <input
              type="number"
              className="rate-limit-input"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              min={100}
              max={4000}
            />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div className="api-key-header-row">
            <div className="api-key-title-group">
              <span className="api-key-label">System Prompt</span>
              <span className="api-key-subtext">
                Override the default AI instructions for this site. Leave empty to use the system
                default.
              </span>
            </div>
          </div>
          <textarea
            className="system-prompt-textarea"
            placeholder="Enter a custom system prompt for this site..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>
      </div>

      <div className="security-save-row">
        <button className="security-save-btn" onClick={handleSaveChanges} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
