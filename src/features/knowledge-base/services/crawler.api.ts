import type {
  CrawlerConfigDto,
  CrawlerOverviewDto,
  CrawlerPaginatedResponse,
  CrawlRunDto,
  CrawlRunItemStatus,
  CrawlRunPageDto,
} from '../types/knowledge-base.types';
import { kbApiRequest } from './knowledge-base.api';

export function fetchCrawlerOverviewApi(siteId: string) {
  return kbApiRequest<CrawlerOverviewDto>(`/sites/${siteId}/kb/crawler`, {
    method: 'GET',
  });
}

export function updateCrawlerConfigApi(
  siteId: string,
  payload: { sitemapUrl: string; autoSyncEnabled: boolean },
) {
  return kbApiRequest<CrawlerConfigDto>(`/sites/${siteId}/kb/crawler`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function startSitemapCrawlApi(siteId: string) {
  return kbApiRequest<{ runId: string; status: string }>(`/sites/${siteId}/kb/crawl`, {
    method: 'POST',
  });
}

export function ingestUrlApi(siteId: string, url: string) {
  return kbApiRequest<{ runId: string; status: string }>(`/sites/${siteId}/kb/upload/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
}

export function fetchCrawlRunsApi(siteId: string, page = 1, limit = 20) {
  return kbApiRequest<CrawlerPaginatedResponse<CrawlRunDto>>(
    `/sites/${siteId}/kb/crawls?page=${page}&limit=${limit}`,
    { method: 'GET' },
  );
}

export function fetchCrawlRunApi(siteId: string, runId: string) {
  return kbApiRequest<CrawlRunDto>(`/sites/${siteId}/kb/crawls/${runId}`, {
    method: 'GET',
  });
}

export function fetchCrawlRunPagesApi(
  siteId: string,
  runId: string,
  params?: { status?: CrawlRunItemStatus; search?: string; page?: number; limit?: number },
) {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('limit', String(params?.limit ?? 100));
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  return kbApiRequest<CrawlerPaginatedResponse<CrawlRunPageDto>>(
    `/sites/${siteId}/kb/crawls/${runId}/pages?${query.toString()}`,
    { method: 'GET' },
  );
}

export function retryFailedCrawlApi(siteId: string, runId: string) {
  return kbApiRequest<{ runId: string; status: string }>(
    `/sites/${siteId}/kb/crawls/${runId}/retry-failed`,
    { method: 'POST' },
  );
}

export function recrawlSourceApi(siteId: string, documentId: string) {
  return kbApiRequest<{ runId: string; status: string }>(
    `/sites/${siteId}/kb/sources/${documentId}/recrawl`,
    { method: 'POST' },
  );
}
