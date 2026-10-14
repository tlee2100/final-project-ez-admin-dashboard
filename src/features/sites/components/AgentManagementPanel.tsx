'use client';

import { Table, Button, Select, Spin, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSiteAgents, type UserRecord } from '@/src/features/sites/hooks/useSiteAgents';

interface AgentManagementPanelProps {
  siteId: string | null;
  siteName?: string;
}

/**
 * Shared agent assign/remove UI + logic. Rendered inside AgentDrawer (sites
 * list) and inside the Agent Management tab (site detail).
 */
export function AgentManagementPanel({ siteId, siteName }: AgentManagementPanelProps) {
  const {
    canManage,
    assignedAgents,
    filteredAgents,
    selectedAgentIds,
    setSelectedAgentIds,
    setSearchTerm,
    isSiteLoading,
    isUsersLoading,
    isMutating,
    assignAgents,
    removeAgent,
  } = useSiteAgents(siteId);

  const columns = [
    {
      title: 'Agent Info',
      key: 'info',
      render: (_: unknown, record: UserRecord) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: '#111827' }}>{record.name}</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{record.email}</span>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 70,
      align: 'right' as const,
      render: (_: unknown, record: UserRecord) =>
        canManage && (
          <Popconfirm
            title="Remove Agent"
            description={`Are you sure you want to remove ${record.name} from this site?`}
            onConfirm={() => removeAgent(record.id)}
            okText="Remove"
            cancelText="Cancel"
            placement="topRight"
            disabled={isMutating}
          >
            <Button type="text" danger icon={<DeleteOutlined />} disabled={isMutating} />
          </Popconfirm>
        ),
    },
  ];

  return (
    <div style={{ marginBottom: '8px' }}>
      <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#4b5563' }}>
        Assign agents responsible for consulting on website:{' '}
        <strong style={{ color: '#111827' }}>{siteName}</strong>
      </p>

      {canManage && (
        <div
          style={{
            padding: '16px',
            border: '1px solid #f3f4f6',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '13.5px', fontWeight: 600, margin: '0 0 12px 0' }}>
            Add Agents to Site
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Select
              mode="multiple"
              placeholder="Search & select agents..."
              style={{ width: '100%' }}
              value={selectedAgentIds}
              onChange={(values) => setSelectedAgentIds(values)}
              filterOption={false}
              onSearch={(val) => setSearchTerm(val)}
              notFoundContent={isUsersLoading ? <Spin size="small" /> : 'No agents found'}
              options={filteredAgents.map((agent) => ({
                label: `${agent.name} (${agent.email})`,
                value: agent.id,
              }))}
              disabled={isMutating}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={assignAgents}
              loading={isMutating}
              disabled={selectedAgentIds.length === 0}
              style={{ width: '100%' }}
            >
              Add Selected Agents
            </Button>
          </div>
        </div>
      )}

      <div>
        <h3
          style={{
            fontSize: '13.5px',
            fontWeight: 600,
            margin: '0 0 12px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Assigned Agents</span>
          <Tag color="blue">{assignedAgents.length} assigned</Tag>
        </h3>

        <Table
          dataSource={assignedAgents}
          columns={columns}
          rowKey="id"
          size="middle"
          loading={isSiteLoading}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            size: 'small',
            hideOnSinglePage: true,
          }}
        />
      </div>
    </div>
  );
}
