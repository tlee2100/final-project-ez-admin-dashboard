'use client';

import React, { useRef } from 'react';
import { SearchOutlined } from '@ant-design/icons';

interface SitesSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SitesSearchBar({ value, onChange }: SitesSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce is handled by React's batched setState in the parent hook
  return (
    <div className="sites-search-wrapper">
      <SearchOutlined className="sites-search-icon" />
      <input
        ref={inputRef}
        id="sites-search-input"
        type="text"
        className="sites-search-input"
        placeholder="Search sites..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search sites by name or URL"
        autoComplete="off"
      />
    </div>
  );
}
