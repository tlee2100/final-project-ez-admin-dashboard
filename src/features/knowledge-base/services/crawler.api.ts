import { useDataProvider } from '@refinedev/core';
import type {
  CrawlerConfigDto,
  CrawlerOverviewDto,
  CrawlerPaginatedResponse,
  CrawlRunDto,
  CrawlRunItemStatus,
  CrawlRunPageDto,
} from '../types/knowledge-base.types';

export function useCrawlerApi() {
  const dataProvider = useDataProvider();

  const fetchCrawlerOverviewApi = async (siteId: string) => {
    const { data } = await dataProvider().custom!<CrawlerOverviewDto>({
      url: `/sites/${siteId}/kb/crawler`,
      method: 'get',
    });
    return data;
  };

  const updateCrawlerConfigApi = async (
    siteId: string,
    payload: { sitemapUrl: string; autoSyncEnabled: boolean },
  ) => {
    const { data } = await dataProvider().custom!<CrawlerConfigDto>({
      url: `/sites/${siteId}/kb/crawler`,
      method: 'put',
      payload,
    });
    return data;
  };

  const startSitemapCrawlApi = async (siteId: string) => {
    const { data } = await dataProvider().custom!<{ runId: string; status: string }>({
      url: `/sites/${siteId}/kb/crawl`,
      method: 'post',
    });
    return data;
  };

  const ingestUrlApi = async (siteId: string, url: string) => {
    const { data } = await dataProvider().custom!<{ runId: string; status: string }>({
      url: `/sites/${siteId}/kb/upload/url`,
      method: 'post',
      payload: { url },
    });
    return data;
  };

  const fetchCrawlRunsApi = async (siteId: string, page = 1, limit = 20) => {
    const { data } = await dataProvider().custom!<CrawlerPaginatedResponse<CrawlRunDto>>({
      url: `/sites/${siteId}/kb/crawls`,
      method: 'get',
      query: {
        page: String(page),
        limit: String(limit),
      },
    });
    return data;
  };

  const fetchCrawlRunApi = async (siteId: string, runId: string) => {
    const { data } = await dataProvider().custom!<CrawlRunDto>({
      url: `/sites/${siteId}/kb/crawls/${runId}`,
      method: 'get',
    });
    return data;
  };

  const fetchCrawlRunPagesApi = async (
    siteId: string,
    runId: string,
    params?: { status?: CrawlRunItemStatus; search?: string; page?: number; limit?: number },
  ) => {
    const query: Record<string, string> = {
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 100),
    };
    if (params?.status) query.status = params.status;
    if (params?.search) query.search = params.search;

    const { data } = await dataProvider().custom!<CrawlerPaginatedResponse<CrawlRunPageDto>>({
      url: `/sites/${siteId}/kb/crawls/${runId}/pages`,
      method: 'get',
      query,
    });
    return data;
  };

  const retryFailedCrawlApi = async (siteId: string, runId: string) => {
    const { data } = await dataProvider().custom!<{ runId: string; status: string }>({
      url: `/sites/${siteId}/kb/crawls/${runId}/retry-failed`,
      method: 'post',
    });
    return data;
  };

  const recrawlSourceApi = async (siteId: string, documentId: string) => {
    const { data } = await dataProvider().custom!<{ runId: string; status: string }>({
      url: `/sites/${siteId}/kb/sources/${documentId}/recrawl`,
      method: 'post',
    });
    return data;
  };

  return {
    fetchCrawlerOverviewApi,
    updateCrawlerConfigApi,
    startSitemapCrawlApi,
    ingestUrlApi,
    fetchCrawlRunsApi,
    fetchCrawlRunApi,
    fetchCrawlRunPagesApi,
    retryFailedCrawlApi,
    recrawlSourceApi,
  };
}
