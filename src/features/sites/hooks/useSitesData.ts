'use client';

import { useMemo, useState, useCallback } from 'react';
import { useList, useUpdate, useDelete } from '@refinedev/core';
import type { HttpError } from '@refinedev/core';
import type { Site, SitesFilter } from '../types/site.types';

// ── Default filter state ─────────────────────────────────────────────────────
const DEFAULT_FILTER: SitesFilter = {
  search: '',
  status: 'all',
  sortKey: 'updatedAt',
  sortOrder: 'desc',
};

// ── Helper: relative time string ─────────────────────────────────────────────
export function getRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSitesData() {
  const [filter, setFilter] = useState<SitesFilter>(DEFAULT_FILTER);

  // ── 1. Fetch from Refine (mockDataProvider → real API later) ──────────────
  const { query: listQuery } = useList<Site>({
    resource: 'sites',
    // Sorting is handled by the data provider
    sorters: [{ field: filter.sortKey, order: filter.sortOrder }],
    // Status filter — passed to data provider
    filters:
      filter.status !== 'all'
        ? [{ field: 'isAiActive', operator: 'eq' as const, value: filter.status === 'active' }]
        : [],
    // Load all for now; add pagination later
    pagination: { pageSize: 100, currentPage: 1 },
  });
  const listData = listQuery.data;
  const isLoading = listQuery.isLoading;

  // ── 2. Role-based visibility (delegated to real backend query visibility) ───────
  const roleSites: Site[] = useMemo(() => {
    return listData?.data ?? [];
  }, [listData]);

  // ── 3. Client-side search (text search — not passed to provider) ──────────
  const filteredSites: Site[] = useMemo(() => {
    if (!filter.search.trim()) return roleSites;
    const q = filter.search.toLowerCase();
    return roleSites.filter(
      (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q),
    );
  }, [roleSites, filter.search]);

  // ── 4. Toggle via useUpdate (goes through data provider) ─────────────────
  const { mutation: updateMutation } = useUpdate<Site>();
  const updateSite = updateMutation.mutate;

  const { mutation: deleteMutation } = useDelete<Site>();
  const deleteSiteMutate = deleteMutation.mutate;

  const toggleSiteEnabled = useCallback(
    (siteId: string) => {
      const site = (listData?.data ?? []).find((s) => s.id === siteId);
      if (!site) return;
      updateSite({
        resource: 'sites',
        id: siteId,
        values: { enabled: !site.enabled },
        // Optimistic update — immediately reflects in UI
        mutationMode: 'optimistic',
      });
    },
    [listData, updateSite],
  );

  const deleteSite = useCallback(
    (
      siteId: string,
      options?: { onSuccess?: () => void; onError?: (error: HttpError) => void },
    ) => {
      deleteSiteMutate(
        {
          resource: 'sites',
          id: siteId,
          successNotification: false,
          errorNotification: false,
        },
        {
          onSuccess: options?.onSuccess,
          onError: options?.onError,
        },
      );
    },
    [deleteSiteMutate],
  );

  const updateSiteData = useCallback(
    (
      siteId: string,
      values: Partial<Site>,
      options?: { onSuccess?: () => void; onError?: (error: HttpError) => void },
    ) => {
      updateSite(
        {
          resource: 'sites',
          id: siteId,
          values,
          successNotification: false,
          errorNotification: false,
        },
        {
          onSuccess: options?.onSuccess,
          onError: options?.onError,
        },
      );
    },
    [updateSite],
  );

  // ── 5. Filter update helpers ──────────────────────────────────────────────
  const updateFilter = useCallback((patch: Partial<SitesFilter>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    filter,
    updateFilter,
    filteredSites,
    totalCount: roleSites.length,
    isLoading,
    toggleSiteEnabled,
    deleteSite,
    updateSiteData,
  };
}
