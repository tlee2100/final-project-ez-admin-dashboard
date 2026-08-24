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
  CustomParams,
} from '@refinedev/core';
import { mockDataProvider } from './mockDataProvider';
import { API_BASE_URL, apiRequest } from '@/src/lib/api.client';

function requestBody(variables: unknown): BodyInit {
  return variables instanceof FormData ? variables : JSON.stringify(variables ?? {});
}

export const combinedDataProvider: DataProvider = {
  // ── getList ──────────────────────────────────────────────────────────────
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    filters = [],
    sorters = [],
    pagination,
    meta,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    let endpoint = `/${resource}`;
    if (resource === 'bookings' && meta?.siteId) {
      endpoint = `/admin/sites/${meta.siteId}/bookings`;
    }

    const queryParams: string[] = [];

    if (meta?.showCancelled !== undefined) {
      queryParams.push(`showCancelled=${meta.showCancelled}`);
    }

    if (pagination?.currentPage) {
      queryParams.push(`page=${pagination.currentPage}`);
    }
    if (pagination?.pageSize) {
      queryParams.push(`limit=${pagination.pageSize}`);
    }

    if (sorters && sorters.length > 0) {
      sorters.forEach((s) => {
        // nestjs-paginate standard: sortBy=field:DESC
        queryParams.push(`sortBy=${s.field}:${s.order.toUpperCase()}`);
      });
    }

    if (filters && filters.length > 0) {
      filters.forEach((f) => {
        if ('field' in f) {
          if (f.operator === 'contains') {
            // General text search
            queryParams.push(`search=${encodeURIComponent(String(f.value))}`);
          } else if (f.operator === 'eq') {
            // Exact match filter
            queryParams.push(`filter.${f.field}=$eq:${encodeURIComponent(String(f.value))}`);
          } else if (f.operator === 'in') {
            // IN filter — nestjs-paginate: filter.field=$in:val1,val2
            const vals = Array.isArray(f.value) ? f.value.join(',') : String(f.value);
            queryParams.push(`filter.${f.field}=$in:${encodeURIComponent(vals)}`);
          } else {
            // Fallback for other operators (gte, lte, etc.)
            queryParams.push(
              `filter.${f.field}=$${f.operator}:${encodeURIComponent(String(f.value))}`,
            );
          }
        }
      });
    }

    const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
    const response = await apiRequest<{
      data: Record<string, unknown>[];
      meta?: { totalItems?: number };
    }>(`${endpoint}${queryString}`);

    return {
      data: response.data as unknown as TData[],
      total: response.meta?.totalItems ?? response.data.length,
    };
  },

  // ── getOne ───────────────────────────────────────────────────────────────
  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
    meta,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    // Support nested endpoints via meta.url
    const endpoint = meta?.url ?? `/${resource}/${id}`;

    try {
      const res = await apiRequest<{ data?: Record<string, unknown> } | Record<string, unknown>>(
        endpoint,
      );
      const data = 'data' in res && res.data ? res.data : res;
      return { data: data as unknown as TData };
    } catch {
      return mockDataProvider.getOne({ resource, id });
    }
  },

  // ── update ───────────────────────────────────────────────────────────────
  update: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    id,
    variables,
    meta,
  }: UpdateParams<_TVariables>): Promise<UpdateResponse<TData>> => {
    const endpoint = meta?.url ?? `/${resource}/${id}`;

    const bodyParams = { ...variables } as Record<string, unknown>;

    try {
      const res = await apiRequest<{ data?: Record<string, unknown> } | Record<string, unknown>>(
        endpoint,
        {
          method: 'PATCH',
          body: requestBody(bodyParams),
        },
      );
      const item = 'data' in res && res.data ? res.data : res;
      return { data: item as unknown as TData };
    } catch {
      return mockDataProvider.update({ resource, id, variables });
    }
  },

  // ── create ───────────────────────────────────────────────────────────────
  create: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    variables,
    meta,
  }: CreateParams<_TVariables>): Promise<CreateResponse<TData>> => {
    const endpoint = meta?.url ?? `/${resource}`;

    const bodyParams = { ...variables } as Record<string, unknown>;

    try {
      const res = await apiRequest<{ data?: Record<string, unknown> } | Record<string, unknown>>(
        endpoint,
        {
          method: 'POST',
          body: requestBody(bodyParams),
        },
      );

      // Safely map if the backend explicitly nests user and initialPassword inside the root response
      if (resource === 'users' && 'user' in res) {
        return {
          data: {
            ...(res.user as object),
            initialPassword: res.initialPassword,
          } as unknown as TData,
        };
      }

      const item = 'data' in res && res.data ? res.data : res;
      return { data: item as unknown as TData };
    } catch {
      return mockDataProvider.create({ resource, variables });
    }
  },

  // ── deleteOne ─────────────────────────────────────────────────────────────
  deleteOne: async <TData extends BaseRecord = BaseRecord, _TVariables = unknown>({
    resource,
    id,
    meta,
  }: DeleteOneParams<_TVariables>): Promise<DeleteOneResponse<TData>> => {
    const endpoint = meta?.url ?? `/${resource}/${id}`;

    try {
      await apiRequest<unknown>(endpoint, { method: 'DELETE' });
      return { data: { id } as unknown as TData };
    } catch {
      return mockDataProvider.deleteOne({ resource, id });
    }
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

  // ── custom ───────────────────────────────────────────────────────────────
  custom: async <TData extends BaseRecord = BaseRecord, TQuery = unknown, TPayload = unknown>({
    url,
    method,
    payload,
    query,
  }: CustomParams<TQuery, TPayload>) => {
    const requestUrl = `${url}${query ? '?' + new URLSearchParams(query as Record<string, string>).toString() : ''}`;

    const response = await apiRequest<TData>(requestUrl, {
      method: method.toUpperCase(),
      body: payload ? requestBody(payload) : undefined,
    });

    return { data: response };
  },

  getApiUrl: () => API_BASE_URL,
};
