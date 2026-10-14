'use client';

import React from 'react';
import { Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import type { OrganizationsFilter, OrganizationStatus } from '../types/organization.types';

interface OrganizationsFilterBarProps {
  filter: OrganizationsFilter;
  onStatusChange: (status: 'all' | OrganizationStatus) => void;
}

export function OrganizationsFilterBar({ filter, onStatusChange }: OrganizationsFilterBarProps) {
  return (
    <div className="org-filter">
      <Select
        value={filter.status}
        onChange={onStatusChange}
        style={{ width: 140 }}
        options={[
          {
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FilterOutlined /> All statuses
              </span>
            ),
            value: 'all',
          },
          { label: 'Active', value: 'Active' },
          { label: 'Trial', value: 'Trial' },
          { label: 'Suspended', value: 'Suspended' },
          { label: 'Inactive', value: 'Inactive' },
        ]}
      />
    </div>
  );
}
