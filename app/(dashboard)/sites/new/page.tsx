'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCreate } from '@refinedev/core';
import { Form, Input, Button, Card, App } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Site } from '@/src/features/sites/types/site.types';
import { AllowedDomainsInput } from '@/src/features/sites/components/AllowedDomainsInput';
import '@/src/features/sites/components/sites.css';

export default function NewSitePage() {
  const router = useRouter();
  const { mutation } = useCreate<Site>();
  const { mutate, isPending: isLoading } = mutation;
  const { message } = App.useApp();

  const handleFinish = (values: { name: string; url: string; allowedDomains?: string[] }) => {
    const cleanedDomains = values.allowedDomains
      ? values.allowedDomains.map((d) => d?.trim()).filter((d): d is string => Boolean(d))
      : [];

    mutate(
      {
        resource: 'sites',
        values: {
          ...values,
          allowedDomains: cleanedDomains,
        },
        successNotification: false,
        errorNotification: false,
      },
      {
        onSuccess: () => {
          message.success('New site created successfully!');
          router.push('/sites');
        },
        onError: (error: unknown) => {
          const err = error as { message?: string } | null;
          const detail = err?.message || 'An error occurred while creating the new site.';
          message.error(detail);
        },
      },
    );
  };

  return (
    <div className="sites-page page-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div className="sites-header" style={{ marginBottom: 20 }}>
        <div
          className="sites-header-left"
          style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row' }}
        >
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/sites')}
            style={{ fontSize: 16 }}
            aria-label="Back to sites list"
          />
          <div>
            <h1 className="sites-title" style={{ fontSize: 22 }}>
              Add New Site
            </h1>
            <p className="sites-subtitle">Configure a new chatbot integration</p>
          </div>
        </div>
      </div>

      {/* ── Form Card ── */}
      <Card
        bordered={false}
        className="site-form-card"
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <Form
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ name: '', url: '' }}
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label="Website Name"
            rules={[
              { required: true, message: 'Please enter the website name!' },
              { min: 3, message: 'Website name must be at least 3 characters!' },
            ]}
          >
            <Input placeholder="e.g. My Online Store" maxLength={50} size="large" />
          </Form.Item>

          <Form.Item
            name="url"
            label="Website URL"
            rules={[
              { required: true, message: 'Please enter the website URL!' },
              { type: 'url', message: 'Invalid URL format!' },
            ]}
          >
            <Input placeholder="e.g. https://my-store.com" size="large" />
          </Form.Item>

          <AllowedDomainsInput />

          <Form.Item
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginBottom: 0,
              marginTop: 24,
            }}
          >
            <Button
              size="large"
              onClick={() => router.push('/sites')}
              style={{ marginRight: 8 }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" size="large" loading={isLoading}>
              Create Site
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
