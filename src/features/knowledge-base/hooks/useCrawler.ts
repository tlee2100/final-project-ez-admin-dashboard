'use client';

import { App } from 'antd';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useCustom, useCustomMutation } from '@refinedev/core';
import type { CrawlerConfigDto, CrawlRunDto } from '../types/knowledge-base.types';

const ACTIVE_STATUSES = new Set(['queued', 'discovering', 'processing']);
const POLLED_STATUSES = new Set(['waiting', ...ACTIVE_STATUSES]);

export function useCrawler(siteId: string, onKnowledgeChanged: () => void) {
  const { message } = App.useApp();

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

  // --- GET OVERVIEW ---
  const { query: overviewQuery } = useCustom<{
    config: CrawlerConfigDto;
    activeRun: CrawlRunDto | null;
  }>({
    url: `/sites/${siteId}/kb/crawler`,
    method: 'get',
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const config = overviewQuery.data?.data?.config || null;
  const isOverviewLoading = overviewQuery.isLoading;
  const refetchOverview = overviewQuery.refetch;

  // --- GET ALL RUNS ---
  const { query: runsQuery } = useCustom<{ data: CrawlRunDto[]; total: number }>({
    url: `/sites/${siteId}/kb/crawls`,
    method: 'get',
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const responseData = runsQuery.data?.data as { data?: CrawlRunDto[] } | CrawlRunDto[] | undefined;
  const runs: CrawlRunDto[] =
    responseData && !Array.isArray(responseData) && Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData)
        ? responseData
        : [];
  const refetchRuns = runsQuery.refetch;
  const effectiveRunId =
    selectedRunId ?? overviewQuery.data?.data?.activeRun?.id ?? runs[0]?.id ?? null;

  // --- GET SELECTED RUN (WITH POLLING IF ACTIVE) ---
  const { query: selectedRunQuery } = useCustom<CrawlRunDto>({
    url: effectiveRunId ? `/sites/${siteId}/kb/crawls/${effectiveRunId}` : '',
    method: 'get',
    queryOptions: {
      enabled: !!siteId && !!effectiveRunId,
      refetchInterval: (query) => {
        const status = query.state.data?.data?.status;
        return status && POLLED_STATUSES.has(status) ? 3000 : false;
      },
    },
  });

  const selectedRun = selectedRunQuery.data?.data || null;
  const refetchSelectedRun = selectedRunQuery.refetch;

  const isLoading = isOverviewLoading;

  // --- POLL ACTIVE RUN IF IT'S DIFFERENT FROM SELECTED ---
  const activeRunIdFromOverview = overviewQuery.data?.data?.activeRun?.id;
  const { query: activeRunPolledQuery } = useCustom<CrawlRunDto>({
    url: activeRunIdFromOverview ? `/sites/${siteId}/kb/crawls/${activeRunIdFromOverview}` : '',
    method: 'get',
    queryOptions: {
      enabled: !!siteId && !!activeRunIdFromOverview,
      refetchInterval: (query) => {
        const status = query.state.data?.data?.status;
        return status && ACTIVE_STATUSES.has(status) ? 3000 : false;
      },
    },
  });

  const effectiveActiveRun =
    activeRunPolledQuery.data?.data || overviewQuery.data?.data?.activeRun || null;

  const refreshCrawler = useCallback(async () => {
    await Promise.all([refetchOverview(), refetchRuns(), refetchSelectedRun()]);
  }, [refetchOverview, refetchRuns, refetchSelectedRun]);

  const refreshSelectedRunFn = useCallback(async () => {
    await refetchSelectedRun();
  }, [refetchSelectedRun]);

  // Monitor active run completion to trigger knowledge changed
  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (effectiveActiveRun?.status) {
      if (ACTIVE_STATUSES.has(effectiveActiveRun.status)) {
        prevStatusRef.current = effectiveActiveRun.status;
      } else if (prevStatusRef.current && !ACTIVE_STATUSES.has(effectiveActiveRun.status)) {
        prevStatusRef.current = null;
        refreshCrawler();
        refreshSelectedRunFn();
        onKnowledgeChanged();
        if (effectiveActiveRun.status === 'completed') message.success('Crawler sync completed');
        else message.warning('Crawler sync finished with errors');
      }
    }
  }, [
    effectiveActiveRun?.status,
    refreshCrawler,
    refreshSelectedRunFn,
    onKnowledgeChanged,
    message,
  ]);

  const { mutateAsync } = useCustomMutation();

  const runAction = useCallback(
    async (
      url: string,
      method: 'post' | 'put' | 'patch' | 'delete',
      successMessage: string,
      values?: unknown,
      waitingMessage?: string,
    ) => {
      setIsActionLoading(true);
      try {
        const result = await mutateAsync({
          url,
          method,
          values: values || {},
        });
        const response = result.data as { runId?: string; status?: string };
        if (response.status === 'waiting' && waitingMessage) {
          message.info(waitingMessage);
        } else {
          message.success(successMessage);
        }

        const runId = response.runId;
        if (runId) {
          setSelectedRunId(runId);
        }
        await refreshCrawler();
      } catch (error: unknown) {
        if ((error as { statusCode?: number })?.statusCode === 409) {
          message.info('A crawler run is already active for this site');
          await refreshCrawler();
        } else {
          message.error((error as { message?: string })?.message || 'Crawler request failed');
        }
      } finally {
        setIsActionLoading(false);
      }
    },
    [mutateAsync, message, refreshCrawler],
  );

  const saveConfig = useCallback(
    async (sitemapUrl: string, autoSyncEnabled: boolean) => {
      setIsActionLoading(true);
      try {
        const saved = await mutateAsync({
          url: `/sites/${siteId}/kb/crawler`,
          method: 'put',
          values: { sitemapUrl, autoSyncEnabled },
        });
        message.success('Crawler configuration saved');
        await refetchOverview();
        return saved.data;
      } catch (error: unknown) {
        message.error(
          (error as { message?: string })?.message || 'Unable to save crawler settings',
        );
        return null;
      } finally {
        setIsActionLoading(false);
      }
    },
    [mutateAsync, siteId, message, refetchOverview],
  );

  const addSitemapAndStart = useCallback(
    async (sitemapUrl: string) => {
      const saved = await saveConfig(sitemapUrl, config?.autoSyncEnabled ?? true);
      if (!saved) return;
      await runAction(`/sites/${siteId}/kb/crawl`, 'post', 'Sitemap crawl started');
    },
    [config?.autoSyncEnabled, saveConfig, siteId, runAction],
  );

  return {
    config,
    activeRun: effectiveActiveRun,
    runs,
    selectedRun,
    isLoading,
    isActionLoading,
    refreshCrawler,
    refreshSelectedRun: refreshSelectedRunFn,
    saveConfig,
    startCrawl: () => runAction(`/sites/${siteId}/kb/crawl`, 'post', 'Sitemap crawl started'),
    ingestUrl: (url: string) =>
      runAction(
        `/sites/${siteId}/kb/upload/url`,
        'post',
        'URL crawl started',
        { url },
        'URL queued and will start after the current crawl',
      ),
    addSitemapAndStart,
    retryFailed: (runId: string) =>
      runAction(
        `/sites/${siteId}/kb/crawls/${runId}/retry-failed`,
        'post',
        'Failed URLs queued for retry',
      ),
    recrawlSource: (documentId: string) =>
      runAction(`/sites/${siteId}/kb/sources/${documentId}/recrawl`, 'post', 'URL recrawl started'),
    siteId,
    progressPercent: useMemo(() => {
      const run = effectiveActiveRun ?? selectedRun;
      if (!run?.totalPages) return 0;
      return Math.min(100, Math.round((run.processedPages / run.totalPages) * 100));
    }, [effectiveActiveRun, selectedRun]),
  };
}
