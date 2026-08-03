'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useCreate, useDelete, useInvalidate, useUpdate } from '@refinedev/core';
import type { HttpError } from '@refinedev/core';
import { useTable } from '@refinedev/antd';
import {
  App,
  Avatar,
  AutoComplete,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  UserOutlined,
  CheckOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { apiRequest } from '@/src/lib/api.client';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import '@/src/features/dashboard/components/dashboard.css';

type UserRoleApi = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT';
type UserGender = 'male' | 'female' | 'other';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRoleApi;
  gender: UserGender | null;
  dateOfBirth: string | null;
  phone: string | null;
  avatarUrl: string | null;
  organizationId?: string | null;
  initialPassword?: string;
}

interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
}

interface UserFormValues {
  email?: string;
  name: string;
  role?: UserRoleApi;
  organizationId?: string;
  gender?: UserGender;
  dateOfBirth?: string;
  phone?: string;
  avatar?: UploadFile[];
}

const roleColor: Record<UserRoleApi, string> = {
  SUPER_ADMIN: 'purple',
  ADMIN: 'blue',
  AGENT: 'orange',
};

function toFormData(values: UserFormValues) {
  const data = new FormData();
  ['name', 'gender', 'dateOfBirth', 'phone'].forEach((key) => {
    const value = values[key as keyof UserFormValues];
    if (typeof value === 'string' && value.trim()) data.append(key, value.trim());
  });
  const file = values.avatar?.[0]?.originFileObj;
  if (file) data.append('avatar', file);
  return data;
}

