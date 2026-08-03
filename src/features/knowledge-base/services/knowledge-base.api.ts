import { getStoredAccessToken } from '@/src/lib/api.client';
import { DocFileExtension, DocFileType, type KBDocument } from '../types/knowledge-base.types';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, '').endsWith('/api/v1')
  ? RAW_API_BASE_URL.replace(/\/$/, '')
  : `${RAW_API_BASE_URL.replace(/\/$/, '')}/api/v1`;

export interface BackendDocumentDto {
  id: string;
  filename: string;
  filePath: string;
  fileSizeBytes?: number | string | null;
  chunksCount?: number | null;
  cloudinaryPublicId: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  siteId: string;
  uploadedAt: string;
  processedAt: string | null;
  errorMessage?: string | null;
}

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
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

async function parseApiError(response: Response): Promise<string> {
  const errorData = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  if (errorData?.message) {
    return Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
  }
  if (errorData?.error) return errorData.error;
  return 'Knowledge base document request failed';
}

async function kbApiRequest<T>(endpoint: string, init: RequestInit): Promise<T> {
  const token = getStoredAccessToken();
  const response = await fetch(buildApiUrl(endpoint), {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as T;
}

export function mapBackendDocToKBDoc(doc: BackendDocumentDto): KBDocument {
  const ext = doc.filename.split('.').pop()?.toLowerCase() || '';
  let docType: DocFileType = DocFileType.TXT;

  if (ext === DocFileExtension.PDF) docType = DocFileType.PDF;
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
    url: doc.filePath !== 'pending' ? doc.filePath : undefined,
    contentSnippet: `Document '${doc.filename}' uploaded to site KB. Status: ${doc.status}`,
    status: isIndexed ? 'indexed' : isFailed ? 'failed' : 'processing',
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

  const response = await kbApiRequest<NestPaginatedResponse<BackendDocumentDto> | BackendDocumentDto[]>(
    endpoint,
    { method: 'GET' },
  );

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
