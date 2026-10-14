'use client';

import { Button } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { Site } from '../../types/site.types';
import { getKbStatusMeta } from '../../types/site.types';

interface TabKnowledgeBaseProps {
  site: Site;
}

export function TabKnowledgeBase({ site }: TabKnowledgeBaseProps) {
  const router = useRouter();
  const kbStatus = getKbStatusMeta(site.knowledgeBaseStatus);

  return (
    <div className="kb-tab-container">
      {/* ── Header ── */}
      <div className="kb-tab-head">
        <h2 className="kb-tab-title">Knowledge Base</h2>
        <p className="kb-tab-desc">
          Manage the documents your chatbot uses to answer questions for this site.
        </p>
      </div>

      {/* ── Summary ── */}
      <div className="kb-tab-summary">
        <div className="kb-tab-summary-item">
          <span className="kb-tab-summary-label">Status</span>
          <span
            className={`site-detail-kb-badge ${kbStatus.variant}`}
            title="Knowledge Base status"
          >
            {kbStatus.label}
          </span>
        </div>
        <div className="kb-tab-summary-item">
          <span className="kb-tab-summary-label">Documents</span>
          <span className="kb-tab-summary-value">{site.kbDocuments}</span>
        </div>
      </div>

      {/* ── Action ── */}
      <Button
        type="primary"
        size="large"
        icon={<DatabaseOutlined />}
        onClick={() => router.push(`/sites/${site.id}/kb`)}
      >
        Manage Knowledge Base
      </Button>
    </div>
  );
}
