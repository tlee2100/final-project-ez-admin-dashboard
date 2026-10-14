import type {
  DataProvider,
  BaseRecord,
  GetListResponse,
  GetOneResponse,
  UpdateResponse,
  CreateResponse,
  DeleteOneResponse,
  GetManyResponse,
  GetListParams,
  GetOneParams,
  UpdateParams,
  CreateParams,
  DeleteOneParams,
  GetManyParams,
} from '@refinedev/core';
import { MOCK_SITES } from '@/src/features/sites/mock/sitesMockData';
import type { Site } from '@/src/features/sites/types/site.types';
import type { Organization } from '@/src/features/organizations/types/organization.types';

// ── In-memory mutable copy of sites (supports toggle/update) ────────────────
let sitesStore: Site[] = MOCK_SITES.map((s) => ({ ...s }));
let orgsStore: Organization[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────────
function applyFilters(
  data: Site[],
  filters: NonNullable<Parameters<DataProvider['getList']>[0]['filters']>,
): Site[] {
  return data.filter((item) =>
    filters.every((f) => {
      if ('field' in f) {
        const val = item[f.field as keyof Site];
        switch (f.operator) {
          case 'eq':
            return val === f.value;
          case 'ne':
            return val !== f.value;
          case 'contains':
            return (
              typeof val === 'string' && val.toLowerCase().includes(String(f.value).toLowerCase())
            );
          default:
            return true;
        }
      }
      return true;
    }),
  );
}

function applySorters(
  data: Site[],
  sorters: NonNullable<Parameters<DataProvider['getList']>[0]['sorters']>,
): Site[] {
  if (!sorters.length) return data;
  return [...data].sort((a, b) => {
    for (const s of sorters) {
      const aVal = a[s.field as keyof Site] ?? '';
      const bVal = b[s.field as keyof Site] ?? '';
      if (aVal === bVal) continue;
      if (s.order === 'asc') return aVal < bVal ? -1 : 1;
      return aVal > bVal ? -1 : 1;
    }
    return 0;
  });
}

// ── Mock Data Provider ────────────────────────────────────────────────────────
export const mockDataProvider: DataProvider = {
  // ── getList ──────────────────────────────────────────────────────────────
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    filters = [],
    sorters = [],
    pagination,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    await simulateDelay(80);

    if (resource === 'sites') {
      let data = [...sitesStore];
      data = applyFilters(data, filters);
      data = applySorters(data, sorters);

      const current = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 100;
      const start = (current - 1) * pageSize;
      const paginated = data.slice(start, start + pageSize);

      return { data: paginated as unknown as TData[], total: data.length };
    }

    if (resource === 'organizations') {
      const data = [...orgsStore];

      // Basic support for filtering/sorting if needed in future, matching sites pattern
      // data = applyFilters(data, filters);
      // data = applySorters(data, sorters);

      const current = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 100;
      const start = (current - 1) * pageSize;
      const paginated = data.slice(start, start + pageSize);

      return { data: paginated as unknown as TData[], total: data.length };
    }

    return { data: [], total: 0 };
  },

  // ── getOne ───────────────────────────────────────────────────────────────
  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    await simulateDelay(60);

    if (resource === 'dashboard') {
      // id is always 'overview' for dashboard
      return { data: {} as unknown as TData };
    }

    if (resource === 'sites') {
      const site = sitesStore.find((s) => s.id === String(id));
      if (!site) throw new Error(`Site ${id} not found`);
      return { data: site as unknown as TData };
    }

    if (resource === 'organizations') {
      const org = orgsStore.find((o) => o.id === String(id));
      if (!org) throw new Error(`Organization ${id} not found`);
      return { data: org as unknown as TData };
    }

    throw new Error(`Resource "${resource}" not supported`);
  },

  // ── update ───────────────────────────────────────────────────────────────
  update: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    id,
    variables,
  }: UpdateParams<_TVariables>): Promise<UpdateResponse<TData>> => {
    await simulateDelay(60);

    if (resource === 'sites') {
      sitesStore = sitesStore.map((s) =>
        s.id === String(id) ? { ...s, ...(variables as Partial<Site>) } : s,
      );
      const updated = sitesStore.find((s) => s.id === String(id));
      if (!updated) throw new Error(`Site ${id} not found for update`);
      return { data: updated as unknown as TData };
    }

    if (resource === 'organizations') {
      orgsStore = orgsStore.map((o) =>
        o.id === String(id) ? { ...o, ...(variables as Partial<Organization>) } : o,
      );
      const updated = orgsStore.find((o) => o.id === String(id));
      if (!updated) throw new Error(`Organization ${id} not found for update`);
      return { data: updated as unknown as TData };
    }

    throw new Error(`Update not supported for resource "${resource}"`);
  },

  // ── create ───────────────────────────────────────────────────────────────
  create: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    variables,
  }: CreateParams<_TVariables>): Promise<CreateResponse<TData>> => {
    await simulateDelay(60);

    if (resource === 'sites') {
      const newSite: Site = {
        id: `site-${Date.now()}`,
        ...(variables as Omit<Site, 'id'>),
      };
      sitesStore.push(newSite);
      return { data: newSite as unknown as TData };
    }

    if (resource === 'organizations') {
      const newOrg: Organization = {
        id: `org-${Date.now()}`,
        ...(variables as Omit<Organization, 'id'>),
      };
      orgsStore.push(newOrg);
      return { data: newOrg as unknown as TData };
    }

    throw new Error(`Create not supported for resource "${resource}"`);
  },

  // ── deleteOne ─────────────────────────────────────────────────────────────
  deleteOne: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    id,
  }: DeleteOneParams<_TVariables>): Promise<DeleteOneResponse<TData>> => {
    await simulateDelay(60);

    if (resource === 'sites') {
      const site = sitesStore.find((s) => s.id === String(id));
      if (!site) throw new Error(`Site ${id} not found for deletion`);
      sitesStore = sitesStore.filter((s) => s.id !== String(id));
      return { data: site as unknown as TData };
    }

    if (resource === 'organizations') {
      const org = orgsStore.find((o) => o.id === String(id));
      if (!org) throw new Error(`Organization ${id} not found for deletion`);
      orgsStore = orgsStore.filter((o) => o.id !== String(id));
      return { data: org as unknown as TData };
    }

    throw new Error(`Delete not supported for resource "${resource}"`);
  },

  getMany: async <TData extends BaseRecord = BaseRecord>({
    resource,
    ids,
  }: GetManyParams): Promise<GetManyResponse<TData>> => {
    await simulateDelay(60);

    if (resource === 'sites') {
      const items = sitesStore.filter((s) => ids.map(String).includes(s.id));
      return { data: items as unknown as TData[] };
    }

    if (resource === 'organizations') {
      const items = orgsStore.filter((o) => ids.map(String).includes(o.id));
      return { data: items as unknown as TData[] };
    }

    return { data: [] };
  },

  // ── required by interface ─────────────────────────────────────────────────
  getApiUrl: () => '/api/v1/admin',
};

// ── Simulate realistic async latency in dev ──────────────────────────────────
function simulateDelay(ms: number): Promise<void> {
  if (process.env.NODE_ENV === 'production') return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
