import { getSession } from 'next-auth/react';
import {
  DocFileExtension,
  DocFileType,
  type KBDocument,
  type DocumentChunksResponse,
  type KBStatsResponse,
  type VectorStorageStats,
  type KBSettings,
} from '../types/knowledge-base.types';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, '').endsWith('/api/v1')
  ? RAW_API_BASE_URL.replace(/\/$/, '')
  : `${RAW_API_BASE_URL.replace(/\/$/, '')}/api/v1`;

export interface BackendDocumentDto {
  id: string;
  filename: string;
  filePath: string | null;
  sourceKind?: 'file' | 'url';
  sourceUrl?: string | null;
  isActive?: boolean;
  fileSizeBytes?: number | string | null;
  chunksCount?: number | null;
  cloudinaryPublicId: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  siteId: string;
  uploadedAt: string;
  processedAt: string | null;
  errorMessage?: string | null;
  indexedChunkSize?: number | null;
  indexedChunkOverlap?: number | null;
  needsReindex?: boolean;
  reindexStatus?: 'idle' | 'queued' | 'processing' | 'failed';
  reindexError?: string | null;
}

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: ApiErrorResponse | null,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return '-';

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = sizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function parseFileSizeBytes(value: BackendDocumentDto['fileSizeBytes']): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatDateTime(value?: string | null): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}

async function parseApiError(response: Response): Promise<{
  message: string;
  body: ApiErrorResponse | null;
}> {
  const errorData = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  if (errorData?.message) {
    return {
      message: Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message,
      body: errorData,
    };
  }
  if (errorData?.error) return { message: errorData.error, body: errorData };
  return { message: 'Knowledge base request failed', body: errorData };
}

export async function kbApiRequest<T>(endpoint: string, init: RequestInit): Promise<T> {
  const session = await getSession();
  const token = session?.accessToken;
  const response = await fetch(buildApiUrl(endpoint), {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await parseApiError(response);
    throw new ApiRequestError(response.status, errorData.message, errorData.body);
  }

  return (await response.json()) as T;
}

export function mapBackendDocToKBDoc(doc: BackendDocumentDto): KBDocument {
  const ext = doc.filename.split('.').pop()?.toLowerCase() || '';
  let docType: DocFileType = DocFileType.TXT;

  if (doc.sourceKind === 'url') docType = DocFileType.URL;
  else if (ext === DocFileExtension.PDF) docType = DocFileType.PDF;
  else if (ext === DocFileExtension.DOCX) docType = DocFileType.DOCX;
  else if (ext === DocFileExtension.MARKDOWN || ext === DocFileExtension.MARKDOWN_LONG) {
    docType = DocFileType.MARKDOWN;
  } else if (ext === DocFileExtension.HTML || ext === DocFileExtension.HTM) {
    docType = DocFileType.HTML;
  }

  const isIndexed = doc.status === 'ready';
  const isFailed = doc.status === 'failed';

  const fileSizeBytes = parseFileSizeBytes(doc.fileSizeBytes);
  const uploadedAtFormatted = formatDateTime(doc.uploadedAt) || '-';
  const processedAtFormatted = formatDateTime(doc.processedAt);
  const updatedAt = doc.processedAt || doc.uploadedAt;

  return {
    id: doc.id,
    siteId: doc.siteId,
    name: doc.filename,
    type: docType,
    sizeFormatted: formatFileSize(fileSizeBytes),
    sizeBytes: fileSizeBytes,
    chunksCount: doc.chunksCount ?? undefined,
    uploadedAt: doc.uploadedAt,
    uploadedAtFormatted,
    processedAt: doc.processedAt,
    processedAtFormatted,
    updatedAt,
    updatedAtFormatted: formatDateTime(updatedAt) || uploadedAtFormatted,
    url:
      doc.sourceKind === 'url'
        ? doc.sourceUrl || undefined
        : doc.filePath && doc.filePath !== 'pending'
          ? doc.filePath
          : undefined,
    sourceKind: doc.sourceKind,
    isActive: doc.isActive,
    contentSnippet: `Document '${doc.filename}' uploaded to site KB. Status: ${doc.status}`,
    status:
      doc.isActive === false
        ? 'retired'
        : isIndexed
          ? 'indexed'
          : isFailed
            ? 'failed'
            : 'processing',
    indexedChunkSize: doc.indexedChunkSize,
    indexedChunkOverlap: doc.indexedChunkOverlap,
    needsReindex: doc.needsReindex ?? false,
    reindexStatus: doc.reindexStatus ?? 'idle',
    reindexError: doc.reindexError,
  };
}

export interface FetchSiteDocumentsParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  sortBy?: string;
}

