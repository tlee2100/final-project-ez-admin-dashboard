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
import { mockDataProvider } from './mockDataProvider';
import { API_BASE_URL, apiRequest, getStoredAccessToken } from '@/src/lib/api.client';

function requestBody(variables: unknown): BodyInit {
  return variables instanceof FormData ? variables : JSON.stringify(variables ?? {});
}

/**
 * Format an ISO timestamp string as YYYY-MM-DD in Asia/Ho_Chi_Minh (GMT+7) timezone
 * using the standard browser Intl.DateTimeFormat API.
 */
function formatDateGmt7(value: unknown): string {
  if (!value) return '';
  const date = new Date(typeof value === 'string' ? value : String(value));
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export const combinedDataProvider: DataProvider = {
  // ── getList ──────────────────────────────────────────────────────────────
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    filters = [],
    sorters = [],
    pagination,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    if (resource === 'users') {
      const queryParams: string[] = [];

      if (pagination?.currentPage) {
        queryParams.push(`page=${pagination.currentPage}`);
      }
      if (pagination?.pageSize) {
        queryParams.push(`limit=${pagination.pageSize}`);
      }
      if (sorters && sorters.length > 0) {
        sorters.forEach((s) => {
          queryParams.push(`sortBy=${s.field}:${s.order.toUpperCase()}`);
        });
      }
      if (filters && filters.length > 0) {
        filters.forEach((f) => {
          if ('field' in f) {
            if (['name', 'email'].includes(String(f.field)) && f.operator === 'contains') {
              queryParams.push(`filter.${f.field}=$ilike:${encodeURIComponent(String(f.value))}`);
            } else if (f.field === 'role' && f.operator === 'eq') {
              queryParams.push(`filter.${f.field}=${encodeURIComponent(String(f.value))}`);
            }
          }
        });
      }

      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const response = await apiRequest<{
        data: Record<string, unknown>[];
        meta?: { totalItems?: number };
      }>(`/users${queryString}`);

      return {
        data: response.data as unknown as TData[],
        total: response.meta?.totalItems ?? response.data.length,
      };
    }

    if (resource === 'sites') {
      const queryParams: string[] = [];

      if (pagination?.currentPage) {
        queryParams.push(`page=${pagination.currentPage}`);
      }
      if (pagination?.pageSize) {
        queryParams.push(`limit=${pagination.pageSize}`);
      }
      if (sorters && sorters.length > 0) {
        sorters.forEach((s) => {
          queryParams.push(`sortBy=${s.field}:${s.order.toUpperCase()}`);
        });
      }
      if (filters && filters.length > 0) {
        filters.forEach((f) => {
          if ('field' in f) {
            if (f.field === 'name' && f.operator === 'contains') {
              queryParams.push(`search=${encodeURIComponent(String(f.value))}`);
            } else if (f.operator === 'eq') {
              queryParams.push(`filter.${f.field}=${encodeURIComponent(String(f.value))}`);
            }
          }
        });
      }

      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const response = await apiRequest<{
        data: Record<string, unknown>[];
        meta?: { totalItems?: number };
      }>(`/sites${queryString}`);

      const mappedData = response.data.map((item: Record<string, unknown>) => ({
        ...item,
        enabled: item.isAiActive ?? item.enabled ?? true,
        kbDocuments: item.kbDocuments ?? (item.documents as unknown[])?.length ?? 0,
        activeChats: item.activeChats ?? 0,
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));

      return {
        data: mappedData as unknown as TData[],
        total: response.meta?.totalItems ?? response.data.length,
      };
    }

    if (resource === 'organizations') {
      const queryParams: string[] = [];

      if (pagination?.currentPage) {
        queryParams.push(`page=${pagination.currentPage}`);
      }
      if (pagination?.pageSize) {
        queryParams.push(`limit=${pagination.pageSize}`);
      }
      if (sorters && sorters.length > 0) {
        sorters.forEach((s) => {
          queryParams.push(`sortBy=${s.field}`);
          queryParams.push(`order=${s.order.toUpperCase()}`);
        });
      }
      if (filters && filters.length > 0) {
        filters.forEach((f) => {
          if ('field' in f) {
            if (f.field === 'name' && f.operator === 'contains') {
              queryParams.push(`name=${encodeURIComponent(String(f.value))}`);
            } else if (f.field === 'slug') {
              queryParams.push(`slug=${encodeURIComponent(String(f.value))}`);
            } else if (f.field === 'status' && f.value !== 'all') {
              queryParams.push(`status=${encodeURIComponent(String(f.value))}`);
            }
          }
        });
      }

      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const response = await apiRequest<{
        data: Record<string, unknown>[];
        meta?: { totalItems?: number };
      }>(`/organizations${queryString}`);

      const mappedData = response.data.map((item: Record<string, unknown>) => {
        const owner = item.owner as Record<string, string> | undefined;
        const ownerName = owner?.name || (item.ownerId ? 'Admin Owner' : 'Unassigned');
        const ownerEmail =
          owner?.email || (item.ownerId ? 'owner@company.com' : 'No owner assigned');
        const nameParts = ownerName.split(' ');
        const initials =
          nameParts.length > 1
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : ownerName.substring(0, 2).toUpperCase();

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          status: item.status || 'Active',
          notes: (item.notes as string) || (item.description as string) || '',
          ownerId: item.ownerId || null,
          adminOwner: {
            name: ownerName,
            email: ownerEmail,
            avatar: owner?.avatarUrl || undefined,
            initials: item.ownerId ? initials : '--',
          },
          sitesCount: typeof item.sitesCount === 'number' ? item.sitesCount : 0,
          agentsCount: typeof item.agentsCount === 'number' ? item.agentsCount : 0,
          ownersCount: item.ownerId ? 1 : 0,
          createdAt: formatDateGmt7(item.createdAt),
        };
      });

      return {
        data: mappedData as unknown as TData[],
        total: response.meta?.totalItems ?? mappedData.length,
      };
    }

    // Delegate to mock provider for other resources
    return mockDataProvider.getList({ resource, filters, sorters, pagination });
  },

  // ── getOne ───────────────────────────────────────────────────────────────
  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    if (resource === 'users') {
      const data = await apiRequest<Record<string, unknown>>(
        id === 'me' ? '/users/me' : `/users/${id}`,
      );
      return { data: data as unknown as TData };
    }

    if (resource === 'sites') {
      if (id === 'new') {
        return { data: {} as unknown as TData };
      }
      const data = await apiRequest<Record<string, unknown>>(`/sites/${id}`);
      const mapped = {
        ...data,
        enabled: data.isAiActive ?? data.enabled ?? true,
        kbDocuments: data.kbDocuments ?? (data.documents as unknown[])?.length ?? 0,
        activeChats: data.activeChats ?? 0,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      return { data: mapped as unknown as TData };
    }
    if (resource === 'organizations') {
      const res = await apiRequest<{ data: Record<string, unknown> }>(`/organizations/${id}`);
      const item = res.data || res;
      const owner = item.owner as Record<string, string> | undefined;
      const ownerName = owner?.name || (item.ownerId ? 'Admin Owner' : 'Unassigned');
      const ownerEmail = owner?.email || (item.ownerId ? 'owner@company.com' : 'No owner assigned');
      const nameParts = ownerName.split(' ');
      const initials =
        nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : ownerName.substring(0, 2).toUpperCase();

      const mapped = {
        id: item.id,
        name: item.name,
        slug: item.slug,
        status: item.status || 'Active',
        notes: (item.notes as string) || (item.description as string) || '',
        ownerId: item.ownerId || null,
        adminOwner: {
          name: ownerName,
          email: ownerEmail,
          avatar: owner?.avatarUrl || undefined,
          initials: item.ownerId ? initials : '--',
        },
        sitesCount: typeof item.sitesCount === 'number' ? item.sitesCount : 0,
        agentsCount: typeof item.agentsCount === 'number' ? item.agentsCount : 0,
        ownersCount: item.ownerId ? 1 : 0,
        createdAt: formatDateGmt7(item.createdAt),
      };
      return { data: mapped as unknown as TData };
    }

    if (resource === 'dashboard' || resource === 'analytics') {
      const token = getStoredAccessToken();
      if (token) {
        try {
          const analyticsRes = await apiRequest<{
            totalChats: number;
            activeSites: number;
            totalSites: number;
            totalOrganizations: number;
            activeOrganizations: number;
            totalAgents: number;
            containmentRate: { aiResolved: number; agentHandoff: number };
            chatActivity: {
              daily: { label: string; value: number }[];
              weekly: { label: string; value: number }[];
              monthly: { label: string; value: number }[];
            };
            recentActivity: {
              id: string;
              type: string;
              title: string;
              description: string;
              time: string;
              timeAgo: string;
            }[];
          }>('/analytics/dashboard');

          const mockRes = await mockDataProvider.getOne({ resource: 'dashboard', id });
          const baseMock = mockRes.data as unknown as Record<string, unknown>;

          const dashboardData = {
            ...baseMock,
            stats: [
              {
                id: 'total-chats',
                title: 'Total Chats',
                value: analyticsRes.totalChats?.toLocaleString('en-US') ?? '0',
                trend: 12,
                trendDirection: 'up',
                icon: 'message',
                iconColor: '#6366f1',
                iconBg: '#ede9fe',
                isMock: false,
              },
              {
                id: 'active-sites',
                title: 'Active Sites',
                value: analyticsRes.activeSites?.toString() ?? '0',
                trend: 2,
                trendDirection: 'up',
                icon: 'global',
                iconColor: '#10b981',
                iconBg: '#d1fae5',
                isMock: false,
              },
              {
                id: 'avg-response-time',
                title: 'Avg. Response Time',
                value: '1.2s',
                trend: 0.3,
                trendDirection: 'up',
                icon: 'clock',
                iconColor: '#f59e0b',
                iconBg: '#fef3c7',
                isMock: true,
              },
              {
                id: 'token-usage',
                title: 'Token Usage',
                value: '1.2M',
                trend: 5,
                trendDirection: 'up',
                icon: 'api',
                iconColor: '#f97316',
                iconBg: '#ffedd5',
                isMock: true,
              },
            ],
            chatActivity: analyticsRes.chatActivity || baseMock.chatActivity,
            containmentRate: analyticsRes.containmentRate || baseMock.containmentRate,
            recentActivity:
              analyticsRes.recentActivity?.length > 0
                ? analyticsRes.recentActivity
                : baseMock.recentActivity,
          };

          return { data: dashboardData as unknown as TData };
        } catch {
          // If JWT fails or error occurs, fall back to mock data cleanly
          return mockDataProvider.getOne({ resource: 'dashboard', id });
        }
      }
    }

    return mockDataProvider.getOne({ resource, id });
  },

  // ── update ───────────────────────────────────────────────────────────────
  update: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    id,
    variables,
  }: UpdateParams<_TVariables>): Promise<UpdateResponse<TData>> => {
    if (resource === 'users') {
      const data = await apiRequest<Record<string, unknown>>(
        id === 'me' ? '/users/me' : `/users/${id}`,
        {
          method: 'PATCH',
          body: requestBody(variables),
        },
      );
      return { data: data as unknown as TData };
    }

    if (resource === 'sites') {
      const bodyParams = { ...variables } as Record<string, unknown>;
      if ('enabled' in bodyParams) {
        bodyParams.isAiActive = bodyParams.enabled;
        delete bodyParams.enabled;
      }
      const data = await apiRequest<Record<string, unknown>>(`/sites/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(bodyParams),
      });
      const mapped = {
        ...data,
        enabled: data.isAiActive ?? data.enabled ?? true,
        kbDocuments: data.kbDocuments ?? (data.documents as unknown[])?.length ?? 0,
        activeChats: data.activeChats ?? 0,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      return { data: mapped as unknown as TData };
    }
    if (resource === 'organizations') {
      const res = await apiRequest<{ data: Record<string, unknown> }>(`/organizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(variables),
      });
      const item = res.data || res;
      return { data: item as unknown as TData };
    }
    return mockDataProvider.update({ resource, id, variables });
  },

  // ── create ───────────────────────────────────────────────────────────────
  create: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    variables,
  }: CreateParams<_TVariables>): Promise<CreateResponse<TData>> => {
    if (resource === 'users') {
      const response = await apiRequest<{
        user: Record<string, unknown>;
        initialPassword: string;
      }>('/users', {
        method: 'POST',
        body: JSON.stringify(variables ?? {}),
      });

      return {
        data: { ...response.user, initialPassword: response.initialPassword } as unknown as TData,
      };
    }

    if (resource === 'sites') {
      const bodyParams = { ...variables } as Record<string, unknown>;
      if ('enabled' in bodyParams) {
        bodyParams.isAiActive = bodyParams.enabled;
        delete bodyParams.enabled;
      }
      const data = await apiRequest<Record<string, unknown>>(`/sites`, {
        method: 'POST',
        body: JSON.stringify(bodyParams),
      });
      const mapped = {
        ...data,
        enabled: data.isAiActive ?? data.enabled ?? true,
      };
      return { data: mapped as unknown as TData };
    }
    if (resource === 'organizations') {
      const res = await apiRequest<{ data: Record<string, unknown> }>(`/organizations`, {
        method: 'POST',
        body: JSON.stringify(variables),
      });
      const item = res.data || res;
      return { data: item as unknown as TData };
    }
    return mockDataProvider.create({ resource, variables });
  },

  // ── deleteOne ─────────────────────────────────────────────────────────────
  deleteOne: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    id,
  }: DeleteOneParams<_TVariables>): Promise<DeleteOneResponse<TData>> => {
    if (resource === 'users') {
      await apiRequest<unknown>(`/users/${id}`, {
        method: 'DELETE',
      });
      return { data: { id } as unknown as TData };
    }

    if (resource === 'sites') {
      await apiRequest<unknown>(`/sites/${id}`, {
        method: 'DELETE',
      });
      return { data: {} as unknown as TData };
    }
    if (resource === 'organizations') {
      await apiRequest<unknown>(`/organizations/${id}`, {
        method: 'DELETE',
      });
      return { data: {} as unknown as TData };
    }
    return mockDataProvider.deleteOne({ resource, id });
  },

  // ── getMany ──────────────────────────────────────────────────────────────
  getMany: async <TData extends BaseRecord = BaseRecord>({
    resource,
    ids,
  }: GetManyParams): Promise<GetManyResponse<TData>> => {
    if (resource === 'sites') {
      const promises = ids.map((id) => apiRequest<Record<string, unknown>>(`/sites/${id}`));
      const results = await Promise.all(promises);
      return { data: results as unknown as TData[] };
    }
    if (mockDataProvider.getMany) {
      return mockDataProvider.getMany({ resource, ids });
    }
    return { data: [] };
  },

  getApiUrl: () => API_BASE_URL,
};
