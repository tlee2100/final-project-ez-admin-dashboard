import React from 'react';
import { Table, Tag, Avatar, Button, Dropdown } from 'antd';
import {
  MoreOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type {
  Organization,
  OrganizationSortField,
  OrganizationStatus,
} from '../types/organization.types';
import type { ColumnsType } from 'antd/es/table';

interface OrganizationsTableProps {
  organizations: Organization[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
  sortKey: OrganizationSortField;
  sortOrder: 'asc' | 'desc';
  onPageChange: (page: number, pageSize: number) => void;
  onSortChange: (sortKey: OrganizationSortField, sortOrder: 'asc' | 'desc') => void;
  onViewDetails: (org: Organization) => void;
  onEditOrg?: (org: Organization) => void;
  onCreateOwner?: (org: Organization) => void;
  onToggleStatus: (org: Organization) => void;
  onDelete?: (org: Organization) => void;
}

export function OrganizationsTable({
  organizations,
  isLoading,
  page,
  pageSize,
  total,
  sortKey,
  sortOrder,
  onPageChange,
  onSortChange,
  onViewDetails,
  onEditOrg,
  onToggleStatus,
  onDelete,
}: OrganizationsTableProps) {
  const getStatusColor = (status: OrganizationStatus) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Trial':
        return 'warning';
      case 'Suspended':
        return 'error';
      case 'Inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<Organization> = [
    {
      title: 'ORGANIZATION',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: sortKey === 'name' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string, record: Organization) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500, color: '#111827' }}>{text}</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{record.slug}</span>
        </div>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrganizationStatus) => (
        <Tag
          color={getStatusColor(status)}
          style={{ borderRadius: 12, padding: '2px 10px', margin: 0, fontWeight: 500 }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'ADMIN OWNER',
      dataIndex: 'adminOwner',
      key: 'adminOwner',
      render: (owner: Organization['adminOwner']) => (
        <div className="org-owner-cell">
          <Avatar size={32} src={owner.avatar} icon={!owner.avatar && <UserOutlined />}>
            {!owner.avatar && owner.initials}
          </Avatar>
          <div className="org-owner-info">
            <span className="org-owner-name">{owner.name}</span>
            <span className="org-owner-email">{owner.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'SITES',
      dataIndex: 'sitesCount',
      key: 'sitesCount',
    },
    {
      title: 'CREATED',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      sortOrder: sortKey === 'createdAt' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Organization) => {
        const isSuspended = record.status === 'Suspended';

        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: 'View details',
                  icon: <EyeOutlined />,
                  onClick: () => onViewDetails(record),
                },
                {
                  key: 'edit',
                  label: 'Edit Organization',
                  icon: <EditOutlined />,
                  onClick: () => onEditOrg && onEditOrg(record),
                },
                {
                  key: 'toggle-status',
                  label: isSuspended ? 'Reactivate' : 'Suspend',
                  icon: isSuspended ? <PlayCircleOutlined /> : <PauseCircleOutlined />,
                  danger: !isSuspended,
                  style: isSuspended ? { color: '#10b981' } : { color: '#f43f5e' },
                  onClick: () => onToggleStatus(record),
                },
                ...(onDelete
                  ? [
                      {
                        type: 'divider' as const,
                      },
                      {
                        key: 'delete',
                        label: 'Delete Organization',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => onDelete(record),
                      },
                    ]
                  : []),
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="org-table">
      <Table
        dataSource={organizations}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          onChange: (p, ps) => onPageChange(p, ps),
          showTotal: (t) => `Total ${t} organizations`,
        }}
        onChange={(_pagination, _filters, sorter) => {
          const s = Array.isArray(sorter) ? sorter[0] : sorter;
          if (s && 'order' in s && s.order) {
            const field =
              typeof s.field === 'string' ? (s.field as OrganizationSortField) : 'createdAt';
            onSortChange(field, s.order === 'ascend' ? 'asc' : 'desc');
          } else {
            onSortChange('createdAt', 'desc');
          }
        }}
      />
    </div>
  );
}
