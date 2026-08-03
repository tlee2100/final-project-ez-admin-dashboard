'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, App } from 'antd';
import type { Organization } from '../types/organization.types';

interface EditOrgModalProps {
  organization: Organization | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, values: { name: string; slug?: string; notes?: string }) => Promise<void>;
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

export function EditOrgModal({ organization, open, onClose, onSubmit }: EditOrgModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (organization) {
      form.setFieldsValue({
        name: organization.name,
        slug: organization.slug,
        notes: organization.notes,
      });
    }
  }, [organization, form]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!isSlugTouched) {
      form.setFieldsValue({ slug: slugify(newName) });
    }
  };

  const handleSlugChange = () => {
    setIsSlugTouched(true);
  };

  const handleModalClose = () => {
    setIsSlugTouched(false);
    onClose();
  };

  const handleFinish = async (values: { name: string; slug?: string; notes?: string }) => {
    if (!organization) return;
    setLoading(true);
    try {
      const finalSlug = values.slug ? values.slug.trim() : slugify(values.name);
      await onSubmit(organization.id, {
        ...values,
        slug: finalSlug,
      });
      message.success('Organization updated successfully!');
      handleModalClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update organization';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Organization Details"
      open={open && Boolean(organization)}
      onCancel={handleModalClose}
      footer={null}
      width={500}
      className="edit-org-modal"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label={<span style={{ fontWeight: 500 }}>Organization Name</span>}
          rules={[{ required: true, message: 'Please enter organization name' }]}
        >
          <Input
            placeholder="Organization name"
            size="large"
            onChange={handleNameChange}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="slug"
          label={<span style={{ fontWeight: 500 }}>Slug</span>}
          extra="URL-safe identifier for the tenant"
          rules={[
            { required: true, message: 'Please enter slug' },
            {
              pattern: /^[a-z0-9-]+$/,
              message: 'Slug may only contain lowercase letters, numbers, and hyphens',
            },
          ]}
        >
          <Input
            placeholder="e.g. zodinet"
            size="large"
            onChange={handleSlugChange}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label={<span style={{ fontWeight: 500 }}>Notes / Description</span>}
        >
          <Input.TextArea
            placeholder="Internal notes or description"
            rows={4}
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Button onClick={onClose} size="large" disabled={loading} style={{ borderRadius: 8 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            style={{ borderRadius: 8, background: '#2563eb' }}
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
