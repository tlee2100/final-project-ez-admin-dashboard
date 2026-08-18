'use client';

import { App } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCrawlerOverviewApi,
  fetchCrawlRunApi,
  fetchCrawlRunPagesApi,
  fetchCrawlRunsApi,
  ingestUrlApi,
  recrawlSourceApi,
  retryFailedCrawlApi,
  startSitemapCrawlApi,
  updateCrawlerConfigApi,
} from '../services/crawler.api';
import { ApiRequestError } from '../services/knowledge-base.api';
import type {
  CrawlerConfigDto,
  CrawlRunDto,
  CrawlRunItemStatus,
  CrawlRunPageDto,
} from '../types/knowledge-base.types';

const ACTIVE_STATUSES = new Set(['queued', 'discovering', 'processing']);

export function useCrawler(siteId: string, onKnowledgeChanged: () => void) {
  const { message } = App.useApp();
  const [config, setConfig] = useState<CrawlerConfigDto | null>(null);
  const [activeRun, setActiveRun] = useState<CrawlRunDto | null>(null);
  const [runs, setRuns] = useState<CrawlRunDto[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<CrawlRunDto | null>(null);
  const [pages, setPages] = useState<CrawlRunPageDto[]>([]);
  const [pagesTotal, setPagesTotal] = useState(0);
  const [pagesPage, setPagesPage] = useState(1);
  const [pagesLimit, setPagesLimit] = useState(20);
  const [pageSearch, setPageSearch] = useState('');
  const [pageStatusFilter, setPageStatusFilter] = useState<CrawlRunItemStatus | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const refreshCrawler = useCallback(async () => {
    if (!siteId) return;
    const [overview, runPage] = await Promise.all([
      fetchCrawlerOverviewApi(siteId),
      fetchCrawlRunsApi(siteId),
    ]);
    setConfig(overview.config);
    setActiveRun(overview.activeRun);
    setRuns(runPage.data);
    setSelectedRunId((current) => current ?? overview.activeRun?.id ?? runPage.data[0]?.id ?? null);
    return overview;
  }, [siteId]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void refreshCrawler()
        .catch((error: unknown) => {
          if (!cancelled)
            message.error(error instanceof Error ? error.message : 'Unable to load crawler');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [message, refreshCrawler]);

  const refreshSelectedRun = useCallback(async () => {
    if (!selectedRunId) {
      setSelectedRun(null);
      setPages([]);
      return;
    }
    const [run, result] = await Promise.all([
      fetchCrawlRunApi(siteId, selectedRunId),
      fetchCrawlRunPagesApi(siteId, selectedRunId, {
        status: pageStatusFilter,
        search: pageSearch || undefined,
        page: pagesPage,
        limit: pagesLimit,
      }),
    ]);
    setSelectedRun(run);
    setPages(result.data);
    setPagesTotal(result.total);
  }, [pageSearch, pageStatusFilter, pagesLimit, pagesPage, selectedRunId, siteId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshSelectedRun().catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshSelectedRun]);

  useEffect(() => {
    if (!activeRun || !ACTIVE_STATUSES.has(activeRun.status)) return;
    const timer = window.setInterval(() => {
      void fetchCrawlRunApi(siteId, activeRun.id)
        .then(async (run: CrawlRunDto) => {
          if (ACTIVE_STATUSES.has(run.status)) {
            setActiveRun(run);
            if (selectedRunId === run.id) {
              setSelectedRun(run);
              const result = await fetchCrawlRunPagesApi(siteId, run.id, {
                status: pageStatusFilter,
                search: pageSearch || undefined,
                page: pagesPage,
                limit: pagesLimit,
              });
              setPages(result.data);
              setPagesTotal(result.total);
            }
            return;
          }
          setActiveRun(null);
          await refreshCrawler();
          await refreshSelectedRun();
          onKnowledgeChanged();
          if (run.status === 'completed') message.success('Crawler sync completed');
          else message.warning('Crawler sync finished with errors');
        })
        .catch(() => undefined);
    }, 3_000);
    return () => window.clearInterval(timer);
  }, [
    activeRun,
    message,
    onKnowledgeChanged,
    pageSearch,
    pageStatusFilter,
    pagesLimit,
    pagesPage,
    refreshCrawler,
    refreshSelectedRun,
    selectedRunId,
    siteId,
  ]);

  const runAction = useCallback(
    async (action: () => Promise<{ runId: string }>, successMessage: string) => {
      setIsActionLoading(true);
      try {
        const result = await action();
        message.success(successMessage);
        setSelectedRunId(result.runId);
        setPagesPage(1);
        await refreshCrawler();
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 409) {
          message.info('A crawler run is already active for this site');
          const overview = await refreshCrawler();
          if (overview?.activeRun) {
            setSelectedRunId(overview.activeRun.id);
            setPagesPage(1);
          }
        } else {
          message.error(error instanceof Error ? error.message : 'Crawler request failed');
        }
      } finally {
        setIsActionLoading(false);
      }
    },
    [message, refreshCrawler],
  );

  const saveConfig = useCallback(
    async (sitemapUrl: string, autoSyncEnabled: boolean) => {
      setIsActionLoading(true);
      try {
        const saved = await updateCrawlerConfigApi(siteId, { sitemapUrl, autoSyncEnabled });
        setConfig(saved);
        message.success('Crawler configuration saved');
        return saved;
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Unable to save crawler settings');
        return null;
      } finally {
        setIsActionLoading(false);
      }
    },
    [message, siteId],
  );

  const addSitemapAndStart = useCallback(
    async (sitemapUrl: string) => {
      const saved = await saveConfig(sitemapUrl, config?.autoSyncEnabled ?? true);
      if (!saved) return;
      await runAction(() => startSitemapCrawlApi(siteId), 'Sitemap crawl started');
    },
    [config?.autoSyncEnabled, runAction, saveConfig, siteId],
  );

  const selectRun = useCallback((runId: string) => {
    setSelectedRunId(runId);
    setPagesPage(1);
  }, []);

  const changeStatusFilter = useCallback((status?: CrawlRunItemStatus) => {
    setPageStatusFilter(status);
    setPagesPage(1);
  }, []);

  const searchPages = useCallback((search: string) => {
    setPageSearch(search.trim());
    setPagesPage(1);
  }, []);

  return {
    config,
    activeRun,
    runs,
    selectedRun,
    selectedRunId,
    setSelectedRunId: selectRun,
    pages,
    pagesTotal,
    pagesPage,
    pagesLimit,
    setPagesPage,
    setPagesLimit,
    pageSearch,
    searchPages,
    pageStatusFilter,
    setPageStatusFilter: changeStatusFilter,
    isLoading,
    isActionLoading,
    refreshCrawler,
    refreshSelectedRun,
    saveConfig,
    startCrawl: () => runAction(() => startSitemapCrawlApi(siteId), 'Sitemap crawl started'),
    ingestUrl: (url: string) => runAction(() => ingestUrlApi(siteId, url), 'URL crawl started'),
    addSitemapAndStart,
    retryFailed: (runId: string) =>
      runAction(() => retryFailedCrawlApi(siteId, runId), 'Failed URLs queued for retry'),
    recrawlSource: (documentId: string) =>
      runAction(() => recrawlSourceApi(siteId, documentId), 'URL recrawl started'),
    progressPercent: useMemo(() => {
      const run = activeRun ?? selectedRun;
      if (!run?.totalPages) return 0;
      return Math.min(100, Math.round((run.processedPages / run.totalPages) * 100));
    }, [activeRun, selectedRun]),
  };
}
