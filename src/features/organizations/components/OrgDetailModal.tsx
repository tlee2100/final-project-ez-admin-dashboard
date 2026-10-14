'use client';

import React from 'react';
import { Modal, Tag, Avatar, Button } from 'antd';
import {
  UserOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { Organization } from '../types/organization.types';

interface OrgDetailModalProps {
  organization: Organization | null;
  open: boolean;
  onClose: () => void;
  onCreateOwner?: (org: Organization) => void;
  onToggleStatus: (org: Organization) => void;
  onDelete?: (org: Organization) => void;
}

export function OrgDetailModal({
  organization,
  open,
  onClose,
  onToggleStatus,
  onDelete,
}: OrgDetailModalProps) {
  if (!organization) return null;

  const isSuspended = organization.status === 'Suspended';
  const hasOwner = Boolean(
    organization.ownerId ||
    (organization.adminOwner && organization.adminOwner.email !== 'No owner assigned'),
  );

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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      className="org-detail-modal"
      destroyOnHidden
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' }}>
            {organization.name}
          </h2>
          <Tag
            color={getStatusColor(organization.status)}
            style={{ borderRadius: 12, fontWeight: 500 }}
          >
            {organization.status}
          </Tag>
        </div>
        <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{organization.slug}</div>
      </div>

      {/* Metrics Row */}
      <div className="org-detail-metrics">
        <div className="metric-box">
          <span className="metric-label">Sites</span>
          <span className="metric-value">{organization.sitesCount ?? 0}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Agents</span>
          <span className="metric-value">{organization.agentsCount ?? 0}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Owners</span>
          <span className="metric-value">{organization.ownersCount ?? (hasOwner ? 1 : 0)}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Created</span>
          <span className="metric-value">{organization.createdAt || 'N/A'}</span>
        </div>
      </div>

      {/* Notes Section */}
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 4 }}>
          Notes
        </div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>
          {organization.notes || 'No internal notes added.'}
        </div>
      </div>

      {/* Admin Owners Section */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Admin Owner</span>
        </div>

        <div className="org-owner-card">
          <Avatar
            size={36}
            src={organization.adminOwner.avatar}
            icon={!organization.adminOwner.avatar && <UserOutlined />}
          >
            {!organization.adminOwner.avatar && organization.adminOwner.initials}
          </Avatar>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                {organization.adminOwner.name}
              </span>
              {hasOwner && (
                <Tag color="blue" style={{ borderRadius: 10, fontSize: 11, padding: '0 6px' }}>
                  Primary
                </Tag>
              )}
            </div>
            <span style={{ color: '#6b7280', fontSize: 12 }}>{organization.adminOwner.email}</span>
          </div>
          <span
            style={{
              color: isSuspended ? '#ef4444' : '#10b981',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isSuspended ? '#ef4444' : '#10b981',
                display: 'inline-block',
              }}
            />
            {isSuspended ? 'Suspended' : 'Active'}
          </span>
        </div>
      </div>

      {/* Footer Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
        <Button onClick={onClose} size="large" style={{ borderRadius: 8 }}>
          Close
        </Button>
        {onDelete && (
          <Button
            danger
            size="large"
            icon={<DeleteOutlined />}
            style={{ borderRadius: 8 }}
            onClick={() => {
              onClose();
              onDelete(organization);
            }}
          >
            Delete
          </Button>
        )}
        <Button
          danger={!isSuspended}
          type={isSuspended ? 'primary' : 'default'}
          size="large"
          icon={isSuspended ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          style={{
            borderRadius: 8,
            background: isSuspended ? '#10b981' : undefined,
            borderColor: isSuspended ? '#10b981' : '#f43f5e',
            color: !isSuspended ? '#f43f5e' : '#fff',
          }}
          onClick={() => {
            onClose();
            onToggleStatus(organization);
          }}
        >
          {isSuspended ? 'Reactivate' : 'Suspend'}
        </Button>
      </div>
    </Modal>
  );
}
