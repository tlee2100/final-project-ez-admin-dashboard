'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Button, App } from 'antd';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { useSitesData } from '@/src/features/sites/hooks/useSitesData';
import { SitesSearchBar } from '@/src/features/sites/components/SitesSearchBar';
import { SitesFilterBar } from '@/src/features/sites/components/SitesFilterBar';
import { SiteGrid } from '@/src/features/sites/components/SiteGrid';
import { AgentDrawer } from '@/src/features/sites/components/AgentDrawer';
import type { Site } from '@/src/features/sites/types/site.types';
import '@/src/features/sites/components/sites.css';
import '@/src/features/dashboard/components/dashboard.css';

export default function SitesPage() {
  const { currentRole, isSuperAdmin, isAdmin } = useCurrentRole();
  const { filter, updateFilter, filteredSites, toggleSiteEnabled, deleteSite, updateSiteData } =
    useSitesData();

  const { message } = App.useApp();

  const canManage = isSuperAdmin || isAdmin;
  const isAgent = currentRole === 'agent';

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [form] = Form.useForm();

  // Drawer State
  const [assignAgentSiteId, setAssignAgentSiteId] = useState<string | null>(null);
  const [assignAgentSiteName, setAssignAgentSiteName] = useState<string>('');

  const handleAssignAgentClick = (siteId: string, siteName: string) => {
    setAssignAgentSiteId(siteId);
    setAssignAgentSiteName(siteName);
  };

  const handleAssignAgentClose = () => {
    setAssignAgentSiteId(null);
    setAssignAgentSiteName('');
  };

  // Reset form values when editingSite changes
  useEffect(() => {
    if (editingSite) {
      form.setFieldsValue({
        name: editingSite.name,
        url: editingSite.url,
      });
    } else {
      form.resetFields();
    }
  }, [editingSite, form]);

  const handleEditClick = (site: Site) => {
    setEditingSite(site);
    setIsEditModalOpen(true);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditingSite(null);
  };

  const handleEditSubmit = async (values: { name: string; url: string }) => {
    if (!editingSite) return;
    try {
      updateSiteData(editingSite.id, values);
      message.success('Site updated successfully!');
      setIsEditModalOpen(false);
      setEditingSite(null);
    } catch {
      message.error('Failed to update site!');
    }
  };

  const handleDelete = (siteId: string) => {
    try {
      deleteSite(siteId);
      message.success('Site deleted successfully!');
    } catch {
      message.error('Failed to delete site!');
    }
  };

  const pageSubtitle = canManage
    ? 'Manage your chatbot installations'
    : 'View assigned sites (read-only for your role)';

  return (
    <div className="sites-page page-fade-in">
      {/* ── Page Header ── */}
      <div className="sites-header">
        <div className="sites-header-left">
          <h1 className="sites-title">Sites</h1>
          <p className="sites-subtitle">{pageSubtitle}</p>
          {isAgent && (
            <span className="sites-agent-badge">
              <ExclamationCircleOutlined style={{ fontSize: 11 }} />
              Agent: limited site access
            </span>
          )}
        </div>

        {canManage && (
          <Link href="/sites/new" id="add-new-site-btn" className="btn-primary">
            <PlusOutlined />
            Add New Site
          </Link>
        )}
      </div>

      {/* ── Controls: Search + Filter + Sort ── */}
      <div className="sites-controls">
        <SitesSearchBar value={filter.search} onChange={(search) => updateFilter({ search })} />
        <SitesFilterBar
          filter={filter}
          onStatusChange={(status) => updateFilter({ status })}
          onSortChange={(sortKey, sortOrder) => updateFilter({ sortKey, sortOrder })}
        />
      </div>

      {/* ── Sites Grid ── */}
      <SiteGrid
        sites={filteredSites}
        canManage={canManage}
        onToggle={toggleSiteEnabled}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onAssignAgent={handleAssignAgentClick}
      />

      {/* ── Edit Site Modal ── */}
      <Modal
        title="Edit Site Settings"
        open={isEditModalOpen}
        onCancel={handleEditCancel}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Website Name"
            rules={[
              { required: true, message: 'Please enter the website name!' },
              { min: 3, message: 'Website name must be at least 3 characters!' },
            ]}
          >
            <Input placeholder="e.g. My E-commerce Site" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="url"
            label="Website URL"
            rules={[
              { required: true, message: 'Please enter the website URL!' },
              { type: 'url', message: 'Invalid URL format!' },
            ]}
          >
            <Input placeholder="e.g. https://my-site.com" />
          </Form.Item>

          <Form.Item
            style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 0 }}
          >
            <Button onClick={handleEditCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Agent Assignment Drawer ── */}
      <AgentDrawer
        siteId={assignAgentSiteId}
        siteName={assignAgentSiteName}
        onClose={handleAssignAgentClose}
      />
    </div>
  );
}
