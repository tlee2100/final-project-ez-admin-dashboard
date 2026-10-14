export enum DocFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  MARKDOWN = 'md',
  HTML = 'html',
  URL = 'url',
  TXT = 'txt',
}

export enum DocFileExtension {
  PDF = 'pdf',
  DOCX = 'docx',
  MARKDOWN = 'md',
  MARKDOWN_LONG = 'markdown',
  HTML = 'html',
  HTM = 'htm',
  TXT = 'txt',
}

export interface KBDocument {
  id: string;
  siteId: string;
  name: string;
  type: DocFileType;
  sizeFormatted: string; // e.g. "2.4 MB"
  sizeBytes: number;
  chunksCount?: number;
  uploadedAt: string; // ISO string
  uploadedAtFormatted: string;
  processedAt?: string | null; // ISO string
  processedAtFormatted?: string;
  updatedAt: string; // ISO string used for sorting
  updatedAtFormatted: string;
  url?: string;
  sourceKind?: 'file' | 'url';
  isActive?: boolean;
  contentSnippet?: string;
  status: 'indexed' | 'processing' | 'failed' | 'retired';
  indexedChunkSize?: number | null;
  indexedChunkOverlap?: number | null;
  needsReindex: boolean;
  reindexStatus: 'idle' | 'queued' | 'processing' | 'failed';
  reindexError?: string | null;
}

export interface VectorStorageStats {
  totalDocuments: number;
  totalChunks: number;
  totalSizeBytes: number;
  totalSizeFormatted: string; // e.g. "24.5 MB"
  lastUpdatedRelative: string; // e.g. "2 hours ago"
  vectorsUsed: number;
  vectorsLimit: number; // e.g. 100000
  usagePercentage: number; // e.g. 68
}

export interface CrawledUrlItem {
  id: string;
  url: string;
  status: 'completed' | 'crawling' | 'failed' | 'pending';
  pagesFound: number;
  lastCrawled: string;
  errorMessage?: string;
}

export interface CrawlerConfig {
  sitemapUrl: string;
  autoCrawlEnabled: boolean;
  crawlIntervalDays: number;
  maxDepth: number;
  respectRobotsTxt: boolean;
  crawledItems: CrawledUrlItem[];
}

export interface KBSettings {
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  vectorStoreBackend: 'pinecone' | 'qdrant' | 'pgvector';
  similarityThreshold: number;
  topKResults: number;
  outdatedDocumentsCount: number;
}

export type ModalTabType = 'upload' | 'url' | 'sitemap';

export interface AddContentPayload {
  tab: ModalTabType;
  files?: File[];
  url?: string;
  sitemapUrl?: string;
}

export interface DocumentChunkItem {
  id: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  sectionTitle: string | null;
  metadata: Record<string, unknown>;
  embeddingModel: string;
  vectorDimensions: number;
  createdAt: string;
}

export interface DocumentChunksResponse {
  document: {
    id: string;
    filename: string;
    fileType: string;
    fileSizeBytes: number | null;
    status: string;
    filePath: string;
    uploadedAt: string;
    processedAt: string | null;
    chunksCount: number;
  };
  chunks: DocumentChunkItem[];
}

export interface KBStatsResponse {
  totalDocuments: number;
  totalChunks: number;
  totalSizeBytes: number;
  totalTokens: number;
  vectorsUsed: number;
  vectorsLimit: number;
  usagePercentage: number;
  lastProcessedAt: string | null;
}

export interface CrawlerConfigDto {
  sitemapUrl: string;
  autoSyncEnabled: boolean;
  updatedAt?: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export type CrawlRunItemStatus =
  | 'discovered'
  | 'queued'
  | 'rendering'
  | 'indexed'
  | 'unchanged'
  | 'skipped_robots'
  | 'skipped_noindex'
  | 'failed'
  | 'quota_exceeded'
  | 'retired';

export interface CrawlRunDto {
  id: string;
  status: string;
  totalPages: number;
  processedPages: number;
  createdAt?: string;
  errorMessage?: string;
  indexedPages: number;
  unchangedPages: number;
  skippedPages: number;
  failedPages: number;
  quotaExceededPages: number;
}

export interface CrawlerOverviewDto {
  config: CrawlerConfigDto | null;
  activeRun: CrawlRunDto | null;
}

export interface CrawlRunPageDto {
  id: string;
  url: string;
  status: CrawlRunItemStatus;
  errorMessage?: string;
  errorCode?: string;
  documentId?: string;
}

export interface CrawlerPaginatedResponse<T> {
  data: T[];
  total: number;
}
