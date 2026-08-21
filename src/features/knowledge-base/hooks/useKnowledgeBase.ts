import { useState, useEffect, useCallback } from 'react';
import type {
  KBDocument,
  VectorStorageStats,
  DocFileType,
  KBSettings,
} from '../types/knowledge-base.types';
import {
  fetchSiteDocumentsApi,
  uploadSiteDocumentApi,
  deleteSiteDocumentApi,
  fetchKBStatsApi,
  fetchKBSettingsApi,
  updateKBSettingsApi,
  reindexDocumentApi,
  reindexOutdatedDocumentsApi,
} from '../services/knowledge-base.api';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/src/contexts/NotificationContext';
import { App } from 'antd';
import { getSocket } from '@/src/utils/socket';
import { message } from 'antd';

export type SortOption = 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'size_desc';

export function useKnowledgeBase(siteId: string) {
  const { data: session } = useSession();
  const { getSocket } = useNotification();
  const { message } = App.useApp();
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<KBSettings>({
    chunkSize: 800,
    chunkOverlap: 100,
    embeddingModel: 'text-embedding-3-small',
    vectorStoreBackend: 'pgvector',
    similarityThreshold: 0.5,
    topKResults: 4,
    outdatedDocumentsCount: 0,
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isBulkReindexing, setIsBulkReindexing] = useState(false);

  // Filters, Pagination & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DocFileType | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalDocs, setTotalDocs] = useState<number>(0);

  // Live Stats
  const [stats, setStats] = useState<VectorStorageStats>({
    totalDocuments: 0,
    totalChunks: 0,
    totalSizeBytes: 0,
    totalSizeFormatted: '0 MB',
    lastUpdatedRelative: 'Realtime Sync',
    vectorsUsed: 0,
    vectorsLimit: 100000,
    usagePercentage: 0,
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<KBDocument | null>(null);

  // Debounce search query to prevent spamming backend API
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page to 1 when filter type or sort option changes
  const handleTypeChange = useCallback((type: DocFileType | 'all') => {
    setSelectedType(type);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort);
    setPage(1);
  }, []);

  const refreshStats = useCallback(async () => {
    if (!siteId) return;
    try {
      const liveStats = await fetchKBStatsApi(siteId);
      setStats(liveStats);
    } catch (err: unknown) {
      console.warn('Failed to fetch KB live stats:', err);
    }
  }, [siteId]);

  // Fetch Documents from Backend API with Pagination & Filtering
  const refreshDocuments = useCallback(async () => {
    if (!siteId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchSiteDocumentsApi(siteId, {
        page,
        limit,
        type: selectedType === 'all' ? undefined : selectedType,
        search: debouncedSearchQuery || undefined,
        sortBy: sortOption,
      });

      setDocuments(res.documents);
      setTotalDocs(res.total);
      void refreshStats();
      void fetchKBSettingsApi(siteId)
        .then((liveSettings) => setSettings((current) => ({ ...current, ...liveSettings })))
        .catch(() => undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load documents from backend';
      setError(msg);
      message.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [siteId, page, limit, selectedType, debouncedSearchQuery, sortOption, refreshStats, message]);

  const refreshSettings = useCallback(async () => {
    if (!siteId) return;
    setIsSettingsLoading(true);
    try {
      const liveSettings = await fetchKBSettingsApi(siteId);
      setSettings((current) => ({
        ...current,
        ...liveSettings,
        embeddingModel: 'text-embedding-3-small',
        vectorStoreBackend: 'pgvector',
      }));
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Unable to load KB settings');
    } finally {
      setIsSettingsLoading(false);
    }
  }, [siteId, message]);

  useEffect(() => {
    let ignore = false;
    fetchKBSettingsApi(siteId)
      .then((liveSettings) => {
        if (!ignore) {
          setSettings((current) => ({
            ...current,
            ...liveSettings,
            embeddingModel: 'text-embedding-3-small',
            vectorStoreBackend: 'pgvector',
          }));
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          message.error(err instanceof Error ? err.message : 'Unable to load KB settings');
        }
      })
      .finally(() => {
        if (!ignore) setIsSettingsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [siteId, message]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!siteId) return;
      try {
        const res = await fetchSiteDocumentsApi(siteId, {
          page,
          limit,
          type: selectedType === 'all' ? undefined : selectedType,
          search: debouncedSearchQuery || undefined,
          sortBy: sortOption,
        });
        if (!ignore) {
          setDocuments(res.documents);
          setTotalDocs(res.total);
          void refreshStats();
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Unable to load documents from backend';
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [
    siteId,
    page,
    limit,
    selectedType,
    debouncedSearchQuery,
    sortOption,
    refreshStats,
    session?.accessToken,
  ]);

  // 2. Realtime WebSocket Listener for Bull Queue Status Updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStatusChanged = (payload: {
      documentId?: string;
      type?: string;
      status?: string;
      filename?: string;
      error?: string;
    }) => {
      if (payload && payload.documentId) {
        if (
          payload.type === 'document-ready' ||
          payload.type === 'document-reindex-ready' ||
          payload.status === 'ready'
        ) {
          message.destroy('processing_docs');
          void refreshDocuments();
          void refreshSettings();
        } else if (
          payload.type === 'document-failed' ||
          payload.type === 'document-reindex-failed' ||
          payload.status === 'failed'
        ) {
          message.destroy('processing_docs');
          const fileNameStr = payload.filename ? `'${payload.filename}'` : 'Document';
          const errorMsgStr = payload.error ? `: ${payload.error}` : '';
          message.error(`Failed to process ${fileNameStr}${errorMsgStr}`);
          void refreshDocuments();
        }
      }
    };

    socket.on('document-status-changed', handleStatusChanged);

    return () => {
      socket.off('document-status-changed', handleStatusChanged);
    };
  }, [refreshDocuments, refreshSettings, session?.accessToken, getSocket, message]);

  // Actions connecting to Backend APIs
  const handleAddFile = async (files: File[]) => {
    if (!files || files.length === 0 || !siteId) return;

    message.loading({
      content: `Uploading ${files.length} document(s)...`,
      key: 'processing_docs',
    });

    let failedCount = 0;
    const successfulDocs: KBDocument[] = [];

    const uploadPromises = files.map(async (file) => {
      const newKBDoc = await uploadSiteDocumentApi(siteId, file);
      return { file, newKBDoc };
    });

    const results = await Promise.allSettled(uploadPromises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulDocs.push(result.value.newKBDoc);
      } else {
        failedCount += 1;
        const fileName = files[index]?.name || 'File';
        const msg = result.reason instanceof Error ? result.reason.message : 'File upload failed';
        message.error(`Failed to upload '${fileName}': ${msg}`);
      }
    });

    if (successfulDocs.length > 0) {
      if (failedCount > 0) {
        message.loading({
          content: `Processing ${successfulDocs.length} of ${files.length} file(s) in background...`,
          key: 'processing_docs',
        });
      } else {
        message.loading({
          content: `Processing ${successfulDocs.length} file(s) in background...`,
          key: 'processing_docs',
        });
      }
      void refreshDocuments();
    } else {
      message.destroy('processing_docs');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!docId || !siteId) return;
    try {
      await deleteSiteDocumentApi(siteId, docId);
      message.success('Document deleted successfully!');
      void refreshDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document';
      message.error(`Failed to delete document: ${msg}`);
    }
  };

  const saveSettings = async (nextSettings: KBSettings) => {
    if (!siteId) return;
    setIsSettingsSaving(true);
    try {
      const saved = await updateKBSettingsApi(siteId, {
        chunkSize: nextSettings.chunkSize,
        chunkOverlap: nextSettings.chunkOverlap,
        similarityThreshold: nextSettings.similarityThreshold,
        topKResults: nextSettings.topKResults,
      });
      setSettings((current) => ({ ...current, ...saved }));
      message.success('Knowledge base settings saved');
      await refreshDocuments();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Unable to save KB settings');
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const reindexDocument = async (documentId: string) => {
    try {
      await reindexDocumentApi(siteId, documentId);
      message.success('Document queued for re-indexing');
      await refreshDocuments();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Unable to re-index document');
    }
  };

  const reindexAllOutdated = async () => {
    setIsBulkReindexing(true);
    try {
      const result = await reindexOutdatedDocumentsApi(siteId);
      message.success(`${result.queued} document(s) queued for re-indexing`);
      await Promise.all([refreshDocuments(), refreshSettings()]);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Unable to re-index documents');
    } finally {
      setIsBulkReindexing(false);
    }
  };

  return {
    documents,
    allDocumentsCount: totalDocs,
    isLoading,
    error,
    refreshDocuments,
    stats,
    settings,
    isSettingsLoading,
    isSettingsSaving,
    isBulkReindexing,
    saveSettings,
    reindexDocument,
    reindexAllOutdated,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType: handleTypeChange,
    sortOption,
    setSortOption: handleSortChange,
    page,
    setPage,
    limit,
    setLimit,
    totalDocs,
    isAddModalOpen,
    setIsAddModalOpen,
    previewDoc,
    setPreviewDoc,
    handleAddFile,
    handleDeleteDocument,
  };
}
