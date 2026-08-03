'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, App } from 'antd';
import { BankOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import type { Organization } from '../types/organization.types';

interface CreateAdminOwnerModalProps {
  organization: Organization | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (
    orgId: string,
    values: { name: string; email: string },
  ) => Promise<{ initialPassword?: string }>;
}

export function CreateAdminOwnerModal({
  organization,
  open,
  onCancel,
  onSubmit,
}: CreateAdminOwnerModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { message } = App.useApp();

  const handleFinish = async (values: { name: string; email: string }) => {
    if (!organization) return;
    setLoading(true);
    try {
      const res = await onSubmit(organization.id, values);
      if (res.initialPassword) {
        setCreatedPassword(res.initialPassword);
      } else {
        message.success('Admin Owner created successfully!');
        handleClose();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create Admin Owner';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setCreatedPassword(null);
    setCopied(false);
    onCancel();
  };

  const copyToClipboard = () => {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword);
      setCopied(true);
      message.success('Password copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      title={createdPassword ? 'Admin Owner Created Successfully' : 'Create Admin Owner'}
      open={open && Boolean(organization)}
      onCancel={handleClose}
      footer={null}
      width={500}
      className="create-admin-owner-modal"
      destroyOnHidden
    >
      {createdPassword && (
        <div style={{ padding: '12px 0' }}>
          <div style={{ color: '#374151', fontSize: 14, marginBottom: 16 }}>
            An initial password has been automatically generated for this Admin Owner. Please copy
            and share it securely:
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
            <Button type="primary" onClick={handleClose} size="large" style={{ borderRadius: 8 }}>
              Done
            </Button>
          </div>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 20, display: createdPassword ? 'none' : 'block' }}
      >
        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
          For organization &quot;{organization?.name}&quot;
        </div>

        {/* Org Info Banner */}
        <div className="org-info-banner">
          <div className="org-info-icon">
            <BankOutlined />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
              {organization?.name}
            </span>
            <span style={{ color: '#6b7280', fontSize: 12 }}>
              Current owners: {organization?.ownersCount || (organization?.ownerId ? 1 : 0)} ·
              Primary: {organization?.adminOwner?.email || 'None'}
            </span>
          </div>
        </div>

        <Form.Item
          name="name"
          label={<span style={{ fontWeight: 500 }}>Full name</span>}
          rules={[{ required: true, message: 'Please enter full name' }]}
          style={{ marginTop: 16 }}
        >
          <Input placeholder="Admin Owner name" size="large" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 500 }}>Email</span>}
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="admin@company.com" size="large" style={{ borderRadius: 8 }} />
        </Form.Item>

        <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 24 }}>
          Role assigned: <strong style={{ color: '#374151' }}>Admin Owner</strong> — full org admin,
          can invite Agents only.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={handleClose} size="large" style={{ borderRadius: 8 }} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            style={{ borderRadius: 8, background: '#2563eb' }}
          >
            Create Admin Owner
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
