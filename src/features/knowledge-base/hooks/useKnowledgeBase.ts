import { useState, useEffect, useCallback } from 'react';
import type { KBDocument, VectorStorageStats, KBSettings } from '../types/knowledge-base.types';
import { DocFileType, DocFileExtension } from '../types/knowledge-base.types';
import { useNotification } from '@/src/contexts/NotificationContext';
import { App } from 'antd';
import { useCustom, useCustomMutation } from '@refinedev/core';

export type SortOption = 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'size_desc';

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
  indexedChunkSize?: number;
  indexedChunkOverlap?: number;
  needsReindex?: boolean;
  reindexStatus?: 'queued' | 'processing' | 'failed' | 'idle';
  reindexError?: string;
}

function parseFileSizeBytes(value?: number | string | null): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = sizeBytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDateTime(value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return undefined;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return undefined;
  }
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

const SORT_BY_MAP: Record<SortOption, string> = {
  date_desc: 'uploadedAt:DESC',
  date_asc: 'uploadedAt:ASC',
  name_asc: 'filename:ASC',
  name_desc: 'filename:DESC',
  size_desc: 'fileSizeBytes:DESC',
};

export function useKnowledgeBase(siteId: string) {
  const { getSocket } = useNotification();
  const { message } = App.useApp();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<KBDocument | null>(null);

  // Filters, Pagination & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DocFileType | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [isBulkReindexing, setIsBulkReindexing] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleTypeChange = useCallback((type: DocFileType | 'all') => {
    setSelectedType(type);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort);
    setPage(1);
  }, []);

  // --- GET DOCUMENTS ---
  const { query: docsQuery } = useCustom<
    { data: BackendDocumentDto[]; meta: { totalItems?: number } } | BackendDocumentDto[]
  >({
    url: `/sites/${siteId}/kb/sources`,
    method: 'get',
    config: {
      query: {
        page: String(page),
        limit: String(limit),
        ...(selectedType !== 'all' ? { 'filter.fileType': `$eq:${selectedType}` } : {}),
        ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
        sortBy: SORT_BY_MAP[sortOption] || 'uploadedAt:DESC',
      },
    },
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const responseData = docsQuery.data?.data;
  let documents: KBDocument[] = [];
  let totalDocs = 0;

  if (responseData && !Array.isArray(responseData) && Array.isArray(responseData.data)) {
    documents = responseData.data.map(mapBackendDocToKBDoc);
    totalDocs = responseData.meta?.totalItems || 0;
  } else if (Array.isArray(responseData)) {
    documents = responseData.map(mapBackendDocToKBDoc);
    totalDocs = responseData.length;
  }
  const isLoading = docsQuery.isLoading;
  const docsError = docsQuery.error;
  const error =
    docsError instanceof Error ? docsError.message : docsError ? String(docsError) : null;
  const refetchDocuments = docsQuery.refetch;

  // --- GET STATS ---
  const { query: statsQuery } = useCustom<VectorStorageStats>({
    url: `/sites/${siteId}/kb/stats`,
    method: 'get',
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const defaultStats: VectorStorageStats = {
    totalDocuments: 0,
    totalChunks: 0,
    totalSizeBytes: 0,
    totalSizeFormatted: '0 MB',
    lastUpdatedRelative: 'Realtime Sync',
    vectorsUsed: 0,
    vectorsLimit: 100000,
    usagePercentage: 0,
  };
  const stats = statsQuery.data?.data || defaultStats;
  const refetchStats = statsQuery.refetch;

  // --- GET SETTINGS ---
  const { query: settingsQuery } = useCustom<KBSettings>({
    url: `/sites/${siteId}/kb/settings`,
    method: 'get',
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const isSettingsLoading = settingsQuery.isLoading;
  const refetchSettings = settingsQuery.refetch;

  const defaultSettings: KBSettings = {
    chunkSize: 800,
    chunkOverlap: 100,
    embeddingModel: 'text-embedding-3-small',
    vectorStoreBackend: 'pgvector',
    similarityThreshold: 0.5,
    topKResults: 4,
    outdatedDocumentsCount: 0,
  };

  const settings = settingsQuery.data?.data
    ? { ...defaultSettings, ...settingsQuery.data.data }
    : defaultSettings;

  // Combine refetches
  const refreshDocuments = useCallback(async () => {
    await Promise.all([refetchDocuments(), refetchStats(), refetchSettings()]);
  }, [refetchDocuments, refetchStats, refetchSettings]);

  // --- WEBSOCKET LISTENER ---
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
  }, [getSocket, message, refreshDocuments]);

  // --- MUTATIONS ---
  const { mutateAsync: customMutate } = useCustomMutation();

  const handleAddFile = async (files: File[]) => {
    if (!files || files.length === 0 || !siteId) return;

    message.loading({
      content: `Uploading ${files.length} document(s)...`,
      key: 'processing_docs',
    });

    let failedCount = 0;
    const successfulDocs: KBDocument[] = [];

    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await customMutate({
        url: `/sites/${siteId}/kb/upload/file`,
        method: 'post',
        values: formData,
      });
      return { file, newKBDoc: res.data as KBDocument };
    });

    const results = await Promise.allSettled(uploadPromises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulDocs.push(result.value.newKBDoc);
      } else {
        failedCount += 1;
        const fileName = files[index]?.name || 'File';
        const error = result.reason;
        const msg =
          error instanceof Error
            ? error.message
            : (error as { message?: string })?.message || 'File upload failed';
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
      await customMutate({
        url: `/sites/${siteId}/kb/sources/${docId}`,
        method: 'delete',
        values: {},
      });
      message.success('Document deleted successfully!');
      await refreshDocuments();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Failed to delete document';
      message.error(`Failed to delete document: ${msg}`);
    }
  };

  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const saveSettings = async (nextSettings: KBSettings) => {
    if (!siteId) return;
    setIsSettingsSaving(true);
    try {
      await customMutate({
        url: `/sites/${siteId}/kb/settings`,
        method: 'patch',
        values: {
          chunkSize: nextSettings.chunkSize,
          chunkOverlap: nextSettings.chunkOverlap,
          similarityThreshold: nextSettings.similarityThreshold,
          topKResults: nextSettings.topKResults,
        },
      });
      message.success('Knowledge base settings saved');
      await refetchSettings();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Unable to save KB settings';
      message.error(msg);
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const reindexDocument = async (documentId: string) => {
    try {
      await customMutate({
        url: `/sites/${siteId}/kb/sources/${documentId}/reindex`,
        method: 'post',
        values: {},
      });
      message.success('Document queued for re-indexing');
      await refreshDocuments();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Unable to re-index document';
      message.error(msg);
    }
  };

  const reindexAllOutdated = async () => {
    setIsBulkReindexing(true);
    try {
      const res = await customMutate({
        url: `/sites/${siteId}/kb/reindex-outdated`,
        method: 'post',
        values: {},
      });
      const queued = (res.data as { queued?: number })?.queued || 0;
      message.success(`${queued} document(s) queued for re-indexing`);
      await refreshDocuments();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Unable to re-index documents';
      message.error(msg);
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
