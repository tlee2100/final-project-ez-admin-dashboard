import React, { useMemo, useState } from 'react';
import { Alert, Button, Spin, Input, InputNumber, Form } from 'antd';
import type { KBSettings } from '../types/knowledge-base.types';

interface KBSettingsTabProps {
  settings: KBSettings;
  canManage: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isBulkReindexing: boolean;
  onSave: (settings: KBSettings) => Promise<void>;
  onReindexAll: () => Promise<void>;
}

export function KBSettingsTab({
  settings,
  canManage,
  isLoading,
  isSaving,
  isBulkReindexing,
  onSave,
  onReindexAll,
}: KBSettingsTabProps) {
  const [draft, setDraft] = useState(settings);

  const validationError = useMemo(() => {
    if (!Number.isInteger(draft.chunkSize) || draft.chunkSize < 100 || draft.chunkSize > 2000) {
      return 'Chunk Size must be an integer between 100 and 2000.';
    }
    if (
      !Number.isInteger(draft.chunkOverlap) ||
      draft.chunkOverlap < 0 ||
      draft.chunkOverlap > 500 ||
      draft.chunkOverlap >= draft.chunkSize
    ) {
      return 'Chunk Overlap must be between 0 and 500 and smaller than Chunk Size.';
    }
    if (!Number.isInteger(draft.topKResults) || draft.topKResults < 1 || draft.topKResults > 20) {
      return 'Top K must be an integer between 1 and 20.';
    }
    if (
      !Number.isFinite(draft.similarityThreshold) ||
      draft.similarityThreshold < 0 ||
      draft.similarityThreshold > 1
    ) {
      return 'Similarity Threshold must be between 0 and 1.';
    }
    return null;
  }, [draft]);

  const setNumber = (field: keyof KBSettings, rawValue: string) => {
    const value = rawValue === '' ? Number.NaN : Number(rawValue);
    setDraft((current) => ({ ...current, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="kb-settings-container" style={{ textAlign: 'center', padding: 64 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="kb-settings-container">
      <h2 className="kb-settings-main-title">Knowledge Base Settings</h2>

      {!canManage && (
        <Alert type="info" showIcon message="Only administrators can change these settings." />
      )}

      {settings.outdatedDocumentsCount > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${settings.outdatedDocumentsCount} document(s) use older chunk settings`}
          description="Existing documents keep their current chunks until you re-index them. They remain available to the chatbot while re-indexing runs."
          action={
            canManage ? (
              <Button loading={isBulkReindexing} onClick={() => void onReindexAll()}>
                Re-index all
              </Button>
            ) : undefined
          }
          style={{ marginTop: 16 }}
        />
      )}

      <div className="kb-settings-section">
        <h3 className="kb-settings-section-title">Chunking Settings</h3>
        <div className="kb-settings-grid">
          <div className="kb-setting-field">
            <Form.Item label="Chunk Size (tokens)" style={{ marginBottom: 0 }} layout="vertical">
              <InputNumber
                min={100}
                max={2000}
                className="kb-setting-input"
                value={Number.isNaN(draft.chunkSize) ? undefined : draft.chunkSize}
                disabled={!canManage}
                onChange={(value) => setNumber('chunkSize', String(value ?? ''))}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
          <div className="kb-setting-field">
            <Form.Item label="Chunk Overlap (tokens)" style={{ marginBottom: 0 }} layout="vertical">
              <InputNumber
                min={0}
                max={500}
                className="kb-setting-input"
                value={Number.isNaN(draft.chunkOverlap) ? undefined : draft.chunkOverlap}
                disabled={!canManage}
                onChange={(value) => setNumber('chunkOverlap', String(value ?? ''))}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
        </div>
        <p className="kb-settings-helper">
          Chunk Size controls the maximum text per vector. Chunk Overlap repeats context between
          adjacent chunks. Changes apply automatically to new content; existing content requires
          re-indexing.
        </p>
      </div>

      <div className="kb-settings-section">
        <h3 className="kb-settings-section-title">Embedding Model</h3>
        <div className="kb-settings-grid">
          <div className="kb-setting-field disabled">
            <Form.Item label="Embedding Model" style={{ marginBottom: 0 }} layout="vertical">
              <Input className="kb-setting-input" value={draft.embeddingModel} readOnly disabled />
            </Form.Item>
          </div>
          <div className="kb-setting-field disabled">
            <Form.Item label="Vector Dimensions" style={{ marginBottom: 0 }} layout="vertical">
              <InputNumber
                className="kb-setting-input"
                readOnly
                disabled
                value={1536}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
        </div>
      </div>

      <div className="kb-settings-section">
        <h3 className="kb-settings-section-title">Retrieval Settings</h3>
        <div className="kb-settings-grid">
          <div className="kb-setting-field">
            <Form.Item label="Top K Results" style={{ marginBottom: 0 }} layout="vertical">
              <InputNumber
                min={1}
                max={20}
                className="kb-setting-input"
                value={Number.isNaN(draft.topKResults) ? undefined : draft.topKResults}
                disabled={!canManage}
                onChange={(value) => setNumber('topKResults', String(value ?? ''))}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
          <div className="kb-setting-field">
            <Form.Item label="Similarity Threshold" style={{ marginBottom: 0 }} layout="vertical">
              <InputNumber
                step={0.05}
                min={0}
                max={1}
                className="kb-setting-input"
                value={
                  Number.isNaN(draft.similarityThreshold) ? undefined : draft.similarityThreshold
                }
                disabled={!canManage}
                onChange={(value) => setNumber('similarityThreshold', String(value ?? ''))}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
        </div>
        <p className="kb-settings-helper">
          Top K limits how many matching chunks are returned. Similarity Threshold rejects chunks
          whose cosine similarity is below the selected score. These changes apply immediately.
        </p>
      </div>

      {validationError && <Alert type="error" showIcon message={validationError} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
        <Button
          type="primary"
          loading={isSaving}
          disabled={!canManage || Boolean(validationError)}
          onClick={() => void onSave(draft)}
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}
