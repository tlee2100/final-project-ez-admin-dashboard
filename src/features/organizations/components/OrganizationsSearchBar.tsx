'use client';

import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface OrganizationsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function OrganizationsSearchBar({ value, onChange }: OrganizationsSearchBarProps) {
  return (
    <div className="org-search">
      <Input
        placeholder="Search by organization name..."
        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        allowClear
      />
    </div>
  );
}
