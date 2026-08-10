'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useList, useInvalidate } from '@refinedev/core';
import type {
  Organization,
  OrganizationsFilter,
  OrganizationSortField,
  OrganizationStatus,
} from '../types/organization.types';
import { apiRequest } from '@/src/lib/api.client';

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useOrganizationsData() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Parse filter state from URL search params for F5 persistence ─────────
  const initialFilter = useMemo<OrganizationsFilter>(() => {
    const search = searchParams.get('search') || '';
    const statusParam = searchParams.get('status');
    const status =
      statusParam && ['all', 'Active', 'Trial', 'Suspended', 'Inactive'].includes(statusParam)
        ? (statusParam as OrganizationsFilter['status'])
        : 'all';
    const sortKey = (searchParams.get('sortKey') as OrganizationSortField) || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(searchParams.get('limit') || '10', 10) || 10;

    return { search, status, sortKey, sortOrder, page, limit };
  }, [searchParams]);

  const [filter, setFilter] = useState<OrganizationsFilter>(initialFilter);
  const invalidate = useInvalidate();

  // ── Sync filter changes to URL search params ──────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.search.trim()) params.set('search', filter.search.trim());
    if (filter.status !== 'all') params.set('status', filter.status);
    if (filter.sortKey !== 'createdAt') params.set('sortKey', filter.sortKey);
    if (filter.sortOrder !== 'desc') params.set('sortOrder', filter.sortOrder);
    if (filter.page > 1) params.set('page', String(filter.page));
    if (filter.limit !== 10) params.set('limit', String(filter.limit));

    const queryString = params.toString();
    const newPath = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newPath, { scroll: false });
  }, [
    filter.search,
    filter.status,
    filter.sortKey,
    filter.sortOrder,
    filter.page,
    filter.limit,
    pathname,
    router,
  ]);

  // ── 1. Debounced search (avoid refetching on every keystroke) ──────────
  const [debouncedSearch, setDebouncedSearch] = useState(filter.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filter.search), 400);
    return () => clearTimeout(t);
  }, [filter.search]);

  // ── 2. Server-side filters (name + status) for useList ──────────────────
  const listFilters = useMemo(() => {
    const f: { field: string; operator: 'contains' | 'eq'; value: string }[] = [];
    if (debouncedSearch.trim()) {
      f.push({ field: 'name', operator: 'contains', value: debouncedSearch.trim() });
    }
    if (filter.status !== 'all') {
      f.push({ field: 'status', operator: 'eq', value: filter.status });
    }
    return f;
  }, [debouncedSearch, filter.status]);

  // ── 3. Paginated + filtered + sorted list (table data) ──────────────────
  const { query: listQuery } = useList<Organization>({
    resource: 'organizations',
    filters: listFilters,
    sorters: [{ field: filter.sortKey, order: filter.sortOrder }],
    pagination: { pageSize: filter.limit, currentPage: filter.page },
  });
  const listData = listQuery.data;
  const isLoading = listQuery.isLoading;
  const refetch = listQuery.refetch;

  const organizations = useMemo(() => listData?.data ?? [], [listData?.data]);
  const total = listData?.total ?? 0;

  // ── 4. Global stats (unfiltered) for the summary cards ──────────────────
  const { query: statsQuery } = useList<Organization>({
    resource: 'organizations',
    pagination: { pageSize: 1000, currentPage: 1 },
  });
  const statsData = useMemo(() => statsQuery.data?.data ?? [], [statsQuery.data?.data]);

  // ── 3. Create Tenant ─────────────────────────────────────────────────────

  const onboardTenantWithAdminOwner = useCallback(
    async (values: {
      name: string;
      slug: string;
      notes?: string;
      adminName: string;
      email: string;
    }): Promise<{ initialPassword?: string }> => {
      // 1. Create Organization
      const orgRes = await apiRequest<{ data: { id: string } }>('/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          slug: values.slug,
          notes: values.notes,
          status: 'Active',
        }),
      });

      const orgId = orgRes.data?.id || (orgRes as unknown as { id: string }).id;

      // 2. Create Admin Owner User
      let initialPassword: string | undefined = undefined;
      if (orgId && values.email && values.adminName) {
        try {
          const userRes = await apiRequest<{
            user: { id: string };
            initialPassword?: string;
          }>('/users', {
            method: 'POST',
            body: JSON.stringify({
              email: values.email,
              name: values.adminName,
              role: 'ADMIN',
              organizationId: orgId,
              gender: 'other',
            }),
          });

          initialPassword = userRes.initialPassword;

          if (userRes.user?.id) {
            await apiRequest(`/organizations/${orgId}`, {
              method: 'PATCH',
              body: JSON.stringify({ ownerId: userRes.user.id }),
            });
          }
        } catch (userErr) {
          // If user creation fails, clean up the newly created organization to prevent orphaned orgs & slug conflicts
          try {
            await apiRequest(`/organizations/${orgId}`, { method: 'DELETE' });
          } catch {
            // Ignore delete error during rollback
          }
          throw userErr;
        }
      }

      invalidate({ resource: 'organizations', invalidates: ['list'] });

      return { initialPassword };
    },
    [invalidate],
  );

  // ── 6. Update Organization Details ─────────────────────────────────────────
  const updateOrganizationDetails = useCallback(
    async (id: string, values: { name?: string; slug?: string; notes?: string }) => {
      await apiRequest(`/organizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      });
      invalidate({ resource: 'organizations', invalidates: ['list'] });
      await refetch();
    },
    [invalidate, refetch],
  );

  // ── 4. Update Organization Status ─────────────────────────────────────────
  const updateStatus = useCallback(
    async (id: string, newStatus: OrganizationStatus) => {
      await apiRequest(`/organizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      invalidate({ resource: 'organizations', invalidates: ['list'] });
      await refetch();
    },
    [invalidate, refetch],
  );

  // ── 5. Create Admin Owner ─────────────────────────────────────────────────
  const createAdminOwner = useCallback(
    async (
      orgId: string,
      payload: { name: string; email: string },
    ): Promise<{ initialPassword?: string }> => {
      // 1. Call POST /users to create Admin user
      const userRes = await apiRequest<{
        user: { id: string };
        initialPassword?: string;
      }>('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: payload.email,
          name: payload.name,
          role: 'ADMIN',
          organizationId: orgId,
          gender: 'other',
        }),
      });

      // 2. Link created admin user as organization ownerId
      if (userRes.user?.id) {
        await apiRequest(`/organizations/${orgId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ownerId: userRes.user.id }),
        });
      }

      // 3. Invalidate list
      invalidate({ resource: 'organizations', invalidates: ['list'] });

      return { initialPassword: userRes.initialPassword };
    },
    [invalidate],
  );

  // ── 6. Filter update helpers ──────────────────────────────────────────────
  const updateFilter = useCallback((patch: Partial<OrganizationsFilter>) => {
    // Any search/status change resets to the first page.
    setFilter((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  const onPageChange = useCallback((page: number, pageSize: number) => {
    setFilter((prev) => ({ ...prev, page, limit: pageSize }));
  }, []);

  const onSortChange = useCallback((sortKey: OrganizationSortField, sortOrder: 'asc' | 'desc') => {
    setFilter((prev) => ({ ...prev, sortKey, sortOrder, page: 1 }));
  }, []);

  // Compute global stats (independent of table filter/page)
  const stats = useMemo(() => {
    const total = statsQuery.data?.total ?? statsData.length;
    const active = statsData.filter((o) => o.status === 'Active').length;
    const trial = statsData.filter((o) => o.status === 'Trial').length;
    const suspended = statsData.filter((o) => o.status === 'Suspended').length;
    return { total, active, trial, suspended };
  }, [statsData, statsQuery.data?.total]);

  // ── 7. Delete Organization ────────────────────────────────────────────────
  const deleteOrganization = useCallback(
    async (id: string) => {
      await apiRequest(`/organizations/${id}`, {
        method: 'DELETE',
      });
      invalidate({ resource: 'organizations', invalidates: ['list'] });
      await refetch();
    },
    [invalidate, refetch],
  );

  return {
    filter,
    updateFilter,
    organizations,
    total,
    page: filter.page,
    pageSize: filter.limit,
    onPageChange,
    sortKey: filter.sortKey,
    sortOrder: filter.sortOrder,
    onSortChange,
    stats,
    isLoading,
    refetch,
    onboardTenantWithAdminOwner,
    updateStatus,
    createAdminOwner,
    updateOrganizationDetails,
    deleteOrganization,
  };
}