export default function UsersPage() {
  const { message } = App.useApp();
  const invalidate = useInvalidate();
  const { isSuperAdmin, isAdmin, user: currentUser } = useCurrentRole();
  const canManage = isSuperAdmin || isAdmin;

  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCloseCreate = () => {
    setCreateOpen(false);
    createForm.resetFields();
    setCreatedPassword(null);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword);
      setCopied(true);
      message.success('Password copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [createForm] = Form.useForm<UserFormValues>();
  const [editForm] = Form.useForm<UserFormValues>();

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    apiRequest<{ data: OrganizationRecord[] }>('/organizations?page=1&limit=100')
      .then((response) => setOrganizations(response.data ?? []))
      .catch(() => setOrganizations([]));
  }, [isSuperAdmin]);

  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.name,
        label: org.name,
      })),
    [organizations],
  );

  const resolveOrganizationId = (input?: string | null) => {
    const value = input?.trim();
    if (!value) return null;

    if (!isSuperAdmin) return currentUser?.organizationId ?? null;

    const org = organizations.find(
      (item) =>
        item.id.toLowerCase() === value.toLowerCase() ||
        item.name.toLowerCase() === value.toLowerCase() ||
        item.slug.toLowerCase() === value.toLowerCase(),
    );

    return org?.id ?? null;
  };

  const { tableProps, searchFormProps } = useTable<
    UserRecord,
    HttpError,
    { name?: string; email?: string; role?: UserRoleApi }
  >({
    resource: 'users',
    syncWithLocation: true,
    queryOptions: { enabled: canManage },
    pagination: { mode: 'server' },
    onSearch: (values) => {
      return [
        { field: 'name', operator: 'contains', value: values.name || undefined },
        { field: 'email', operator: 'contains', value: values.email || undefined },
        { field: 'role', operator: 'eq', value: values.role || undefined },
      ];
    },
  });

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const onSearchValuesChange = () => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchFormProps.form?.submit();
    }, 500);
  };
  const { mutation: createMutation } = useCreate<UserRecord>();
  const { mutation: updateMutation } = useUpdate<UserRecord, HttpError, FormData>();
  const { mutation: deleteMutation } = useDelete<UserRecord>();

  useEffect(() => {
    if (!editing) return;
    editForm.setFieldsValue({
      name: editing.name,
      gender: editing.gender ?? undefined,
      dateOfBirth: editing.dateOfBirth ?? undefined,
      phone: editing.phone ?? undefined,
      avatar: [],
    });
  }, [editForm, editing]);

  const refreshUsers = () => invalidate({ resource: 'users', invalidates: ['list'] });

  const createUser = (values: UserFormValues) => {
    const organizationId = resolveOrganizationId(
      isAdmin ? currentUser?.organizationId : values.organizationId,
    );
    if (!organizationId) {
      message.error('Please select a valid organization');
      return;
    }

    createMutation.mutate(
      {
        resource: 'users',
        values: {
          email: values.email,
          name: values.name,
          role: isAdmin ? 'AGENT' : values.role,
          organizationId,
          gender: values.gender,
        },
      },
      {
        onSuccess: ({ data }) => {
          refreshUsers();
          if (data.initialPassword) {
            setCreatedPassword(data.initialPassword);
          } else {
            message.success('User created');
            handleCloseCreate();
          }
        },
        onError: (error) => message.error(error.message),
      },
    );
  };

  const updateUser = (values: UserFormValues) => {
    if (!editing) return;
    updateMutation.mutate(
      { resource: 'users', id: editing.id, values: toFormData(values) },
      {
        onSuccess: () => {
          setEditing(null);
          refreshUsers();
          message.success('User updated');
        },
        onError: (error) => message.error(error.message),
      },
    );
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      sorter: true,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Avatar src={record.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      sorter: true,
      render: (value: UserRoleApi) => <Tag color={roleColor[value]}>{value}</Tag>,
    },
    { title: 'Gender', dataIndex: 'gender', render: (value: string | null) => value || '-' },
    { title: 'Phone', dataIndex: 'phone', render: (value: string | null) => value || '-' },
    {
      title: 'Actions',
      width: 120,
      render: (_: unknown, record: UserRecord) => {
        const isSelf = record.id === currentUser?.id;
        if (isSelf) return null; // Hide actions completely for the current user

        return (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setEditing(record)} />
            <Popconfirm
              title="Delete user?"
              onConfirm={() =>
                deleteMutation.mutate(
                  { resource: 'users', id: record.id },
                  {
                    onSuccess: () => {
                      refreshUsers();
                      message.success('User deleted');
                    },
                    onError: (error) => message.error(error.message),
                  },
                )
              }
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const userFields = (
    <>
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
        <Select
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </Form.Item>
      <Form.Item name="dateOfBirth" label="Date of birth">
        <Input type="date" />
      </Form.Item>
      <Form.Item name="phone" label="Phone">
        <Input />
      </Form.Item>
      <Form.Item
        name="avatar"
        label="Avatar"
        valuePropName="fileList"
        getValueFromEvent={(event: { fileList?: UploadFile[] } | UploadFile[]) =>
          Array.isArray(event) ? event : (event?.fileList ?? [])
        }
      >
        <Upload beforeUpload={() => false} maxCount={1} accept="image/*" listType="picture">
          <Button icon={<UploadOutlined />}>Choose image</Button>
        </Upload>
      </Form.Item>
    </>
  );

  const managementTab = canManage ? (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Form
        {...searchFormProps}
        layout="inline"
        onValuesChange={onSearchValuesChange}
        style={{ gap: 8, flexWrap: 'wrap' }}
      >
        <Form.Item name="name" style={{ margin: 0 }}>
          <Input placeholder="Search name" style={{ width: 220 }} allowClear />
        </Form.Item>
        <Form.Item name="email" style={{ margin: 0 }}>
          <Input placeholder="Search email" style={{ width: 240 }} allowClear />
        </Form.Item>
        <Form.Item name="role" style={{ margin: 0 }}>
          <Select
            allowClear
            placeholder="Role"
            style={{ width: 160 }}
            options={[
              { value: 'ADMIN', label: 'Admin', disabled: isAdmin },
              { value: 'AGENT', label: 'Agent' },
            ]}
          />
        </Form.Item>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <Button icon={<ReloadOutlined />} onClick={refreshUsers} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            New user
          </Button>
        </div>
      </Form>

      <Table<UserRecord>
        {...(tableProps as unknown as import('antd').TableProps<UserRecord>)}
        rowKey="id"
        columns={columns}
      />
    </Space>
  ) : null;

  return (
    <div className="dashboard-page page-fade-in">
      <div className="dashboard-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="dashboard-title">Users</h1>
          <p className="dashboard-subtitle">Manage users in your organization.</p>
        </div>
      </div>

      {managementTab}

      <Modal
        title={createdPassword ? 'User Created Successfully' : 'Create user'}
        open={createOpen}
        onCancel={handleCloseCreate}
        footer={null}
        width={500}
        destroyOnClose
      >
        {createdPassword && (
          <div style={{ padding: '12px 0' }}>
            <div style={{ color: '#374151', fontSize: 14, marginBottom: 16 }}>
              An initial password has been automatically generated for this user. Please copy and
              share it securely:
            </div>

            <div
              style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <code
                style={{ fontSize: 16, fontWeight: 600, color: '#111827', letterSpacing: '0.05em' }}
              >
                {createdPassword}
              </code>
              <Button
                type="text"
                icon={copied ? <CheckOutlined style={{ color: '#10b981' }} /> : <CopyOutlined />}
                onClick={copyToClipboard}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                onClick={handleCloseCreate}
                size="large"
                style={{ borderRadius: 8 }}
              >
                Done
              </Button>
            </div>
          </div>
        )}

        <Form
          form={createForm}
          layout="vertical"
          onFinish={createUser}
          initialValues={{
            role: isAdmin ? 'AGENT' : 'ADMIN',
            organizationId: currentUser?.organizationId ?? undefined,
            gender: 'other',
          }}
          style={{ marginTop: 20, display: createdPassword ? 'none' : 'block' }}
        >
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!isAdmin && (
            <>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'ADMIN', label: 'Admin' },
                    { value: 'AGENT', label: 'Agent' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="organizationId" label="Organization" rules={[{ required: true }]}>
                <AutoComplete
                  options={organizationOptions}
                  placeholder="Type or pick organization name"
                  filterOption={(inputValue, option) =>
                    String(option?.value ?? '')
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                  notFoundContent={organizations.length ? 'Type to search' : 'No organizations'}
                />
              </Form.Item>
            </>
          )}
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button onClick={handleCloseCreate} size="large" style={{ borderRadius: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
              size="large"
              style={{ borderRadius: 8, background: '#2563eb' }}
            >
              Create User
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Edit user"
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        forceRender
      >
        <Form form={editForm} layout="vertical" onFinish={updateUser}>
          {userFields}
        </Form>
      </Modal>
    </div>
  );
}
