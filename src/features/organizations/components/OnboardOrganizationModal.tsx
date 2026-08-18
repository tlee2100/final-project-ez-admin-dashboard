'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, App } from 'antd';
import { CopyOutlined, CheckOutlined, MailOutlined } from '@ant-design/icons';

interface OnboardOrganizationModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    name: string;
    slug: string;
    notes?: string;
    adminName: string;
    email: string;
  }) => Promise<{ initialPassword?: string; activationEmailQueued?: boolean }>;
  isSubmitting?: boolean;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');
}

export function OnboardOrganizationModal({
  open,
  onCancel,
  onSubmit,
  isSubmitting: externalSubmitting,
}: OnboardOrganizationModalProps) {
  const [form] = Form.useForm();
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [activationEmailSent, setActivationEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const { message } = App.useApp();

  const loading = externalSubmitting || internalLoading;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!isSlugTouched) {
      form.setFieldsValue({ slug: slugify(newName) });
    }
  };

  const handleSlugChange = () => {
    setIsSlugTouched(true);
  };

  const handleFinish = async (values: {
    name: string;
    slug: string;
    notes?: string;
    adminName: string;
    email: string;
  }) => {
    setInternalLoading(true);
    try {
      const finalSlug = values.slug ? values.slug.trim() : slugify(values.name);
      const res = await onSubmit({
        ...values,
        slug: finalSlug,
      });

      if (res.initialPassword) {
        setCreatedPassword(res.initialPassword);
      } else if (res.activationEmailQueued) {
        setActivationEmailSent(true);
      } else {
        message.success('Organization onboarded successfully!');
        handleClose();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to onboard organization';
      message.error(errorMsg);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setIsSlugTouched(false);
    setCreatedPassword(null);
    setActivationEmailSent(false);
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
      open={open}
      onCancel={handleClose}
      footer={null}
      className="onboard-tenant-modal"
      width={560}
      destroyOnHidden
    >
      {createdPassword && (
        <div style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px 0', color: '#111827' }}>
            Organization & Admin Owner Created!
          </h2>
          <p style={{ color: '#4b5563', fontSize: 14, marginBottom: 20 }}>
            An initial password has been generated for the new Admin Owner. Please copy and share it
            securely:
          </p>

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
              onClick={handleClose}
              size="large"
              style={{ borderRadius: 8, background: '#2563eb' }}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {activationEmailSent && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <MailOutlined style={{ fontSize: 48, color: '#2563eb', marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 12px 0', color: '#111827' }}>
            Organization Onboarded!
          </h2>
          <p style={{ color: '#4b5563', fontSize: 14, marginBottom: 24 }}>
            The organization was created successfully. An invitation email has been sent to the
            Admin Owner to activate their account.
          </p>
          <Button
            type="primary"
            onClick={handleClose}
            size="large"
            style={{ borderRadius: 8, background: '#2563eb' }}
          >
            Done
          </Button>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{
          display: createdPassword || activationEmailSent ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Fixed Header */}
        <div className="modal-header-container">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111827' }}>
            Onboard Organization
          </h2>
          <div style={{ color: '#6b7280', marginTop: 4, fontSize: 13 }}>
            Create a new tenant and its first Org Owner (Admin).
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="modal-body-scrollable">
          <div className="form-section-title" style={{ marginTop: 0 }}>
            Tenant details
          </div>

          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 500 }}>Organization name</span>}
            rules={[{ required: true, message: 'Please enter organization name' }]}
          >
            <Input
              placeholder="e.g. Glow Beauty Group"
              size="large"
              onChange={handleNameChange}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="slug"
            label={<span style={{ fontWeight: 500 }}>Slug</span>}
            extra="URL-safe identifier for the tenant"
            rules={[{ required: true, message: 'Please enter slug' }]}
          >
            <Input
              placeholder="auto-generated-from-name"
              size="large"
              onChange={handleSlugChange}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item name="notes" label={<span style={{ fontWeight: 500 }}>Notes (optional)</span>}>
            <Input.TextArea
              placeholder="Internal notes about this tenant"
              rows={3}
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div className="form-section-title">First Admin Owner</div>

          <Form.Item
            name="adminName"
            label={<span style={{ fontWeight: 500 }}>Full name</span>}
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Admin full name" size="large" style={{ borderRadius: 8 }} />
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

          <div className="tenant-trial-notice" style={{ marginTop: 12 }}>
            New tenants start in <strong>Active</strong>. The Admin Owner can manage sites and
            invite Agents, but cannot create other Admins or Super Admins.
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="modal-footer-container">
          <Button onClick={handleClose} size="large" disabled={loading} style={{ borderRadius: 8 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            style={{ borderRadius: 8, background: '#2563eb' }}
          >
            Onboard Tenant
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