export interface PaginatedKBDocumentsResponse {
  documents: KBDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NestPaginatedResponse<T> {
  data: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}

export async function fetchSiteDocumentsApi(
  siteId: string,
  params?: FetchSiteDocumentsParams,
): Promise<PaginatedKBDocumentsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.type && params.type !== 'all') {
    queryParams.set('filter.fileType', `$eq:${params.type}`);
  }
  if (params?.sortBy) {
    if (params.sortBy === 'name_asc') queryParams.set('sortBy', 'filename:ASC');
    else if (params.sortBy === 'name_desc') queryParams.set('sortBy', 'filename:DESC');
    else if (params.sortBy === 'date_asc') queryParams.set('sortBy', 'uploadedAt:ASC');
    else if (params.sortBy === 'size_desc') queryParams.set('sortBy', 'fileSizeBytes:DESC');
    else queryParams.set('sortBy', 'uploadedAt:DESC');
  }

  const queryString = queryParams.toString();
  const endpoint = `/sites/${siteId}/kb/sources${queryString ? `?${queryString}` : ''}`;

  const response = await kbApiRequest<
    NestPaginatedResponse<BackendDocumentDto> | BackendDocumentDto[]
  >(endpoint, { method: 'GET' });

  // Handle nestjs-paginate object response
  if (response && !Array.isArray(response) && Array.isArray(response.data)) {
    return {
      documents: response.data.map(mapBackendDocToKBDoc),
      total: response.meta.totalItems,
      page: response.meta.currentPage,
      limit: response.meta.itemsPerPage,
      totalPages: response.meta.totalPages,
    };
  }

  // Fallback for legacy raw array response
  const rawArray = Array.isArray(response) ? response : [];
  return {
    documents: rawArray.map(mapBackendDocToKBDoc),
    total: rawArray.length,
    page: 1,
    limit: rawArray.length || 10,
    totalPages: 1,
  };
}

export async function uploadSiteDocumentApi(siteId: string, file: File): Promise<KBDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const savedDoc = await kbApiRequest<BackendDocumentDto>(`/sites/${siteId}/kb/upload/file`, {
    method: 'POST',
    body: formData,
  });

  if (savedDoc.status === 'failed') {
    throw new Error(savedDoc.errorMessage || 'File was rejected by the knowledge base service');
  }

  return mapBackendDocToKBDoc(savedDoc);
}

export async function deleteSiteDocumentApi(
  siteId: string,
  documentId: string,
): Promise<{ message: string; id: string }> {
  return kbApiRequest<{ message: string; id: string }>(
    `/sites/${siteId}/kb/sources/${documentId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function fetchDocumentChunksApi(
  siteId: string,
  documentId: string,
): Promise<DocumentChunksResponse> {
  return kbApiRequest<DocumentChunksResponse>(`/sites/${siteId}/kb/sources/${documentId}/chunks`, {
    method: 'GET',
  });
}

export async function fetchKBStatsApi(siteId: string): Promise<VectorStorageStats> {
  const stats = await kbApiRequest<KBStatsResponse>(`/sites/${siteId}/kb/stats`, {
    method: 'GET',
  });

  const formattedSize = stats.totalSizeBytes > 0 ? formatFileSize(stats.totalSizeBytes) : '0 KB';
  const lastUpdated = stats.lastProcessedAt
    ? formatDateTime(stats.lastProcessedAt) || 'Just now'
    : 'Realtime Sync';

  return {
    totalDocuments: stats.totalDocuments,
    totalChunks: stats.totalChunks,
    totalSizeBytes: stats.totalSizeBytes,
    totalSizeFormatted: formattedSize,
    lastUpdatedRelative: lastUpdated,
    vectorsUsed: stats.vectorsUsed,
    vectorsLimit: stats.vectorsLimit,
    usagePercentage: stats.usagePercentage,
  };
}

export function fetchKBSettingsApi(siteId: string): Promise<KBSettings> {
  return kbApiRequest<KBSettings>(`/sites/${siteId}/kb/settings`, { method: 'GET' });
}

export function updateKBSettingsApi(
  siteId: string,
  settings: Pick<KBSettings, 'chunkSize' | 'chunkOverlap' | 'topKResults' | 'similarityThreshold'>,
): Promise<KBSettings> {
  return kbApiRequest<KBSettings>(`/sites/${siteId}/kb/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}

export function reindexDocumentApi(siteId: string, documentId: string) {
  return kbApiRequest<{ documentId?: string; runId?: string; status: string }>(
    `/sites/${siteId}/kb/sources/${documentId}/reindex`,
    { method: 'POST' },
  );
}

export function reindexOutdatedDocumentsApi(siteId: string) {
  return kbApiRequest<{ queued: number; skipped: number; totalOutdated: number }>(
    `/sites/${siteId}/kb/reindex-outdated`,
    { method: 'POST' },
  );
}
