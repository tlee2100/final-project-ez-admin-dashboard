'use client';

import React, { useState } from 'react';
import { Button, Avatar, Tag, App } from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { useOrganizationsData } from '@/src/features/organizations/hooks/useOrganizationsData';
import { OrganizationsSearchBar } from '@/src/features/organizations/components/OrganizationsSearchBar';
import { OrganizationsFilterBar } from '@/src/features/organizations/components/OrganizationsFilterBar';
import { OrganizationsTable } from '@/src/features/organizations/components/OrganizationsTable';
import { OnboardOrganizationModal } from '@/src/features/organizations/components/OnboardOrganizationModal';
import { OrgDetailModal } from '@/src/features/organizations/components/OrgDetailModal';
import { CreateAdminOwnerModal } from '@/src/features/organizations/components/CreateAdminOwnerModal';
import { EditOrgModal } from '@/src/features/organizations/components/EditOrgModal';
import type {
  Organization,
  OrganizationStatus,
} from '@/src/features/organizations/types/organization.types';
import Link from 'next/link';

import '@/src/features/organizations/components/organizations.css';
import '@/src/features/dashboard/components/dashboard.css';

function OrganizationsContent() {
  const { currentRole, isSuperAdmin, isAdmin, user } = useCurrentRole();
  const { modal, message } = App.useApp();
  const {
    filter,
    updateFilter,
    organizations,
    total,
    page,
    pageSize,
    onPageChange,
    sortKey,
    sortOrder,
    onSortChange,
    stats,
    isLoading,
    onboardTenantWithAdminOwner,
    updateStatus,
    createAdminOwner,
    updateOrganizationDetails,
    deleteOrganization,
  } = useOrganizationsData();

  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedOrgForDetail, setSelectedOrgForDetail] = useState<Organization | null>(null);
  const [selectedOrgForCreateOwner, setSelectedOrgForCreateOwner] = useState<Organization | null>(
    null,
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState<Organization | null>(null);

  if (isAdmin) {
    const myOrg =
      organizations.find((o) => o.id === user?.organizationId || o.ownerId === user?.id) ||
      organizations[0];

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Active':
          return 'success';
        case 'Trial':
          return 'warning';
        case 'Suspended':
          return 'error';
        default:
          return 'default';
      }
    };

    const formattedCreatedDate = myOrg?.createdAt
      ? dayjs(myOrg.createdAt).isValid()
        ? dayjs(myOrg.createdAt).format('DD/MM/YYYY')
        : myOrg.createdAt
      : 'N/A';

    return (
      <div className="organizations-page page-fade-in">
        {/* Page Header */}
        <div className="organizations-header">
          <div className="organizations-header-left">
            <div className="organizations-title-container">
              <h1 className="organizations-title">My Organization</h1>
              <span
                style={{
                  background: '#e0e7ff',
                  color: '#3730a3',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Admin
              </span>
            </div>
            <p className="organizations-subtitle">
              Manage and view detailed information for your organization.
            </p>
          </div>

          {myOrg && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="large"
              onClick={() => setIsEditModalOpen(true)}
              style={{ borderRadius: 8, background: '#2563eb' }}
            >
              Edit Organization
            </Button>
          )}
        </div>

        {myOrg ? (
          <div className="org-my-card">
            {/* Header Info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0 }}>
                    {myOrg.name}
                  </h2>
                  <Tag
                    color={getStatusColor(myOrg.status)}
                    style={{ borderRadius: 12, fontWeight: 500, padding: '2px 10px' }}
                  >
                    {myOrg.status}
                  </Tag>
                </div>
                <div style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>
                  Identifier:{' '}
                  <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                    {myOrg.slug}
                  </code>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="org-detail-metrics" style={{ marginBottom: 24 }}>
              <div className="metric-box">
                <span className="metric-label">Sites</span>
                <span className="metric-value">{myOrg.sitesCount ?? 0}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Agents</span>
                <span className="metric-value">{myOrg.agentsCount ?? 0}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Owners</span>
                <span className="metric-value">{myOrg.ownersCount ?? (myOrg.ownerId ? 1 : 0)}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Created</span>
                <span className="metric-value">{formattedCreatedDate}</span>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Internal Notes / Description
              </h3>
              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #f3f4f6',
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: myOrg.notes ? '#374151' : '#9ca3af',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                }}
              >
                {myOrg.notes || 'No internal notes provided for this organization.'}
              </div>
            </div>

            {/* Primary Admin Owner */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                Primary Admin Owner
              </h3>
              <div className="org-owner-card" style={{ padding: 14 }}>
                <Avatar
                  size={42}
                  src={myOrg.adminOwner.avatar}
                  icon={!myOrg.adminOwner.avatar && <UserOutlined />}
                >
                  {!myOrg.adminOwner.avatar && myOrg.adminOwner.initials}
                </Avatar>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                      {myOrg.adminOwner.name}
                    </span>
                    <span
                      style={{
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        fontSize: 11,
                        padding: '1px 8px',
                        borderRadius: 10,
                        fontWeight: 500,
                      }}
                    >
                      Owner
                    </span>
                  </div>
                  <span style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                    {myOrg.adminOwner.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            No organization data found.
          </div>
        )}

        {/* Edit Org Modal */}
        {myOrg && (
          <EditOrgModal
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            organization={myOrg}
            onSubmit={async (id, values) => {
              await updateOrganizationDetails(id, values);
              setIsEditModalOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // If not super admin nor admin (e.g. Agent), show access restricted
  if (!isSuperAdmin) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '40px 60px',
            borderRadius: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: 480,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: '#fff1f2',
              color: '#f43f5e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <LockOutlined style={{ fontSize: 24 }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
            Access restricted
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 8px 0' }}>
            Your current demo role{' '}
            <span
              style={{
                background: '#ffedd5',
                color: '#c2410c',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {currentRole}
            </span>{' '}
            does not have permission to view this page.
          </p>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 24px 0' }}>
            Use the sticky role switcher in the sidebar footer to try Super Admin or Admin.
          </p>
          <Link href="/dashboard" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              block
              style={{ background: '#bfdbfe', color: '#1e40af', border: 'none', fontWeight: 500 }}
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleOnboardSubmit = async (values: {
    name: string;
    slug: string;
    notes?: string;
    adminName: string;
    email: string;
  }): Promise<{ initialPassword?: string }> => {
    setIsSubmitting(true);
    try {
      const res = await onboardTenantWithAdminOwner(values);
      return res;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (org: Organization) => {
    const isSuspended = org.status === 'Suspended';
    const newStatus: OrganizationStatus = isSuspended ? 'Active' : 'Suspended';

    modal.confirm({
      title: `${isSuspended ? 'Reactivate' : 'Suspend'} Organization`,
      content: `Are you sure you want to ${isSuspended ? 'reactivate' : 'suspend'} "${org.name}"?`,
      okText: isSuspended ? 'Reactivate' : 'Suspend',
      okButtonProps: { danger: !isSuspended },
      onOk: async () => {
        try {
          await updateStatus(org.id, newStatus);
          message.success(
            `Organization "${org.name}" has been ${isSuspended ? 'reactivated' : 'suspended'}.`,
          );
        } catch (err: unknown) {
          const errorMsg =
            err instanceof Error ? err.message : 'Failed to update organization status.';
          message.error(errorMsg);
        }
      },
    });
  };

  const handleDeleteOrg = (org: Organization) => {
    modal.confirm({
      title: 'Delete Organization',
      content: `Are you sure you want to delete "${org.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteOrganization(org.id);
          message.success(`Organization "${org.name}" has been deleted.`);
        } catch (err: unknown) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : 'Failed to delete organization. Make sure it has no active sites or users/agents.';
          message.error(errorMsg);
        }
      },
    });
  };

  return (
    <div className="organizations-page page-fade-in">
      {/* ── Page Header ── */}
      <div className="organizations-header">
        <div className="organizations-header-left">
          <div className="organizations-title-container">
            <h1 className="organizations-title">Organizations</h1>
            <span
              style={{
                background: '#fce7f3',
                color: '#db2777',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <CheckCircleOutlined style={{ fontSize: 10, marginRight: 4 }} />
              Super Admin
            </span>
          </div>
          <p className="organizations-subtitle">
            List tenants, onboard new organizations, and manage Org details.
          </p>
        </div>

        <Button
          type="primary"
          icon={<BankOutlined />}
          size="large"
          onClick={() => setIsOnboardModalOpen(true)}
        >
          Onboard Tenant
        </Button>
      </div>

      {/* ── Info Banner ── */}
      <div className="organizations-banner">
        <div className="organizations-banner-icon">
          <ExclamationCircleOutlined style={{ fontSize: 18 }} />
        </div>
        <div className="organizations-banner-content">
          <h3>Super Admin · tenant lifecycle</h3>
          <ul>
            <li>
              <CheckCircleOutlined className="anticon-check" /> Onboard a new organization (tenant)
              with a first Admin Owner
            </li>
            <li>
              <CheckCircleOutlined className="anticon-check" /> Edit organization details and manage
              status
            </li>
            <li>
              <CheckCircleOutlined className="anticon-info-circle" /> Admin Owners invite Agents
              from the Users page — they cannot create other Admins
            </li>
          </ul>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="organizations-stats">
        <div className="org-stat-card">
          <div className="org-stat-icon">
            <BankOutlined />
          </div>
          <div className="org-stat-content">
            <span className="org-stat-label">Tenants</span>
            <span className="org-stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="org-stat-card">
          <div className="org-stat-icon">
            <CheckCircleOutlined />
          </div>
          <div className="org-stat-content">
            <span className="org-stat-label">Active</span>
            <span className="org-stat-value">{stats.active}</span>
          </div>
        </div>
        <div className="org-stat-card">
          <div className="org-stat-icon">
            <ClockCircleOutlined />
          </div>
          <div className="org-stat-content">
            <span className="org-stat-label">Trial</span>
            <span className="org-stat-value">{stats.trial}</span>
          </div>
        </div>
        <div className="org-stat-card">
          <div className="org-stat-icon">
            <StopOutlined />
          </div>
          <div className="org-stat-content">
            <span className="org-stat-label">Suspended</span>
            <span className="org-stat-value">{stats.suspended}</span>
          </div>
        </div>
      </div>

      {/* ── Controls: Search + Filter ── */}
      <div className="organizations-controls">
        <OrganizationsSearchBar
          value={filter.search}
          onChange={(search) => updateFilter({ search })}
        />
        <OrganizationsFilterBar
          filter={filter}
          onStatusChange={(status) => updateFilter({ status })}
        />
      </div>

      {/* ── Table ── */}
      <OrganizationsTable
        organizations={organizations}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onPageChange={onPageChange}
        onSortChange={onSortChange}
        onViewDetails={(org) => setSelectedOrgForDetail(org)}
        onEditOrg={(org) => setSelectedOrgForEdit(org)}
        onCreateOwner={(org) => setSelectedOrgForCreateOwner(org)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteOrg}
      />

      {/* ── Modals ── */}
      <OnboardOrganizationModal
        open={isOnboardModalOpen}
        onCancel={() => setIsOnboardModalOpen(false)}
        onSubmit={handleOnboardSubmit}
        isSubmitting={isSubmitting}
      />

      <OrgDetailModal
        organization={selectedOrgForDetail}
        open={Boolean(selectedOrgForDetail)}
        onClose={() => setSelectedOrgForDetail(null)}
        onCreateOwner={(org) => setSelectedOrgForCreateOwner(org)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteOrg}
      />

      <EditOrgModal
        organization={selectedOrgForEdit}
        open={Boolean(selectedOrgForEdit)}
        onClose={() => setSelectedOrgForEdit(null)}
        onSubmit={async (id, values) => {
          await updateOrganizationDetails(id, values);
        }}
      />

      <CreateAdminOwnerModal
        organization={selectedOrgForCreateOwner}
        open={Boolean(selectedOrgForCreateOwner)}
        onCancel={() => setSelectedOrgForCreateOwner(null)}
        onSubmit={createAdminOwner}
      />
    </div>
  );
}

export default function OrganizationsPage() {
  return (
    <React.Suspense
      fallback={<div style={{ padding: 32, color: '#6b7280' }}>Loading organizations...</div>}
    >
      <OrganizationsContent />
    </React.Suspense>
  );
}
