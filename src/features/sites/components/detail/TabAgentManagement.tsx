'use client';

import { AgentManagementPanel } from '../AgentManagementPanel';

interface TabAgentManagementProps {
  siteId: string;
  siteName?: string;
}

export function TabAgentManagement({ siteId, siteName }: TabAgentManagementProps) {
  return (
    <div className="agent-tab-container">
      {/* ── Header ── */}
      <div className="agent-tab-head">
        <h2 className="agent-tab-title">Agent Management</h2>
        <p className="agent-tab-desc">
          Assign or remove the agents responsible for handling conversations on this site.
        </p>
      </div>

      {/* ── Shared assign/remove panel (same logic as the Agent drawer) ── */}
      <AgentManagementPanel siteId={siteId} siteName={siteName} />
    </div>
  );
}
