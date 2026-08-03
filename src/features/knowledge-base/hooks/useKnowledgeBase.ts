import { useState, useMemo, useEffect, useCallback } from 'react';
import type {
  KBDocument,
  VectorStorageStats,
  DocFileType,
  CrawlerConfig,
  KBSettings,
} from '../types/knowledge-base.types';
import { initialCrawlerConfig, initialKBSettings } from '../mock/knowledgeBaseMockData';
import {
  fetchSiteDocumentsApi,
  uploadSiteDocumentApi,
  deleteSiteDocumentApi,
} from '../services/knowledge-base.api';
import { useNotification } from '@/src/contexts/NotificationContext';
import { message } from 'antd';

export type SortOption = 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'size_desc';

export function useKnowledgeBase(siteId: string) {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getSocket } = useNotification();
  const [error, setError] = useState<string | null>(null);

  const [crawlerConfig] = useState<CrawlerConfig>(initialCrawlerConfig);
  const [settings, setSettings] = useState<KBSettings>(initialKBSettings);

  // Filters, Pagination & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DocFileType | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalDocs, setTotalDocs] = useState<number>(0);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load documents from backend';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [siteId, page, limit, selectedType, debouncedSearchQuery, sortOption]);

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
  }, [siteId, page, limit, selectedType, debouncedSearchQuery, sortOption]);

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
        if (payload.type === 'document-ready' || payload.status === 'ready') {
          void refreshDocuments();
        } else if (payload.type === 'document-failed' || payload.status === 'failed') {
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
  }, [getSocket, refreshDocuments]);

  // Dynamic Statistics Calculation
  const stats: VectorStorageStats = useMemo(() => {
    const totalDocsCount = totalDocs || documents.length;
    const totalChunks = documents.reduce((acc, d) => acc + (d.chunksCount || 0), 0);
    const totalBytes = documents.reduce((acc, d) => acc + d.sizeBytes, 0);
    const sizeMB = (totalBytes / (1024 * 1024)).toFixed(1);
    const vectorsUsed = totalChunks;
    const vectorsLimit = 100000;
    const usagePercentage = Math.min(100, Math.round((vectorsUsed / vectorsLimit) * 100));

    return {
      totalDocuments: totalDocsCount,
      totalChunks,
      totalSizeBytes: totalBytes,
      totalSizeFormatted: `${sizeMB} MB`,
      lastUpdatedRelative: 'Realtime Sync',
      vectorsUsed,
      vectorsLimit,
      usagePercentage,
    };
  }, [documents, totalDocs]);

  // Actions connecting to Backend APIs
  const handleAddFile = async (files: File[]) => {
    if (!files || files.length === 0 || !siteId) return;

    const uploadPromises = files.map(async (file) => {
      const newKBDoc = await uploadSiteDocumentApi(siteId, file);
      return { file, newKBDoc };
    });

    const results = await Promise.allSettled(uploadPromises);
    const successfulDocs: KBDocument[] = [];
    let failedCount = 0;

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
        message.info(
          `Uploaded ${successfulDocs.length} of ${files.length} file(s). Processing in background...`,
        );
      } else {
        message.info(`Uploaded ${successfulDocs.length} file(s). Processing in background...`);
      }
      void refreshDocuments();
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

  const handleAddUrl = (url: string) => {
    if (!url.trim()) return;
    message.info('URL ingest feature will be connected to the Crawler Service in the next phase.');
  };

  const handleAddSitemap = (sitemapUrl: string) => {
    if (!sitemapUrl.trim()) return;
    message.info(
      'Sitemap ingest feature will be connected to the Sitemap Crawler Service in the next phase.',
    );
  };

  return {
    documents,
    allDocumentsCount: totalDocs,
    isLoading,
    error,
    refreshDocuments,
    stats,
    crawlerConfig,
    settings,
    setSettings,
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
    handleAddUrl,
    handleAddSitemap,
    handleDeleteDocument,
  };
}
