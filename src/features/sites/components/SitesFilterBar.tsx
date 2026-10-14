'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FilterOutlined, SortAscendingOutlined, CheckOutlined } from '@ant-design/icons';
import type {
  SiteStatusFilter,
  SiteSortKey,
  SiteSortOrder,
  SitesFilter,
} from '../types/site.types';
import { STATUS_FILTER_OPTIONS, SORT_OPTIONS } from '../types/site.types';

interface SitesFilterBarProps {
  filter: SitesFilter;
  onStatusChange: (status: SiteStatusFilter) => void;
  onSortChange: (key: SiteSortKey, order: SiteSortOrder) => void;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, onClose]);
}

export function SitesFilterBar({ filter, onStatusChange, onSortChange }: SitesFilterBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useClickOutside(filterRef, () => setFilterOpen(false));
  useClickOutside(sortRef, () => setSortOpen(false));

  const activeStatusLabel =
    STATUS_FILTER_OPTIONS.find((o) => o.value === filter.status)?.label ?? 'All Sites';

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.key === filter.sortKey && o.order === filter.sortOrder)?.label ??
    'Recently Updated';

  const isFilterActive = filter.status !== 'all';
  const isSortActive = filter.sortKey !== 'updatedAt' || filter.sortOrder !== 'desc';

  return (
    <div className="sites-controls-right">
      {/* ── Filter Dropdown ── */}
      <div className="sites-dropdown-wrapper" ref={filterRef}>
        <button
          id="sites-filter-btn"
          className={`sites-btn-icon ${isFilterActive ? 'active' : ''}`}
          onClick={() => {
            setFilterOpen((o) => !o);
            setSortOpen(false);
          }}
          aria-expanded={filterOpen}
          aria-haspopup="listbox"
          aria-label="Filter sites"
        >
          <FilterOutlined />
          Filter{isFilterActive ? `: ${activeStatusLabel}` : ''}
        </button>

        {filterOpen && (
          <div className="sites-dropdown" role="listbox" aria-label="Filter options">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                role="option"
                aria-selected={filter.status === opt.value}
                className={`sites-dropdown-item ${filter.status === opt.value ? 'selected' : ''}`}
                onClick={() => {
                  onStatusChange(opt.value);
                  setFilterOpen(false);
                }}
              >
                {filter.status === opt.value && <CheckOutlined style={{ fontSize: 11 }} />}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Sort Dropdown ── */}
      <div className="sites-dropdown-wrapper" ref={sortRef}>
        <button
          id="sites-sort-btn"
          className={`sites-btn-icon ${isSortActive ? 'active' : ''}`}
          onClick={() => {
            setSortOpen((o) => !o);
            setFilterOpen(false);
          }}
          aria-expanded={sortOpen}
          aria-haspopup="listbox"
          aria-label="Sort sites"
        >
          <SortAscendingOutlined />
          Sort{isSortActive ? `: ${activeSortLabel}` : ''}
        </button>

        {sortOpen && (
          <div className="sites-dropdown" role="listbox" aria-label="Sort options">
            {SORT_OPTIONS.map((opt, idx) => {
              const isActive = filter.sortKey === opt.key && filter.sortOrder === opt.order;
              // Add visual divider between Name group and the rest
              const showDivider =
                idx > 0 &&
                SORT_OPTIONS[idx - 1].key !== opt.key &&
                opt.key !== SORT_OPTIONS[idx - 1].key;
              return (
                <React.Fragment key={`${opt.key}-${opt.order}`}>
                  {showDivider && <div className="sites-dropdown-divider" />}
                  <button
                    role="option"
                    aria-selected={isActive}
                    className={`sites-dropdown-item ${isActive ? 'selected' : ''}`}
                    onClick={() => {
                      onSortChange(opt.key, opt.order);
                      setSortOpen(false);
                    }}
                  >
                    {isActive && <CheckOutlined style={{ fontSize: 11 }} />}
                    {opt.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
