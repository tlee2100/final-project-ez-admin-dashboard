'use client';

import { Drawer } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { AgentManagementPanel } from './AgentManagementPanel';

interface AgentDrawerProps {
  siteId: string | null;
  siteName?: string;
  onClose: () => void;
}

/**
 * Thin drawer shell around the shared AgentManagementPanel. The assign/remove
 * logic lives in AgentManagementPanel so the site-detail "Agent Management"
 * tab can reuse it.
 */
export function AgentDrawer({ siteId, siteName, onClose }: AgentDrawerProps) {
  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TeamOutlined style={{ fontSize: '18px' }} />
          <span>Agent Management</span>
        </div>
      }
      placement="right"
      width={420}
      onClose={onClose}
      open={!!siteId}
      destroyOnHidden
    >
      <AgentManagementPanel siteId={siteId} siteName={siteName} />
    </Drawer>
  );
}
