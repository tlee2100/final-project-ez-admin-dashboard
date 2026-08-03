'use client';

import { useState } from 'react';
import { useList, useOne, useInvalidate } from '@refinedev/core';
import { Table, Button, Select, Spin, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { apiRequest } from '@/src/lib/api.client';

interface AgentManagementPanelProps {
  siteId: string | null;
  siteName?: string;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Shared agent assign/remove UI + logic. Rendered inside AgentDrawer (sites
 * list) and inside the Agent Management tab (site detail). Inline styles keep
 * it self-contained so it works under both routes' CSS scopes.
 */
export function AgentManagementPanel({ siteId, siteName }: AgentManagementPanelProps) {
  const invalidate = useInvalidate();
  const { isSuperAdmin, isAdmin } = useCurrentRole();

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  const canManage = isSuperAdmin || isAdmin;

  // 1. Fetch all users from backend
  const { query: usersQuery } = useList({
    resource: 'users',
    pagination: { mode: 'server', currentPage: 1, pageSize: 1000 },
    queryOptions: {
      enabled: !!siteId && canManage,
    },
  });

  const allUsers = (usersQuery.data?.data as unknown as UserRecord[]) || [];
  const allAgents = allUsers.filter((u) => String(u.role).toLowerCase() === 'agent');

  // 2. Fetch current site details to get assigned agents
  const { query: siteQuery } = useOne({
    resource: 'sites',
    id: siteId || '',
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const isSiteLoading = siteQuery.isLoading;
  const assignedAgents = (siteQuery.data?.data?.agents as unknown as UserRecord[]) || [];

  // Filter out agents that are already assigned to this site
  const availableAgents = allAgents.filter(
    (agent) => !assignedAgents.some((assigned) => assigned.id === agent.id),
  );

  const filteredAgents = availableAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 3. Handle assign agents (save)
  const handleAssignAgents = async () => {
    if (!siteId || selectedAgentIds.length === 0) return;
    setIsMutating(true);

    try {
      const assignPromises = selectedAgentIds.map((agentId) =>
        apiRequest(`/sites/${siteId}/agents`, {
          method: 'POST',
          body: JSON.stringify({ agentId }),
        }),
      );

      await Promise.all(assignPromises);

      setSelectedAgentIds([]);
      setSearchTerm('');
      message.success('Agent assigned successfully!');

      invalidate({
        resource: 'sites',
        invalidates: ['detail', 'list'],
        id: siteId,
      });
    } catch (error) {
      console.error(error);
      message.error('An error occurred while assigning the agent.');
    } finally {
      setIsMutating(false);
    }
  };

  // 4. Handle remove agent
  const handleRemoveAgent = async (agentId: string) => {
    if (!siteId) return;
    setIsMutating(true);
    try {
      await apiRequest(`/sites/${siteId}/agents/${agentId}`, {
        method: 'DELETE',
      });

      message.success('Agent removed successfully!');

      invalidate({
        resource: 'sites',
        invalidates: ['detail', 'list'],
        id: siteId,
      });
    } catch (error) {
      console.error(error);
      message.error('An error occurred while removing the agent.');
    } finally {
      setIsMutating(false);
    }
  };

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
            onConfirm={() => handleRemoveAgent(record.id)}
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
              notFoundContent={usersQuery.isLoading ? <Spin size="small" /> : 'No agents found'}
              options={filteredAgents.map((agent) => ({
                label: `${agent.name} (${agent.email})`,
                value: agent.id,
              }))}
              disabled={isMutating}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAssignAgents}
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
