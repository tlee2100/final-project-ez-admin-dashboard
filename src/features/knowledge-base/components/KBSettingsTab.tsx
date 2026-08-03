import React from 'react';
import type { KBSettings } from '../types/knowledge-base.types';

interface KBSettingsTabProps {
  settings: KBSettings;
  onUpdateSettings: (newSettings: Partial<KBSettings>) => void;
}

export function KBSettingsTab({ settings, onUpdateSettings }: KBSettingsTabProps) {
  return (
    <div className="kb-settings-container">
      {/* Page Title */}
      <h2 className="kb-settings-main-title">Knowledge Base Settings</h2>

      {/* ── Section 1: Chunking Settings ── */}
      <div className="kb-settings-section">
        <h3 className="kb-settings-section-title">Chunking Settings</h3>

        <div className="kb-settings-grid">
          {/* Chunk Size */}
          <div className="kb-setting-field">
            <label className="kb-setting-label">Chunk Size (tokens)</label>
            <input
              type="number"
              className="kb-setting-input"
              value={settings.chunkSize}
              onChange={(e) => onUpdateSettings({ chunkSize: parseInt(e.target.value) || 1000 })}
            />
          </div>

          {/* Chunk Overlap */}
          <div className="kb-setting-field">
            <label className="kb-setting-label">Chunk Overlap (tokens)</label>
            <input
              type="number"
              className="kb-setting-input"
              value={settings.chunkOverlap}
              onChange={(e) => onUpdateSettings({ chunkOverlap: parseInt(e.target.value) || 200 })}
            />
          </div>
        </div>

        <p className="kb-settings-helper">
          Chunks are segments of text that are processed and embedded separately. Smaller chunks are
          more precise but may miss context. Larger chunks provide more context but use more tokens.
        </p>
      </div>

      {/* ── Section 2: Embedding Model ── */}
      <div className="kb-settings-section">
        <h3 className="kb-settings-section-title">Embedding Model</h3>

        <div className="kb-settings-grid">
          {/* Embedding Model */}
          <div className="kb-setting-field">
            <label className="kb-setting-label">Embedding Model</label>
            <select
              className="kb-setting-select"
              value={settings.embeddingModel}
              onChange={(e) => onUpdateSettings({ embeddingModel: e.target.value })}
            >
              <option value="text-embedding-3-large">text-embedding-3-large</option>
              <option value="text-embedding-3-small">text-embedding-3-small</option>
              <option value="text-embedding-ada-002">text-embedding-ada-002</option>
            </select>
          </div>

          {/* Vector Dimensions */}
          <div className="kb-setting-field">
            <label className="kb-setting-label">Vector Dimensions</label>
            <input
              type="number"
              className="kb-setting-input"
              readOnly
              value={settings.embeddingModel.includes('small') ? 1536 : 1536}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Retrieval Settings ── */}
      <div className="kb-settings-section">
        <h3 className="kb-settings-section-title">Retrieval Settings</h3>

        <div className="kb-settings-grid">
          {/* Top K Results */}
          <div className="kb-setting-field">
            <label className="kb-setting-label">Top K Results</label>
            <input
              type="number"
              className="kb-setting-input"
              value={settings.topKResults}
              onChange={(e) => onUpdateSettings({ topKResults: parseInt(e.target.value) || 5 })}
            />
          </div>

          {/* Similarity Threshold */}
          <div className="kb-setting-field">
            <label className="kb-setting-label">Similarity Threshold</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1.0"
              className="kb-setting-input"
              value={settings.similarityThreshold}
              onChange={(e) =>
                onUpdateSettings({ similarityThreshold: parseFloat(e.target.value) })
              }
            />
          </div>
        </div>

        <p className="kb-settings-helper">
          These settings control how many similar chunks are retrieved from the KB when answering a
          question, and the minimum similarity score required.
        </p>
      </div>

      {/* Footer Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
        <button
          className="kb-btn-primary"
          onClick={() => alert('Knowledge Base settings saved successfully!')}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
